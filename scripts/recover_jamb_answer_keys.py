#!/usr/bin/env python3
import json
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ocr_past_questions import api, download, pdf_text, parse_questions, quality_questions

DEFAULT_IDS = [
    "88a597c6-60e5-4a14-9e28-5bf2ee5c3e0c",  # Biology questions and answers
    "2d12714b-b918-481a-9215-b22f031b3142",  # Economics questions and answers
    "d385e1d6-147b-4aa7-a0c8-e7e5b27448bd",  # Use of English questions and answers
    "8ff55438-3875-42c3-8ef9-7b3cad4c1177",  # Literature questions and answers
    "8ca0b837-35f3-423f-a91a-665dc88ba19d",  # Government questions and answers
]

def main():
    raw_ids = os.environ.get("RECOVERY_FILE_IDS", "").strip()
    file_ids = [value.strip() for value in raw_ids.split(",") if value.strip()] if raw_ids else DEFAULT_IDS
    manifest = api({"action": "answer_recovery_manifest", "fileIds": file_ids})
    files = manifest.get("files", [])
    print("Answer-key source files:", len(files))
    totals = {"files": 0, "parsed_with_answers": 0, "recovered": 0, "answered": 0}

    for file in files:
        print("Recovering:", file.get("file_name"))
        with tempfile.TemporaryDirectory(prefix="guide-jamb-answer-key-") as td:
            pdf = Path(td) / "source.pdf"
            download(file["public_url"], pdf)
            text = pdf_text(pdf)
            parsed = quality_questions(parse_questions(text))
            answered = [question for question in parsed if str(question.get("correctAnswer") or "").upper() in {"A","B","C","D","E"}]
            print("  parsed:", len(parsed), "with embedded answer key:", len(answered))
            if not answered:
                continue
            result = api({
                "action": "recover_answers",
                "fileId": file["id"],
                "method": "pdf-text-answer-key",
                "questions": answered,
            })
            totals["files"] += 1
            totals["parsed_with_answers"] += len(answered)
            totals["recovered"] += int(result.get("recovered", 0))
            totals["answered"] += int(result.get("answered", 0))
            print(" ", json.dumps(result, sort_keys=True))

    print("RECOVERY_SUMMARY", json.dumps(totals, sort_keys=True))

if __name__ == "__main__":
    main()
