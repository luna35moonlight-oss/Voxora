# Alpha Bondfire — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Official spelling:** **Bondfire** (never “Bonfire”)  
**Full feature name:** **Alpha Bondfire**

---

## 1. Product definition

Alpha Bondfire is Alpha’s primary visible conversational environment and a complete Voxora interaction environment — **not** merely a chat textarea.

It eventually supports:

- text, voice, streaming responses, read aloud  
- avatar presence, pet presence  
- files, documents, images  
- research, planning, brainstorming, learning, project work  
- calendar actions, reminder creation, mail assistance  
- creation tools, workspaces  
- Wellness mode  
- Voxora memory  

The same Alpha backend serves Bondfire and the wider platform.

---

## 2. Quotas (server-controlled)

| Level | Spec quota |
|-------|------------|
| Level 1 | 4 messages/questions per configured quota period |
| Level 2 | 100 per period |
| Level 3 | 200 per period |
| Level 4 | Subject to commercial rules (not invented here) |

### Must not invent (owner review)

- quota reset period  
- whether failed requests count  
- whether retries count  
- voice request counting  
- tool request counting  
- streaming counting (one user message vs token chunks)

Recorded in `open-questions.md` as **OWNER REVIEW REQUIRED**.

---

## 3. Client architecture notes

- Bondfire screen hosts Scene Engine presence (avatar/pet)  
- Messages stream from Alpha service  
- Voice uses shared voice-to-reaction flow  
- Entitlement `bondfire.access` + `bondfire.messageQuota` enforced server-side  
- UI may preview higher packages but must lock inaccessible functionality honestly  

---

## 4. Wellness mode

Wellness mode is a Bondfire/Alpha mode with additional privacy + entitlement constraints, not a separate AI product. Detailed Wellness specification to be supplied separately.

---

## 5. Honest states

| State | When shown |
|-------|------------|
| Sending | Request in flight |
| Stream active | Tokens arriving |
| Failed | Provider/Alpha/network error |
| Quota exceeded | Server rejects for quota |
| Pending | Offline queue (if allowed) — not Sent |

Never show success for sends that did not succeed.

---

## 6. Terminology checklist

Use **Alpha Bondfire** / **Bondfire** in UI, navigation, headings, messages, docs, architecture, analytics labels, tests, and internal product-concept naming.
