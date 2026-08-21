#!/usr/bin/env node
/**
 * Parse past-question PDFs from Supabase Storage and seed structured questions.
 *
 * Usage:
 *   node backend/scripts/parse-and-seed-past-questions.js [--board waec] [--dry-run]
 *
 * Required environment variables:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (or another server-side key with required access)
 *   SUPABASE_DB_PASSWORD (for direct PostgreSQL access)
 *
 * This script deliberately does NOT invent correct answers or explanations.
 * Extracted questions are inserted with null answers when the source PDF does
 * not provide a verifiable answer key. They must be validated before use in
 * auto-graded exams.
 */
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xanrzsszrysianxhpprk.supabase.co';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const DB_CONNECTION = process.env.DATABASE_URL || (
  DB_PASSWORD
    ? `postgresql://postgres:${DB_PASSWORD}@db.xanrzsszrysianxhpprk.supabase.co:5432/postgres`
    : null
);

if (!DB_CONNECTION) {
  throw new Error('Missing DATABASE_URL or SUPABASE_DB_PASSWORD.');
}

const args = process.argv.slice(2);
const filterBoard = args.includes('--board') ? args[args.indexOf('--board') + 1] : null;
const dryRun = args.includes('--dry-run');
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : null;

const pool = new pg.Pool({ connectionString: DB_CONNECTION, ssl: { rejectUnauthorized: false } });
const SUBJECT_MAP = {};

async function loadSubjectMap() {
  const result = await pool.query('SELECT id, name FROM subjects');
  for (const row of result.rows) {
    SUBJECT_MAP[row.name.toLowerCase()] = row.id;
  }
  console.log(`Loaded ${result.rows.length} subjects`);
}

function getSubjectId(subjectName) {
  if (!subjectName) return null;
  const normalized = subjectName.trim().toLowerCase();
  if (SUBJECT_MAP[normalized]) return SUBJECT_MAP[normalized];

  for (const [key, id] of Object.entries(SUBJECT_MAP)) {
    if (key.includes(normalized) || normalized.includes(key)) return id;
  }
  return null;
}

async function extractTextFromPdf(buffer) {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    const data = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const textContent = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      if (pageText.trim()) textContent.push(pageText.trim());
    }

    const text = textContent.join('\n\n');
    return { text, pageCount: doc.numPages, hasText: text.length > 50 };
  } catch (error) {
    return { text: '', pageCount: 0, hasText: false, error: error.message };
  }
}

function parseQuestionsFromText(text, board, subject, year) {
  const questions = [];
  const mcqPattern = /(?:^|\n)\s*(\d+)[.\)]\s*(.+?)(?=(?:\n\s*\d+[.\)]\s)|\n\n|$)/gs;
  let match;

  while ((match = mcqPattern.exec(text)) !== null) {
    const questionNumber = parseInt(match[1], 10);
    const questionBlock = match[2].trim();
    if (questionBlock.length < 10) continue;

    const optionPattern = /\b([A-E])\s*[.)]\s*(.+?)(?=\b[A-E]\s*[.)]|\n\n|$)/g;
    const options = [];
    let optMatch;

    while ((optMatch = optionPattern.exec(questionBlock)) !== null) {
      options.push({ id: optMatch[1], text: optMatch[2].trim() });
    }

    let cleanQuestionText = questionBlock;
    if (options.length) {
      const firstOptionIndex = cleanQuestionText.search(/\bA\s*[.)]\s*/);
      if (firstOptionIndex >= 0) cleanQuestionText = cleanQuestionText.slice(0, firstOptionIndex).trim();
    }

    if (cleanQuestionText.length < 5) continue;

    questions.push({
      questionNumber,
      board: board?.toLowerCase() || null,
      year: year || null,
      subjectId: getSubjectId(subject),
      questionType: options.length >= 4 ? 'mcq' : 'essay',
      questionText: cleanQuestionText,
      options: options.length >= 4 ? options : [],
      // Never guess these values. They require a verified answer key/review.
      correctAnswer: null,
      explanation: null,
      difficulty: 'medium',
      marks: options.length >= 4 ? 1 : 10,
      source: 'parsed_from_pdf',
      tags: [board?.toLowerCase(), subject, year].filter(Boolean),
    });
  }

  return questions;
}

