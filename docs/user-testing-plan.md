# ScopeGuard AI — Neutral Usability Testing Protocol

This document outlines a lightweight, neutral usability testing protocol designed for 1–2 independent freelancers or agency practitioners.

The purpose of this test is to observe whether real users naturally understand the interface, comprehend the three classification levels, trust the quotation verification, find the proposed next actions helpful, and feel comfortable with the privacy posture.

---

## 1. Guiding Principles & Facilitator Ethics

- **Do Not Coach**: Allow the participant to explore, read, and click on their own. Do not guide their cursor or tell them where to click unless they are completely blocked.
- **Do Not Lead**: Avoid biased framing such as *"Don't you love how fast this breaks down scope?"* or *"Isn't this evidence helpful?"*. Use neutral, open-ended prompts: *"What do you notice here?"* or *"How would you interpret this result?"*.
- **Observe Hesitations**: Watch for pauses, repeated re-reading, confusion over terminology, or skepticism regarding model statements.
- **Voluntary & Confidential**: Inform the participant that their feedback is voluntary, completely confidential, and will only be reported in anonymized, non-identifying form. Do not record their client names, pricing, or proprietary contracts.

---

## 2. Participant Profile

- **Target Candidate**: A freelance web developer, designer, copywriter, or digital agency project manager who regularly handles client statements of work and client change requests.
- **Non-Identifying Description**: E.g. *"Freelance frontend developer (4 years experience, solo practitioner)"* or *"Design studio project manager (2-person boutique agency)"*.

---

## 3. Session Outline (Approx. 20–25 Minutes)

### Phase 1: First Impressions & Problem Understanding (3–4 mins)
1. Provide the participant with the URL (`http://localhost:5173`) with the landing page open.
2. Instruct: *"Please look at this page for a moment without clicking into the workspace yet."*
3. **Neutral Questions**:
   - *"In your own words, what does this tool claim to do?"*
   - *"Who do you think this is built for?"*
   - *"Is there anything on this page that seems unclear, exaggerated, or confusing?"*

### Phase 2: Input & Interaction (5 mins)
1. Instruct: *"Please open the workspace and set up an analysis."*
   - Note whether they choose to paste their own synthetic text or click **"Load Sample Scenario"**.
   - If they ask what to test, suggest using one of the built-in sample scenarios or a fictitious scenario of their own.
2. Observe without interrupting:
   - Do they notice the character count and minimum length requirements?
   - Do they understand the two distinct input panels (Original Agreement vs New Client Request)?
   - When they click **"Analyze Scope"**, observe their reaction to the loading indicator and CPU latency note.
3. **Neutral Questions during loading / initial pause**:
   - *"What do you expect the system is doing right now?"*
   - *"How does the wait time feel to you?"*

### Phase 3: Interpreting Results & Evidence (7–8 mins)
1. When the analysis results render, allow the participant to scroll through without interruption.
2. Instruct: *"Please take a look at the results and tell me what you see."*
3. **Tasks to observe**:
   - **Decomposition**: Did they notice whether a compound request was broken down into individual items?
   - **Classification**: Do they understand the meaning of `ALREADY_INCLUDED`, `Likely Out-of-Scope`, and `NEEDS_CLARIFICATION`?
   - **Evidence & Verification**: Do they notice the difference between *"Verified in your agreement text"* and *"Not found verbatim — treat as unverified"*?
   - **Uncertainty**: Do they read the contractual uncertainty disclosures?
4. **Neutral Questions**:
   - *"Which parts of this request were marked as included, additional, or uncertain?"*
   - *"Look at the quoted evidence section. Do you trust this quotation? Why or why not?"*
   - *"If this were a real client of yours, would you agree with this classification, or would you challenge it? Why?"*
   - *"What crucial information or context, if any, is missing from this analysis?"*

### Phase 4: Next Steps & Change-Order Review (4–5 mins)
1. Instruct: *"Look at the proposed next steps and the message draft at the bottom."*
2. **Tasks to observe**:
   - Do they notice the suggested next action on each card?
   - Do they read the disclaimer above the draft message?
   - Do they attempt to edit the draft or fill in placeholders (`[Client Name]`, `[price]`, etc.)?
   - Do they test the **"Copy Response"** button?
3. **Neutral Questions**:
   - *"Based on this result, what would your next actual step be with your client?"*
   - *"How close is this draft message to something you would actually send to a client?"*
   - *"What would you change about the tone or content of this message before sending it?"*

### Phase 5: Debrief & Wrap-Up (5 mins)
Conclude with comprehensive, non-leading debrief questions:

1. **Confusion**: *"What was the most confusing or frustrating part of the whole experience?"*
2. **Trust & Boundaries**: *"What would stop you from pasting a real client contract into this tool today?"*
3. **Workflow Fit**: *"Would a tool like this realistically fit into your current client workflow? Why or why not?"*
4. **Single Improvement**: *"If you could change or add exactly one thing to make this genuinely useful in your day-to-day work, what would it be?"*

---

## 4. Post-Session Documentation

Immediately after the session, record the participant's observations and direct quotes using the standardized template in [`docs/user-feedback-template.md`](file:///d:/HacktoberFest%20Challenges/Hacktoberfest%20Week%202%20challenge/docs/user-feedback-template.md).
