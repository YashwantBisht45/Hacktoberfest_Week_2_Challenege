# ScopeGuard AI

> **"Know when a client request goes beyond the original deal."**

ScopeGuard AI is an open-source, competition-focused application designed for the **Hacktoberfest 2026 Open-Source AI Challenge** (Submission Deadline: October 18, 2026).

It helps freelancers and digital agencies determine whether a new client request is already covered by their original project agreement, constitutes out-of-scope additional work, or requires contractual clarification — backed by independent quotation verification against the agreement text.

---

## Current Status: Phase 6.1 (Pre-Deployment Audit & Verified Hosted Providers)

The application is prepared for public cloud demonstration on **Render** using hosted open-weight Gemma models while preserving full on-device local development with Ollama:

- **Frontend**: Responsive React 19, Vite, TypeScript, and Tailwind CSS. Deploys as a Render Static Site with dynamic backend base URL configuration (`VITE_API_BASE_URL`).
- **Backend**: Express with TypeScript, Zod validation, configurable rate limiting (`RATE_LIMIT_MAX`), reverse proxy trust (`trust proxy`), and safe error handling. Binds to `0.0.0.0` and platform-provided `PORT`.
- **Dual AI Engine**:
  - **Local Development**: Google Gemma 2 (`gemma2:2b`) via local Ollama (`127.0.0.1:11434`) with automated Windows IPv4 loopback resolution.
  - **Cloud Deployment**: OpenAI-compatible hosted open-weight Gemma endpoint (e.g. OpenRouter `google/gemma-2-9b-it` or DeepInfra `google/gemma-2-9b-it`) with server-side credential isolation and automatic `response_format` fallback for providers that do not support programmatic JSON mode.
- **Independent Evidence Verifier**: Algorithmic 3-level matcher that verifies model-cited quotations directly against user-supplied agreement text. Checks verbatim text presence rather than legal meaning, and flags unverified or missing citations.
- **Render Blueprint**: Full [`render.yaml`](render.yaml) specification defining frontend Static Site and backend Web Service with health checks and rewrite rules.
- **Automated Test Coverage**: **36 passing Vitest unit tests** covering pipeline execution, quotation matching, input boundaries, API base URL resolution, CORS enforcement, provider failure handling, and `response_format` fallback retry.

---

## Core Capabilities

### 1. 6-Stage Analysis Pipeline
- **Stage A (Agreement Parsing)**: Identifies deliverables, exclusions, revisions, and boundary conditions.
- **Stage B (Request Decomposition)**: Decomposes compound client requests into discrete, individually evaluated items.
- **Stage C (Scope Classification)**: Categorizes each requested item into one of three classifications:
  - `ALREADY_INCLUDED`: Deliverable or task covered by the agreed scope.
  - `LIKELY_ADDITIONAL`: Work that extends beyond agreed deliverables or triggers explicit exclusions.
  - `NEEDS_CLARIFICATION`: Ambiguous requests where the agreement is silent or underspecified.
- **Stage D (Independent Evidence Verification)**: Independent backend algorithm verifies exact model-cited quotations against the actual contract text. Prevents fabricated citations and distinguishes explicit evidence from inferences.
- **Stage E (Impact & Uncertainty Assessment)**: Details identified work, timeline considerations, and contract unknowns without fabricating hours or costs.
- **Stage F (Editable Client Change-Order Message)**: Crafts a polite response with bracketed placeholders (`[Client Name]`, `[timeline]`, `[price]`) for budget and schedule approval.

### 2. Guardrails & Safety
- **Prompt Injection Defense**: Separation of system instructions from untrusted user documents in strict prompt sections. Tested against prompt injection overrides in client requests.
- **No Hallucinated Quotations as Verified Evidence**: Every quotation is verified verbatim; unverified quotes are prominently flagged in the UI.
- **No Invented Commitments**: The model is prompted never to fabricate dollar amounts, hourly rates, or delivery guarantees unless explicitly present in the original agreement text.
- **Zero Sensitive Data Logging**: Agreement contents, client messages, and provider API keys are never logged or stored in a database.

---

## Selected AI Model & License

- **Model Family**: **Google Gemma 2** instruction-tuned models (`gemma2:2b`, `gemma2-9b-it`, `google/gemma-2-9b-it`).
- **Open-Weight License**: Released under the open-weight **Gemma Terms of Use / Gemma Open License**, permitting commercial and non-commercial development.
- **Local Footprint**: `gemma2:2b` has an ultra-compact memory footprint (~1.6 GB RAM), allowing it to run smoothly on laptops with 8 GB RAM without requiring a dedicated high-end GPU.
- **Cloud Speed**: `gemma2-9b-it` on hosted providers (such as OpenRouter or DeepInfra) completes analysis in 1–5 seconds compared to 60–120s on dual-core CPU hardware.

---

## Architecture & Request Flow

```text
[ Browser Client ]
        │
        ├─► Local Dev:  Vite Proxy (/api) ──► Express API (localhost:5000)
        │
        └─► Production: VITE_API_BASE_URL  ──► Render Web Service (0.0.0.0:10000)
                                                    │
                                                    ▼
                                            [ AI Adapter Factory ]
                                              ├── AI_PROVIDER=ollama ──► Local Ollama (127.0.0.1:11434)
                                              └── AI_PROVIDER=hosted ──► Cloud Gemma Endpoint (HTTPS)
                                                    │
                                                    ▼
                                            [ Evidence Verifier ]
                                              Verifies quotations against agreement text
                                                    │
                                                    ▼
                                            [ Client UI Response ]
```

---

## Local Development (Ollama Mode)

To run ScopeGuard AI completely on your local machine with full data privacy:

