# PRD: VibeShield Demo Experience Redesign

**Author:** Giri Chockalingam
**Status:** Draft
**Last Updated:** 2026-04-09

---

## Problem Statement

VibeShield's current demo experience fails to communicate its core value proposition. Every page displays governance activity — identity verification, policy checks, isolation layers, audit logs — but none of it *means anything* to the viewer because they never see what would have gone wrong without it. The product's own creator cannot articulate what the app does after using it. If the builder can't feel it, a prospect in a 20-minute demo certainly won't.

The cost of not solving this: VibeShield becomes a tech demo that impresses engineers for 30 seconds but never converts a CISO, a VP of Engineering, or a developer lead into a buyer. The entire go-to-market collapses because the product can't answer its own question: *"Why do I need this?"*

## Goals

1. **Every demo interaction answers "what would have gone wrong without NemoClaw"** — the viewer should be able to articulate the risk NemoClaw prevented within 5 seconds of seeing it happen.

2. **Every agent output is provably accurate, not theatrical** — code compiles, security scans find real patterns, tests validate real behavior, reverse engineering maps real structure. 100% accuracy in results.

3. **A first-time user understands VibeShield's value without any verbal explanation** — the UI tells the story. No presenter needed to narrate.

4. **Demo-to-conviction time under 90 seconds** — from clicking "Run" to thinking "I need this for my org," the experience should take less than 90 seconds per scenario.

5. **Works for all audiences without mode-switching** — a CISO sees risk mitigation, a developer sees quality tooling, a CTO sees both. Same screen, same flow, no persona toggle.

## Non-Goals

- **Replacing the backend AI agent execution** — the Claude-powered agent pipeline stays as-is. We're redesigning how results are *presented*, not how they're *generated*.
- **Building a real SIEM/SOC integration** — governance events are simulated for demo purposes. We're not building actual Landlock/Seccomp enforcement in the browser.
- **Multi-user or multi-tenant features** — this is a single-player demo experience, not a collaboration platform.
- **Custom scenario authoring** — users pick from curated scenarios. Building a "create your own prompt" feature is a separate initiative.
- **Mobile-first redesign** — desktop is the primary demo surface. Mobile responsiveness is nice-to-have but not a driver.

---

## The Two Pillars

Every interaction in VibeShield must deliver on both pillars simultaneously:

### Pillar 1: Safety (Threat → Catch → Relief)

The AI agent *attempts something dangerous* during execution. NemoClaw *catches it in real time*. The user *sees exactly what was prevented and why it matters*.

Examples of governance interception events:
- Agent attempts an outbound HTTP call to an unauthorized external API → NemoClaw's network namespace blocks it
- Agent tries to read a file outside its sandbox boundary → Landlock denies the access
- Agent attempts to install an unvetted package → Seccomp filter blocks the syscall
- Agent tries to write credentials to stdout → OpenShell policy intercepts and redacts
- Agent attempts to escalate its own permissions → Policy engine denies the escalation

### Pillar 2: Accuracy (Output → Verification → Trust)

The AI agent *produces an output*. NemoClaw *verifies it meets quality and correctness standards*. The user *sees proof the output is trustworthy*.

Examples of accuracy verification:
- Generated code is validated against linting rules, type checks, and known vulnerability patterns
- Security scan findings map to real CWE/OWASP categories with evidence
- Generated tests actually execute and report real pass/fail with coverage metrics
- Architecture reverse-engineering maps to actual code structure, not hallucinated components
- All outputs include confidence scores and verification status

---

## User Stories

### Demo Console

**As a CISO evaluating AI agent governance,** I want to see an AI agent attempt a dangerous action and get blocked in real time, so that I can trust NemoClaw will protect my organization when developers use AI coding agents.

**As a VP of Engineering evaluating AI productivity tools,** I want to see AI-generated code pass rigorous automated quality checks before my eyes, so that I know agent output won't introduce tech debt or vulnerabilities into my codebase.

**As a developer exploring AI coding assistants,** I want to run a scenario relevant to my industry and see production-quality code with real governance context, so that I understand what "governed AI agents" means in practice.

**As any first-time visitor,** I want to understand what VibeShield does within 90 seconds of running my first scenario, so that I can decide whether this solves a problem I have.

### SDLC Agents

**As a developer evaluating the SDLC pipeline,** I want to see each pipeline stage build trust in the agent's output incrementally, so that I understand governance isn't just security theatre — it produces verifiably better results.

**As a CISO watching the SDLC demo,** I want to see the security scan catch a real vulnerability that the AI agent introduced, so that I can demonstrate to my board why governed agents are safer than ungoverned ones.

