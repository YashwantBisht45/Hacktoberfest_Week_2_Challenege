# ScopeGuard AI — Production Deployment Guide (Render)

This guide documents the production deployment of ScopeGuard AI to [Render](https://render.com), preserving both local open-weight development (via Ollama) and cloud-ready hosted open-weight inference (Google Gemma 2 via OpenAI-compatible endpoints).

---

## 1. Architecture Overview

ScopeGuard AI is designed as a decoupled two-tier monorepo architecture:

```text
[ Browser Client ]
       │
       ▼
[ Render Static Site: scopeguard-ui ]
  • React 19 + Vite SPA
  • Built to client/dist
  • Connects to backend via VITE_API_BASE_URL
       │
       ▼ HTTPS API Calls (/api/health, /api/analyze)
[ Render Web Service: scopeguard-api ]
  • Node.js + Express + TypeScript
  • Binds to 0.0.0.0:${PORT}
  • Enforces CORS, rate-limiting, and payload size bounds
  • Runs 6-stage scope analysis pipeline
  • Algorithmic 3-level quotation verifier
       │
       ▼ Secure Outbound HTTPS (Server-side API key)
[ Hosted Open-Weight Gemma Endpoint ]
  • Supported: Groq (gemma2-9b-it), Together AI, or OpenRouter
  • Zero client exposure: API keys never sent to the browser
```

---

## 2. Render Services Specification

| Service Property | Frontend (`scopeguard-ui`) | Backend (`scopeguard-api`) |
| :--- | :--- | :--- |
| **Render Service Type** | **Static Site** | **Web Service** |
| **Runtime** | Static HTML/JS/CSS | Node.js |
| **Root Directory** | `client` | `server` |
| **Build Command** | `npm install && npm run build` | `npm install && npm run build` |
| **Start Command** | *(Not applicable for static site)* | `npm run start` |
| **Publish Directory** | `dist` | *(Not applicable)* |
| **Health Check Path** | *(Not applicable)* | `/api/health` |
| **Rewrite Rules** | `/*` &rarr; `/index.html` (SPA fallback) | *(None)* |

---

## 3. Environment Variables

### Backend Service (`scopeguard-api`)

Configure these in the Render Web Service dashboard (**Environment** tab):

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | Port assigned by Render (automatically set) |
| `HOST` | `0.0.0.0` | Binds to all network interfaces |
| `TRUST_PROXY` | `true` | Enables correct IP handling behind Render reverse proxies |
| `CLIENT_ORIGIN` | `https://scopeguard-ui.onrender.com` | Allowed frontend origin for CORS (comma-separated if multiple) |
| `RATE_LIMIT_MAX` | `30` | Max analyses per IP per 15-minute window |
| `AI_PROVIDER` | `hosted` | Activates cloud open-weight adapter |
| `HOSTED_AI_BASE_URL` | `https://api.groq.com/openai/v1` | OpenAI-compatible endpoint URL |
| `HOSTED_AI_MODEL` | `gemma2-9b-it` | Target open-weight Gemma model identifier |
| `HOSTED_AI_API_KEY` | *(Secret value)* | Provider API key (stored securely in Render) |
| `AI_TIMEOUT_MS` | `60000` | Upstream model timeout (60 seconds) |

> **Security Note**: Never commit real API keys to source control or `.env.example`. Enter secrets directly in Render's dashboard.

### Frontend Service (`scopeguard-ui`)

Configure this in the Render Static Site dashboard:

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://scopeguard-api-xxxx.onrender.com` | Public URL of your deployed backend (baked into bundle at build time) |

> **Critical Build-Time Note**: Vite compiles `VITE_*` variables into static assets **at build time** (`npm run build`). Setting `VITE_API_BASE_URL` after a build will NOT take effect until you trigger a **Manual Deploy &rarr; Clear build cache & deploy** in the Render Static Site dashboard.

---

## 4. Supported Hosted Open-Weight Gemma Providers

ScopeGuard AI requires open-weight Google Gemma models under the Gemma Terms of Use.

### Option A: OpenRouter (Verified Active Default)
- **Base URL**: `https://openrouter.ai/api/v1`
- **Model**: `google/gemma-2-9b-it` (or `google/gemma-2-9b-it:free` if available)
- **Model Documentation**: [openrouter.ai/models/google/gemma-2-9b-it](https://openrouter.ai/models/google/gemma-2-9b-it)
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Authentication**: Bearer token (`Authorization: Bearer <sk-or-v1-...>`)
- **JSON Support**: Supported via prompt engineering and `response_format` (with automatic fallback if underlying provider rejects programmatic JSON mode).

### Option B: DeepInfra (Verified Alternative)
- **Base URL**: `https://api.deepinfra.com/v1/openai`
- **Model**: `google/gemma-2-9b-it`
- **Model Documentation**: [deepinfra.com/google/gemma-2-9b-it](https://deepinfra.com/google/gemma-2-9b-it)
- **Endpoint**: `https://api.deepinfra.com/v1/openai/chat/completions`
- **Authentication**: Bearer token (`Authorization: Bearer <key>`)

### Deprecated / Unverified Options:
- **Groq `gemma2-9b-it`**: **DEPRECATED**. Officially retired and shut down by Groq on **October 8, 2025**. Do not use this model on Groq.
- **Together AI Serverless `google/gemma-2-9b-it`**: **DEPRECATED**. Removed from Together AI's serverless pool (requires dedicated endpoints).

---

## 5. Step-by-Step Deployment Instructions

> **Note on Service URLs**: Render assigns unique generated subdomains (e.g. `https://scopeguard-api-abc1.onrender.com` and `https://scopeguard-ui-xyz2.onrender.com`). Do not assume exact names without hashes.

### Step 1: Push Repository to GitHub
Ensure all code and configuration are committed to your GitHub repository:
```bash
git add .
git commit -m "Prepare ScopeGuard AI for Render deployment"
git push origin main
```

### Step 2: Deploy Using Render Blueprint
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** &rarr; **Blueprint**.
3. Select your GitHub repository.
4. Render will parse [`render.yaml`](file:///d:/HacktoberFest%20Challenges/Hacktoberfest%20Week%202%20challenge/render.yaml) and declare both services:
   - `scopeguard-api` (Web Service)
   - `scopeguard-ui` (Static Site)
5. Under `scopeguard-api`:
   - Enter your `HOSTED_AI_API_KEY` (e.g. from OpenRouter).
   - Leave `CLIENT_ORIGIN` blank initially or set to placeholder.
6. Click **Apply**.

### Step 3: Link Frontend and Backend URLs (Crucial Post-Deploy Step)
Because Render generates unique URLs and Vite requires `VITE_API_BASE_URL` at build time:
1. Once `scopeguard-api` is created, copy its assigned URL (e.g. `https://scopeguard-api-xxxx.onrender.com`).
2. Go to `scopeguard-ui` &rarr; **Environment** &rarr; set `VITE_API_BASE_URL` to `https://scopeguard-api-xxxx.onrender.com`.
3. In `scopeguard-ui`, click **Manual Deploy** &rarr; **Clear build cache & deploy** to recompile Vite with the live backend URL.
4. Copy `scopeguard-ui`'s assigned URL (e.g. `https://scopeguard-ui-yyyy.onrender.com`).
5. Go to `scopeguard-api` &rarr; **Environment** &rarr; set `CLIENT_ORIGIN` to `https://scopeguard-ui-yyyy.onrender.com`. Save changes (Render will automatically redeploy the backend).

### Step 3: Deploy Manually (Alternative)
If you prefer creating services individually:
1. **Create Backend Web Service**:
   - Repository: your GitHub repo
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Add all backend environment variables from Section 3.
2. **Create Frontend Static Site**:
   - Repository: your GitHub repo
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add rewrite rule: `/*` &rarr; `/index.html`
   - Add environment variable: `VITE_API_BASE_URL` pointing to backend URL.

---

## 6. Verification & Health Checks

Once deployed, verify the installation:

### 1. Test Backend Health:
```bash
curl https://scopeguard-api.onrender.com/api/health
```
Expected response:
```json
{
  "status": "ok",
  "service": "ScopeGuard AI Backend",
  "version": "1.0.0",
  "ai": {
    "provider": "hosted-open-weight",
    "model": "gemma2-9b-it",
    "status": "connected"
  }
}
```

### 2. Test Frontend Interface:
Open `https://scopeguard-ui.onrender.com` in a browser:
- The top-right navbar pill should display a green dot with **"API Online"**.
- Click **"Try sample SOW scenario"** to load the preconfigured SOW.
- Click **"Analyze Scope"** to execute real cloud inference.

---

## 7. Operational Realities: Cold Starts & Costs

### Render Free Tier Sleep Behavior
- **Spin-down after Inactivity**: Render's free Web Service spins down after 15 minutes of inactivity.
- **Cold-Start Delay**: The first incoming request after spin-down takes **45–60 seconds** to wake up.
- **Frontend Status Indicator**: The navbar in the frontend polls `/api/health`. During a cold start, it displays an amber or gray pulsing dot until the backend wakes up.

### Provider Rate Limits & Quotas
- Hosted inference free tiers (such as Groq or OpenRouter credits) have strict requests-per-minute (RPM) and tokens-per-minute (TPM) limits.
- The ScopeGuard backend enforces a default rate limit of 30 requests per 15 minutes per IP (`RATE_LIMIT_MAX=30`) to protect your provider quota.

---

## 8. Privacy Implications: Local vs. Hosted

| Dimension | Local Ollama Mode (`AI_PROVIDER=ollama`) | Hosted Cloud Mode (`AI_PROVIDER=hosted`) |
| :--- | :--- | :--- |
| **Data Boundary** | 100% on-device (runs on `127.0.0.1`) | Transmitted over TLS to hosted model endpoint |
| **Network Egress** | Zero outbound network calls | Transmits agreement text and client message |
| **Third-Party Logging** | None | Subject to the hosted provider's data retention policy |
| **Ideal For** | Highly confidential client NDAs, proprietary IP | Public hackathon demos, non-sensitive reviews |
| **Hardware Required** | Laptop CPU/RAM (dual-core, 8 GB RAM) | None (runs in the cloud) |

---

## 9. Troubleshooting

- **CORS Error in Browser Console (`CORS policy violation`)**:
  Verify that `CLIENT_ORIGIN` on the backend matches the frontend's exact URL (including `https://`, no trailing slash).
- **Backend returns HTTP 503 (`AI Service Unavailable`)**:
  Check `HOSTED_AI_API_KEY` in the Render dashboard. Verify that your provider quota is not exhausted.
- **Frontend displays "API Offline"**:
  Wait 60 seconds if the free Render instance was sleeping. Check Render service logs for build or start crashes.
- **Frontend calls `http://localhost:5000` in production**:
  Ensure `VITE_API_BASE_URL` was configured in the Render Static Site dashboard before building. Re-deploy the frontend to bake in the environment variable.
