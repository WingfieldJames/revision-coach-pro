#!/usr/bin/env node
/**
 * Seed mock papers from JSON files into Supabase.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node seeds/seed-mock-papers.mjs
 *
 * Or set env vars in .env and use dotenv:
 *   node -r dotenv/config seeds/seed-mock-papers.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAPERS_DIR = join(__dirname, "mock_papers");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const files = (await readdir(PAPERS_DIR)).filter((f) => f.endsWith(".json"));
  console.log(`Found ${files.length} paper files`);

  let inserted = 0;
  let skipped = 0;

  for (const file of files) {
    const raw = await readFile(join(PAPERS_DIR, file), "utf-8");
    const paper = JSON.parse(raw);

    // Check if paper already exists (by board + subject + paper_number + year)
    const { data: existing } = await supabase
      .from("mock_papers")
      .select("id")
      .eq("exam_board", paper.exam_board)
      .eq("subject", paper.subject)
      .eq("paper_number", paper.paper_number)
      .eq("year", paper.year)
      .maybeSingle();

    if (existing) {
      console.log(`  SKIP ${file} (already exists: ${existing.id})`);
      skipped++;
      continue;
    }

    // Look up product_id
    const boardSlugMap = {
      Edexcel: "edexcel",
      AQA: "aqa",
      CIE: "cie",
      OCR: "ocr",
    };
    const subjectSlugMap = {
      Economics: "economics",
      Chemistry: "chemistry",
      Physics: "physics",
      "Computer Science": "computer-science",
      Psychology: "psychology",
      Mathematics: "mathematics",
    };
    const slug = `${boardSlugMap[paper.exam_board] || paper.exam_board.toLowerCase()}-${
      subjectSlugMap[paper.subject] || paper.subject.toLowerCase()
    }`;

    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    const { error } = await supabase.from("mock_papers").insert({
      exam_board: paper.exam_board,
      subject: paper.subject,
      paper_number: paper.paper_number,
      paper_name: paper.paper_name,
      year: paper.year,
      total_marks: paper.total_marks,
      time_limit_minutes: paper.time_limit_minutes,
      content_source: paper.content_source || "representative",
      sections: paper.sections,
      questions: paper.questions,
      product_id: product?.id || null,
      active: true,
    });

    if (error) {
      console.error(`  FAIL ${file}:`, error.message);
    } else {
      console.log(`  OK   ${file}`);
      inserted++;
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
