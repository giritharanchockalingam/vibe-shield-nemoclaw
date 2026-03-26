from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Literal
import anthropic, os, json, uuid
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

PROMPTS = {
  "edtech": [
    {"id":"e1","vertical":"edtech","agent_type":"coding","title":"Academic planner API","prompt":"Write a FastAPI endpoint GET /students/{id}/academic-plan that queries PostgreSQL and computes a 4-year graduation plan. Include Pydantic models, SQLAlchemy queries, error handling, and OpenAPI docstrings.","expected_wow_moment":"Complete endpoint in 60s","tags":["fastapi","postgresql"]},
    {"id":"e2","vertical":"edtech","agent_type":"coding","title":"Canvas LMS webhook","prompt":"Write a FastAPI webhook handler for Canvas LMS grade_change events that validates the Canvas signature, updates a PostgreSQL student_grades table, and triggers async notifications.","expected_wow_moment":"Secure webhook with validation","tags":["canvas","webhook"]},
    {"id":"e3","vertical":"edtech","agent_type":"research","title":"PeopleSoft migration plan","prompt":"Create a Jira epic with 6 stories for migrating PeopleSoft Student Financials to GCP microservices. Each story needs description, acceptance criteria, story points, and definition of done.","expected_wow_moment":"Full epic in 45s","tags":["peoplesoft","gcp"]},
    {"id":"e4","vertical":"edtech","agent_type":"coding","title":"Student data ETL pipeline","prompt":"Write a Python ETL pipeline extracting student enrollment from PeopleSoft SOAP API, transforming to a normalised schema, and loading into BigQuery. Include retry logic and dead-letter queue.","expected_wow_moment":"Production ETL with retry","tags":["etl","bigquery"]},
    {"id":"e5","vertical":"edtech","agent_type":"planning","title":"LMS modernisation roadmap","prompt":"Create a 12-month phased roadmap for modernising a legacy LMS with 15,000 learners to GCP. Include 4 phases, milestones, resource requirements, and success KPIs.","expected_wow_moment":"12-month roadmap","tags":["roadmap","lms"]},
  ],
  "retail": [
    {"id":"r1","vertical":"retail","agent_type":"coding","title":"Dynamic pricing engine","prompt":"Write a Python DynamicPricingEngine class adjusting prices based on inventory, competitor prices, demand score, and time-of-day multipliers. Include unit tests covering floor/ceiling constraints.","expected_wow_moment":"Pricing engine with tests","tags":["pricing","python"]},
    {"id":"r2","vertical":"retail","agent_type":"coding","title":"Inventory reorder automation","prompt":"Write a FastAPI service monitoring inventory via PostgreSQL, creating purchase orders when stock falls below reorder points, integrating with a mock supplier API, and sending Slack notifications.","expected_wow_moment":"End-to-end automation","tags":["inventory","slack"]},
    {"id":"r3","vertical":"retail","agent_type":"research","title":"Omnichannel architecture ADR","prompt":"Design a microservices architecture for unifying online, mobile, and in-store inventory for a 500-store chain. Create an ADR covering Kafka vs Pub/Sub, API gateway pattern, and disaster recovery.","expected_wow_moment":"Complete ADR with diagram","tags":["architecture","kafka"]},
    {"id":"r4","vertical":"retail","agent_type":"coding","title":"Product recommendation API","prompt":"Write a FastAPI recommendation endpoint returning 10 personalised products using collaborative filtering on purchase history. Include Redis caching, cold-start handling, and A/B test flag support.","expected_wow_moment":"Recommendation API with cache","tags":["ml","redis"]},
    {"id":"r5","vertical":"retail","agent_type":"planning","title":"Peak season scaling plan","prompt":"Create a Black Friday scaling plan for 50K concurrent users. Include infrastructure checklist, load testing strategy, rollback procedures, on-call runbook, and go/no-go framework.","expected_wow_moment":"Complete runbook","tags":["scaling","operations"]},
  ],
  "manufacturing": [
    {"id":"m1","vertical":"manufacturing","agent_type":"coding","title":"Predictive maintenance ML pipeline","prompt":"Write a Python ML pipeline predicting equipment failure from sensor time-series data. Include feature engineering, Random Forest classifier, F1 evaluation, FastAPI endpoint, and drift detection.","expected_wow_moment":"Full ML pipeline","tags":["ml","iot"]},
    {"id":"m2","vertical":"manufacturing","agent_type":"coding","title":"ERP integration middleware","prompt":"Write a FastAPI middleware bridging SAP ERP SOAP/BAPI with a REST API. Include retry logic, JSON transformation, GCP Secret Manager auth, and health checks.","expected_wow_moment":"SAP-to-REST middleware","tags":["sap","erp"]},
    {"id":"m3","vertical":"manufacturing","agent_type":"research","title":"Quality control AI spec","prompt":"Write a technical specification for an AI vision agent inspecting products on a manufacturing line. Cover YOLO vs CNN, edge inference, SCADA integration, and operator override workflow.","expected_wow_moment":"Complete AI vision spec","tags":["computer-vision","scada"]},
    {"id":"m4","vertical":"manufacturing","agent_type":"coding","title":"IoT data ingestion pipeline","prompt":"Write a Python service ingesting real-time data from 500 IoT devices via MQTT, storing in TimescaleDB, computing rolling averages, and publishing anomaly alerts to Pub/Sub.","expected_wow_moment":"MQTT to TimescaleDB pipeline","tags":["iot","mqtt"]},
    {"id":"m5","vertical":"manufacturing","agent_type":"planning","title":"Digital twin roadmap","prompt":"Create a 3-phase digital twin implementation plan for a 10-machine production line. Phase 1: data collection. Phase 2: real-time sync. Phase 3: AI simulation. Include ROI milestones.","expected_wow_moment":"3-phase roadmap","tags":["digital-twin","simulation"]},
  ],
  "travel": [
    {"id":"t1","vertical":"travel","agent_type":"coding","title":"Flight availability aggregator","prompt":"Write a FastAPI endpoint aggregating flight availability from 3 mock OTA APIs, normalising to a unified schema, applying markup rules, and returning paginated results with async concurrent fetching.","expected_wow_moment":"Aggregated OTA search","tags":["ota","async"]},
    {"id":"t2","vertical":"travel","agent_type":"coding","title":"Itinerary optimisation engine","prompt":"Write a Python ItineraryOptimiser class taking destinations and dates and returning an optimised day-by-day itinerary using greedy nearest-neighbour with 2-opt improvement. Include full test suite.","expected_wow_moment":"Optimiser with tests","tags":["algorithms","optimisation"]},
    {"id":"t3","vertical":"travel","agent_type":"research","title":"PNR system modernisation ADR","prompt":"Write an ADR for migrating a legacy PNR system from mainframe to GCP. Cover data migration, GDS integration (Amadeus/Sabre), GDPR compliance, and zero-downtime cutover.","expected_wow_moment":"Complete ADR","tags":["pnr","migration"]},
    {"id":"t4","vertical":"travel","agent_type":"coding","title":"Dynamic package pricing","prompt":"Write a microservice computing holiday package prices combining flights, hotels, and transfers with margin rules, currency conversion, promo code validation, and PostgreSQL audit trail.","expected_wow_moment":"Pricing with audit trail","tags":["pricing","postgresql"]},
    {"id":"t5","vertical":"travel","agent_type":"planning","title":"OTA platform launch plan","prompt":"Create a GTM plan for a B2B OTA platform targeting independent travel agents. Include 90-day rollout, API onboarding, SLA commitments, partner incentives, and KPIs for months 1, 3, 6.","expected_wow_moment":"Full GTM plan","tags":["gtm","b2b"]},
  ],
}

