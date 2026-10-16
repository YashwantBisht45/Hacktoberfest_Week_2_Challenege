export interface SampleDataset {
  name: string;
  description: string;
  originalAgreement: string;
  clientRequest: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    name: "Web Dev SOW — Explicit Exclusion",
    description: "Client asks for ERP sync that's explicitly excluded from the agreement.",
    originalAgreement: `STATEMENT OF WORK: E-Commerce Store Refresh
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
- Additional revision rounds billed at $120/hr.`,
    clientRequest: `Hi Alex,
Hope you're having a good week! The team loved the new homepage draft.

Quick update from our ops meeting this morning: We just signed a contract with a regional warehouse distributor in Germany, so we urgently need the store to automatically sync inventory with their custom SAP SOAP API in real time. Also, we want customers from the EU to be automatically routed to dedicated localized checkout domains with VAT calculation.

Can we include this in next Friday's launch? Thanks!`,
  },
  {
    name: "Web Dev SOW — Ambiguous Feature Request",
    description: "Client requests a feature the agreement neither explicitly includes nor excludes.",
    originalAgreement: `PROJECT AGREEMENT: Company Website Redesign
Client: Meridian Consulting Group
Freelancer: Jamie Osei (Osei Digital)
Date: October 2026

Project Summary:
Complete redesign and rebuild of the Meridian Consulting public-facing website using
WordPress (Elementor Pro). The goal is a modern, professional site that generates
inbound consultation inquiries.

Deliverables:
1. Up to 7 custom page designs and builds:
   - Home, About, Services Overview, Contact, Blog Index, Privacy Policy, and 1 Landing Page
2. Integration of a contact form (e.g. Gravity Forms or WP Forms) routing to client's email.
3. Basic on-page SEO setup: meta titles, descriptions, sitemap generation via Yoast SEO.
4. Migration of existing blog posts from old WordPress installation (up to 30 posts).
5. Google Analytics 4 tag integration.
6. 30 days post-launch support for bug fixes and minor copy adjustments.

Payment Terms:
50% deposit upfront, 50% on project completion and sign-off.

Notes:
Additional pages, custom plugin development, or third-party system integrations not
listed above will require a separate Change Order and pricing agreement.`,
    clientRequest: `Hi Jamie,

The new site looks great! A few things our team wanted to ask about before we finalize:

1. Our CEO would like to have a live chat widget on the site so visitors can ask questions
   instantly. Would that be straightforward to add before we launch? We're thinking something
   like Intercom or a similar tool.

2. We also just realized we need a careers page where candidates can apply directly with
   a resume upload. Would that count as one of the 7 pages, or is the application form
   a separate piece of work?

We want to make sure we are aligned on the scope before giving final sign-off.`,
  },
];
