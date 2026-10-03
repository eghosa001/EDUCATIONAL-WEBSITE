#!/usr/bin/env python3
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

EXTRACTOR_URL = os.environ["EXTRACTOR_URL"]
AUDIENCE = os.environ.get("OIDC_AUDIENCE", "the-guide-question-extractor")

def request_oidc_token():
    base = os.environ["ACTIONS_ID_TOKEN_REQUEST_URL"]
    sep = "&" if "?" in base else "?"
    url = base + sep + "audience=" + urllib.parse.quote(AUDIENCE)
    req = urllib.request.Request(
        url,
        headers={"Authorization": "bearer " + os.environ["ACTIONS_ID_TOKEN_REQUEST_TOKEN"]},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)["value"]

def api(payload):
    token = request_oidc_token()
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        EXTRACTOR_URL,
        data=data,
        method="POST",
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=180) as response:
        return json.load(response)

def run(args):
    p = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if p.returncode != 0:
        raise RuntimeError((p.stderr or p.stdout or "command failed")[-1200:])
    return p.stdout

def safe_url(url):
    parts = urllib.parse.urlsplit(url)
    path = urllib.parse.quote(urllib.parse.unquote(parts.path), safe="/")
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))

def download(url, path):
    req = urllib.request.Request(
        safe_url(url),
        headers={"User-Agent": "THE-GUIDE-question-extractor/1.0"},
    )
    with urllib.request.urlopen(req, timeout=180) as response, open(path, "wb") as out:
        shutil.copyfileobj(response, out)

def pdf_text(pdf):
    out = str(pdf) + ".txt"
    run(["pdftotext", "-layout", str(pdf), out])
    return Path(out).read_text(errors="ignore")

def ocr_pdf(pdf, work, psm=6):
    prefix = work / ("page-psm%d" % psm)
    run(["pdftoppm", "-jpeg", "-r", "180", str(pdf), str(prefix)])
    pages = sorted(work.glob("page-psm%d-*.jpg" % psm))
    text = []
    for idx, image in enumerate(pages, 1):
        out = work / ("ocr-psm%d-%04d" % (psm, idx))
        run(["tesseract", str(image), str(out), "-l", "eng", "--psm", str(psm)])
        txt = out.with_suffix(".txt")
        if txt.exists():
            text.append(txt.read_text(errors="ignore"))
        image.unlink(missing_ok=True)
        txt.unlink(missing_ok=True)
    return "\n".join(text)

def clean_text(value):
    value = value.replace("\u2022", " ").replace("\uf0b7", " ").replace("\u25cf", " ")
    value = re.sub(r"https?://\S+|www\.\S+", " ", value, flags=re.I)
    value = re.sub(r"PDF to Word", " ", value, flags=re.I)
    value = re.sub(r"Uploaded online by[^\n]*", " ", value, flags=re.I)
    value = re.sub(r"Download\s+MySchoolGist[^\n]*", " ", value, flags=re.I)
    value = re.sub(r"ANSWER\s+KEYS?[^\n]*", " ", value, flags=re.I)
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()

ARTIFACT_RE = re.compile(
    r"(WAEC.{0,45}Past|Uploaded\s+on|UNTIL\s+YOU\s+ARE\s+TOLD|PRINT\s+IN\s+BLOCK\s+LETTERS|INSTRUCTIONS\s+TO\s+CANDIDATES|Download\s+MySchoolGist|ANSWER\s+KEYS?|Question\s+Paper\s+Type)",
    re.I,
)

def clean_option_text(value):
    value = clean_text(value)
    value = re.sub(r"\s+(w\.m|t\.co)$", "", value, flags=re.I)
    value = re.sub(
        r"\s+(Turn\s+over|UNTIL\s+YOU\s+ARE\s+TOLD|Uploaded\s+on|[0-9]{0,5}[\s\W]*WAEC.{0,45}Past).*$",
        "",
        value,
        flags=re.I,
    )
    return re.sub(r"\s+", " ", value).strip()

def answer_key(raw):
    key = {}
    markers = list(re.finditer(
        r"(?im)^\s*(?:answer\s*keys?|answers?(?:\s+to\s+(?:the\s+)?questions?)?)\s*[:\-]?\s*(?=(?:\d{1,3}\s*[\.\):=\-]?\s*[A-E]\b)|$)",
        raw,
    ))
    if not markers:
        markers = list(re.finditer(r"(?i)\banswer\s*keys?\b", raw))
    if not markers:
        return key
    scope = raw[markers[-1].end():markers[-1].end() + 30000]
    for m in re.finditer(r"(?<!\d)(\d{1,3})\s*[\.\):=\-]?\s*([A-E])\b", scope, flags=re.I):
        number = int(m.group(1))
        if 1 <= number <= 250:
            key[number] = m.group(2).upper()
    return key