sessions = {}

class SessionReq(BaseModel):
    vertical: str
    agent_type: str
    prompt: str
    client_id: Optional[str] = None

@app.get("/health")
def health(): return {"status": "ok"}

@app.get("/api/prompts")
def get_prompts(vertical: str): return PROMPTS.get(vertical, [])

@app.get("/api/sandbox/status")
def sandbox_status():
    return {"name":"acl-demo","status":"running","model":"claude-sonnet-4-6","policies":[
        {"host":"api.anthropic.com","port":443,"action":"allow"},
        {"host":"registry.npmjs.org","port":443,"action":"allow"},
        {"host":"pypi.org","port":443,"action":"allow"},
        {"host":"*","port":80,"action":"deny"},
    ],"active_sessions":len(sessions)}

@app.post("/api/demo/sessions")
def create_session(req: SessionReq):
    sid = str(uuid.uuid4())
    sessions[sid] = req
    return {"session_id": sid}

@app.get("/api/demo/sessions/{session_id}/stream")
async def stream_session(session_id: str):
    req = sessions.get(session_id)
    if not req: return {"error": "not found"}

    system = f"You are an expert {req.agent_type} agent for {req.vertical}. Deliver production-grade, complete, runnable output — never stubs."

    async def generate():
        async with client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=system,
            messages=[{"role":"user","content":req.prompt}]
        ) as stream:
            async for text in stream.text_stream:
                yield f"data: {json.dumps({'type':'token','content':text})}\n\n"
        yield f"data: {json.dumps({'type':'done','content':''})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
        headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

@app.get("/api/roi/calculate")
def calc_roi(vertical: str, dev_team_size: int = 10, avg_hourly_rate: float = 85):
    saved = dev_team_size * avg_hourly_rate * 12 * 48
    return {"annual_savings": saved, "payback_period_months": round(180000/(saved/12)), "multiplier": 3.5}

@app.get("/api/clients")
def list_clients(): return []

@app.get("/api/demo/sessions")
def list_sessions(): return []
