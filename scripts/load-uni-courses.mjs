#!/usr/bin/env node
/**
 * Discover Uni course data — one-time, idempotent load (FirmChoice port).
 *
 * Streams the official UK Discover Uni (HESA) CSVs and loads two tables:
 *   uni_institutions  — the 28 target universities (matched by name)
 *   uni_courses       — their full-time honours courses, with a typical_tariff
 *                       computed from the entry-tariff band distribution
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/load-uni-courses.mjs
 *   node scripts/load-uni-courses.mjs --dry-run
 *   node scripts/load-uni-courses.mjs --data-dir /path/to/discover-uni
 *
 * Env vars (target = the A*AI Supabase project), read from the environment
 * with a fallback to .env.local / .env at the repo root:
 *   SUPABASE_URL                 — the project URL (NOT the VITE_ one)
 *   SUPABASE_SERVICE_ROLE_KEY    — service-role key; server-side only, never
 *                                  expose this client-side
 *
 * The CSVs live in the FirmChoice repo and are never copied here; default
 * --data-dir is ../firmchoice/data/discover-uni relative to this repo root.
 *
 * Re-running is safe: courses upsert on the natural key (ukprn, kiscourseid,
 * kismode), and only HESA-derived columns are written — the manually/web-sourced
 * offer fields (offer_alevel, offer_ib, required_subjects, admissions_test,
 * contextual_offer, success_rate, source_url, verified_date,
 * verification_status, notes) are never touched, so a refresh can never
 * clobber human work.
 *
 * The schema must already exist — see
 * supabase/migrations/20260722090000_university_applications.sql.
 */

import { createReadStream, existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Transforms (inlined from firmchoice/lib/discover-uni/transform.ts)
// ---------------------------------------------------------------------------

/** Lowercase, strip apostrophes/punctuation, collapse whitespace, drop a leading "the". */
function normalise(s) {
  return s
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^the\s+/, "")
    .replace(/\s+/g, " ");
}

/**
 * TARIFF band columns → the UCAS-points value we attribute to entrants in that
 * band. Each band column holds the % of the entrant population scoring in that
 * range; we use the band's lower bound, except T001 (1–47pts) which uses a
 * 24-pt midpoint.
 */
const TARIFF_BANDS = [
  { col: "T001", points: 24 },
  { col: "T048", points: 48 },
  { col: "T064", points: 64 },
  { col: "T080", points: 80 },
  { col: "T096", points: 96 },
  { col: "T112", points: 112 },
  { col: "T128", points: 128 },
  { col: "T144", points: 144 },
  { col: "T160", points: 160 },
  { col: "T176", points: 176 },
  { col: "T192", points: 192 },
  { col: "T208", points: 208 },
  { col: "T224", points: 224 },
  { col: "T240", points: 240 },
];

/**
 * Weighted median of one entry-tariff distribution: the band value at which the
 * cumulative entrant share first reaches half the total weight. Returns null
 * when every band weight is zero. `band` resolves a band column (e.g. "T128")
 * to its numeric %.
 */