async function processFile(file, buffer) {
  const result = await extractTextFromPdf(buffer);

  if (!result.hasText) {
    console.log(`  [SCANNED] ${file.file_name} - No extractable text (OCR required)`);
    return { parsed: 0, scanned: true };
  }

  const questions = parseQuestionsFromText(result.text, file.board, file.subject, file.year);
  if (!questions.length) {
    console.log(`  [NO-PARSE] ${file.file_name} - ${result.pageCount} pages, ${result.text.length} chars`);
    return { parsed: 0, scanned: false };
  }

  console.log(`  [PARSED] ${file.file_name} - ${questions.length} questions extracted`);
  return { parsed: questions.length, questions, scanned: false };
}

async function main() {
  console.log('=== Past Questions PDF Parser & Seeder ===\n');
  await loadSubjectMap();

  let queryText = 'SELECT * FROM past_question_files WHERE mime_type = $1';
  const queryParams = ['application/pdf'];
  let paramIdx = 2;

  if (filterBoard) {
    queryText += ` AND board = $${paramIdx++}`;
    queryParams.push(filterBoard);
  }

  queryText += ' AND (is_processed = FALSE OR is_processed IS NULL) ORDER BY board, subject, year';

  if (limit) {
    queryText += ` LIMIT $${paramIdx}`;
    queryParams.push(limit);
  }

  const filesResult = await pool.query(queryText, queryParams);
  const files = filesResult.rows;
  console.log(`Found ${files.length} PDF files to process\n`);

  const stats = { total: files.length, parsed: 0, scanned: 0, errors: 0, questionsInserted: 0 };
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pq-parse-'));

  try {
    for (const file of files) {
      console.log(`Processing: ${file.file_name} (${file.board}/${file.subject})`);

      try {
        if (!file.public_url) {
          throw new Error('Missing public_url');
        }

        const response = await fetch(file.public_url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const buffer = Buffer.from(await response.arrayBuffer());
        const tmpPath = path.join(tmpDir, path.basename(file.file_name));
        fs.writeFileSync(tmpPath, buffer);

        const result = await processFile(file, buffer);

        if (result.scanned) {
          stats.scanned++;
          if (!dryRun) {
            await pool.query(
              'UPDATE past_question_files SET is_processed = TRUE, questions_extracted = 0, metadata = $2 WHERE id = $1',
              [file.id, JSON.stringify({ status: 'scanned_no_text', needs_ocr: true })]
            );
          }
        } else if (result.parsed > 0 && result.questions) {
          stats.parsed++;

          if (!dryRun) {
            for (const q of result.questions) {
              try {
                await pool.query(
                  `INSERT INTO past_questions
                    (board, year, subject_id, question_type, question_text, options,
                     correct_answer, explanation, difficulty, marks, source, tags)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                  [
                    q.board, q.year, q.subjectId, q.questionType, q.questionText,
                    JSON.stringify(q.options), null, null, q.difficulty, q.marks,
                    q.source, JSON.stringify(q.tags),
                  ]
                );
                stats.questionsInserted++;
              } catch (err) {
                if (err.code !== '23505') console.log(`  [WARN] Insert failed: ${err.message}`);
              }
            }

            await pool.query(
              'UPDATE past_question_files SET is_processed = TRUE, questions_extracted = $2 WHERE id = $1',
              [file.id, result.parsed]
            );
          } else {
            console.log(`  [DRY-RUN] Would insert ${result.parsed} questions`);
          }
        }

        fs.unlinkSync(tmpPath);
      } catch (error) {
        console.log(`  [ERROR] ${error.message}`);
        stats.errors++;
      }
    }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    await pool.end();
  }

  console.log('\n=== Summary ===');
  console.log(`Total files: ${stats.total}`);
  console.log(`Parsed (text-based): ${stats.parsed}`);
  console.log(`Scanned (OCR required): ${stats.scanned}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Questions inserted: ${stats.questionsInserted}`);
  console.log(dryRun ? '\n[DRY-RUN] No database changes made' : '\nDone!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
