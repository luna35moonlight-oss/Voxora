# Voxora Alpha Architecture — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Rule:** There is only one Alpha. Alpha lives inside Voxora. Users are not redirected to consumer AI apps.

---

## 1. Phase 0 Alpha questions (§102)

| Question | Answer (proposed) |
|----------|-------------------|
| How does one Alpha service support the platform? | Single Alpha orchestration service with shared understanding → planning → permission → execution pipeline; modules request capabilities, not separate bots |
| How does Alpha stream responses? | Token/streaming via API WebSocket or SSE to mobile; Bondfire UI renders stream; events mark thinking/speaking |
| How are model providers abstracted? | Provider adapters behind `AlphaModelRouter`; swap/route models without rewriting product UI |
| How does Alpha call Voxora tools? | Tool registry with schemas; Alpha proposes tool calls; execution layer runs only after permission checks |
| How are permissions checked? | User + provider connection + capability + entitlement + feature flag; calendar permission ≠ mail permission |
| How are actions confirmed? | Tool executor waits for provider/Voxora result; Alpha may only claim success after confirmation |
| How is memory implemented? | Formal Memory subsystem with user controls; not “send entire history every time” |
| How does Bondfire connect to Alpha? | Bondfire is a client of the same Alpha service with conversation/thread context + quota enforcement |
| How do avatar/pet states receive Alpha events? | Alpha lifecycle emits `ALPHA_STARTED_THINKING` / `SPEAKING` / `FINISHED`; Interaction Runtime reacts |
| How does voice coordinate with Alpha? | Voice pipeline produces transcript → Alpha request with correlation ID → optional TTS → speaking events |

---

## 2. Pipeline separation (mandatory)

1. User request understanding  
2. Reasoning / suggestion  
3. Draft creation  
4. Action planning  
5. Permission checking  
6. Action execution  
7. Action result  

Alpha must **never** claim an external action succeeded until Voxora confirms it.

---

## 3. Forms of presence

### Background Alpha
Coordinates context, memory, notifications, reminders, calendar, email, contacts, files, providers, voice, avatar/pet cues, creation tools, workspaces, Wellness, tasks, automation — as permitted.

### Visible Alpha
Intentional conversation in **Alpha Bondfire**.

Do not create Alpha Chat Bot / Calendar Bot / Reminder Bot / Wellness Bot / Email Bot / Pet Bot / Game Bot as unrelated implementations.

---

## 4. Tool permission examples

Possible tools: calendar read/write, reminder create, mail read/draft/send, contacts access, file read/create, workspaces, creation tools, notifications.

Each invocation is:

- user-aware  
- provider-aware  
- capability-aware  
- server-enforced  

---

## 5. Provider independence

Alpha may use one or more underlying AI services. The user interacts with **Alpha** inside **Voxora**.

Architecture allows:

- replace model providers  
- route tasks between approved models  
- combine specialised models  
- add future providers  

without rewriting the whole application.

---

## 6. Memory subsystem

Fields: memory ID, owner, category, content/reference, source, scope, created/updated, retention, visibility, enabled, deletion, sensitivity controls.

Categories (potential): preferences, projects, people, ongoing plans, work context, user-provided facts, conversation continuity.

User controls: view, delete one, clear all, disable, settings.

---

## 7. Wellness / emotional support boundary

- Wellness uses Alpha (same architecture)  
- Privacy boundary stricter  
- Entitlement + trial rules apply  
- No invented medical diagnosis  
- Crisis behaviour content awaits separate owner specification  
- Supportive tone must not be only “contact a hotline,” but safety-critical escalation still required when defined  

---

## 8. Failure isolation

If an AI provider fails, Alpha returns a controlled error; other Voxora pillars remain available. Bondfire quota counting rules for failures → owner decision (`open-questions.md`).

---

## 9. Security notes

- Prompts/tools must not exfiltrate secrets  
- Provider data only accessed with grants  
- Do not log private user content unnecessarily  
- Memory deletion must be enforceable  

---

## 10. Open owner decisions

- Initial model vendor(s)  
- Whether multiple models at launch  
- Quota counting for tool calls / voice / failed requests  
- Retention defaults for memory and Bondfire transcripts  
