from pathlib import Path
import re

src = Path('978433855-Pre-primary-Primary-Schools-Nerdc-Scheme-2025.txt')
out = Path('generated/primary-nerdc')
out.mkdir(parents=True, exist_ok=True)
text = src.read_text(encoding='utf-8', errors='replace')

# Keep only the Primary 1-6 portions. The source is a text extraction of the NERDC book
# and contains page-break characters, so headings are matched independently of form-feed.
for n in range(1, 7):
    start_re = re.compile(rf'PRIMARY\s+{n}\s+SCHEME\s+OF\s+WORK', re.I)
    end_re = re.compile(rf'PRIMARY\s+{n+1}\s+SCHEME\s+OF\s+WORK', re.I) if n < 6 else re.compile(r'SAMPLE\s+LESSON\s+NOTES', re.I)
    sm = start_re.search(text)
    em = end_re.search(text, sm.end()) if sm else None
    if not sm:
        continue
    section = text[sm.start():em.start() if em else len(text)]
    # Remove repeated archive banners and page-break glyphs, but preserve curriculum text.
    section = re.sub(r'\f', '\n', section)
    section = re.sub(r'GET ACCESS TO MORE EDUCATIONAL RESOURCES[^\n]*\n', '', section, flags=re.I)
    section = re.sub(r'\n\s*\d+\s*\|\s*985\|BACK TO TABLE OF CONTENT\s*\n', '\n', section, flags=re.I)
    (out / f'primary-{n}.txt').write_text(section.strip() + '\n', encoding='utf-8')

manifest = []
for p in sorted(out.glob('primary-*.txt')):
    manifest.append(f'{p.name}\t{p.stat().st_size}\t{len(p.read_text(encoding="utf-8").splitlines())}')
(out / 'MANIFEST.txt').write_text('file\tbytes\tlines\n' + '\n'.join(manifest) + '\n', encoding='utf-8')
