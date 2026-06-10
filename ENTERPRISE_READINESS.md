# VibeShield — Enterprise Readiness (R1 complete)

## The principle
The app never presents fabricated data as real. `DEMO_MODE=1` re-enables the
scripted sales experience — watermarked "DEMO MODE — SIMULATED DATA" and tagged
`data_source: "demo"` in every payload. With it off (default), every endpoint
returns real data, an honest empty state, or HTTP 501 for integrations that
don't exist yet.

## What is REAL today (enforced at runtime)
- **Hybrid inference**: all 5 SDLC agents + governance agent route through the
  Edge-First gateway — local models first, cloud only when policy and the
  customer's opt-in permit. Verified end-to-end on real Ollama models.
- **Egress protection**: PII/secret redaction + an egress manifest (exactly
  what left, post-redaction) on every cloud call. `privacy: confidential`
  cannot egress, structurally.
- **FinOps**: per-user/per-project attribution, budget caps that pin work
  local when exhausted, cloud-cost-avoided accounting, `/finops` dashboard.
- **SAST engine** (20 rules) + **code metrics engine** run in-process before
  AI enrichment.
- **Signed governance**: HMAC-signed policies and model manifests on the
  gateway; tampering is rejected.
- **Audit trail**: real operational events persisted to Supabase.

## What is ROADMAP (was previously presented as real — now labeled honestly)
- Kernel isolation (Landlock / Seccomp / NetNS / OpenShell containers)
- ITSM (real ticket linkage), Jira/SIEM write integrations, GitHub write
  operations (commit/push/PR), real test-suite execution
- DORA metrics computed from real deployment events (R2)

## Deployment posture
- **vibeshield.vercel.app** = sales demo → set `DEMO_MODE=1` in Vercel env
  **before deploying this code**, or the demo pages will show empty states.
- **Enterprise deployments** = `DEMO_MODE` unset + `EDGE_GATEWAY_URL` pointed
  at the org's Edge-First inference tier + a clean per-tenant database (R3).
- Current Supabase project retains its seeded demo data intentionally; the
  real product gets a clean tenant in R3.

## Remaining phases
- **R2 — real computation**: pipeline stages render live agent output for all
  5 agents (today the run is real but stage narration is scripted), real test
  execution, DORA from actual deploy events.
- **R3 — enterprise hardening**: multi-tenant database + RLS, SSO, CI for
  frontend+backend, rate limiting, observability, clean production tenant.

## Security review notes (R1c)
- No secrets in git (only `.env.example` tracked; history clean).
- Supabase RLS on audit events verified correct (service-role writes, anon
  read). The 403 seen during development was a sandbox network artifact.
- Frontend uses the anon key only (public by design); backend holds the
  service-role key in env.