OPTION_RE = re.compile(r"(?<!\w)(?:[\u2022\u25cf\u25aa\uf0b7]\s*)?(?:\(([A-E])\)|([A-E])[\.\):])\s+", re.I)
QUESTION_RE = re.compile(r"(?m)^\s*(\d{1,3})\s*[\.\)]\s+(?=\S)")

def parse_questions(raw):
    answers = answer_key(raw)
    text = clean_text(raw)
    starts = list(QUESTION_RE.finditer(text))
    if len(starts) < 2:
        starts = list(re.finditer(r"(?m)^\s*(\d{1,3})\s+(?=[A-Z(\"'])", text))
    results = []
    seen = set()
    for idx, match in enumerate(starts):
        number = int(match.group(1))
        end = starts[idx + 1].start() if idx + 1 < len(starts) else len(text)
        block = text[match.end():end].strip()
        if len(block) < 8:
            continue
        inline = re.search(r"(?i)(?:correct\s*option|correct\s*answer|answer)\s*[:\-]?\s*(?:is\s*)?([A-E])\b", block)
        correct = inline.group(1).upper() if inline else answers.get(number)
        block = re.split(r"(?i)\b(?:correct\s*option|correct\s*answer|answer)\s*[:\-]", block, maxsplit=1)[0].strip()
        block = re.split(r"(?i)\bshort\s+explanation\s*:", block, maxsplit=1)[0].strip()
        option_matches = list(OPTION_RE.finditer(block))
        options = []
        question = block
        if len(option_matches) >= 2:
            question = block[:option_matches[0].start()].strip()
            for oi, om in enumerate(option_matches):
                oid = (om.group(1) or om.group(2)).upper()
                oend = option_matches[oi + 1].start() if oi + 1 < len(option_matches) else len(block)
                otext = block[om.end():oend].strip(" \n\t;")
                otext = re.split(r"(?i)\b(?:correct\s*option|correct\s*answer|answer)\s*[:\-]", otext, maxsplit=1)[0].strip()
                if otext:
                    cleaned_option = clean_option_text(otext)[:900]
                    if cleaned_option:
                        options.append({"id": oid, "text": cleaned_option})
        question = re.sub(r"\s+", " ", question).strip(" -:\n\t")
        if len(question) < 8 or len(question) > 2200 or ARTIFACT_RE.search(question):
            continue
        if options:
            ids = [item["id"] for item in options]
            if ids[:4] != ["A", "B", "C", "D"] or len(question) > 1000:
                continue
            if any(len(item["text"]) > 500 or ARTIFACT_RE.search(item["text"]) for item in options):
                continue
        normalized = re.sub(r"[^a-z0-9]+", "", question.lower())
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        results.append({
            "number": number,
            "questionText": question,
            "options": options[:5],
            "correctAnswer": correct,
        })
    return results

MERGED_NEXT_RE = re.compile(
    r"\b\d{1,3}\s*[.)]\s+(?:The|Which|What|When|Where|Why|How|If|In|From|Under|During|Use|Find|Calculate|State|Explain|A|An)\b"
)
MID_START_RE = re.compile(
    r".{15}\b(?:The|Which|What|When|Where|Why|How|If|In|From|Under|During|Use|Find|Calculate|State|Explain)\b"
)
REFERENCE_RE = re.compile(
    r"(candidates should|learning objectives|assessment would include|topics[ /]contents|question paper type)",
    re.I,
)
NOISE_RE = re.compile(r"(?:[._—-]{4,}\s*\d*|\b(?:w\.m|ww|www|t\.co)\b)", re.I)

def quality_text(value, max_len):
    value = str(value or "").strip()
    if not value or len(value) > max_len:
        return False
    if ARTIFACT_RE.search(value) or REFERENCE_RE.search(value) or MERGED_NEXT_RE.search(value):
        return False
    if re.search(r"[a-z][A-Z][a-z]", value) or NOISE_RE.search(value):
        return False
    letters = len(re.findall(r"[A-Za-z]", value))
    if letters < 6 or letters / max(1, len(value)) < 0.42:
        return False
    return True

def quality_questions(items):
    clean = []
    for item in items:
        question = str(item.get("questionText") or "").strip()
        options = item.get("options") or []
        if not quality_text(question, 420):
            continue
        if options:
            if [str(opt.get("id") or "").upper() for opt in options[:4]] != ["A", "B", "C", "D"]:
                continue
            option_texts = [str(opt.get("text") or "").strip() for opt in options]
            if any(not quality_text(text, 160) or MID_START_RE.search(text) for text in option_texts):
                continue
        elif re.match(r"(?i)^which\s+of\s+the\s+following\b", question):
            continue
        clean.append(item)
    return clean

