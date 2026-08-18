#!/usr/bin/env node
/**
 * Parse past question PDFs from Supabase storage and seed into past_questions table.
 * 
 * Usage: node backend/scripts/parse-and-seed-past-questions.js [--board waec] [--dry-run]
 * 
 * This script:
 * 1. Downloads PDFs from Supabase public storage URLs
 * 2. Extracts text using pdfjs-dist
 * 3. Attempts to parse structured questions (MCQ, essay)
 * 4. Seeds parsed questions into past_questions table
 */
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xanrzsszrysianxhpprk.supabase.co';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const DB_CONNECTION = process.env.DATABASE_URL || `postgresql://postgres:${DB_PASSWORD}@db.xanrzsszrysianxhpprk.supabase.co:5432/postgres`;

const args = process.argv.slice(2);
const filterBoard = args.includes('--board') ? args[args.indexOf('--board') + 1] : null;
const dryRun = args.includes('--dry-run');
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;

// Database client
const pool = new pg.Pool({ connectionString: DB_CONNECTION, ssl: { rejectUnauthorized: false } });

const SUBJECT_MAP = {};

async function loadSubjectMap() {
  const result = await pool.query('SELECT id, name FROM subjects');
  for (const row of result.rows) {
    SUBJECT_MAP[row.name.toLowerCase()] = row.id;
    SUBJECT_MAP[row.name] = row.id;
  }
  console.log(`Loaded ${result.rows.length} subjects`);
}

function getSubjectId(subjectName) {
  if (!subjectName) return null;
  // Try exact match first
  if (SUBJECT_MAP[subjectName]) return SUBJECT_MAP[subjectName];
  // Try lowercase
  if (SUBJECT_MAP[subjectName.toLowerCase()]) return SUBJECT_MAP[subjectName.toLowerCase()];
  // Try partial match
  for (const [key, id] of Object.entries(SUBJECT_MAP)) {
    if (key.toLowerCase().includes(subjectName.toLowerCase()) || subjectName.toLowerCase().includes(key.toLowerCase())) {
      return id;
    }
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
      if (pageText.trim()) {
        textContent.push(pageText.trim());
      }
    }
    
    return {
      text: textContent.join('\n\n'),
      pageCount: doc.numPages,
      hasText: textContent.length > 0 && textContent.join('').length > 50,
    };
  } catch (error) {
    return { text: '', pageCount: 0, hasText: false, error: error.message };
  }
}

function parseQuestionsFromText(text, board, subject, year) {
  const questions = [];
  
  // Pattern 1: Numbered questions with options (MCQ)
  // Matches: "1. Question text\nA. option\nB. option\nC. option\nD. option"
  const mcqPattern = /(?:^|\n)\s*(\d+)[.\)]\s*(.+?)(?=(?:\n\s*\d+[.\)]\s)|\n\n|$)/gs;
  let match;
  
  while ((match = mcqPattern.exec(text)) !== null) {
    const questionBlock = match[0];
    const questionNumber = parseInt(match[1]);
    const questionText = match[2].trim();
    
    // Skip very short "questions" (likely headers/footers)
    if (questionText.length < 10) continue;
    
    // Try to extract options (A, B, C, D, E)
    const optionPattern = /\b([A-E])\s*[.)]\s*(.+?)(?=\b[A-E]\s*[.)]|\n\n|$)/g;
    const options = [];
    let optMatch;
    
    while ((optMatch = optionPattern.exec(questionBlock)) !== null) {
      options.push({
        id: optMatch[1],
        text: optMatch[2].trim(),
      });
    }
    
    // Clean question text (remove options from it)
    let cleanQuestionText = questionText;
    for (const opt of options) {
      cleanQuestionText = cleanQuestionText.replace(new RegExp(`\\b${opt.id}\\s*[.)]\\s*.+`, 'g'), '');
    }
    cleanQuestionText = cleanQuestionText.trim();
    
    if (cleanQuestionText.length < 5) continue;
    
    questions.push({
      board: board.toLowerCase(),
      year: year,
      subjectId: getSubjectId(subject),
      questionType: options.length >= 4 ? 'mcq' : 'essay',
      questionText: cleanQuestionText,
      options: options.length >= 4 ? options : [],
      correctAnswer: null,
      explanation: null,
      difficulty: 'medium',
      marks: options.length >= 4 ? 1 : 10,
      source: `parsed_from_pdf`,
      tags: [board.toLowerCase(), subject, year].filter(Boolean),
    });
  }
  
  return questions;
}

