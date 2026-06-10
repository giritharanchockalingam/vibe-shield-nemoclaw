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
        r = await c.post(f"{EDGE_GATEWAY_URL}/v1/chat/completions", json=body,
                         headers={"Authorization": f"Bearer {EDGE_GATEWAY_TOKEN}"})
        r.raise_for_status()
        d = r.json()
    return {
        "text": d["choices"][0]["message"]["content"],
        "route": d.get("x_edge_route", {}),
        "usage": d.get("usage", {}),
    }


async def metrics() -> dict:
    """Pull the gateway's FinOps telemetry (per-user/project spend, route mix)."""
    if not enabled():
        return {}
    async with httpx.AsyncClient(timeout=10.0) as c:
        r = await c.get(f"{EDGE_GATEWAY_URL}/metrics",
                        headers={"Authorization": f"Bearer {EDGE_GATEWAY_TOKEN}"})
        r.raise_for_status()
        m = r.json()
        h = await c.get(f"{EDGE_GATEWAY_URL}/healthz")
        budget = h.json().get("budget", {}) if h.status_code == 200 else {}
    return {"telemetry": m, "budget": budget}