function bandWeightedMedian(band) {
  const weights = TARIFF_BANDS.map((b) => {
    const v = band(b.col);
    return Number.isFinite(v) && v > 0 ? v : 0;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;

  const half = total / 2;
  let cumulative = 0;
  for (let i = 0; i < TARIFF_BANDS.length; i++) {
    cumulative += weights[i];
    if (cumulative >= half) return TARIFF_BANDS[i].points;
  }
  return TARIFF_BANDS[TARIFF_BANDS.length - 1].points;
}

/**
 * A single typical tariff for a course that may have several TARIFF rows
 * (subject splits / aggregation levels). We keep only usable rows — available
 * (TARUNAVAILREASON === "0") with a real population — then prefer the
 * whole-course figure (empty TARSBJ); failing that, for joint courses reported
 * only per subject, take the largest-population pathway. Returns null when no
 * row is usable (suppressed or no population), matching the spec.
 */
function selectCourseTariff(rows) {
  const usable = rows.filter((r) => r.reason === "0" && r.pop > 0);
  if (usable.length === 0) return null;

  const courseLevel = usable.filter((r) => r.sbj === "");
  const pool = courseLevel.length > 0 ? courseLevel : usable;
  pool.sort((a, b) => b.pop - a.pop);
  return bandWeightedMedian(pool[0].band);
}

// Longer / more specific abbreviations first so e.g. "MSci" wins over "MSc".
const QUALIFICATIONS = [
  "MBChB", "MBBS", "BVMS", "BVSc", "MPharm", "MArch", "MGeol", "MBiol", "MChem",
  "MPhys", "MMath", "MComp", "MSci", "MEng", "MNurs", "MMus", "MA", "MSc",
  "BEng", "BSci", "BSc", "BBA", "BFA", "BMus", "LLB", "BDS", "BA",
];
const QUAL_RE = new RegExp(`\\b(${QUALIFICATIONS.join("|")})\\b`);

/** Best-effort qualification from a course title (e.g. "BSc (Hons) Economics" → "BSc"). */
function parseQualification(title) {
  const m = title.match(QUAL_RE);
  return m ? m[1] : null;
}

/**
 * A single qual_level for a course: the clean qualification from the title
 * (BA/BSc/…) when the title carries one, otherwise the raw Discover Uni
 * KISLEVEL code (e.g. "03" = first degree, "04" = other undergraduate).
 */
function courseQualLevel(title, kislevel) {
  return parseQualification(title) ?? (kislevel.trim() || null);
}

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/**
 * Load .env.local / .env at the repo root into process.env (without
 * overwriting anything already set). Minimal KEY=VALUE parser — good enough
 * for our flat env files. Never prints values.
 */
function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const path = join(REPO_ROOT, name);
    if (!existsSync(path)) continue;
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
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadEnvFiles();

// --dry-run parses, matches and computes everything but writes nothing to the
// database (and needs no credentials) — for sanity-checking before the real load.
const DRY_RUN = process.argv.includes("--dry-run");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error(
    "\nMissing Supabase service-role credentials for the target (A*AI) project.\n" +
      "Set both of these in .env.local (gitignored) or the environment:\n" +
      "  SUPABASE_URL=https://<project>.supabase.co\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=<service-role key>\n\n" +
      "These are server-side only — never VITE_, never committed.\n" +
      "(Run with --dry-run to parse and report without writing to the database.)\n",
  );
  process.exit(1);
}

/** --data-dir <path> or --data-dir=<path>; default is the FirmChoice repo's CSVs. */
function dataDirFromArgs() {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--data-dir" && argv[i + 1]) return argv[i + 1];
    if (argv[i].startsWith("--data-dir=")) return argv[i].slice("--data-dir=".length);
  }
  return join("..", "firmchoice", "data", "discover-uni");
}

const rawDataDir = dataDirFromArgs();
const DATA_DIR = isAbsolute(rawDataDir) ? rawDataDir : resolve(REPO_ROOT, rawDataDir);

function requireFile(name) {
  const path = join(DATA_DIR, name);
  if (!existsSync(path)) {
    console.error(
      `\nMissing data file: ${path}\n` +
        `Place the four Discover Uni CSVs in ${DATA_DIR}/ (or pass --data-dir).\n` +
        "The CSVs live in the FirmChoice repo and must never be copied into this one.\n",
    );
    process.exit(1);
  }
  return path;
}

// ---------------------------------------------------------------------------
// Target institutions
// ---------------------------------------------------------------------------

/**
 * The 28 universities we care about. `include` holds normalised phrases — an
 * institution matches if its (normalised) legal name contains ANY of them;
 * `exclude` rules out the near-namesakes ("manchester metropolitan", etc).
 * Legal names in HESA differ from common usage, so phrases are deliberately
 * specific. Every match is printed for a human sanity-check.
 */
