# Voxora Integrations — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Rule:** Selecting an app is intent. Connected means real authorisation + capability verification.

---

## 1. Phase 0 provider questions (§106)

| Question | Answer (proposed) |
|----------|-------------------|
| Adapter structure | Provider Adapter Layer with shared interface; feature screens never call raw provider SDKs directly |
| OAuth token storage | Server-side encrypted token vault table; mobile holds only Voxora session |
| Refresh token protection | Encrypt at rest; restrict DB roles; never log token values |
| Token renewal | Background job + on-demand refresh; state → `REAUTHORIZATION_REQUIRED` on failure |
| Webhook verification | Per-provider signature/secret validation before enqueue |
| Provider failure isolation | Circuit breaker / error boundaries per adapter; degrade capability, don’t crash app |
| Capability detection | Declare & verify scopes/APIs after OAuth; store capability set |
| Disconnection | User or system revoke; delete/disable tokens; state `DISCONNECTED` |

---

## 2. Connection states

- `NOT_CONNECTED`  
- `AUTHORIZATION_STARTED`  
- `CONNECTED`  
- `LIMITED_CAPABILITY`  
- `REAUTHORIZATION_REQUIRED`  
- `EXPIRED`  
- `ERROR`  
- `DISCONNECTED`  

Only successful real authorisation (+ verification) may result in `CONNECTED`.

---

## 3. Capability catalogue (examples)

mail read/write, calendar read/write, contacts read, attachment access, webhook, push, polling, provider deep link.

Do not show unsupported capabilities as working.

---

## 4. Planned ecosystems (where technically possible)

| Domain | Candidates | Notes |
|--------|------------|-------|
| Email | Google/Gmail, Microsoft Outlook/Hotmail, future standards-based | Depends on official API + grants |
| Calendar | Google, Microsoft | Alpha schedule flow must verify write permission + timezone |
| Contacts | Provider contacts | Separate permission; do not upload entire list without legitimate feature + consent |
| AI models | Abstracted behind Alpha router | User still sees Alpha only |
| Voice STT/TTS | Platform APIs and/or vendors | Privacy: no silent always-on mic |
| Payments | Apple IAP, Google Play Billing (+ web questions) | Store rules critical |
| SMS OTP | Real OTP provider for phone verification | Required for paid tiers |

---

## 5. Unified communications caution

Do **not** fake integrations for WhatsApp, Instagram, Messenger, TikTok, Discord, or others.

For each provider, before implementation, verify:

- official API  
- authentication  
- read / reply / send capability  
- webhook capability  
- account restrictions  
- legal restrictions  
- rate limits  

If official API cannot support the product behaviour, record limitation + closest valid alternative for owner approval.

---

## 6. Alpha calendar example (success path)

“Schedule my meeting tomorrow at 10.”

1. understand request  
2. identify connected calendar  
3. verify write permission  
4. resolve timezone  
5. gather missing essentials  
6. send provider request  
7. receive result  
8. save provider reference  
9. report success only after creation succeeds  

---

## 7. Onboarding interest vs connection

Step 7 selected apps = **User intends to connect**.  
Step 8 real OAuth = path to **Connected**.

---

## 8. Open owner decisions

- Launch provider priority order  
- Whether contacts are launch-critical  
- Which social/messaging providers are even candidates  
- Data retention for synced mail/calendar caches  
