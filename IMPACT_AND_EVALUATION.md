# Political Payola (`politicalpayola.com`) — Measurable Impact Metrics, Evaluation Framework & 12-Month Grant Budget

**Prepared For:** Foundation Program Officers, Fiscal Sponsors & Civic-Tech Evaluators  
**Project Lead:** Tristan Jordan (Pueblo, Colorado)  
**Verification Gate:** Automated daily via `validate_data.py` & `corruption_gate.py`

---

## 1. Verified Baseline Output & Technical Readiness (As of November 2, 2026)

| Institutional Readiness Metric | Verified Baseline (Live Today) | Verification Source / URL |
| :--- | :--- | :--- |
| **Total Verified Primary-Source Records** | **5,308 records** (1981–2026) | `https://politicalpayola.com/data_bundle.js` |
| **Indexed Civic & Scientific Modules** | **26 modules** (Congress, 50 States, Bills, PACs, Corruption, Media, Health, Economy, Unions, Wars) | `https://politicalpayola.com/api/tools.json` |
| **119th U.S. Congress Coverage** | **539 / 539 lawmakers (100%)** with verified portraits & FEC links | `https://politicalpayola.com/#panel-congress` |
| **State-Level Longitudinal Matrix** | **50 States + D.C.** across 25+ peer-reviewed medical, fiscal & crime indicators | `https://politicalpayola.com/#panel-states` |
| **Bipartisan Corruption Docket Archive** | **177 verified cases** (**93 D · 84 R · 12 Colorado**) with DOJ/Ethics dockets | `https://politicalpayola.com/#panel-scandals` |
| **Media Bias & Live Output Radar** | **Top 21 U.S. & global news outlets** (**248 scraped headlines** + blind survey scores) | `https://politicalpayola.com/#panel-media` |
| **Language & Reading Accessibility** | **100% English & Español (`EN/ES`)** parity at a **Grade-10 reading level** | Top-nav `EN | ES` toggle + `CIVICS_CURRICULUM_KIT.md` |
| **Open-Data & Academic Licensing** | **`CC-BY-4.0`** + GitHub **`CITATION.cff`** + **`METHODOLOGY.md`** | `https://politicalpayola.com/CITATION.cff` |
| **Anti-Hallucination AI Discovery** | **WebMCP (`/api/tools.json` + `/.well-known/mcp.json`)** + `llms.txt` | `https://politicalpayola.com/.well-known/mcp.json` |

---

## 2. 12-Month Grant Outcomes & Logic Model ($25,000 – $75,000 Grant Cycle)

### Outcome Pillar A: Rural & Bilingual Civic Information Equity (Colorado & National)
- **Target Population:** Working families, Spanish-speaking households, and Title I high school / community college students in Southern Colorado (Pueblo County D60/D70, El Paso County, Fremont County, Huerfano County, Las Animas County, Otero County) and nationwide.
- **12-Month Measurable KPIs:**
  1. **50,000+ Unique Bilingual Civic Lookups:** Tracked via privacy-preserving, cookie-free aggregate pageview and tool-interaction counters (`connect-src 'self'`).
  2. **25+ High School & Community College Classrooms Onboarded:** Direct adoption of the free bilingual **Civics & Data Literacy Curriculum Kit (`CIVICS_CURRICULUM_KIT.md`)** across Southern Colorado and Title I districts.
  3. **100% Zero-Paywall Public Access:** All 5,308+ records remain permanently free of paywalls, login walls, or intrusive ad trackers.

### Outcome Pillar B: Local Newsroom & Public-Radio Data Infrastructure
- **Target Population:** Local Colorado and regional investigative journalists, student newspapers, and community radio stations lacking dedicated data-journalism engineers.
- **12-Month Measurable KPIs:**
  1. **15+ Newsroom & Community Portal Embeds:** Free non-commercial licensing of Political Payola's bilingual `<iframe>` 50-State Rankings and Congressional Roll-Call Scorecards to local 501(c)(3) newsrooms and Colorado Media Project partners.
  2. **Quarterly FEC & Legislative Roll-Call Refreshes:** 4 scheduled quarterly dataset releases within 72 hours of official FEC filing deadlines, verified with `0` broken primary-source links.

### Outcome Pillar C: Open-Web AI Provenance & Hallucination Prevention
- **Target Population:** Civic researchers, librarians, and open-source AI developers querying legislative and public-health data.
- **12-Month Measurable KPIs:**
  1. **100% Schema-Locked Citation Provenance:** Every record served via `/api/tools.json` and `/.well-known/mcp.json` returns an immutable `source.url` and `source.publisher` from our 55-domain federal/peer-reviewed allowlist.

---

## 3. Standard Line-Item Grant Budget Template ($75,000 National / $25,000 Regional)

| Budget Category | National Tier ($75,000) | Regional Tier ($25,000) | Charitable & Educational Justification |
| :--- | :--- | :--- | :--- |
| **1. Civic Data Engineering & Primary-Source Verification** | $32,000 | $11,000 | Quarterly FEC/Congress/CBO ingestion, automated link-health verification across 5,308+ records, and WebMCP open-API maintenance. |
| **2. Bilingual (`EN/ES`) Translation & Grade-10 Literacy Review** | $18,000 | $6,500 | Human editorial audit of Spanish translations, plain-language kitchen-table summaries, and printable classroom worksheets. |
| **3. Southern Colorado & Title I Classroom Curriculum Rollout** | $12,000 | $4,000 | Teacher workshop packets, printable bilingual lesson guides, and community library civic-data clinics across Pueblo & Southern CO. |
| **4. Rural 3G CDN Hosting, Accessibility & Security Auditing** | $7,000 | $1,500 | Edge caching, offline PWA service-worker optimization, and WCAG 2.1 AA screen-reader compliance testing. |
| **5. 501(c)(3) Fiscal Sponsor Administrative Fee (8%)** | $6,000 | $2,000 | Standard fiscal sponsorship accounting, IRS Form 990 compliance, and independent grant fund auditing. |
| **TOTAL GRANT REQUEST** | **$75,000** | **$25,000** | **100% Non-Dilutive Charitable & Educational Allocation** |
