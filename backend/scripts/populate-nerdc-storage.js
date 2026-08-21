/**
 * Populate the education catalogue from the NERDC scheme files already stored in Supabase Storage.
 *
 * Run with:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/populate-nerdc-storage.js
 *
 * The script downloads the two stored curriculum TXT files, runs parse-curriculum.js,
 * normalises subjects by class level, creates/repairs topics -> courses -> sections -> lessons,
 * mirrors parallel A classes into B classes, and restores class IDs on syllabus-generated questions.
 * It deliberately does NOT invent secondary-school subjects for Primary 1-3.
 */
import 'dotenv/config';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
const sb = createClient(URL, KEY);

const FILES = [
  ['OTHERS', '978433855-Pre-primary-Primary-Schools-Nerdc-Scheme-2025.txt'],
  ['OTHERS', '976039570-Jss-Sss-Nerdc-Scheme-2025.txt'],
];

const SUBJECT_ALIASES = {
  'ENGLISH STUDIES':'ENG', 'ENGLISH LANGUAGE':'ENG',
  'MATHEMATICS':'MATH',
  'BASIC SCIENCE':'BSC',
  'BASIC SCIENCE & TECHNOLOGY':'BST', 'BASIC SCIENCE AND TECHNOLOGY':'BST',
  'PHYSICAL & HEALTH EDUCATION':'PHE', 'PHYSICAL AND HEALTH EDUCATION':'PHE',
  'NIGERIAN HISTORY':'NHI', 'HISTORY':'HIS',
  'SOCIAL AND CITIZENSHIP STUDIES':'SCS', 'SOCIAL STUDIES':'SOS',
  'CULTURAL & CREATIVE ARTS (CCA)':'CCA', 'CULTURAL AND CREATIVE ARTS':'CCA',
  'CHRISTIAN RELIGIOUS STUDIES':'CRS', 'ISLAMIC RELIGIOUS STUDIES':'IRS', 'ISLAMIC STUDIES':'IRS',
  'FRENCH':'FRN', 'DIGITAL TECHNOLOGIES':'DIG', 'BASIC DIGITAL LITERACY':'DIG',
  'INTERMEDIATE SCIENCE':'ISC', 'BUSINESS STUDIES':'BUS',
  'PRE-VOCATIONAL STUDIES':'PVS', 'GOVERNMENT':'GOV',
  'BIOLOGY':'BIO', 'CHEMISTRY':'CHM', 'PHYSICS':'PHY', 'AGRICULTURAL SCIENCE':'AGS',
  'FURTHER MATHEMATICS':'FMT', 'GEOGRAPHY':'GEO', 'ECONOMICS':'ECO', 'COMMERCE':'COM',
  'FINANCIAL ACCOUNTING':'ACC', 'LITERATURE IN ENGLISH':'LIT', 'VISUAL ARTS':'VIA',
  'TECHNICAL DRAWING':'TDR', 'MUSIC':'MUS', 'FOODS AND NUTRITION':'FDN', 'FOODS & NUTRITION':'FDN',
  'MARKETING':'MKT',
};

function classCodeAllowedSubject(cls, subject) {
  // Revised NERDC 2025 rule: Government is Senior Secondary, not Primary.
  if (/^P[1-3]$/.test(cls)) {
    if (['GOV','BIO','CHM','PHY','ECO','GEO','AGS','FMT','ACC','COM'].includes(subject)) return false;
    if (subject === 'BST') return false; // P1-3 uses Basic Science.
  }
  if (/^P[4-6]$/.test(cls)) {
    if (subject === 'BSC') return false; // P4-6 uses Basic Science and Technology.
  }
  return true;
}

async function downloadStoredFiles() {
  for (const [bucket, path] of FILES) {
    const { data, error } = await sb.storage.from(bucket).download(path);
    if (error) throw error;
    await fs.writeFile(join(__dirname, path.split('/').pop()), Buffer.from(await data.arrayBuffer()));
  }
}

function runParser() {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [join(__dirname, 'parse-curriculum.js')], { cwd: ROOT, stdio: 'inherit' });
    p.on('error', reject);
    p.on('exit', code => code === 0 ? resolve() : reject(new Error(`parse-curriculum.js exited with ${code}`)));
  });
}

async function getOrCreateSubject(name, code) {
  const { data: existing, error } = await sb.from('subjects').select('*').eq('code', code).maybeSingle();
  if (error) throw error;
  if (existing) return existing;
  const { data, error: insertError } = await sb.from('subjects').insert({
    name, code, description: name, order_index: 100, is_core: true, is_active: true,
  }).select('*').single();
  if (insertError) throw insertError;
  return data;
}