const TARGETS = [
  { short: "Oxford", include: ["university of oxford"], russellGroup: true },
  { short: "Cambridge", include: ["university of cambridge"], russellGroup: true },
  { short: "LSE", include: ["london school of economics"], russellGroup: true },
  { short: "Imperial", include: ["imperial college"], russellGroup: true },
  { short: "UCL", include: ["university college london"], russellGroup: true },
  { short: "King's College London", include: ["kings college london"], russellGroup: true },
  { short: "Queen Mary", include: ["queen mary"], russellGroup: true },
  { short: "Warwick", include: ["university of warwick"], russellGroup: true },
  { short: "Durham", include: ["university of durham", "durham university"], russellGroup: true },
  { short: "Bristol", include: ["university of bristol"], russellGroup: true },
  {
    short: "Manchester",
    include: ["university of manchester"],
    exclude: ["metropolitan"],
    russellGroup: true,
  },
  {
    short: "Edinburgh",
    include: ["university of edinburgh"],
    exclude: ["napier"],
    russellGroup: true,
  },
  {
    short: "Glasgow",
    include: ["university of glasgow"],
    exclude: ["caledonian"],
    russellGroup: true,
  },
  {
    short: "Nottingham",
    include: ["university of nottingham"],
    exclude: ["trent"],
    russellGroup: true,
  },
  {
    short: "Leeds",
    include: ["university of leeds"],
    exclude: ["beckett", "trinity"],
    russellGroup: true,
  },
  {
    short: "Birmingham",
    include: ["university of birmingham"],
    exclude: ["city university"],
    russellGroup: true,
  },
  {
    short: "Sheffield",
    include: ["university of sheffield"],
    exclude: ["hallam"],
    russellGroup: true,
  },
  {
    short: "Southampton",
    include: ["university of southampton"],
    exclude: ["solent"],
    russellGroup: true,
  },
  { short: "York", include: ["university of york"], exclude: ["st john"], russellGroup: true },
  { short: "Exeter", include: ["university of exeter"], russellGroup: true },
  {
    short: "Newcastle",
    include: ["university of newcastle", "newcastle upon tyne"],
    exclude: ["college"],
    russellGroup: true,
  },
  {
    short: "Cardiff",
    include: ["cardiff university", "university of cardiff", "prifysgol caerdydd"],
    exclude: ["metropolitan"],
    russellGroup: true,
  },
  { short: "St Andrews", include: ["university of st andrews"], russellGroup: false },
  { short: "Bath", include: ["university of bath"], exclude: ["spa"], russellGroup: false },
  { short: "Loughborough", include: ["loughborough university"], russellGroup: false },
  {
    short: "Lancaster",
    include: ["university of lancaster", "lancaster university"],
    russellGroup: false,
  },
  { short: "Surrey", include: ["university of surrey"], russellGroup: false },
  {
    short: "Queen's University Belfast",
    include: ["queens university belfast", "queens university of belfast"],
    russellGroup: true,
  },
];

// ---------------------------------------------------------------------------
// CSV streaming
// ---------------------------------------------------------------------------

async function forEachRow(filePath, fn) {
  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, bom: true, skip_empty_lines: true, relax_column_count: true, trim: true }),
  );
  let n = 0;
  for await (const row of parser) {
    fn(row);
    n++;
  }
  return n;
}

/** Case-insensitive column lookup — HESA header casing is not always consistent. */
function col(row, name) {
  if (row[name] !== undefined) return row[name];
  const lower = name.toLowerCase();
  for (const key of Object.keys(row)) {
    if (key.toLowerCase() === lower) return row[key];
  }
  return "";
}

// ---------------------------------------------------------------------------
// Course record
// ---------------------------------------------------------------------------

function naturalKey(ukprn, kiscourseid, kismode) {
  return `${ukprn}|${kiscourseid}|${kismode}`;
}

