/**
 * Parse NERDC Scheme of Work TXT files into structured JSON.
 *
 * Covers all levels present in the two source documents:
 *   - Pre-Nursery, Nursery 1-3, Primary 1-6   (Pre-primary/Primary file)
 *   - JSS 1-3, SSS 1-3                         (JSS/SSS file)
 *
 * Handles multiple table formats:
 *   - "Week Topic | Breakdown (Subtopics)" with bullet subtopics (JSS/SSS, P1-2, P4-6, Nursery)
 *   - "Week Topic | Content" with dash bullets (Nursery 2-3)
 *   - "Week Theme / Focus Area | Topic & Content Breakdown" prose (Primary 3)
 *   - "Week Topic | Teacher's Activities | Pupil's Activities | Resources" (Pre-nursery, Nursery 1)
 *
 * Usage: node scripts/parse-curriculum.js
 */
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Subject name normalisation (merges variants into one canonical name) ──
const NAME_MAP = {
  'ENGLISH STUDIES': 'ENGLISH LANGUAGE',
  'CULTURAL & CREATIVE ARTS (CCA)': 'CULTURAL AND CREATIVE ARTS',
  'CULTURAL AND CREATIVE ARTS (CCA)': 'CULTURAL AND CREATIVE ARTS',
  'CHRISTIAN RELIGIOUS STUDIES (CRS)': 'CHRISTIAN RELIGIOUS STUDIES',
  'ISLAMIC RELIGIOUS STUDIES (IRS)': 'ISLAMIC RELIGIOUS STUDIES',
  'ISLAMIC STUDIES': 'ISLAMIC RELIGIOUS STUDIES',
  'PHYSICAL & HEALTH EDUCATION': 'PHYSICAL AND HEALTH EDUCATION',
  'FRENCH LANGUAGE': 'FRENCH',
  'CATERING AND CRAFT': 'CATERING AND CRAFT PRACTICE',
  'FASHION DESIGN & GARMENT MAKING': 'FASHION DESIGN AND GARMENT MAKING',
  'SOLAR PHOTOVOLTAIC INSTALLATION & MAINTENANCE': 'SOLAR PHOTOVOLTAIC INSTALLATION AND MAINTENANCE',
  'SOLAR PHOTOVOLTAIC (PV) INSTALLATION AND MAINTENANCE': 'SOLAR PHOTOVOLTAIC INSTALLATION AND MAINTENANCE',
  'BASIC SCIENCE': 'BASIC SCIENCE & TECHNOLOGY',
  'BASIC SCIENCE AND TECHNOLOGY': 'BASIC SCIENCE & TECHNOLOGY',
  'BASIC SCIENCE & TECHNOLOGY': 'BASIC SCIENCE & TECHNOLOGY',
  'PRE-SCIENCE': 'BASIC SCIENCE & TECHNOLOGY',
  'BASIC DIGITAL LITERACY': 'DIGITAL TECHNOLOGIES',
};

function normalizeSubject(name) {
  let n = name.replace(/\s+SCHEME\s+OF\s+WORK\s*$/i, '').trim();
  n = n.replace(/\s+SCHEME\s*$/i, '').trim();
  n = n.replace(/\s+/g, ' ');
  return NAME_MAP[n] || n;
}