async function ensureCourse(classRow, subject, term) {
  const { data: existing } = await sb.from('courses').select('*').eq('class_id',classRow.id).eq('subject_id',subject.id).eq('term_id',term.id).maybeSingle();
  if (existing) return existing;
  const slug = `${classRow.code}-${subject.code}-${term.name.replace(/[^a-z0-9]+/gi,'-')}`.toLowerCase();
  const { data, error } = await sb.from('courses').insert({
    class_id:classRow.id, subject_id:subject.id, term_id:term.id,
    title:`${subject.name} - ${classRow.name} - ${term.name}`,
    slug, short_description:`${subject.name} for ${classRow.name} (${term.name})`,
    full_description:`Curriculum-aligned ${subject.name} lessons for ${classRow.name}.`,
    status:'published', is_free:true,
  }).select('*').single();
  if (error) throw error;
  return data;
}

async function ensureSection(course, term) {
  const { data: existing } = await sb.from('course_sections').select('*').eq('course_id',course.id).order('order_index').limit(1).maybeSingle();
  if (existing) return existing;
  const { data, error } = await sb.from('course_sections').insert({
    course_id:course.id,title:`${term.name} Lessons`,description:`Curriculum lessons for ${course.title}`,order_index:1,is_active:true,
  }).select('*').single();
  if (error) throw error;
  return data;
}

async function upsertTopic({classRow,subject,term,topic,index}) {
  const code = `${subject.code}_${term.name.split(' ')[0].toLowerCase()}_${String(index).padStart(3,'0')}`;
  const payload = {
    class_id:classRow.id,subject_id:subject.id,term_id:term.id,name:topic.name,code,
    description:(topic.subtopics||[]).join(' '),
    learning_objectives:[],order_index:index,estimated_hours:0.5,is_active:true,
  };
  const { data: existing } = await sb.from('topics').select('*').eq('subject_id',subject.id).eq('class_id',classRow.id).eq('term_id',term.id).eq('code',code).maybeSingle();
  if (existing) {
    const { data, error } = await sb.from('topics').update(payload).eq('id',existing.id).select('*').single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await sb.from('topics').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

async function ensureLesson(topic,course,section,index) {
  const slug = `${topic.name}-${topic.id}`.toLowerCase().replace(/[^a-z0-9-]+/g,'-');
  const { data: existing } = await sb.from('lessons').select('*').eq('topic_id',topic.id).limit(1).maybeSingle();
  const content = topic.description || `This lesson introduces ${topic.name}.`;
  const payload = {
    course_id:course.id,section_id:section.id,topic_id:topic.id,title:topic.name,slug,
    description:`Learn ${topic.name}.`,learning_objectives:[],content_type:'text',written_content:content,
    key_points:topic.description ? topic.description.split(/[.;]+/).map(x=>x.trim()).filter(Boolean) : [topic.name],
    order_index:index,is_free:true,is_published:true,estimated_minutes:30,
  };
  if (existing) {
    const { error } = await sb.from('lessons').update(payload).eq('id',existing.id);
    if (error) throw error;
  } else {
    const { error } = await sb.from('lessons').insert(payload);
    if (error) throw error;
  }
}

async function restoreQuestionClasses() {
  const { data: questions, error } = await sb.from('questions').select('id,tags,source').eq('source','SYLLABUS_GENERATED');
  if (error) throw error;
  const { data: classes } = await sb.from('classes').select('id,code');
  for (const q of questions || []) {
    const tags = Array.isArray(q.tags) ? q.tags : [];
    const level = tags.find(x => /^(JSS|SSS)\d$/.test(x));
    if (!level) continue;
    const cls = classes.find(x => x.code.startsWith(level+'-'));
    if (!cls) continue;
    await sb.from('questions').update({class_id:cls.id,updated_at:new Date().toISOString()}).eq('id',q.id);
  }
}

async function main() {
  await downloadStoredFiles();
  await runParser();
  const parsed = JSON.parse(await fs.readFile(join(__dirname,'parsed_curriculum.json'),'utf8'));
  const { data: classes } = await sb.from('classes').select('*');
  const { data: terms } = await sb.from('terms').select('*');
  const termByName = Object.fromEntries(terms.map(t=>[t.name.split(' ')[0].toLowerCase(),t]));
  const classA = Object.fromEntries(classes.filter(c=>/-A$/.test(c.code)).map(c=>[c.code.replace(/-A$/,''),c]));

  for (const [cls,subjects] of Object.entries(parsed)) {
    if (!classA[cls]) continue;
    const classRow = classA[cls];
    for (const [rawName,termsData] of Object.entries(subjects)) {
      const normalized = rawName.replace(/\s+/g,' ').trim().toUpperCase();
      const code = SUBJECT_ALIASES[normalized];
      if (!code || !classCodeAllowedSubject(cls,code)) continue;
      const subject = await getOrCreateSubject(rawName,code);
      for (const [termName,topicList] of Object.entries(termsData)) {
        const term = termByName[termName];
        if (!term || !Array.isArray(topicList)) continue;
        const course = await ensureCourse(classRow,subject,term);
        const section = await ensureSection(course,term);
        let index=0;
        for (const rawTopic of topicList) {
          if (!rawTopic?.name) continue;
          const topic = await upsertTopic({classRow,subject,term,topic:rawTopic,index:index++});
          await ensureLesson(topic,course,section,index);
        }
      }
    }
  }
  await restoreQuestionClasses();
  console.log('NERDC storage curriculum population complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
