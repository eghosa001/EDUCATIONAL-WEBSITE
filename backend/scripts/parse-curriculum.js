/**
 * Parse NERDC Scheme of Work TXT files into structured JSON.
 * Usage: node scripts/parse-curriculum.js
 */
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

      // Class headers
      if (/JUNIOR SECONDARY ONE|JSS1 SCHEME/.test(stripped) && /SCHEME/.test(stripped.toUpperCase())) {
        currentClass = 'JSS1'; currentSubject = null; currentTerm = null; continue;
      }
      if (/JUNIOR SECONDARY TWO|JSS2 SCHEME/.test(stripped) && /SCHEME/.test(stripped.toUpperCase())) {
        currentClass = 'JSS2'; currentSubject = null; currentTerm = null; continue;
      }
      if (/JUNIOR SECONDARY THREE|JSS3 SCHEME/.test(stripped) && /SCHEME/.test(stripped.toUpperCase())) {
        currentClass = 'JSS3'; currentSubject = null; currentTerm = null; continue;
      }
      if (/SENIOR SECONDARY ONE|SS1 SCHEME/.test(stripped) && /SCHEME/.test(stripped.toUpperCase())) {
        currentClass = 'SSS1'; currentSubject = null; currentTerm = null; continue;
      }
      if (/SENIOR SECONDARY TWO|SS2 SCHEME/.test(stripped) && /SCHEME/.test(stripped.toUpperCase())) {
        currentClass = 'SSS2'; currentSubject = null; currentTerm = null; continue;
      }
      if (/SENIOR SECONDARY THREE|SS3 SCHEME/.test(stripped) && /SCHEME/.test(stripped.toUpperCase())) {
        currentClass = 'SSS3'; currentSubject = null; currentTerm = null; continue;
      }
      if (/PRIMARY\s+1.*SCHEME/.test(stripped)) { currentClass = 'P1'; currentSubject = null; currentTerm = null; continue; }
      if (/PRIMARY\s+2.*SCHEME/.test(stripped)) { currentClass = 'P2'; currentSubject = null; currentTerm = null; continue; }
      if (/PRIMARY\s+3.*SCHEME/.test(stripped)) { currentClass = 'P3'; currentSubject = null; currentTerm = null; continue; }
      if (/PRIMARY\s+4.*SCHEME/.test(stripped)) { currentClass = 'P4'; currentSubject = null; currentTerm = null; continue; }
      if (/PRIMARY\s+5.*SCHEME/.test(stripped)) { currentClass = 'P5'; currentSubject = null; currentTerm = null; continue; }
      if (/PRIMARY\s+6.*SCHEME/.test(stripped)) { currentClass = 'P6'; currentSubject = null; currentTerm = null; continue; }
      if (/PRE[- ]?NURSERY.*SCHEME/.test(stripped)) { currentClass = 'PRE-NURSERY'; currentSubject = null; currentTerm = null; continue; }

      // Subject headers
      const subjMatch = stripped.match(/^(?:JSS[123]|SS[123]|PRIMARY\s*\d|PRE[- ]?NURSERY)\s+(.+?)\s+(?:SCHEME\s+OF\s+WORK|SCHEME)\s*$/i);
      if (subjMatch && currentClass) {
        currentSubject = subjMatch[1].trim().replace(/\s+/g, ' ');
        if (!curriculum[currentClass]) curriculum[currentClass] = {};
        if (!curriculum[currentClass][currentSubject]) {
          curriculum[currentClass][currentSubject] = { first: [], second: [], third: [] };
        }
        currentTerm = null;
        continue;
      }

      // Term headers
      if (/^FIRST\s+TERM$/.test(stripped)) { currentTerm = 'first'; continue; }
      if (/^SECOND\s+TERM$/.test(stripped)) { currentTerm = 'second'; continue; }
      if (/^THIRD\s+TERM$/.test(stripped)) { currentTerm = 'third'; continue; }

      // Skip noise
      if (/^(GET ACCESS|CLICK HERE|Scholarclopedia|Home|Back to|Website:|ALL Schemes|https?://|\d+\s*$|•|—+$|\s*$|Number of Weeks|Assessment Methods|Teaching and Learning|Evaluation Methods|Recommended Texts|Instructional Materials)/i.test(stripped)) {
        continue;
      }

      // Table rows: number + tabs + topic + more tabs + content
      const tableMatch = stripped.match(/^(\d+)[\t]+(.+?)(?:[\t\s]{3,})(.+)$/);
      if (tableMatch && currentClass && currentSubject && currentTerm) {
        const topicName = tableMatch[2].trim().replace(/\s+/g, ' ');
        const content = tableMatch[3].trim().replace(/\s+/g, ' ');
        const skipKw = ['MIDTERM', 'BREAK', 'EXAMINATION', 'CLOSING', 'VACATION', 'REVISION'];
        if (!skipKw.some(kw => topicName.toUpperCase().includes(kw)) && topicName !== '-' && topicName !== '–') {
          const topic = { name: topicName };
          if (content && content !== '—' && content !== '-') {
            topic.subtopics = [content];
          }
          curriculum[currentClass][currentSubject][currentTerm].push(topic);
        }
        continue;
      }

      // Continuation lines
      if (currentClass && currentSubject && currentTerm && curriculum[currentClass]?.[currentSubject]?.[currentTerm]?.length > 0) {
        const last = curriculum[currentClass][currentSubject][currentTerm][curriculum[currentClass][currentSubject][currentTerm].length - 1];
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
  const outputPath = join(__dirname, '..', '..', 'parsed_curriculum.json');

  console.log('Parsing JSS/SSS curriculum...');
  const jssSss = await parseSchemeFile(jssSssPath);
  console.log('Parsing Primary curriculum...');
  const primary = await parseSchemeFile(primaryPath);

  const allData = { ...jssSss, ...primary };
  const totalTopics = Object.values(allData).reduce((sum, cls) =>
    sum + Object.values(cls).reduce((s, subj) =>
      s + ['first', 'second', 'third'].reduce((t, term) => t + (subj[term] || []).length, 0), 0), 0);

  console.log(`\nClasses: ${Object.keys(allData).length}`);
  console.log(`Subjects: ${Object.values(allData).reduce((s, c) => s + Object.keys(c).length, 0)}`);
  console.log(`Total topics: ${totalTopics}`);

  for (const cls of Object.keys(allData).sort()) {
    const tc = Object.values(allData[cls]).reduce((s, subj) =>
      s + ['first', 'second', 'third'].reduce((t, term) => t + (subj[term] || []).length, 0), 0);
    console.log(`  ${cls}: ${Object.keys(allData[cls]).length} subjects, ${tc} topics`);
  }

  await fs.writeFile(outputPath, JSON.stringify(allData, null, 2), 'utf-8');
  console.log(`\nSaved to ${outputPath}`);
}

main().catch(console.error);