async function chunkedUpsert(supabase, table, rows, onConflict, size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) {
      throw new Error(`upsert into ${table} (rows ${i}–${i + chunk.length}) failed: ${error.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const institutionFile = requireFile("INSTITUTION.csv");
  const kiscourseFile = requireFile("KISCOURSE.csv");
  const tariffFile = requireFile("TARIFF.csv");
  const sbjFile = requireFile("SBJ.csv");

  const supabase = DRY_RUN
    ? null
    : createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

  console.log(`\nData dir: ${DATA_DIR}`);
  if (DRY_RUN) console.log("\n*** DRY RUN — parsing and reporting only, nothing is written ***");

  // --- 1. Institutions -----------------------------------------------------
  console.log("\nParsing INSTITUTION.csv …");

  // Collect every (ukprn, legalName) so we can match and report ambiguity.
  const providers = [];
  await forEachRow(institutionFile, (row) => {
    const ukprn = col(row, "UKPRN").trim();
    const name = col(row, "LEGAL_NAME").trim();
    if (!ukprn || !name) return;
    providers.push({ ukprn, name, url: col(row, "PROVURL").trim() });
  });

  console.log(`  ${providers.length} providers in file. Matching the 28 targets:\n`);

  const institutionRows = [];
  const targetUkprns = new Set();
  const unmatched = [];

  for (const target of TARGETS) {
    const matches = providers.filter((p) => {
      const n = normalise(p.name);
      const included = target.include.some((phrase) => n.includes(phrase));
      const excluded = (target.exclude ?? []).some((phrase) => n.includes(phrase));
      return included && !excluded;
    });

    if (matches.length === 0) {
      unmatched.push(target.short);
      console.log(`  ✗ ${target.short.padEnd(28)} — NO MATCH`);
      continue;
    }

    // Prefer the shortest legal name (most likely the core university, not a
    // subsidiary), but show every candidate so the user can sanity-check.
    matches.sort((a, b) => a.name.length - b.name.length);
    const chosen = matches[0];
    targetUkprns.add(chosen.ukprn);
    institutionRows.push({
      ukprn: chosen.ukprn,
      name: chosen.name,
      short_name: target.short,
      russell_group: target.russellGroup,
      website: chosen.url || null,
    });

    const flag = matches.length > 1 ? `  [${matches.length} candidates]` : "";
    console.log(`  ✓ ${target.short.padEnd(28)} ${chosen.ukprn}  ${chosen.name}${flag}`);
    if (matches.length > 1) {
      for (const m of matches.slice(1)) {
        console.log(`      also: ${m.ukprn}  ${m.name}`);
      }
    }
  }

  if (supabase) {
    await chunkedUpsert(supabase, "uni_institutions", institutionRows, "ukprn");
    console.log(`\n  Upserted ${institutionRows.length} institutions.`);
  } else {
    console.log(`\n  (dry run — would upsert ${institutionRows.length} institutions)`);
  }

  // --- 2. Courses (KISCOURSE, full-time honours KISMODE=01) -----------------
  console.log("\nParsing KISCOURSE.csv …");

  const courses = new Map();
  let kisScanned = 0;
  await forEachRow(kiscourseFile, (row) => {
    kisScanned++;
    const ukprn = col(row, "UKPRN").trim();
    if (!targetUkprns.has(ukprn)) return;
    const kismode = col(row, "KISMODE").trim();
    if (kismode !== "01") return; // full-time

    const kiscourseid = col(row, "KISCOURSEID").trim();
    if (!kiscourseid) return;
    const title = col(row, "TITLE").trim();
    // Only HESA-derived columns — the manually-sourced offer fields are never
    // part of this record, so the upsert can never overwrite them.
    courses.set(naturalKey(ukprn, kiscourseid, kismode), {
      ukprn,
      kiscourseid,
      kismode,
      ucas_code: col(row, "UCASPROGID").trim() || null,
      title: title || null,
      qualification: parseQualification(title),
      qual_level: courseQualLevel(title, col(row, "KISLEVEL")),
      crse_url: col(row, "CRSEURL").trim() || null,
      typical_tariff: null,
      cah_codes: null,
    });
  });
  console.log(`  ${kisScanned} course rows scanned, ${courses.size} kept (target unis, full-time).`);

  // --- 3. Tariff -----------------------------------------------------------
  // A course can have several TARIFF rows (per-subject splits, aggregation
  // levels), so collect them all then pick one figure per course.
  console.log("\nParsing TARIFF.csv …");
  const tariffRows = new Map();
  await forEachRow(tariffFile, (row) => {
    const ukprn = col(row, "UKPRN").trim();
    if (!targetUkprns.has(ukprn)) return;
    const key = naturalKey(ukprn, col(row, "KISCOURSEID").trim(), col(row, "KISMODE").trim());
    if (!courses.has(key)) return;
    const arr = tariffRows.get(key) ?? [];
    // Snapshot band values now — `row` is reused by the streaming parser.
    const cells = {};
    for (const band of TARIFF_BANDS) {
      cells[band.col] = Number(col(row, band.col)) || 0;
    }
    arr.push({
      reason: col(row, "TARUNAVAILREASON").trim(),
      sbj: col(row, "TARSBJ").trim(),
      pop: Number(col(row, "TARPOP").trim()) || 0,
      band: (name) => cells[name] ?? 0,
    });
    tariffRows.set(key, arr);
  });

  let tariffMatched = 0;
  tariffRows.forEach((rows, key) => {
    const course = courses.get(key);
    if (!course) return;
    const t = selectCourseTariff(rows);
    course.typical_tariff = t;
    if (t !== null) tariffMatched++;
  });
  console.log(`  ${tariffMatched} courses given a typical_tariff.`);

  // --- 4. Subjects (SBJ → cah_codes) ---------------------------------------
  console.log("\nParsing SBJ.csv …");
  let sbjMatched = 0;
  await forEachRow(sbjFile, (row) => {
    const ukprn = col(row, "UKPRN").trim();
    if (!targetUkprns.has(ukprn)) return;
    const key = naturalKey(ukprn, col(row, "KISCOURSEID").trim(), col(row, "KISMODE").trim());
    const course = courses.get(key);
    if (!course) return;
    const code = col(row, "SBJ").trim();
    if (!code) return;
    if (!course.cah_codes) course.cah_codes = [];
    if (!course.cah_codes.includes(code)) {
      course.cah_codes.push(code);
      sbjMatched++;
    }
  });
  console.log(`  ${sbjMatched} subject tags attached.`);

  // --- 5. Upsert courses ---------------------------------------------------
  if (supabase) {
    console.log("\nUpserting courses …");
    await chunkedUpsert(supabase, "uni_courses", Array.from(courses.values()), "ukprn,kiscourseid,kismode");
    console.log(`  Upserted ${courses.size} courses.`);
  } else {
    console.log(`\n  (dry run — would upsert ${courses.size} courses)`);
  }

  // --- 6. Verify -----------------------------------------------------------
  await report(courses, institutionRows, unmatched, supabase);
}

async function report(courses, institutionRows, unmatched, supabase) {
  const all = Array.from(courses.values());
  const withTariff = all.filter((c) => c.typical_tariff !== null).length;
  const withQual = all.filter((c) => c.qualification !== null).length;
  const qualFromLevel = all.filter((c) => c.qualification === null && c.qual_level !== null).length;
  const withCah = all.filter((c) => c.cah_codes && c.cah_codes.length > 0).length;

  console.log("\n────────────────────────── summary ──────────────────────────");
  console.log(`institutions matched : ${institutionRows.length} / 28`);
  if (unmatched.length) console.log(`  UNMATCHED: ${unmatched.join(", ")}`);
  console.log(`courses loaded       : ${all.length}`);
  console.log(`with typical_tariff  : ${withTariff}  (${Math.round((100 * withTariff) / all.length)}%)`);
  console.log(`with qualification   : ${withQual}  (${Math.round((100 * withQual) / all.length)}% — strict, from title)`);
  console.log(`with qual_level      : ${withQual + qualFromLevel}  (${withQual} from title, ${qualFromLevel} from KISLEVEL code)`);
  console.log(`with subject (cah)   : ${withCah}  (${Math.round((100 * withCah) / all.length)}%)`);

  // Sample: economics-ish courses, a few from LSE and a few from Warwick.
  const byUkprn = new Map(institutionRows.map((i) => [i.ukprn, i.short_name]));
  console.log("\nsample courses (economics-ish at LSE / Warwick):");
  let shown = 0;
  for (const short of ["LSE", "Warwick"]) {
    const ukprn = institutionRows.find((i) => i.short_name === short)?.ukprn;
    const matches = all
      .filter((c) => c.ukprn === ukprn && /econ/i.test(c.title ?? ""))
      .slice(0, 3);
    for (const s of matches) {
      shown++;
      console.log(
        `  ${(byUkprn.get(s.ukprn) ?? "?").padEnd(8)} ${(s.title ?? "").slice(0, 42).padEnd(42)} ` +
          `qual:${(s.qualification ?? "—").padEnd(5)} lvl:${(s.qual_level ?? "—").padEnd(5)} ucas:${(s.ucas_code ?? "—").padEnd(8)} tariff:${s.typical_tariff ?? "—"}`,
      );
    }
  }
  if (shown === 0) console.log("  (no economics-ish courses found at LSE / Warwick)");

  // When we actually wrote, confirm the rows landed in the database.
  if (supabase) {
    const { count } = await supabase.from("uni_courses").select("*", { count: "exact", head: true });
    console.log(`\ndatabase now holds   : ${count ?? "?"} course rows`);
  }
  console.log("──────────────────────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