**As a technical evaluator,** I want every output (code, scan results, tests, architecture diagrams) to be 100% accurate and internally consistent, so that I trust this is real technology and not a pre-baked demo.

---

## Requirements

### P0 — Must Have

#### 1. Governance Interception Events in Demo Console

Each of the 50 demo scenarios must include at least one scripted "governance interception event" — a moment during agent execution where NemoClaw visibly blocks a dangerous action.

**How it works:**
- The agent execution stream includes embedded governance events (defined per scenario in the prompt/response data)
- When a governance event fires, the code stream *pauses*, a red-bordered alert appears inline in the output panel, and the governance trail on the right animates the corresponding catch
- The alert shows: what the agent tried to do, which NemoClaw layer blocked it (Landlock/Seccomp/NetNS/OpenShell), and a one-line explanation of the risk ("Agent attempted to POST patient data to external endpoint api.analytics.io — blocked by network namespace policy")
- After 2-3 seconds (or user click), execution resumes and completes normally
- The governance trail step that caught the violation shows a red shield icon instead of the default green checkmark

**Acceptance criteria:**
- [ ] Every scenario has at least 1 governance interception event defined in its data
- [ ] Interception events are contextually relevant to the vertical (healthcare = PHI exfiltration, finance = unauthorized trading API, defense = classified data leak, etc.)
- [ ] The code stream visually pauses during the interception
- [ ] The interception alert clearly states: attempted action, blocking layer, and business risk
- [ ] The governance trail on the right reflects the interception with distinct visual treatment (red/amber, not green)
- [ ] Execution resumes after the interception and completes successfully

#### 2. Accuracy Verification Panel in Demo Console

After the agent completes code generation, a verification panel appears showing automated quality checks that NemoClaw performed on the output.

**How it works:**
- Below the completed code output, a "Verification Results" panel slides in
- Shows 4-6 checks with pass/fail status: syntax validity, security patterns (no hardcoded secrets, no SQL injection), compliance alignment (HIPAA for healthcare, PCI for finance, FedRAMP for government, etc.), code quality score, dependency audit
- At least one check should show a *finding* that was auto-remediated — not just green checkmarks. E.g., "Found hardcoded API key on line 34 → auto-redacted to environment variable"
- A summary line at the bottom: "Output verified: 6/6 checks passed, 1 auto-remediation applied"

**Acceptance criteria:**
- [ ] Verification panel appears after every completed scenario execution
- [ ] Each check shows clear pass/fail with one-line detail
- [ ] At least one auto-remediation finding per scenario (shows NemoClaw actively improving output, not just approving it)
- [ ] Checks are vertical-specific (HIPAA for healthcare, SWIFT for finance, NERC CIP for energy, etc.)
- [ ] Verification results are accurate and internally consistent with the generated code

#### 3. SDLC Pipeline Flow (Not Standalone Tabs)

The SDLC Agents page tabs must function as a sequential pipeline where each stage builds on the previous one, not as independent standalone demos.

**How it works:**
- When the user runs "Code Complete," it produces code AND automatically queues the next stages
- A pipeline progress bar across the top shows: Code Complete → Security Scan → Quality Review → Generate Tests → Reverse Engineer
- Each subsequent tab shows results *specific to the code that was just generated*
- Security Scan shows findings *in the generated code* with line numbers that match
- Quality Review references the actual complexity and structure of the generated code
- Generate Tests produces tests *for the generated code* that show real pass/fail
- Reverse Engineer produces a diagram *of the generated code's architecture*
- A cumulative "Trust Score" builds as each stage completes: starts at 0%, climbs to ~95%+ by the end

**Acceptance criteria:**
- [ ] Running Code Complete enables/triggers subsequent pipeline stages
- [ ] Each stage's output references the specific code from Code Complete (matching line numbers, function names, etc.)
- [ ] Security Scan shows at least 1 real finding with CWE reference and line number
- [ ] Quality Review shows measurable metrics (cyclomatic complexity, maintainability index)
- [ ] Generated Tests show pass/fail results with coverage percentage
- [ ] A visual "Trust Score" or "Governance Score" accumulates across the pipeline
- [ ] User can see the pipeline is connected, not 5 separate demos

#### 4. "What Could Have Gone Wrong" Summary

Every completed scenario (Demo Console or SDLC) ends with a brief impact summary showing the business risk that was mitigated.