// ── Class (level) section markers ────────────────────────────────────────
// Only "… SCHEME OF WORK" markers are used (standalone "PRE-NURSERY" /
// "NURSERY 1" lines also appear as table-cell continuation text, so they
// must NOT be treated as section markers).
const CLASS_RULES = [
  [/^\s*PRENURSERY\s+SCHEME\s+OF\s+WORK\s*$/i, 'PRE-NURSERY'],
  [/^\s*NURSERY\s*(\d)\s+SCHEME\s+OF\s+WORK\s*$/i, (m) => `NURSERY${m[1]}`],
  [/^\s*PRIMARY\s*(\d)\s+SCHEME\s+OF\s+WORK\s*$/i, (m) => `P${m[1]}`],
  [/^\s*JUNIOR\s+SECONDARY\s+ONE\s+SCHEME\s+OF\s+WORK\s*$/i, 'JSS1'],
  [/^\s*JUNIOR\s+SECONDARY\s+TWO\s+SCHEME\s+OF\s+WORK\s*$/i, 'JSS2'],
  [/^\s*JUNIOR\s+SECONDARY\s+THREE\s+SCHEME\s+OF\s+WORK\s*$/i, 'JSS3'],
  [/^\s*SENIOR\s+SECONDARY\s+ONE\s+SCHEME\s+OF\s+WORK\s*$/i, 'SSS1'],
  [/^\s*SENIOR\s+SECONDARY\s+TWO\s+SCHEME\s+OF\s+WORK\s*$/i, 'SSS2'],
  [/^\s*SENIOR\s+SECONDARY\s+THREE\s+SCHEME\s+OF\s+WORK\s*$/i, 'SSS3'],
];

// ── Noise / boilerplate lines to ignore ─────────────────────────────────
const NOISE_RULES = [
  /BACK\s+TO\s+TABLE\s+OF\s+CONTENT/i,
  /GET\s+ACCESS/i,
  /CLICK\s+HERE/i,
  /SCHOLARCLOPEDIA/i,
  /https?:\/\//i,
  /TRADE\s+SUBJECTS/i,
  /^.*\|.*\d+\|BACK/i,                    // "  610 | 985|BACK TO TABLE OF CONTENT"
  /^WEEK\s/i,                             // WEEK ... table headers
  /^Week\s/i,                             // Week ... table headers
  /^CONTENT\s*$/i,
  /BREAKDOWN/i,
  /TEACHERS?\s*'?\s*ACTIVIT/,
  /PUPILS?\s*'?\s*ACTIVIT/,
  /LEARNING\s+RESOURCES/,
  /RESOURCES\s*$/i,
  /SAMPLE\s+LESSON\s+NOTE/i,
  /^\.{3,}/,
  /\.{3,}\d+\s*$/,                        // dotted TOC lines ending in a page number
  /^\s*\d+\s*$/,                          // bare page numbers
  /^\s*\(\s*(for|primary|secondary)[^)]*\)\s*$/i,
];

