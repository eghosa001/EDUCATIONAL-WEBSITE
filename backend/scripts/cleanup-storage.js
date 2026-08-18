#!/usr/bin/env node
/**
 * Storage cleanup script:
 * 1. Removes duplicate files (names containing "(1)")
 * 2. Standardizes naming conventions
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const BUCKETS = ['WAEC 1', 'WAEC 2', 'WAEC 3', 'jamb', 'OTHERS'];

async function listAllFiles(bucket) {
  const files = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list('', { limit, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) { console.error(`Error listing ${bucket}:`, error.message); break; }
    if (!data || data.length === 0) break;
    files.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return files;
}

async function deleteFile(bucket, fileName) {
  const { error } = await supabase.storage.from(bucket).remove([fileName]);
  if (error) {
    console.error(`  FAILED to delete ${bucket}/${fileName}: ${error.message}`);
    return false;
  }
  console.log(`  Deleted ${bucket}/${fileName}`);
  return true;
}

async function main() {
  console.log('=== Storage Cleanup ===\n');

  // Step 1: Remove duplicate files
  console.log('--- Removing duplicate files ---');
  let totalDeleted = 0;
  for (const bucket of BUCKETS) {
    const files = await listAllFiles(bucket);
    const duplicates = files.filter(f => f.name.includes('(1)'));
    for (const dup of duplicates) {
      const ok = await deleteFile(bucket, dup.name);
      if (ok) totalDeleted++;
    }
  }
  console.log(`\nRemoved ${totalDeleted} duplicate files.\n`);

  // Step 2: Report on naming issues (don't auto-rename to avoid breaking references)
  console.log('--- Naming convention report ---');
  const namingIssues = [];
  for (const bucket of BUCKETS) {
    const files = await listAllFiles(bucket);
    for (const f of files) {
      const issues = [];
      if (f.name.includes(' ')) issues.push('contains spaces');
      if (f.name !== f.name.replace(/ /g, '-')) issues.push('should use hyphens');
      if (f.name.includes('CAPENTRY')) issues.push('typo: CAPENTRY -> CARPENTRY');
      if (f.name.includes('techical')) issues.push('typo: techical -> technical');
      if (f.name.includes('SYllabus')) issues.push('typo: SYllabus -> Syllabus');
      if (f.name.includes('.pdf-')) issues.push('malformed double extension');
      if (f.name.includes('paper20001')) issues.push('unusual suffix');
      if (f.name === 'document_compress.pdf' || f.name === 'document_compress (1).pdf') issues.push('generic name - needs descriptive rename');
      if (issues.length > 0) {
        namingIssues.push({ bucket, name: f.name, issues });
      }
    }
  }

  if (namingIssues.length > 0) {
    console.log(`Found ${namingIssues.length} files with naming issues:\n`);
    for (const item of namingIssues) {
      console.log(`  ${item.bucket}/${item.name}`);
      for (const issue of item.issues) {
        console.log(`    - ${issue}`);
      }
    }
  } else {
    console.log('No naming issues found.');
  }

  console.log('\n=== Cleanup complete ===');
}

main().catch(console.error);
