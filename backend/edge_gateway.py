"""Edge-First AI hybrid inference gateway client.

When EDGE_GATEWAY_URL is set, SDLC agent inference routes through the
Edge-First policy router (local SLM first; cloud only when policy + the
customer's choice permit). Every request carries FinOps attribution
(user/project) and a privacy class; the gateway returns the full route
decision (LOCAL vs CLOUD, model, cost, egress manifest) for the audit trail.

Unset EDGE_GATEWAY_URL -> callers fall back to the direct provider path.

Env:
  EDGE_GATEWAY_URL    e.g. http://127.0.0.1:8080 (dev) or the org inference tier
  EDGE_GATEWAY_TOKEN  the gateway's API token
"""
from __future__ import annotations

import os

import httpx

EDGE_GATEWAY_URL = os.getenv("EDGE_GATEWAY_URL", "").rstrip("/")
EDGE_GATEWAY_TOKEN = os.getenv("EDGE_GATEWAY_TOKEN", "dev-local-token-change-me")


def enabled() -> bool:
    return bool(EDGE_GATEWAY_URL)


def _headers(extra: dict | None = None) -> dict:
    # Both forms: Authorization for direct gateways; X-Edge-Token for gateways
    # behind provider proxies (RunPod) that consume the Authorization header.
    h = {"Authorization": f"Bearer {EDGE_GATEWAY_TOKEN}",
         "X-Edge-Token": EDGE_GATEWAY_TOKEN}
    if extra:
        h.update(extra)
    return h


def _client(timeout: float = 60.0) -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=httpx.Timeout(
        connect=5.0, read=timeout, write=timeout, pool=5.0))


async def chat(prompt: str, system: str | None = None, *,
               privacy: str = "internal", allow_cloud: bool = True,
               quality: str = "balanced", task: str = "general",
               user_id: str = "anonymous",
               project_id: str = "vibeshield", timeout: float = 300.0) -> dict:
    """Route one completion through the Edge-First gateway.

    Returns {"text", "route", "usage"} where route is the gateway's full
    decision: target (local/cloud), model, reason, escalated, cost_usd,
    egress_manifest (exactly what left the device, post-redaction).
    """
    messages = ([{"role": "system", "content": system}] if system else [])
    messages.append({"role": "user", "content": prompt})
    body = {
        "model": "edge-router",      # let the policy router pick the model
        "messages": messages,
        "privacy": privacy,
        "allow_cloud": allow_cloud,
        "quality": quality,
        "task": task,        # Tier-1 assistant (Gemma) vs Tier-2 SDLC (Qwen-Coder)
        "user": user_id,
        "project": project_id,
    }
    async with httpx.AsyncClient(timeout=httpx.Timeout(connect=5.0, read=timeout,
                                                       write=timeout, pool=5.0)) as c:
        # Both header forms: Authorization for direct gateways; X-Edge-Token
        # for gateways behind provider proxies that consume Authorization.
        r = await c.post(f"{EDGE_GATEWAY_URL}/v1/chat/completions", json=body,
                         headers={"Authorization": f"Bearer {EDGE_GATEWAY_TOKEN}",
                                  "X-Edge-Token": EDGE_GATEWAY_TOKEN})
        r.raise_for_status()
        d = r.json()
    return {
        "text": d["choices"][0]["message"]["content"],
        "route": d.get("x_edge_route", {}),
        "usage": d.get("usage", {}),
    }


# ── Knowledge / RAG ─────────────────────────────────────────────────────────
async def index_text(doc_id: str, text: str, *, source: str = "inline",
                     user_id: str = "anonymous", project_id: str = "vibeshield") -> dict:
    """Index raw text into the gateway's on-device vector store. The text is
    embedded LOCALLY (nomic-embed) and never leaves the inference boundary."""
    body = {"doc_id": doc_id, "text": text, "source": source,
            "meta": {"user_id": user_id, "project_id": project_id, "privacy": "confidential"}}
    async with _client(120.0) as c:
        r = await c.post(f"{EDGE_GATEWAY_URL}/index", json=body, headers=_headers())
        r.raise_for_status()
        return r.json()


async def ingest_file(filename: str, content: bytes, *, doc_id: str = "",
                      user_id: str = "anonymous", project_id: str = "vibeshield") -> dict:
    """Upload a file (PDF/text/md) to the gateway for on-device extraction +
    indexing. Bytes are processed inside the boundary; nothing is uploaded
    to any cloud provider."""
    files = {"file": (filename, content)}
    data = {"doc_id": doc_id or f"{project_id}:{filename}"}
    async with _client(300.0) as c:
        r = await c.post(f"{EDGE_GATEWAY_URL}/ingest", files=files, data=data,
                         headers=_headers())
        r.raise_for_status()
        return r.json()


async def ask(question: str, *, top_k: int = 4, privacy: str = "internal",
              allow_cloud: bool = True, user_id: str = "anonymous",
              project_id: str = "vibeshield", timeout: float = 300.0) -> dict:
    """Ask a question grounded in the indexed corpus (RAG). The gateway
    retrieves locally, then routes generation local-first per policy. Returns
    {answer, sources, route, confidence}."""
    body = {"question": question, "top_k": top_k,
            "meta": {"privacy": privacy, "allow_cloud": allow_cloud,
                     "user_id": user_id, "project_id": project_id}}
    async with _client(timeout) as c:
        r = await c.post(f"{EDGE_GATEWAY_URL}/ask", json=body, headers=_headers())
        r.raise_for_status()
        d = r.json()
    return {"answer": d.get("answer", ""), "sources": d.get("sources", []),
            "route": d.get("decision", {}), "confidence": d.get("confidence", 0)}


async def index_stats() -> dict:
    """Current vector-store stats (docs/chunks) from the gateway health probe."""
    async with _client(10.0) as c:
        r = await c.get(f"{EDGE_GATEWAY_URL}/healthz")
        return r.json().get("index", {}) if r.status_code == 200 else {}


async def metrics() -> dict:
    """Pull the gateway's FinOps telemetry (per-user/project spend, route mix)."""
    if not enabled():
        return {}
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.get(f"{EDGE_GATEWAY_URL}/metrics",
                        headers={"Authorization": f"Bearer {EDGE_GATEWAY_TOKEN}",
                                 "X-Edge-Token": EDGE_GATEWAY_TOKEN})
        r.raise_for_status()
        m = r.json()
        h = await c.get(f"{EDGE_GATEWAY_URL}/healthz")
        budget = h.json().get("budget", {}) if h.status_code == 200 else {}
    return {"telemetry": m, "budget": budget}
