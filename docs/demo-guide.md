# ScopeGuard AI — Five-Minute Guided Demo Script

This guided demo script helps you present ScopeGuard AI to a freelancer or digital agency owner in 5 minutes. The demo uses the live application running against local open-weight inference (Google Gemma 2 `gemma2:2b` via Ollama).

---

## 1. The Problem ScopeGuard AI Solves

When clients send messages like *"Can we also add real-time inventory syncing before Friday's launch?"*, freelancers face an uncomfortable dilemma:
- **Saying yes immediately** causes uncompensated scope creep, tightens deadlines, and cuts margins.
- **Pushing back reflexively** risks awkward friction or damaging client trust.
- **Checking the contract** can be time-consuming, especially when digging through multi-page proposals under deadline pressure.

ScopeGuard AI acts as an objective reference: it compares the client's request clause-by-clause against the original agreement, decomposes compound requests, highlights verified quotations from the contract, points out uncertainties, and drafts an editable change-order reply.

---

## 2. Short Introduction for a Freelancer (30 seconds)

> *"ScopeGuard AI is a lightweight tool designed for freelancers and small studios. You paste in your original Statement of Work and a client's email or Slack request. An open-weight AI model evaluates what is already covered, what is clearly extra work, and what is ambiguous. Crucially, every quoted clause is verified verbatim against your agreement so you never get hallucinated contract terms, and an editable change-order message is drafted for you to review and customize."*

---

## 3. Demo Scenario Setup

### Option A: One-Click Built-in Scenario (Recommended for Speed)
1. Open the application at `http://localhost:5173`.
2. Click **"Analyze a client request"** or **"Try sample SOW scenario"** on the landing page.
3. In the workspace, click the dropdown **"Load Sample Scenario"** and select:
   - **Scenario 1**: *"Web Dev SOW — Explicit Exclusion"* (demonstrates explicit out-of-scope detection).
   - **Scenario 2**: *"Web Dev SOW — Ambiguous Feature Request"* (demonstrates `NEEDS_CLARIFICATION` and targeted questions).

### Option B: Manual Input (To Demonstrate Raw Text Entry)
Paste the following synthetic agreement and client message:

#### Original Agreement / SOW
```text
STATEMENT OF WORK: E-Commerce Store Refresh
Client: Apex Apparel
Freelancer: Alex Morgan (DevStudio)
Date: October 2026

Scope of Deliverables:
1. Re-theme existing Shopify store using the Dawn theme base.
2. Setup and configuration of 5 core page templates:
   - Homepage
   - Product Detail Page (PDP)
   - Collection Listing Page
   - About Us (including team member bio section with photos)
   - Contact Page
3. Integration with standard Shopify Payments and PayPal gateways.
4. Up to 2 rounds of design revisions on mockup previews prior to coding.
5. Standard responsive testing across latest versions of Safari, Chrome, and iOS/Android.

Out of Scope / Explicit Exclusions:
- Custom ERP or legacy inventory management system integration of any kind.
- Native mobile application development.
- Copywriting or raw photography asset creation.
- Multi-currency / international tax nexus configuration beyond Shopify core.
- Additional revision rounds billed at $120/hr.
```

#### New Client Request
```text
Hi Alex,
Hope you're having a good week! The team loved the new homepage draft.

Quick update from our ops meeting this morning: We just signed a contract with a regional warehouse distributor in Germany, so we urgently need the store to automatically sync inventory with their custom SAP SOAP API in real time. Also, we want customers from the EU to be automatically routed to dedicated localized checkout domains with VAT calculation.

Can we include this in next Friday's launch? Thanks!
```

---

## 4. Running Analysis & What to Inspect

1. Click the **"Analyze Scope"** button.
2. **Observe the Loading Experience**:
   - Point out the honest CPU progress indicator: *"Running AI scope analysis — this may take 1–2 minutes on local CPU hardware."*
   - Explain that real inference runs locally without cloud latency tricks or fake progress bars.
3. **When Results Appear, Inspect the 5 Core Sections**:

### A. Executive Summary Card
- **Summary**: Concise high-level synthesis of findings.
- **Metrics**: Count of decomposed items, likely out-of-scope items, and clarification points.
- **Engine pill**: Confirms provider (`ollama`) and model (`gemma2:2b`).
- **Disclaimer**: Notice that this is decision support, not legal advice.

### B. Request-by-Request Decomposition & Evidence
- Point out that the compound client email was split into discrete items (e.g. ERP integration vs VAT checkout).
- Inspect the **Classification Badge**:
  - `Likely Out-of-Scope` (rose badge).
- Inspect the **Agreement Evidence**:
  - Shows the quoted text: `"Custom ERP or legacy inventory management system integration of any kind."`
  - Shows **"Verified in your agreement text"** with a green badge, indicating the backend verified this quote appears verbatim in the SOW.
- Inspect the **Suggested Next Step**:
  - Provides constructive guidance without pretending to make a legal determination.

### C. Scope & Delivery Impact Assessment
- Three columns: **Identified Additional Work**, **Timeline & Delivery Considerations**, and **Unstated Assumptions / Unknowns**.

### D. Clarification Questions
- Actionable questions to ask the client before agreeing or refusing.

### E. Editable Client Response Draft
- A tactfully worded reply ready for review.
- Point out bracketed placeholders (`[Client Name]`, `[price]`, `[timeline]`) that the freelancer must complete.

---

## 5. Demonstrating Draft Editing & Clipboard Copying

1. Click inside the **"Editable Client Response Draft"** textarea.
2. Edit a placeholder live (e.g., replace `[Client Name]` with `"Sarah"`).
3. Click **"Copy Response"**:
   - Notice the button transforms to a green **"Copied to Clipboard"** state with a checkmark.
4. Click **"Reset Draft"**:
   - Resets the textarea back to the model's original generated response.

---

## 6. Privacy & Architecture Explanation for the Freelancer

Explain in plain language:
- **Local Ollama Inference**: All processing runs locally on the machine. Client contract text never leaves the computer and is never sent to third-party model trainers.
- **Hosted Model Option**: If configured with a hosted open-weight endpoint (`AI_PROVIDER=hosted`), data is transmitted over HTTPS to that provider.
- **Independent Citation Verification**: ScopeGuard AI does not trust the AI's quotation output blindly. A separate deterministic algorithm verifies whether cited text actually exists in the contract text you supplied. This checks verbatim text presence, not legal meaning.

---

## 7. Essential Legal Boundary Reminder

Always conclude the demo with this clear boundary:
> *"ScopeGuard AI is designed as a communication and decision-support assistant for freelancers. It helps you prepare for client conversations with clarity and line-by-line contract references. It does not replace a lawyer and does not make legally binding contractual determinations."*

---

## 8. Illustrative vs. Real-Time Output Note

> **Note for Presenters**: The sample output descriptions above illustrate expected model behavior. When you run the demo, the text generated by the local `gemma2:2b` model will be produced live. Slight wording variations in the summary, impact bullets, or email draft are normal for open-weight generative models.
