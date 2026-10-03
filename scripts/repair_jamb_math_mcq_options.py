#!/usr/bin/env python3
import collections
import json
import re
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ocr_past_questions import api, download, ocr_pdf, parse_questions, pdf_text, quality_questions

FILE_ID = "256ba2ee-b872-4024-bf35-ef96c6a3a4c7"

def norm_question(value):
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())

def option_signature(options):
    cleaned = []
    for index, option in enumerate(options or []):
        oid = str(option.get("id") or chr(65 + index)).upper().strip()
        text = re.sub(r"[^a-z0-9]+", "", str(option.get("text") or "").lower())
        if not oid or not text:
            return ""
        cleaned.append(f"{oid}:{text}")
    return "|".join(cleaned)

def collect_consensus(variants):
    votes = collections.defaultdict(set)
    representative = {}
    for label, questions in variants:
        seen_in_pass = set()
        for question in questions:
            options = question.get("options") or []
            if len(options) < 4:
                continue
            qkey = norm_question(question.get("questionText"))
            osig = option_signature(options)
            if len(qkey) < 18 or not osig:
                continue
            key = (qkey, osig)
            if key in seen_in_pass:
                continue
            seen_in_pass.add(key)
            votes[key].add(label)
            representative.setdefault(key, question)
    consensus = []
    for key, labels in votes.items():
        if len(labels) < 2:
            continue
        question = dict(representative[key])
        question["consensusPasses"] = len(labels)
        consensus.append(question)
    return consensus

def main():
    manifest = api({"action": "answer_key_scan_manifest", "fileIds": [FILE_ID]})
    files = manifest.get("files", [])
    if len(files) != 1:
        raise RuntimeError("JAMB Mathematics source file is unavailable for option repair")

    file = files[0]
    print("Repair source:", file.get("file_name"))
    with tempfile.TemporaryDirectory(prefix="guide-jamb-math-options-") as td:
        work = Path(td)
        pdf = work / "source.pdf"
        download(file["public_url"], pdf)

        variants = []
        embedded = quality_questions(parse_questions(pdf_text(pdf)))
        variants.append(("pdf-text", embedded))
        print("pdf-text MCQs:", sum(1 for q in embedded if len(q.get("options") or []) >= 4))

        for psm in (6, 3, 4, 11):
            text = ocr_pdf(pdf, work, psm=psm)
            questions = quality_questions(parse_questions(text))
            variants.append((f"ocr-psm{psm}", questions))
            print(f"ocr-psm{psm} MCQs:", sum(1 for q in questions if len(q.get("options") or []) >= 4))

        consensus = collect_consensus(variants)
        print("Two-pass option-consensus candidates:", len(consensus))

        if not consensus:
            anchors = [
                "A regular polygon",
                "What is the nth term",
                "If cos",
                "Write h in terms",
                "sum to infinity",
            ]
            print("MATH_LAYOUT_DIAGNOSTIC_BEGIN")
            for label, questions in variants:
                print("VARIANT", label, "PARSED", len(questions))
            raw_variants = [("pdf-text-raw", pdf_text(pdf))]
            for psm in (6, 3, 4, 11):
                raw_variants.append((f"ocr-psm{psm}-raw", ocr_pdf(pdf, work, psm=psm)))
            for label, raw in raw_variants:
                normalized = raw.replace("\\r", "")
                for anchor in anchors:
                    index = normalized.lower().find(anchor.lower())
                    if index < 0:
                        continue
                    start = max(0, index - 220)
                    end = min(len(normalized), index + 900)
                    snippet = normalized[start:end].replace("\\x00", " ")
                    print("CONTEXT", label, anchor, json.dumps(snippet))
            print("MATH_LAYOUT_DIAGNOSTIC_END")

        result = api({
            "action": "repair_mcq_options",
            "fileId": FILE_ID,
            "method": "pdf-options-ocr-consensus",
            "consensusPasses": 2,
            "questions": consensus,
        })
        print("OPTION_REPAIR_SUMMARY", json.dumps(result, sort_keys=True))

if __name__ == "__main__":
    main()
