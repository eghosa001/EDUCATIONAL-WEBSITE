/**
 * Parse NERDC Scheme of Work TXT files into structured JSON.
 * Handles multiple table formats: tab-separated, space-separated with periods, and mixed.
 * Usage: node scripts/parse-curriculum.js
 */
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Normalize subject name variants across the curriculum
const NAME_MAP = {
  'CULTURAL & CREATIVE ARTS (CCA)': 'CULTURAL AND CREATIVE ARTS',
  'PHYSICAL & HEALTH EDUCATION': 'PHYSICAL AND HEALTH EDUCATION',
  'ISLAMIC RELIGIOUS STUDIES (IRS)': 'ISLAMIC RELIGIOUS STUDIES',
  'ISLAMIC STUDIES': 'ISLAMIC RELIGIOUS STUDIES',
  'CATERING AND CRAFT': 'CATERING AND CRAFT PRACTICE',
  'FASHION DESIGN & GARMENT MAKING': 'FASHION DESIGN AND GARMENT MAKING',
  'SOLAR PHOTOVOLTAIC INSTALLATION & MAINTENANCE': 'SOLAR PHOTOVOLTAIC INSTALLATION AND MAINTENANCE',
  'SOLAR PHOTOVOLTAIC (PV) INSTALLATION AND MAINTENANCE': 'SOLAR PHOTOVOLTAIC INSTALLATION AND MAINTENANCE',
  'BASIC SCIENCE': 'BASIC SCIENCE & TECHNOLOGY',
  'BASIC SCIENCE & TECHNOLOGY': 'BASIC SCIENCE & TECHNOLOGY',
  'ENGLISH LANGUAGE': 'ENGLISH LANGUAGE',
  'ENGLISH STUDIES': 'ENGLISH LANGUAGE',
};

function normalizeSubject(name) {
  return NAME_MAP[name] || name;
}

