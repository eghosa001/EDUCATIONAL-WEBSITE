#!/usr/bin/env python3
import collections
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ocr_past_questions import api, answer_key, download, pdf_text, parse_questions, quality_questions

DEFAULT_IDS = [
    "88a597c6-60e5-4a14-9e28-5bf2ee5c3e0c",  # Biology Q&A
    "14111548-f56b-45cb-bb5b-0b975c3c34c8",  # Biology past questions
    "8ca0b837-35f3-423f-a91a-665dc88ba19d",  # Government Q&A
    "ca48f55f-9f83-40be-96ba-dcf934226df7",  # Government past questions
    "ccd14c9d-222a-4ba8-8b4b-e3d847f8d19c",  # Chemistry past questions
    "256ba2ee-b872-4024-bf35-ef96c6a3a4c7",  # Mathematics past questions
    "787b6ff8-b879-4c0d-b2dd-8b51c119446f",  # Physics past questions
]

def page_count(pdf: Path) -> int:
    result = subprocess.run(["pdfinfo", str(pdf)], capture_output=True, text=True, check=True)
    match = re.search(r"(?m)^Pages:\s+(\d+)\s*$", result.stdout)
    return int(match.group(1)) if match else 1

def ocr_page_window(pdf: Path, work: Path, psm: int, first: int, last: int, dpi: int = 190, gray: bool = False) -> str:
    mode = "gray" if gray else "color"
    out_dir = work / f"psm-{psm}-{dpi}-{mode}-{first}-{last}"
    out_dir.mkdir(parents=True, exist_ok=True)
    prefix = out_dir / "page"
    command = ["pdftoppm", "-f", str(first), "-l", str(last), "-r", str(dpi)]
    if gray:
        command.append("-gray")
    else:
        command.append("-jpeg")
    command.extend([str(pdf), str(prefix)])
    subprocess.run(
        command,
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    chunks = []
    images = sorted(out_dir.glob("page-*.pgm" if gray else "page-*.jpg"))
    for image in images:
        result = subprocess.run(
            ["tesseract", str(image), "stdout", "--psm", str(psm), "-l", "eng"],
            capture_output=True,
            text=True,
            check=True,
        )
        chunks.append(result.stdout)
    return "\n".join(chunks)

def ocr_full(pdf: Path, work: Path, psm: int = 6) -> str:
    pages = page_count(pdf)
    chunks = []
    # Process in bounded windows so large PDFs do not create hundreds of images at once.
    for first in range(1, pages + 1, 20):
        last = min(pages, first + 19)
        chunks.append(ocr_page_window(pdf, work, psm, first, last))
    return "\n".join(chunks)

def consensus_keys(key_maps):
    votes = collections.defaultdict(list)
    for mapping in key_maps:
        for number, answer in mapping.items():
            votes[number].append(answer)
    consensus = {}
    for number, answers in votes.items():
        counts = collections.Counter(answers)
        answer, count = counts.most_common(1)[0]
        if count >= 2:
            consensus[number] = answer
    return consensus

def candidate_questions(texts, consensus):
    result = {}
    for text in texts:
        for question in quality_questions(parse_questions(text)):
            number = int(question.get("number") or 0)
            answer = consensus.get(number)
            if not answer:
                continue
            qtext = str(question.get("questionText") or "").strip()
            key = re.sub(r"[^a-z0-9]+", "", qtext.lower())
            if len(key) < 18:
                continue
            result[key] = {
                "number": number,
                "questionText": qtext,
                "options": question.get("options") or [],
                "correctAnswer": answer,
            }
    return list(result.values())

def main():
    raw_ids = os.environ.get("RECOVERY_FILE_IDS", "").strip()
    file_ids = [value.strip() for value in raw_ids.split(",") if value.strip()] if raw_ids else DEFAULT_IDS
    manifest = api({"action": "answer_key_scan_manifest", "fileIds": file_ids})
    files = manifest.get("files", [])
    print("JAMB answer-key scan files:", len(files))
    totals = {"files": 0, "with_consensus_key": 0, "consensus_entries": 0, "recovered": 0}

    for pos, file in enumerate(files, 1):
        print(f"[{pos}/{len(files)}] Scanning:", file.get("file_name"))
        try:
            with tempfile.TemporaryDirectory(prefix="guide-jamb-consensus-") as td:
                work = Path(td)
                pdf = work / "source.pdf"
                download(file["public_url"], pdf)
                pages = page_count(pdf)
                embedded = pdf_text(pdf)
                embedded_pages = embedded.split("\f")
                heading_pages = [
                    index + 1 for index, page in enumerate(embedded_pages)
                    if re.search(r"(?im)^\s*(?:(?:correct|objective|section\s+[A-Z])\s+)?(?:answer\s*keys?|answers?)\b", page)
                ]
                windows = [(max(1, pages - 29), pages)]
                for page_no in heading_pages[-6:]:
                    window = (max(1, page_no - 2), min(pages, page_no + 4))
                    if window not in windows:
                        windows.append(window)

                ocr_texts = []
                key_maps = []
                variants = [
                    (6, 190, False, "psm6-color"),
                    (11, 240, True, "psm11-gray"),
                    (12, 300, True, "psm12-gray"),
                    (3, 260, True, "psm3-gray"),
                ]
                consensus = {}
                for psm, dpi, gray, label in variants:
                    combined = []
                    for first, last in windows:
                        combined.append(ocr_page_window(pdf, work, psm, first, last, dpi=dpi, gray=gray))
                    text = "\n".join(combined)
                    ocr_texts.append(text)
                    mapping = answer_key(text)
                    key_maps.append(mapping)
                    consensus = consensus_keys(key_maps)
                    print(f"  {label}: {len(mapping)} answer-key entries; consensus {len(consensus)}")
                    if len(consensus) >= 5 and len(key_maps) >= 2:
                        break

                if len(consensus) < 5:
                    print("  no reliable two-pass answer-key consensus")
                    continue

                question_texts = [embedded]
                extraction_method = str((file.get("metadata") or {}).get("extraction_method") or "").lower()
                if "tesseract" in extraction_method:
                    print("  source questions were OCR-derived; running one matching full-layout pass")
                    question_texts.append(ocr_full(pdf, work, psm=6))

                questions = candidate_questions(question_texts, consensus)
                print("  consensus entries:", len(consensus), "matched question candidates:", len(questions))
                if not questions:
                    continue

                result = api({
                    "action": "recover_answers",
                    "fileId": file["id"],
                    "method": "pdf-answer-key-ocr-consensus",
                    "consensusPasses": 2,
                    "keyEntries": len(consensus),
                    "questions": questions,
                })
                totals["files"] += 1
                totals["with_consensus_key"] += 1
                totals["consensus_entries"] += len(consensus)
                totals["recovered"] += int(result.get("recovered", 0))
                print(" ", json.dumps(result, sort_keys=True))
        except Exception as exc:
            print("  ERROR:", exc)

    print("OCR_CONSENSUS_SUMMARY", json.dumps(totals, sort_keys=True))

if __name__ == "__main__":
    main()