function parseSchemeFile(filepath) {
  return fs.readFile(filepath, 'utf-8').then(text => {
    const lines = text.split('\n');
    const curriculum = {};
    let currentClass = null;
    let currentSubject = null;
    let currentTerm = null;

    const ensureSubject = (cls, subj) => {
      if (!curriculum[cls]) curriculum[cls] = {};
      if (!curriculum[cls][subj]) curriculum[cls][subj] = { first: [], second: [], third: [] };
      return curriculum[cls][subj];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const stripped = line.trim();

      if (!stripped) continue;

      // ── 1. Class (level) section markers ──────────────────────────
      let clsMatch = false;
      for (const [re, val] of CLASS_RULES) {
        const m = re.exec(stripped);
        if (m) {
          currentClass = typeof val === 'function' ? val(m) : val;
          currentSubject = null;
          currentTerm = null;
          clsMatch = true;
          break;
        }
      }
      if (clsMatch) continue;

      // ── 2. Term markers ───────────────────────────────────────────
      const termMatch = stripped.match(/^(FIRST|SECOND|THIRD)\s+TERM\s*:?\s*$/i);
      if (termMatch) {
        currentTerm = termMatch[1].toLowerCase();
        continue;
      }

      // ── 3. Noise lines (before subject detection so "SS 1 TRADE SUBJECTS" etc. are ignored) ──
      if (NOISE_RULES.some(re => re.test(stripped))) continue;

      // ── 4. Subject headers ─────────────────────────────────────────
      // A genuine subject header is a single-column line (single spaces).
      // Lines containing a run of 3+ spaces are table-cell content
      // (rows or wrapped cells) and must not be misread as headers.
      const isTableLine = / {3,}/.test(stripped);
      let subjectMatch = null;

      // 3a. "NURSERY 3 LITERACY (LETTER WORK) SCHEME OF WORK", "PRIMARY 1 MATHEMATICS SCHEME OF WORK",
      //     "JSS 1 SOLAR PHOTOVOLTAIC (PV) INSTALLATION AND MAINTENANCE", "PRE-NURSERY HEALTH HABITS SCHEME OF WORK"
      const m3a = !isTableLine && stripped.match(
        /^(JSS\s*\d+|SSS\s*\d+|SS\s*\d+|PRIMARY\s*\d+|NURSERY\s*\d+|PRE-NURSERY)\s+(.+?)(?:\s+SCHEME\s+OF\s+WORK|\s+SCHEME)?\s*$/i
      );
      if (m3a && !/^(FIRST|SECOND|THIRD)\s+TERM$/.test(m3a[2].trim())) {
        subjectMatch = { subject: normalizeSubject(m3a[2]) };
      }

      // 3b. "MATHEMATICS SCHEME OF WORK (PRIMARY 1)", "LITERACY (LETTER WORK) SCHEME OF WORK (NURSERY 3)"
      if (!subjectMatch) {
        const m3b = !isTableLine && stripped.match(
          /^(.+?)\s+SCHEME\s+OF\s+WORK\s*\((PRIMARY|JSS|SS|NURSERY)\s*(\d+)\)\s*$/i
        );
        if (m3b) {
          const clsPrefix = m3b[2].toUpperCase() === 'PRIMARY' ? 'P'
            : m3b[2].toUpperCase() === 'NURSERY' ? 'NURSERY' : m3b[2].toUpperCase();
          subjectMatch = {
            subject: normalizeSubject(m3b[1]),
            class: clsPrefix === 'NURSERY' ? `NURSERY${m3b[3]}` : `${clsPrefix}${m3b[3]}`,
          };
        }
      }

      // 3c. "ENGLISH LANGUAGE (PRIMARY 1)"
      if (!subjectMatch) {
        const m3c = !isTableLine && stripped.match(/^(.+?)\s+\((PRIMARY|JSS|SS)\s*(\d+)\)\s*$/i);
        if (m3c && !/^(FIRST|SECOND|THIRD)\s+TERM$/.test(m3c[1].trim())) {
          const clsPrefix = m3c[2].toUpperCase() === 'PRIMARY' ? 'P' : m3c[2].toUpperCase();
          subjectMatch = { subject: normalizeSubject(m3c[1]), class: `${clsPrefix}${m3c[3]}` };
        }
      }

      // 3d. Bare subject (nursery style): "HEALTH HABITS SCHEME OF WORK"
      if (!subjectMatch) {
        const m3d = !isTableLine && stripped.match(/^(.+?)\s+SCHEME\s+OF\s+WORK\s*$/i);
        if (m3d && currentClass) {
          const name = m3d[1].trim();
          if (!/^(FIRST|SECOND|THIRD)\s+TERM$/.test(name)) {
            subjectMatch = { subject: normalizeSubject(name) };
          }
        }
      }

      if (subjectMatch) {
        // A subject name must never contain a term label (e.g. "… (FIRST TERM)")
        if (/TERM\b/i.test(subjectMatch.subject)) subjectMatch = null;
      }

      if (subjectMatch) {
        if (subjectMatch.class) currentClass = subjectMatch.class;
        if (currentClass) {
          currentSubject = subjectMatch.subject;
          currentTerm = null;
          ensureSubject(currentClass, currentSubject);
        }
        continue;
      }

      // ── 5. Table rows — "WEEK TOPIC CONTENT ..." ───────────────────
      if (currentClass && currentSubject && currentTerm) {
        const tm = stripped.match(/^(\d+(?:\s*[–—-]\s*\d+)?)[.)]?\s+(.+?)(?:\t{2,}|   +)(.+)$/);
        if (tm) {
          const topicName = tm[2].trim().replace(/\s+/g, ' ');
          const content = tm[3].trim().replace(/\s+/g, ' ');
          const skipKw = ['MIDTERM', 'MID-TERM', 'BREAK', 'EXAMINATION', 'CLOSING', 'VACATION', 'REVISION'];
          const upper = topicName.toUpperCase();
          if (!skipKw.some(kw => upper.includes(kw)) && topicName !== '-' && topicName !== '–') {
            const topic = { name: topicName };
            if (content && content !== '—' && content !== '-' && content.length > 2) {
              topic.subtopics = [content];
            }
            curriculum[currentClass][currentSubject][currentTerm].push(topic);
          }
          continue;
        }

        // ── 6. Continuation lines (subtopics / topic wrapping) ──────
        const last = curriculum[currentClass][currentSubject][currentTerm].at(-1);
        if (last && stripped.length > 2 && !/^\d/.test(stripped)) {
          if (/^(SCHEME|TERM|WORK|WEEK|CLASS)/.test(stripped.toUpperCase())) continue;
          const sub = stripped.replace(/\s+/g, ' ').trim();
          if (!sub) continue;
          if (!last.subtopics) last.subtopics = [];
          last.subtopics.push(sub);
        }
      }
    }
    return curriculum;
  });
}