function parseSchemeFile(filepath) {
  const content = fs.readFile(filepath, 'utf-8');
  return content.then(text => {
    const lines = text.split('\n');
    const curriculum = {};
    let currentClass = null;
    let currentSubject = null;
    let currentTerm = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const stripped = line.trim();

      // ── Class headers ──────────────────────────────────────────────
      // Match: "PRIMARY 1 SCHEME OF WORK" or "JUNIOR SECONDARY ONE SCHEME OF WORK"
      const classRules = [
        [/JUNIOR\s+SECONDARY\s+ONE.*SCHEME/i, 'JSS1'],
        [/JUNIOR\s+SECONDARY\s+TWO.*SCHEME/i, 'JSS2'],
        [/JUNIOR\s+SECONDARY\s+THREE.*SCHEME/i, 'JSS3'],
        [/SENIOR\s+SECONDARY\s+ONE.*SCHEME/i, 'SSS1'],
        [/SENIOR\s+SECONDARY\s+TWO.*SCHEME/i, 'SSS2'],
        [/SENIOR\s+SECONDARY\s+THREE.*SCHEME/i, 'SSS3'],
        [/PRIMARY\s*1.*SCHEME/i, 'P1'],
        [/PRIMARY\s*2.*SCHEME/i, 'P2'],
        [/PRIMARY\s*3.*SCHEME/i, 'P3'],
        [/PRIMARY\s*4.*SCHEME/i, 'P4'],
        [/PRIMARY\s*5.*SCHEME/i, 'P5'],
        [/PRIMARY\s*6.*SCHEME/i, 'P6'],
      ];
      let foundClass = false;
      for (const [pat, cls] of classRules) {
        if (pat.test(stripped) && /SCHEME/.test(stripped.toUpperCase())) {
          currentClass = cls;
          currentSubject = null;
          currentTerm = null;
          foundClass = true;
          break;
        }
      }
      if (foundClass) continue;

      // ── Subject headers — Format 1: "PRIMARY 1 MATHEMATICS SCHEME OF WORK" ──
      const subjMatch1 = stripped.match(
        /^(?:JSS\s*\d|SS\s*\d|PRIMARY\s*\d)\s+(.+?)(?:\s+(?:SCHEME\s+OF\s+WORK|SCHEME))?\s*$/i
      );
      if (subjMatch1 && currentClass) {
        let name = subjMatch1[1].trim().replace(/\s+/g, ' ');
        // Check if this is actually a term indicator
        if (/^(FIRST|SECOND|THIRD)\s+TERM$/.test(name)) continue;
        if (/WEEK/i.test(name) || /SUBJECTS/i.test(name)) continue;
        // If we have a class mismatch, the subject line might contain class info
        if (!/PRIMARY/i.test(stripped) && currentClass.startsWith('P')) {
          // Already in primary context, accept subject
        }
        currentSubject = normalizeSubject(name);
        if (!curriculum[currentClass]) curriculum[currentClass] = {};
        if (!curriculum[currentClass][currentSubject]) {
          curriculum[currentClass][currentSubject] = { first: [], second: [], third: [] };
        }
        currentTerm = null;
        continue;
      }

      // ── Subject headers — Format 2: "ENGLISH LANGUAGE SCHEME OF WORK (PRIMARY 2)" ──
      const subjMatch2 = stripped.match(
        /^(.+?)\s+\(PRIMARY\s+(\d+)\)\s*(?:SCHEME\s+OF\s+WORK|SCHEME)?\s*$/i
      );
      if (subjMatch2) {
        const name = subjMatch2[1].trim().replace(/\s+/g, ' ');
        const clsNum = parseInt(subjMatch2.group?.(2) || subjMatch2[2]);
        const cls = `P${clsNum}`;
        if (/^(FIRST|SECOND|THIRD)\s+TERM$/.test(name)) continue;
        if (/WEEK/i.test(name) || /SUBJECTS/i.test(name)) continue;
        currentClass = cls;
        currentSubject = normalizeSubject(name);
        if (!curriculum[currentClass]) curriculum[currentClass] = {};
        if (!curriculum[currentClass][currentSubject]) {
          curriculum[currentClass][currentSubject] = { first: [], second: [], third: [] };
        }
        currentTerm = null;
        continue;
      }

      // Also handle: "SUBJECT NAME SCHEME OF WORK (PRIMARY N)" where PRIMARY N comes at end after SCHEME
      const subjMatch3 = stripped.match(
        /^(.+?)\s+SCHEME\s+OF\s+WORK\s*\((?:JSS|SS|PRIMARY)\s*(\d+)\)$/i
      );
      if (subjMatch3) {
        const name = subjMatch3[1].trim().replace(/\s+/g, ' ');
        const clsNum = parseInt(subjMatch3[2]);
        const clsPrefix = subjMatch3[0].toUpperCase().includes('JSS') ? 'JSS' :
                          subjMatch3[0].toUpperCase().includes('SS') ? 'SS' : 'P';
        const cls = `${clsPrefix}${clsNum}`;
        if (/^(FIRST|SECOND|THIRD)\s+TERM$/.test(name)) continue;
        currentClass = cls;
        currentSubject = normalizeSubject(name);
        if (!curriculum[currentClass]) curriculum[currentClass] = {};
        if (!curriculum[currentClass][currentSubject]) {
          curriculum[currentClass][currentSubject] = { first: [], second: [], third: [] };
        }
        currentTerm = null;
        continue;
      }

      // ── Term headers ───────────────────────────────────────────────
      if (/^FIRST\s+TERM$/.test(stripped)) { currentTerm = 'first'; continue; }
      if (/^SECOND\s+TERM$/.test(stripped)) { currentTerm = 'second'; continue; }
      if (/^THIRD\s+TERM$/.test(stripped)) { currentTerm = 'third'; continue; }

      // ── Skip noise lines ───────────────────────────────────────────
      if (/^(GET ACCESS|CLICK HERE|Scholarclopedia|Home|Back to|Website:|ALL Schemes|https?:\/\/|\d+\s*$|•|—+$|\s*$|Number of Weeks|Assessment Methods|Teaching and Learning|Evaluation Methods|Recommended Texts|Instructional Materials|TRADE SUBJECTS)/i.test(stripped)) {
        continue;
      }
      // Skip dotted filler lines
      if (/^\.+\s*$/.test(stripped)) continue;

      // ── Table rows — supports multiple formats: ────────────────────
      const tm = stripped.match(/^\s*(\d+)[.)]?\s+(.+?)(?:\t{2,}|   +)(.+)$/);
      if (tm && currentClass && currentSubject && currentTerm) {
        const topicName = tm[2].trim().replace(/\s+/g, ' ');
        const content = tm[3].trim().replace(/\s+/g, ' ');
        const skipKw = ['MIDTERM', 'BREAK', 'EXAMINATION', 'CLOSING', 'VACATION', 'REVISION'];
        if (!skipKw.some(kw => topicName.toUpperCase().includes(kw))
            && topicName !== '-' && topicName !== '–') {
          const topic = { name: topicName };
          if (content && content !== '—' && content !== '-' && content.length > 2) {
            topic.subtopics = [content];
          }
          curriculum[currentClass][currentSubject][currentTerm].push(topic);
        }
        continue;
      }

      // ── Continuation lines ─────────────────────────────────────────
      if (currentClass && currentSubject && currentTerm
          && curriculum[currentClass]?.[currentSubject]?.[currentTerm]?.length > 0) {
        const last = curriculum[currentClass][currentSubject][currentTerm].at(-1);
        if (stripped && stripped.length > 5 && !/^\d+/.test(stripped)) {
          if (!/^(SCHEME|TERM|WORK|WEEK|CLASS)/.test(stripped.toUpperCase())) {
            if (!last.subtopics) last.subtopics = [];
            const sub = stripped.replace(/\s+/g, ' ').trim();
            if (sub && sub.length > 2 && !sub.startsWith('-')) {
              last.subtopics.push(sub);
            }
          }
        }
      }
    }
    return curriculum;
  });
}

