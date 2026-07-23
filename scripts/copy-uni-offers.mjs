#!/usr/bin/env node
/**
 * One-off copy of verified offer data from the live FirmChoice Supabase
 * project into A*AI.
 *
 * Reads every row in FirmChoice's `courses` table where offer_alevel is set
 * and writes the manually-sourced offer columns onto the matching row in
 * A*AI's `uni_courses`, matching on the natural key (ukprn, kiscourseid,
 * kismode). HESA-derived columns are never touched.
 *
 * Usage:
 *   node scripts/copy-uni-offers.mjs            # copy
 *   node scripts/copy-uni-offers.mjs --dry-run  # report only, write nothing
 *
 * Env vars:
 *   Source (FirmChoice project):
 *     SOURCE_SUPABASE_URL / SOURCE_SUPABASE_SERVICE_ROLE_KEY
 *     — fallback: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY parsed from
 *       ../firmchoice/.env.local (read locally, never merged into process.env)
 *   Target (A*AI project):
 *     SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *     — fallback: .env.local / .env at this repo root
 *
 * Service-role keys are server-side only — never printed, never committed.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const FIRMCHOICE_ENV = resolve(REPO_ROOT, "..", "firmchoice", ".env.local");

const DRY_RUN = process.argv.includes("--dry-run");

// The manually-sourced columns this script copies — and the ONLY columns it
// ever writes to the target.
const OFFER_COLUMNS = [
  "offer_alevel",
  "offer_ib",
  "required_subjects",
  "admissions_test",
  "contextual_offer",
  "success_rate",
  "source_url",
  "verified_date",
  "verification_status",
  "notes",
];

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/** Minimal KEY=VALUE parser → plain object. Never prints values. */
function parseEnvFile(path) {
  const env = {};
  if (!existsSync(path)) return env;
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/** Load this repo's .env.local / .env into process.env (target credentials). */
function loadTargetEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const fileEnv = parseEnvFile(join(REPO_ROOT, name));
    for (const [key, value] of Object.entries(fileEnv)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadTargetEnvFiles();

// Source: explicit SOURCE_* vars win; otherwise fall back to the FirmChoice
// repo's .env.local (whose keys are SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).
// Parsed into a local object so it can never clobber the target credentials.
const firmchoiceEnv = parseEnvFile(FIRMCHOICE_ENV);
const SOURCE_URL = process.env.SOURCE_SUPABASE_URL || firmchoiceEnv.SUPABASE_URL;
const SOURCE_KEY = process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY || firmchoiceEnv.SUPABASE_SERVICE_ROLE_KEY;

// Target: the A*AI project.
const TARGET_URL = process.env.SUPABASE_URL;
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SOURCE_URL || !SOURCE_KEY) {
  console.error(
    "\nMissing FirmChoice (source) service-role credentials.\n" +
      "Set SOURCE_SUPABASE_URL and SOURCE_SUPABASE_SERVICE_ROLE_KEY in the\n" +
      `environment, or keep SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in\n${FIRMCHOICE_ENV}\n`,
  );
  process.exit(1);
}
if (!TARGET_URL || !TARGET_KEY) {
  console.error(
    "\nMissing A*AI (target) service-role credentials.\n" +
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (gitignored)\n" +
      "or the environment. These are server-side only — never VITE_, never committed.\n",
  );
  process.exit(1);
}
if (SOURCE_URL === TARGET_URL) {
  console.error("\nSource and target Supabase URLs are identical — refusing to copy a project onto itself.\n");
  process.exit(1);
}

const source = createClient(SOURCE_URL, SOURCE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const target = createClient(TARGET_URL, TARGET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function naturalKey(row) {
  return `${row.ukprn}|${row.kiscourseid}|${row.kismode}`;
}

/**
 * Fetch all rows of a query, paging past PostgREST's per-request cap.
 * The query's ordering must be TOTAL (no ties) — offset pagination over a
 * non-unique order can skip or duplicate rows between pages, which here would
 * silently drop offers. Both callers order by the full natural key.
 */
async function fetchAll(buildQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

/** Order a courses query by the full natural key, so pagination is stable. */
function orderByNaturalKey(query) {
  return query.order("ukprn").order("kiscourseid").order("kismode");
}

async function main() {
  if (DRY_RUN) console.log("\n*** DRY RUN — reporting only, nothing is written ***");

  // --- 1. Verified offers from the source ----------------------------------
  console.log("\nReading verified offers from FirmChoice `courses` …");
  const selectCols = ["ukprn", "kiscourseid", "kismode", ...OFFER_COLUMNS].join(",");
  const offers = await fetchAll(() =>
    orderByNaturalKey(source.from("courses").select(selectCols).not("offer_alevel", "is", null)),
  );
  console.log(`  ${offers.length} source rows with offer_alevel set.`);
  if (offers.length === 0) {
    console.log("\nNothing to copy.\n");
    return;
  }

  // --- 2. Natural keys present in the target -------------------------------
  console.log("\nReading natural keys from A*AI `uni_courses` …");
  const targetKeys = new Set(
    (
      await fetchAll(() => orderByNaturalKey(target.from("uni_courses").select("ukprn,kiscourseid,kismode")))
    ).map(naturalKey),
  );
  console.log(`  ${targetKeys.size} target course rows.`);

  // --- 3. Match and update -------------------------------------------------
  const matched = offers.filter((o) => targetKeys.has(naturalKey(o)));
  const unmatchedRows = offers.filter((o) => !targetKeys.has(naturalKey(o)));

  let updated = 0;
  if (!DRY_RUN) {
    console.log("\nCopying offer columns onto matching target rows …");
    for (const offer of matched) {
      const patch = {};
      for (const colName of OFFER_COLUMNS) patch[colName] = offer[colName] ?? null;
      const { error } = await target
        .from("uni_courses")
        .update(patch)
        .eq("ukprn", offer.ukprn)
        .eq("kiscourseid", offer.kiscourseid)
        .eq("kismode", offer.kismode);
      if (error) {
        throw new Error(
          `update uni_courses (${offer.ukprn}/${offer.kiscourseid}/${offer.kismode}) failed: ${error.message}`,
        );
      }
      updated++;
    }
  }

  // --- 4. Report -----------------------------------------------------------
  console.log("\n────────────────────────── summary ──────────────────────────");
  console.log(`source rows with offers : ${offers.length}`);
  console.log(`matched in target       : ${matched.length}`);
  if (DRY_RUN) {
    console.log(`updated                 : 0 (dry run — would update ${matched.length})`);
  } else {
    console.log(`updated                 : ${updated}`);
  }
  console.log(`unmatched               : ${unmatchedRows.length}`);
  if (unmatchedRows.length) {
    console.log("\nsource rows with no match in target (ukprn + kiscourseid):");
    for (const row of unmatchedRows) {
      console.log(`  ${row.ukprn}  ${row.kiscourseid}  (kismode ${row.kismode})`);
    }
  }
  console.log("──────────────────────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