// ── Clean up garbage subjects and merge near-duplicates ─────────────────
function cleanAndMerge(allData) {
  for (const cls in allData) {
    for (const subj of Object.keys(allData[cls])) {
      if (!subj || subj.trim().length < 4) { delete allData[cls][subj]; continue; }
      if (/^[.\s]+/.test(subj)) { delete allData[cls][subj]; continue; }
      if (subj.trim().toUpperCase() === 'SCHEME OF WORK') { delete allData[cls][subj]; continue; }
      if (/SCHEME\s+OF/.test(subj.toUpperCase())) { delete allData[cls][subj]; continue; }
    }
    const seen = {};
    for (const subj of Object.keys(allData[cls])) {
      const norm = subj.toUpperCase().replace(/&/g, 'AND').trim();
      if (seen[norm] && seen[norm] !== subj) {
        for (const term of ['first', 'second', 'third']) {
          allData[cls][seen[norm]][term] = allData[cls][seen[norm]][term].concat(allData[cls][subj][term] || []);
        }
        delete allData[cls][subj];
      } else {
        seen[norm] = subj;
      }
    }
  }
}

async function main() {
  const jssSssPath = join(__dirname, '976039570-Jss-Sss-Nerdc-Scheme-2025.txt');
  const primaryPath = join(__dirname, '978433855-Pre-primary-Primary-Schools-Nerdc-Scheme-2025.txt');
  const outputPath = join(__dirname, 'parsed_curriculum.json');

  console.log('Parsing JSS/SSS curriculum...');
  const jssSss = await parseSchemeFile(jssSssPath);
  console.log('Parsing Pre-primary/Primary curriculum...');
  const primary = await parseSchemeFile(primaryPath);

  const allData = { ...jssSss, ...primary };
  cleanAndMerge(allData);

  const totalTopics = Object.values(allData).reduce((sum, cls) =>
    sum + Object.values(cls).reduce((s, subj) =>
      s + ['first', 'second', 'third'].reduce((t, term) => t + (subj[term] || []).length, 0), 0), 0);
  const totalSubjects = Object.values(allData).reduce((s, c) => s + Object.keys(c).length, 0);

  console.log(`\nClasses: ${Object.keys(allData).length}`);
  console.log(`Subjects: ${totalSubjects}`);
  console.log(`Total topics: ${totalTopics}`);
  for (const cls of Object.keys(allData).sort()) {
    const subs = Object.keys(allData[cls]);
    const tc = subs.reduce((s, subj) =>
      s + ['first', 'second', 'third'].reduce((t, term) => t + (allData[cls][subj][term] || []).length, 0), 0);
    console.log(`  ${cls.padEnd(10)}: ${String(subs.length).padStart(3)} subjects, ${String(tc).padStart(5)} topics`);
  }

  await fs.writeFile(outputPath, JSON.stringify(allData, null, 2), 'utf-8');
  console.log(`\nSaved to ${outputPath}`);
}

main().catch(console.error);