async function main() {
  const jssSssPath = join(__dirname, '976039570-Jss-Sss-Nerdc-Scheme-2025.txt');
  const primaryPath = join(__dirname, '978433855-Pre-primary-Primary-Schools-Nerdc-Scheme-2025.txt');
  const outputPath = join(__dirname, '..', 'parsed_curriculum.json');

  console.log('Parsing JSS/SSS curriculum...');
  const jssSss = await parseSchemeFile(jssSssPath);
  console.log('Parsing Primary curriculum...');
  const primary = await parseSchemeFile(primaryPath);

  let allData = { ...jssSss, ...primary };

  // ── Clean up garbage subjects and merge near-duplicates ─────────
  for (const cls in allData) {
    // Remove invalid entries
    for (const subj of Object.keys(allData[cls])) {
      if (!subj || subj.length < 4) { delete allData[cls][subj]; continue; }
      if (/^[\.\s]+/.test(subj)) { delete allData[cls][subj]; continue; }
      if (subj.trim().toUpperCase() === 'SCHEME OF WORK') { delete allData[cls][subj]; continue; }
      if (/SCHEME\s+OF/.test(subj.toUpperCase())) { delete allData[cls][subj]; continue; }
    }
    // Merge duplicates by normalized name
    const seen = {};
    for (const subj of Object.keys(allData[cls])) {
      const norm = subj.toUpperCase().replace(/&/g, 'AND').trim();
      if (seen[norm] && seen[norm] !== subj) {
        const existing = seen[norm];
        for (const term of ['first', 'second', 'third']) {
          allData[cls][existing][term] = allData[cls][existing][term].concat(allData[cls][subj][term] || []);
        }
        delete allData[cls][subj];
      } else {
        seen[norm] = subj;
      }
    }
  }

  const totalTopics = Object.values(allData).reduce((sum, cls) =>
    sum + Object.values(cls).reduce((s, subj) =>
      s + ['first','second','third'].reduce((t, term) => t + (subj[term] || []).length, 0), 0), 0);
  const totalSubjects = Object.values(allData).reduce((s, c) => s + Object.keys(c).length, 0);

  console.log(`\nClasses: ${Object.keys(allData).length}`);
  console.log(`Subjects: ${totalSubjects}`);
  console.log(`Total topics: ${totalTopics}`);
  for (const cls of Object.keys(allData).sort()) {
    const tc = Object.values(allData[cls]).reduce((s, subj) =>
      s + ['first','second','third'].reduce((t, term) => t + (subj[term] || []).length, 0), 0);
    console.log(`  ${cls}: ${Object.keys(allData[cls]).length} subjects, ${tc} topics`);
  }

  await fs.writeFile(outputPath, JSON.stringify(allData, null, 2), 'utf-8');
  console.log(`\nSaved to ${outputPath}`);
}

main().catch(console.error);
