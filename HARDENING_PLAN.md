# VibeShield + Edge-First — Enterprise Hardening Plan

Working doc for the principal-engineering hardening initiative. Status legend:
✅ shipped (commit-referenced) · 🔨 in progress · ⏭ next · 🗓 scheduled.

The three non-negotiables — enforced in code with tests today:
1. Customer code never reaches public AI without explicit opt-in
   (`policy.may_egress` + `allow_cloud` + privacy classes; `tests/test_router.py`,
   `tests/test_degradation.py`).
2. Cheapest/private/local inference first (router order: device → private GPU →
   cloud; task profiles pick the smallest capable model; `tests/test_tiers.py`).
3. Every AI dollar attributable (user/project on every request through cost,
   telemetry, audit, `/api/finops`; `tests/test_finops.py`). Tenant + agent +
   provider dimensions: ⏭ (see §4).

## §1 MVP assessment — verdict: preserve
**Keep as-is:** router decision order, redaction+manifest, signed policy/model
manifest, budget gating, SQLite vector store, grounding confidence, SDLC agent
endpoints, FinOps pipeline, React frontend, DEMO_MODE truth layer.
**Modularize, don't rewrite:** `backend/main.py` (2700 lines) → split into
routers (`governance.py`, `sdlc.py`, `integrations.py`, `ciso.py`, `finops.py`)
behind identical paths — zero API change. 🗓 R2.
**Already hardened (Edge-First P1–P5):** retries/timeouts on all I/O, graceful
local↔cloud degradation, crash-safe persistence, structured logs + request IDs,
readiness probes, launchd service, CI, signed manifests, device-token ingestion,
anon DB writes revoked.

## §2 Edge-First gateway hardening
✅ Done: middleware (request-ID + tracing log line), typed error envelope,
retry/backoff, failover both directions, per-project budget enforcement,
explainable decisions (reason/note/manifest on every response).
✅ Tonight: tiered runtime — device → **private-GPU tier** (bearer-token,
org-controlled) with automatic failover; tier recorded in route notes.
⏭ Next: OIDC/JWT validation at the shim (verify Supabase JWTs instead of
trusting `user` field), per-tenant rate limiting, request queueing for the GPU
tier, OpenTelemetry spans (§6).

## §3 Private GPU MVP — `edge-first-ai/deploy/gpu/`
✅ Tonight: docker-compose (Ollama, no exposed port + Caddy bearer-token TLS
proxy), tiered model pull script (Gemma 4B/12B, Qwen-Coder 7B/14B, embeddings),
RunPod + Vast.ai provisioning runbooks, gateway wiring envs.
Model strategy shipped: **Gemma = Tier-1 default assistant path**
(`EDGE_ASSISTANT_MODEL`), **Qwen-Coder = Tier-2 SDLC path** (`EDGE_CODE_MODEL`),
task-aware selection (`task: chat|governance|code`) wired from VibeShield agents
through the shim. Defaults unchanged when unset — no regression on Mac MVP.
⏭ Next: GPU-tier digests pinned in the signed model manifest; eval-harness run
against the GPU tier to tune profiles; queueing + concurrency caps.

## §4 FinOps hardening
✅ Foundation: per-user/project attribution, budget caps→pin-local, cloud-cost-
avoided, `/finops` dashboard.
⏭ Next: append-only spend LEDGER table (control plane) replacing point-in-time
snapshots; GPU pool cost amortization (tier $/hr ÷ tokens served — telemetry
already counts per-project tokens); tenant + agent + model + provider dimensions
on the ledger row; nightly aggregation job; forecast = trailing 7-day burn.
🗓 Then: chargeback exports, anomaly alerts (spend spike per project).

## §5 Security hardening
✅ Done: confidential-code blocking (tested under failure modes), redaction
gate, signed policy + manifests (canonical signing), device registry with
hashed bearer tokens, anon DB writes revoked, secrets hygiene audit clean,
truth layer (no fabricated compliance claims).
⏭ Next: RBAC roles (admin/operator/viewer) enforced at VibeShield backend via
Supabase JWT claims; immutable audit = ledger table with hash chaining;
per-tenant RLS on all VibeShield tables (clean tenant DB, not the demo project).
🗓 Then: SSO (OIDC IdP), SIEM forwarder (real one), key custody → KMS.

## §6 Observability
✅ Done: structured JSON logs + request-ID correlation end-to-end, route
telemetry (mix/latency/escalations), health+readiness.
⏭ Next: OpenTelemetry SDK in gateway + VibeShield backend (trace: agent →
gateway → tier), Prometheus exporters (gateway /metrics is JSON today — add
/metrics/prom), GPU telemetry via dcgm-exporter on the GPU host, Grafana
dashboards (routing, FinOps, GPU), Loki for logs. Compose file for the
observability stack ships with R3.

## §7 VibeShield frontend
✅ Done: FinOps dashboard, route badges, truthful landing/claims, DEMO_MODE
watermark, auth identity attribution.
⏭ Next: audit viewer upgrades (filter by user/project/severity), policy admin
UI (edit signed policy via gateway `/admin/policy`), cloud opt-in toggle per
project (writes `allow_cloud` default into policy), budget management UI.

## §8 Infrastructure evolution
Mac MVP (✅ running) → private-cloud GPU (✅ artifacts shipped, provision when
org approves spend) → dedicated org GPUs (same compose/K8s shape, new hosts) →
multi-region (K8s + queue).
⏭ Next: docker-compose for the full stack (gateway + backend + frontend) for
one-command dev/staging; GitHub Actions deploy pipeline for backend (Vercel)
and GPU tier (SSH/compose); K8s manifests when moving off single-host tiers.

## Sequencing (each step shippable, rollback = config revert)
1. ✅ R1 truth layer + tiers + GPU artifacts (tonight)
2. Provision RunPod tier; run evals against it; pin digests (1 session)
3. OIDC JWT verification + RBAC + tenant column end-to-end (1–2 sessions)
4. FinOps ledger + Prometheus/OTel + Grafana compose (1–2 sessions)
5. main.py modularization + R2 real computation (1–2 sessions)
6. Clean production tenant DB + K8s + CI/CD promotion (2+ sessions)