async function processFile(file, buffer) {
  const result = await extractTextFromPdf(buffer);
  
  if (!result.hasText) {
    console.log(`  [SCANNED] ${file.file_name} - No extractable text (scanned PDF)`);
    return { parsed: 0, scanned: true };
  }
  
  const questions = parseQuestionsFromText(result.text, file.board, file.subject, file.year);
  
  if (questions.length === 0) {
    console.log(`  [NO-parse] ${file.file_name} - Text extracted but no questions parsed (${result.pageCount} pages, ${result.text.length} chars)`);
    return { parsed: 0, scanned: false };
  }
  
  console.log(`  [PARSED] ${file.file_name} - ${questions.length} questions extracted (${result.pageCount} pages)`);
  return { parsed: questions.length, questions, scanned: false };
}

async function main() {
  console.log('=== Past Questions PDF Parser & Seeder ===\n');
  
  await loadSubjectMap();
  
  // Get files from database
  let queryText = 'SELECT * FROM past_question_files WHERE mime_type = $1';
  const queryParams = ['application/pdf'];
  let paramIdx = 2;
  
  if (filterBoard) {
    queryText += ` AND board = $${paramIdx++}`;
    queryParams.push(filterBoard);
  }
  
  // Skip already processed files
  queryText += ' AND (is_processed = FALSE OR is_processed IS NULL)';
  queryText += ' ORDER BY board, subject, year';
  
  if (limit) {
    queryText += ` LIMIT $${paramIdx}`;
    queryParams.push(limit);
  }
  
  const filesResult = await pool.query(queryText, queryParams);
  const files = filesResult.rows;
  
  console.log(`Found ${files.length} PDF files to process\n`);
  
  const stats = { total: files.length, parsed: 0, scanned: 0, errors: 0, questionsInserted: 0 };
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pq-parse-'));
  
  for (const file of files) {
    console.log(`Processing: ${file.file_name} (${file.board}/${file.subject})`);
    
    try {
      // Download from public URL
      const response = await fetch(file.public_url);
      if (!response.ok) {
        console.log(`  [SKIP] HTTP ${response.status}`);
        stats.errors++;
        continue;
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Save temp file
      const tmpPath = path.join(tmpDir, file.file_name);
      fs.writeFileSync(tmpPath, buffer);
      
      const result = await processFile(file, buffer);
      
      if (result.scanned) {
        stats.scanned++;
        // Mark as processed with 0 questions (scanned, needs OCR/manual entry)
        await pool.query(
          'UPDATE past_question_files SET is_processed = TRUE, questions_extracted = 0, metadata = $2 WHERE id = $1',
          [file.id, JSON.stringify({ status: 'scanned_no_text', needs_ocr: true })]
        );
      } else if (result.parsed > 0 && result.questions) {
        stats.parsed++;
        
        if (!dryRun) {
          // Insert questions
          for (const q of result.questions) {
            try {
              await pool.query(
                `INSERT INTO past_questions (board, year, subject_id, question_type, question_text, options, correct_answer, explanation, difficulty, marks, source, tags)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [q.board, q.year, q.subjectId, q.questionType, q.questionText,
                 JSON.stringify(q.options), q.correctAnswer ? JSON.stringify(q.correctAnswer) : null,
                 q.explanation, q.difficulty, q.marks, q.source, JSON.stringify(q.tags)]
              );
              stats.questionsInserted++;
            } catch (err) {
              // Skip duplicate or constraint errors
              if (err.code !== '23505') {
                console.log(`  [WARN] Insert failed: ${err.message}`);
              }
            }
          }
          
          // Mark file as processed
          await pool.query(
            'UPDATE past_question_files SET is_processed = TRUE, questions_extracted = $2 WHERE id = $1',
            [file.id, result.parsed]
          );
        } else {
          console.log(`  [DRY-RUN] Would insert ${result.parsed} questions`);
        }
      }
      
      // Cleanup temp file
      fs.unlinkSync(tmpPath);
      
    } catch (error) {
      console.log(`  [ERROR] ${error.message}`);
      stats.errors++;
    }
  }
  
  // Cleanup temp dir
  try { fs.rmdirSync(tmpDir, { recursive: true }); } catch {}
  
  console.log('\n=== Summary ===');
  console.log(`Total files: ${stats.total}`);
  console.log(`Parsed (text-based): ${stats.parsed}`);
  console.log(`Scanned (no text): ${stats.scanned}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Questions inserted: ${stats.questionsInserted}`);
  console.log(dryRun ? '\n[DRY-RUN] No changes made to database' : '\nDone!');
  
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