### 1. Install & Start Ollama
1. Download Ollama from [ollama.com](https://ollama.com/download).
2. Pull the Gemma 2 model:
   ```bash
   ollama pull gemma2:2b
   ```
3. Start the Ollama daemon:
   ```bash
   ollama serve
   ```

> **Windows IPv4 Binding Note**: The backend's `OllamaAdapter` automatically normalizes `http://localhost:11434` to `http://127.0.0.1:11434` to prevent Windows Node.js 18+ IPv6 (`::1`) connection drops.

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Configure Server Environment
Copy `.env.example` to `server/.env` if not already present:
```bash
cp server/.env.example server/.env
```
Ensure `server/.env` contains:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma2:2b
AI_TIMEOUT_MS=180000
```

### 4. Start Development Servers
In separate terminals:
```bash
# Terminal 1: Backend
npm run start:server

# Terminal 2: Frontend
npm run start:client
```
Open `http://localhost:5173`.

---

## Production Deployment (Render)

A complete deployment blueprint is provided in [`render.yaml`](render.yaml) and documented step-by-step in [`docs/deployment.md`](docs/deployment.md).

### 1. Services Configured
- **Frontend**: Render Static Site (`client`), built with `npm install && npm run build`, publishing `dist`.
- **Backend**: Render Web Service (`server`), built with `npm install && npm run build`, started with `npm run start`.
- **Inference**: Cloud open-weight Gemma model via OpenAI-compatible endpoint.

### 2. Backend Environment Variables (Render Dashboard)
```env
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
TRUST_PROXY=true
CLIENT_ORIGIN=https://scopeguard-ui.onrender.com
AI_PROVIDER=hosted
HOSTED_AI_BASE_URL=https://openrouter.ai/api/v1
HOSTED_AI_MODEL=google/gemma-2-9b-it
HOSTED_AI_API_KEY=your_secret_api_key_here
AI_TIMEOUT_MS=60000
RATE_LIMIT_MAX=30
```

### 3. Frontend Environment Variables (Render Dashboard)
```env
VITE_API_BASE_URL=https://scopeguard-api.onrender.com
```

### 4. Operational Realities: Cold Starts & Costs
- **Render Free Tier Spin-Down**: Free Render web services spin down after 15 minutes of inactivity. The first wake-up request takes ~45–60 seconds. The frontend navbar indicates connection status during spin-up.
- **Provider Quotas**: OpenRouter offers a free tier for some models (e.g. `google/gemma-2-9b-it:free`) with rate limits. DeepInfra provides pay-per-token access. Set `RATE_LIMIT_MAX` to prevent unintended credit consumption.

---

## Local vs. Hosted Privacy Notice

- **Local Inference (`AI_PROVIDER=ollama`)**: All agreement text and client requests remain 100% on-device on `127.0.0.1`. No data leaves your machine. Recommended for confidential NDAs.
- **Hosted Cloud Inference (`AI_PROVIDER=hosted`)**: Data is transmitted securely over TLS from your backend to the configured model provider's API. Suitable for public demos and non-sensitive agreements.
- **Decision Support Disclaimer**: ScopeGuard AI provides objective contract comparison and draft communications. It does not provide legal advice, and its classifications are not legally binding determinations.

---

## Testing & Quality Verification

### 1. Automated Unit Test Suite (Vitest)
```bash
npm run test
```
Runs **36 automated tests** across 3 test suites:
- **`analysis.test.ts` (14 tests)**: Exact and normalized quotation matching, hallucination rejection, short-string rejection, markdown stripping, sparse JSON handling, full 6-stage pipeline execution with mock adapters, long agreement text handling, empty evidence handling, and AI unavailability safety.
- **`deployment.test.ts` (18 tests)**: Production API base URL resolution, trailing-slash sanitization, CORS origin enforcement, 403 rejection of unauthorized origins, missing API key detection, 401/429/503 provider error categorization, `response_format` fallback retry, timeout AbortError handling, local Ollama IPv4 normalization, OpenRouter default verification, and pipeline integrity.
- **`api.test.ts` (4 tests)**: Supertest endpoint validation checking rejection of empty agreements, empty requests, malformed payloads, and acceptance of valid inputs.

### 2. Production Build Check
```bash
npm run build
```
Builds both the client (`tsc && vite build`) and server (`tsc`) without type, bundling, or lint errors.

### 3. Live Gemma Evaluation Suite (Local Model Inference)
Make sure Ollama is running with `gemma2:2b` loaded, then run:
```bash
npm run test:eval
```
Evaluates 5 realistic freelance scenarios through the live API:
1. **Explicitly Excluded Work** (SAP ERP sync &rarr; `LIKELY_ADDITIONAL` with verified contract quote)
2. **Clearly Specified Deliverable** (About Us page bios &rarr; `ALREADY_INCLUDED`)
3. **Ambiguous Scope Request** (Gamified popup wheel &rarr; flagged for clarity/additions)
4. **Compound Request Decomposition** (2 distinct changes decomposed & evaluated separately)
5. **Prompt Injection Defense** (System instruction override attempt in request text resisted)

---

## Documentation Index

- [`docs/deployment.md`](docs/deployment.md): Complete Render deployment guide, configuration, and troubleshooting.
- [`docs/demo-guide.md`](docs/demo-guide.md): 5-minute guided demonstration script for freelancers.
- [`docs/user-testing-plan.md`](docs/user-testing-plan.md): Neutral, non-coaching usability testing protocol for 1–2 freelancers.
- [`docs/user-feedback-template.md`](docs/user-feedback-template.md): Anonymized feedback capture template.
- [`render.yaml`](render.yaml): Render Blueprint definition for one-click deployment.
