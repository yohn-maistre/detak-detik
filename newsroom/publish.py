"""
Publish the finished edition to the live site: POST it to the worker, which writes
KV (edisi:current). The site reads that at runtime, no rebuild (loop 3's "update a
real system"). Needs AKSARA_URL + EDISI_TOKEN; without them it runs dry (logs only)
so local and CI dry-runs never touch production. Ported from newsroom/lib/publish.ts.
"""

from __future__ import annotations

import os

import httpx

from .models import Edisi


def publish_edisi(edisi: Edisi) -> bool:
    url = (os.environ.get("AKSARA_URL") or os.environ.get("PUBLIC_AKSARA_URL") or "").rstrip("/")
    token = os.environ.get("EDISI_TOKEN")
    payload = edisi.model_dump(exclude_none=True)

    if not url or not token:
        print("[publish] AKSARA_URL / EDISI_TOKEN belum diset, edisi tidak dikirim (kering).")
        return False
    try:
        r = httpx.post(
            f"{url}/edisi",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(15.0),
        )
        print(f"[publish] /edisi -> {r.status_code}")
        return r.is_success
    except Exception as e:  # noqa: BLE001
        print(f"[publish] gagal: {e}")
        return False