**How it works:**
- After execution completes, a summary card appears: "In this session, NemoClaw prevented: [1 blocked network exfiltration attempt], [1 auto-remediated credential exposure], [2 policy violations caught]. Without governance, this agent would have [sent patient data to an external analytics service / committed code with a hardcoded AWS secret / ...]."
- The summary is scenario-specific and uses language appropriate to the vertical
- For SDLC, the summary aggregates across all pipeline stages

**Acceptance criteria:**
- [ ] Summary appears at the end of every scenario execution
- [ ] Summary includes specific counts of prevented actions and verified outputs
- [ ] Summary includes a plain-language "without governance" counterfactual
- [ ] Language is vertical-appropriate (PHI for healthcare, PII for government, etc.)

### P1 — Nice to Have

#### 5. Side-by-Side "Governed vs Ungoverned" Toggle

A toggle that lets the user see what the agent output *would have looked like* without NemoClaw — the dangerous API call going through, the hardcoded credentials staying in the code, the unauthorized package installed.

**Acceptance criteria:**
- [ ] Toggle switches between "With NemoClaw" and "Without NemoClaw" views
- [ ] "Without NemoClaw" view highlights the dangerous elements that would have shipped
- [ ] Visual treatment makes the risk viscerally obvious (red highlights, warning annotations)

#### 6. Live Governance Metrics Dashboard

A real-time counter visible across all pages: "X threats blocked | Y outputs verified | Z policy checks passed" — accumulating across the user's entire session.

**Acceptance criteria:**
- [ ] Persistent counter visible in the top nav or sidebar
- [ ] Counts update in real-time as the user runs scenarios
- [ ] Clicking the counter expands to show a breakdown

#### 7. Guided First-Run Experience

For first-time visitors, a brief (3-step) guided overlay that sets up the "what to watch for" before they run their first scenario. Not a product tour — a threat briefing.

**Acceptance criteria:**
- [ ] Appears only on first visit (session-based, no localStorage)
- [ ] 3 steps max, dismissible
- [ ] Frames the experience: "You're about to watch an AI agent write code. Watch what happens when it tries to break the rules."

### P2 — Future Considerations

#### 8. Custom Scenario Builder
Let enterprise prospects paste their own prompts and watch NemoClaw govern them. Requires real backend agent execution — not scriptable in the current architecture.

#### 9. Exportable Demo Report
After running scenarios, generate a PDF report: "Here's what NemoClaw caught during your evaluation session" — designed to be forwarded to a procurement committee.

#### 10. Multiplayer Demo Mode
Allow a sales engineer to control the demo remotely while a prospect watches on their own screen. Requires real-time sync infrastructure.

---

## Technical Architecture for Governance Events

### Data Model: Governance Interception Events

Each scenario prompt definition gains a new field: `governance_events`, an array of scripted interception moments.

```typescript
interface GovernanceEvent {
  id: string
  trigger_after_tokens: number    // fire after N tokens of output
  attempted_action: string        // "POST patient records to api.analytics.io:443"
  blocked_by: 'landlock' | 'seccomp' | 'netns' | 'openshell'
  risk_category: string           // "data_exfiltration" | "privilege_escalation" | "unauthorized_network" | "credential_exposure"
  risk_description: string        // "Patient PHI would have been sent to an unauthorized third-party analytics service"
  severity: 'critical' | 'high' | 'medium'
  vertical_context: string        // "HIPAA violation — ePHI transmitted without BAA"
}
```

### Data Model: Verification Checks

Each scenario also includes verification results:

```typescript
interface VerificationCheck {
  id: string
  check_name: string              // "Security Pattern Scan"
  status: 'pass' | 'fail' | 'remediated'
  detail: string                  // "No hardcoded credentials detected"
  remediation?: string            // "Line 34: API_KEY='sk-...' → replaced with os.environ['API_KEY']"
  compliance_ref?: string         // "HIPAA §164.312(a)(1)" | "CWE-798"
}
```

### Frontend Execution Flow

```
User clicks "Run Demo"
  → Agent output starts streaming (token by token)
  → At token N, governance event triggers:
      → Code stream pauses with "processing..." indicator
      → Red alert panel slides into the output area
      → Governance trail on right animates: step turns red/amber
      → 2-3 second pause (or click to continue)
      → Code stream resumes
  → Agent output completes
  → Verification panel slides in below output
      → Shows 4-6 checks with pass/fail/remediated status
      → At least 1 shows auto-remediation with before/after
  → "Impact Summary" card appears
      → "NemoClaw prevented: ..."
      → "Without governance: ..."
```

### Per-Vertical Governance Event Examples

