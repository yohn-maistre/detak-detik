"""
The newsroom log: every edition's deliberation written as JSONL (loop 4, the
trace store to tune desk prompts later, and the future "Bagaimana edisi ini
disusun"). One line per event: drafts, gate verdicts, lawyer flags, the editor's
pick. Same JSONL family as reader sessions and tour scripts.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

_DIR = Path(__file__).resolve().parent / "logs"


class Log:
    def __init__(self, edisi_no: int):
        _DIR.mkdir(exist_ok=True)
        self.path = _DIR / f"edisi-{edisi_no}.jsonl"
        self._fh = self.path.open("w", encoding="utf-8")

    def event(self, jenis: str, **data) -> None:
        line = {"pada": datetime.now(timezone.utc).isoformat(), "jenis": jenis, **data}
        self._fh.write(json.dumps(line, ensure_ascii=False) + "\n")
        print(f"[log] {jenis}: {json.dumps(data, ensure_ascii=False)}")

    def close(self) -> None:
        self._fh.close()
