#!/usr/bin/env python3
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

def ocr_pdf(pdf, work):
    prefix = work / "page"
    run(["pdftoppm", "-jpeg", "-r", "180", str(pdf), str(prefix)])
    pages = sorted(work.glob("page-*.jpg"))
    text = []
    for idx, image in enumerate(pages, 1):
        out = work / ("ocr-%04d" % idx)
        run(["tesseract", str(image), str(out), "-l", "eng", "--psm", "6"])
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
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()

def answer_key(text):
    key = {}
    marker = re.search(r"(?is)\b(answer\s*key|answers?)\b", text)
    scope = text[marker.start():] if marker else ""
    for m in re.finditer(r"(?m)^\s*(\d{1,3})\s*[\.\):\-]?\s*([A-E])\s*$", scope):
        key[int(m.group(1))] = m.group(2).upper()
    return key

OPTION_RE = re.compile(r"(?<!\w)(?:[\u2022\u25cf\u25aa\uf0b7]\s*)?(?:\(([A-E])\)|([A-E])[\.\):])\s+", re.I)
QUESTION_RE = re.compile(r"(?m)^\s*(\d{1,3})\s*[\.\)]\s+(?=\S)")

def parse_questions(raw):
    text = clean_text(raw)
    answers = answer_key(text)
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
                    options.append({"id": oid, "text": re.sub(r"\s+", " ", otext)[:900]})
        question = re.sub(r"\s+", " ", question).strip(" -:\n\t")
        if len(question) < 8 or len(question) > 2200:
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

def should_ocr(file, text):
    status = str((file.get("metadata") or {}).get("status") or "")
    if status == "needs_batch_processing":
        return len(text.strip()) < 3000
    pages = int((file.get("metadata") or {}).get("page_count") or 1)
    return status in {"needs_ocr_or_manual_parse", "ocr_failed"} or len(text.strip()) < max(1000, pages * 150)

def main():
    manifest = api({"action": "manifest"})
    files = manifest.get("files", [])
    print("Files queued:", len(files))
    totals = {"files": 0, "questions": 0, "active": 0, "answered": 0, "failed": 0}
    for pos, file in enumerate(files, 1):
        print("[%d/%d] %s" % (pos, len(files), file.get("file_name")))
        try:
            with tempfile.TemporaryDirectory(prefix="guide-pq-") as td:
                work = Path(td)
                pdf = work / "source.pdf"
                download(file["public_url"], pdf)
                text = pdf_text(pdf)
                method = "pdf-text"
                if should_ocr(file, text):
                    text = ocr_pdf(pdf, work)
                    method = "tesseract-ocr"
                questions = parse_questions(text)
                if not questions:
                    api({
                        "action": "fail",
                        "fileId": file["id"],
                        "message": "No reliable structured questions found after " + method,
                    })
                    totals["failed"] += 1
                    continue
                result = api({
                    "action": "ingest",
                    "fileId": file["id"],
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