SUBJECT_ALIASES = [
    ("agricultural science", "Agricultural Science"),
    ("agriculture", "Agricultural Science"),
    ("biology", "Biology"),
    ("chemistry", "Chemistry"),
    ("commerce", "Commerce"),
    ("computer studies", "Computer Studies"),
    ("computer", "Computer Studies"),
    ("economics", "Economics"),
    ("english language", "English Language"),
    ("use of english", "English Language"),
    ("literature in english", "Literature in English"),
    ("literature", "Literature in English"),
    ("french", "French"),
    ("geography", "Geography"),
    ("government", "Government"),
    ("history", "History"),
    ("mathematics", "Mathematics"),
    ("maths", "Mathematics"),
    ("physics", "Physics"),
    ("technical drawing", "Technical Drawing"),
    ("visual arts", "Visual Arts"),
    ("yoruba", "Yoruba"),
]

def infer_subject(file, text):
    explicit = str(file.get("subject") or "").strip()
    if explicit:
        return explicit
    haystack = (str(file.get("file_name") or "") + "\n" + text[:12000]).lower()
    for needle, subject in SUBJECT_ALIASES:
        if needle in haystack:
            return subject
    return None

def should_ocr(file, text):
    status = str((file.get("metadata") or {}).get("status") or "")
    if status == "needs_batch_processing":
        return len(text.strip()) < 3000
    pages = int((file.get("metadata") or {}).get("page_count") or 1)
    return status in {"needs_ocr_or_manual_parse", "ocr_failed"} or len(text.strip()) < max(1000, pages * 150)

def main():
    manifest = api({"action": "manifest"})
    files = manifest.get("files", [])
    shard_total = max(1, int(os.environ.get("OCR_SHARD_TOTAL", "1")))
    shard_index = int(os.environ.get("OCR_SHARD_INDEX", "0"))
    if shard_total > 1:
        files = [
            file for file in files
            if int(hashlib.sha256(str(file.get("id") or "").encode()).hexdigest(), 16) % shard_total == shard_index
        ]
    print("Files queued for extraction/retry:", len(files), "shard", shard_index, "of", shard_total)
    print("Boards:", json.dumps({
        board: sum(1 for item in files if str(item.get("board") or "").lower() == board)
        for board in sorted({str(item.get("board") or "").lower() for item in files})
    }, sort_keys=True))
    totals = {"files": 0, "questions": 0, "active": 0, "answered": 0, "failed": 0}
    for pos, file in enumerate(files, 1):
        print("[%d/%d] %s" % (pos, len(files), file.get("file_name")))
        try:
            with tempfile.TemporaryDirectory(prefix="guide-pq-") as td:
                work = Path(td)
                pdf = work / "source.pdf"
                download(file["public_url"], pdf)
                embedded_text = pdf_text(pdf)
                candidates = [("pdf-text", embedded_text, quality_questions(parse_questions(embedded_text)))]
                if should_ocr(file, embedded_text) or len(candidates[0][2]) < 10:
                    for psm in (6, 3, 4, 11):
                        layout_text = ocr_pdf(pdf, work, psm=psm)
                        layout_questions = quality_questions(parse_questions(layout_text))
                        candidates.append(("tesseract-ocr-psm%d" % psm, layout_text, layout_questions))
                method, text, questions = max(candidates, key=lambda item: len(item[2]))
                print("  extraction candidates:", json.dumps({name: len(rows) for name, _, rows in candidates}, sort_keys=True))
                if not questions:
                    api({
                        "action": "fail",
                        "fileId": file["id"],
                        "message": "No reliable structured questions found after embedded text + OCR PSM 6/3/4/11 retries",
                    })
                    totals["failed"] += 1
                    continue
                subject = infer_subject(file, text)
                if not subject:
                    api({
                        "action": "fail",
                        "fileId": file["id"],
                        "message": "Questions were found but the subject could not be identified safely",
                    })
                    totals["failed"] += 1
                    continue
                result = api({
                    "action": "ingest",
                    "fileId": file["id"],
                    "subject": subject,
                    "pipelineVersion": 2,
                    "method": method,
                    "questions": questions,
                })
                totals["files"] += 1
                totals["questions"] += int(result.get("inserted", 0))
                totals["active"] += int(result.get("active", 0))
                totals["answered"] += int(result.get("answered", 0))
                print("  ", json.dumps(result))
        except Exception as exc:
            print("  ERROR:", exc)
            try:
                api({"action": "fail", "fileId": file["id"], "message": str(exc)})
            except Exception:
                pass
            totals["failed"] += 1
    print("SUMMARY", json.dumps(totals, sort_keys=True))

if __name__ == "__main__":
    main()