| Vertical | Interception Event | Blocked By | Risk |
|---|---|---|---|
| Healthcare | POST patient vitals to external analytics API | NetNS | HIPAA ePHI exfiltration |
| Finance | Connect to unauthorized trading execution endpoint | NetNS | Rogue trade execution |
| EdTech | Read /etc/passwd for user enumeration | Landlock | Privilege escalation |
| Retail | Install unvetted npm package with known CVE | Seccomp | Supply chain attack |
| Manufacturing | Write to SCADA control register outside sandbox | Landlock | Industrial control tampering |
| Travel | Log full credit card number to stdout | OpenShell | PCI-DSS violation |
| Logistics | Access GPS tracking database without authorization | Landlock | Fleet surveillance breach |
| Energy | Modify grid load parameters outside safe range | Seccomp | Grid stability threat |
| Government | Transmit document to non-.gov endpoint | NetNS | Classified data spillage |
| Defense | Attempt to read file outside IL5 boundary | Landlock | Classification boundary violation |

### Per-Vertical Verification Check Examples

| Vertical | Remediated Finding | Compliance Reference |
|---|---|---|
| Healthcare | Hardcoded patient ID in test data → parameterized | HIPAA §164.514 |
| Finance | API key in source → environment variable | PCI-DSS Req 6.5.3 |
| EdTech | SQL query without parameterization → prepared statement | CWE-89 |
| Retail | Missing input validation on price field → added bounds check | OWASP A03:2021 |
| Manufacturing | Sensor data logged without encryption → AES-256 applied | IEC 62443 |
| Travel | PII in log output → redacted with masking | GDPR Art. 32 |
| Logistics | Hardcoded GPS coordinates → config-driven | SOC 2 CC6.1 |
| Energy | Unvalidated grid command input → range-checked | NERC CIP-007 |
| Government | Document marked as public → classified handling enforced | NIST 800-53 SC-16 |
| Defense | Unencrypted data at rest → FIPS 140-2 encryption applied | DFARS 252.204-7012 |

---

## Success Metrics

### Leading Indicators (1-2 weeks post-launch)

| Metric | Target | Stretch | Measurement |
|---|---|---|---|
| Demo completion rate | 70% of visitors who start a scenario finish it | 85% | Frontend analytics |
| Time to first "aha" | Under 90 seconds from clicking Run | Under 60 seconds | Session recording analysis |
| Governance event attention | 90% of users pause/read the interception alert | 95% | Click-through rate on "Continue" vs auto-dismiss |
| Second scenario rate | 50% of users run a second scenario | 70% | Frontend analytics |

### Lagging Indicators (1-3 months post-launch)

| Metric | Target | Stretch | Measurement |
|---|---|---|---|
| Demo-to-meeting conversion | 15% of demo completions request a meeting | 25% | CRM funnel tracking |
| Unprompted value articulation | 80% of prospects can explain what NemoClaw does without prompting | 90% | Sales call recordings |
| Competitive differentiation | "Governance" mentioned in 60% of win reports | 75% | CRM win/loss analysis |

---

## Open Questions

| # | Question | Owner | Blocking? |
|---|---|---|---|
| 1 | Should governance events be fully scripted in frontend data, or should the backend agent actually attempt these actions and get blocked by real middleware? | Engineering | Yes — determines architecture complexity |
| 2 | For accuracy verification, do we run real linters/type-checkers on generated code in the browser (e.g., via WASM), or simulate results? | Engineering | Yes — determines accuracy guarantee level |
| 3 | What is the right number of governance events per scenario? Too many feels theatrical, too few feels scripted. | Product + Design | No — can tune after launch |
| 4 | Should the SDLC pipeline auto-advance through all stages, or require user click at each stage? | Design | No — can A/B test |
| 5 | Do we need vertical-specific compliance language reviewed by actual compliance consultants? | Legal / Compliance | No — can launch with best-effort and refine |

---

## Timeline Considerations

- **Phase 1 (2-3 weeks):** Implement governance interception events and verification panel in Demo Console. This is the highest-impact change — it transforms the core demo experience.
- **Phase 2 (1-2 weeks):** Redesign SDLC Agents as a connected pipeline with trust score accumulation.
- **Phase 3 (1 week):** Add impact summaries, polish animations, tune timing of interception events.
- **Phase 4 (ongoing):** P1 features (side-by-side toggle, live metrics, guided first-run) based on user feedback.

**Hard dependency:** The governance event data model must be finalized before any frontend work begins. This is the foundation everything else builds on.

---

*This document should be treated as a living spec. As implementation begins, open questions will resolve and requirements may shift. The north star remains: every interaction must answer "what would have gone wrong without NemoClaw" AND "why should I trust this output."*
