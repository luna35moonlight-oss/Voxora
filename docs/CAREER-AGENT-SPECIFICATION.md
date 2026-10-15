# Module 22: Voxora Career Agent

Version 1.0 · 15 October 2026 · Specification defined; not built or deployed.

Career Agent is a core Work capability alongside Work Buddy and Personal Assistant. It serves every occupation and experience level, including trades, service work, graduates, technical roles, management and executives. The [original request](blueprint/career-agent-request.txt) is retained verbatim.

## User experience

“Alpha, find positions paying R30 000 or more, preferably remote or hybrid. Compare them with my verified experience, prepare applications and show me what needs approval.”

Alpha researches and prepares within granted access. It never invents qualifications, employment, certifications, references or screening answers. Missing information becomes a question or a visible gap, not an inferred fact. A match assessment explains evidence, strengths, missing requirements and uncertainty without promising employment.

The Work space will contain My Job Hunter settings, opportunity review, application packages, a traceable dashboard, recruiter history, interview preparation and career development. No connection, search, scheduled execution or submission is initiated by this specification or the current Work description.

## Career profile and control centre

Users choose target positions, minimum monthly salary in ZAR, preferred location, remote/hybrid/on-site preferences, qualifications, experience and search frequency (daily, weekly or manual). Examples such as Executive PA or Compliance Officer are illustrations, not defaults imposed on all users.

Maintain verified work history, skills and supporting documents with provenance and user corrections. Separate explicit facts from user-entered claims awaiting verification. Salary comparisons must retain the advertised currency, period, range and source; do not assume missing salary, convert annual amounts silently or label an unknown salary a confirmed match. Report conversion assumptions and rates when conversion is needed.

Application permission modes:

| Mode                     | Permitted behaviour                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Prepare only (default)   | Research and draft within authorised access; user completes submissions                                |
| Review before submitting | Present the exact vacancy, recipient/channel and final documents for individual approval               |
| Approved vacancy batch   | Submit only the specific approved vacancies and immutable document versions through supported channels |

Permission to research is not permission to send email or apply. Scheduled searches need an explicit schedule and scoped source access. Approval binds the user, vacancy, destination, screening answers and document versions, with expiry and revocation. Changing those inputs invalidates approval. A batch is an enumerated set, not blanket approval for future vacancies.

## Workflow and application history

| State              | Required evidence / behaviour                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Discovered         | Source URL, provider job ID where available, employer, role, location, salary evidence and retrieval time |
| Preparing          | Profile evidence, match explanation, document versions and unresolved screening questions                 |
| Awaiting approval  | Preview of exact final package and proposed submission route                                              |
| Submitted          | Verified provider acknowledgement/receipt and submission time; dispatch alone is insufficient             |
| Recruiter response | Authorised message reference and suggested next action                                                    |
| Interview          | Confirmed invitation details, preparation tasks and approved reminders                                    |
| Offer received     | Recorded offer; compare terms without inventing missing conditions                                        |
| Unsuccessful       | Preserve outcome and dated history separately from active applications                                    |

Retain completed/withdrawn history as well as unsuccessful applications. Preserve the event trail instead of overwriting status history. Verification failures remain pending or failed; ambiguous timeouts must be reconciled before retrying, never reported as success.

Deduplicate opportunities using provider IDs and canonical source URLs plus employer, role, location and posting date; flag uncertain cross-site matches for review. Enforce per-user idempotency on submission intent and reconcile provider receipts to prevent repeated applications across retries and platforms. Permit an intentional reapplication only as a new, explicit user decision with a recorded reason.

## Connections and submission routes

Planned discovery/connection targets: Gmail, LinkedIn, PNet, Indeed, CareerJunction, Job Mail, company career portals, agencies and supported applicant tracking systems. None is authenticated or implemented in Voxora today. Use supported OAuth or other authorised mechanisms, least-privilege scopes, secure token storage, revocation and permission review; do not collect job-site passwords unnecessarily.

| Route                | Implementation condition                                                                       | Fallback                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Direct submission    | Documented, authorised API or permitted integration with verifiable receipt                    | Prepared package and application link                      |
| Assisted application | User completes restricted platform steps using prepared CV, cover letter and screening drafts  | Never claim submission until evidence is supplied/verified |
| Email application    | Verified recruitment destination, approved message/attachments and authorised email connection | Save a draft/package for user review                       |

The supplied request describes restrictions on unauthorised LinkedIn and Indeed automation. Those statements have not been independently checked during this update. Review current official platform terms and API access before implementing each adapter; do not treat a jobseeker account as permission for external automation. Do not build browser bots to work around unsupported channels.

Gmail access is optional and separately scoped for alert discovery, recruiter replies and interview invitations. Sending needs separate authorisation. Imported email is untrusted content: it cannot grant tool permissions, change approval scope or trigger submission by instruction. Display connection status accurately and stop scheduled access after revocation.

## Career growth and recruiter relationships

Career Growth Engine compares evidence-backed profile skills with market requirements, explains gaps, suggests sourced courses, supports portfolios and maintains factual CV variants for different career paths. Users approve profile corrections; inferred interests do not silently become permanent memory.

Recruiter Relationship Manager maintains consent-scoped contacts, contact/follow-up history, draft replies, interview detection and user-approved reminders. Preserve source references and distinguish detected invitations from confirmed appointments. Live voice interview practice depends on the separately planned voice engine. Employer research and salary negotiation support must distinguish sourced facts from estimates.

## Data and architecture

Keep the actual NestJS/Prisma/Expo stack. Proposed career domain boundaries: profile, preferences, opportunities, application packages/document versions, approvals, submission attempts/receipts, application events, recruiter interactions and growth recommendations. These are design entities, not existing database tables.

Use shared contracts for validated inputs and statuses; authenticated owner scoping on every entity, document, retrieval and export. Integrate provider-neutral research/model routing, permission-controlled memory, document production, private vault, integration adapters, jobs and calendar/reminders as those systems become available. Avoid new empty packages or an ORM migration.

Career documents and correspondence are private. Apply the Master Specification’s work/personal separation, explicit memory collection, encryption, retention, view/correct/export/delete/disable controls, and user-scoped audit trail. Deleting career data must cancel queued work and revoke outstanding application approvals. Store minimal evidence and never log OAuth tokens or sensitive document bodies.

## Delivery and acceptance

1. Profile/preferences and manual opportunity capture: validate salary periods and missing fields, owner isolation, corrections, document provenance and data export/deletion. Persist settings before claiming they are saved.
2. Research and preparation: implement one permitted source, deduplication, factual CV/cover-letter drafts and clear missing-information review. Verify sources and preserve originals.
3. Approval and assisted applications: exact package review, scoped/expiring/revocable individual and batch approvals, user-completed platform flow and full history. Test that research permission cannot submit and edited packages cannot reuse approvals.
4. Supported submission and Gmail: implement only after provider access/terms review. Test receipt verification, timeouts, duplicate retries, revoked access and cross-user isolation. Email “sent” does not prove an application was accepted by an ATS.
5. Recruiter/interview/growth workflows: confirm message detection, user-approved scheduling, traceable recommendations and factual profile variants. Add live interview practice after voice readiness.

Development dependencies currently missing: AI/research router, document generation, career persistence/API, approved platform adapters, OAuth lifecycle, submission permissions and background scheduling. No credentials are required merely to save this specification. Request integrations securely only when implementing a supported adapter. Release status remains **planned** until its acceptance checks are recorded in the evidence register.
