# Voxora Security — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Bootstrap owner identity (account email seed):** `luna35moonlight@gmail.com`  
**Support:** `support@voxora.co.za`  
**Rule:** Do not hard-code `if email == ownerEmail then admin` in the mobile/browser client.

---

## 1. Phase 0 security questions (§107)

| Question | Answer (proposed) |
|----------|-------------------|
| Account authentication | Email/password with modern hashing; OIDC IdPs only when really integrated |
| Session protection | Short-lived access tokens + rotated refresh tokens hashed at rest; device binding metadata; secure mobile storage |
| Owner access assignment | Server-side bootstrap/role assignment + audited elevation; not client email checks |
| RBAC | Roles: User, Support, Moderator, Admin, Owner, Service Account; permission checks on API |
| Capabilities / entitlements | Entitlement Service + per-route guards |
| File protection | Authz on object access; signed short-lived URLs; virus scanning later as needed |
| Per-user DB isolation | Queries scoped by user/membership; automated authz tests |
| User deletion | Defined deletion/anonymisation workflow (legal retention TBD) |
| Audit log protection | Append-only, restricted access, no public API |
| Backup protection | Encrypted backups, restricted restore roles, env separation |
| App secrets | Secret manager; never in client binaries or git |

---

## 2. Authentication details (plan)

- Password hashing: **Argon2id** (or bcrypt only if platform constraint forces — prefer Argon2id)  
- Email verification tokens: hashed, expiring, single-use, attempt limits, resend throttling  
- Phone OTP: real provider, attempt limits, expiry; **Verified** only after success  
- MFA readiness: schema/session design must allow MFA factors later without redesign  
- Rate limits on auth endpoints  
- Lockout / abuse prevention progressive delays  

---

## 3. Mobile secure storage

| Platform | Store |
|----------|-------|
| iOS | Keychain via secure store module |
| Android | Keystore-backed encrypted storage |

Forbidden for sensitive tokens: plain files, ordinary unencrypted preferences, insecure JS storage, logs.

---

## 4. OAuth / provider security

- PKCE for mobile OAuth where applicable  
- Tokens only on server vault  
- Webhook signature verification  
- Minimal scopes; capability verification after connect  
- Revocation path on disconnect  

---

## 5. Application security controls

- Input validation (schema)  
- Output encoding appropriate to channel  
- CSRF where cookie/web admin applicable  
- CORS allowlists  
- CSP for any web admin/marketing surfaces  
- Secure file handling  
- Environment separation (dev/staging/prod)  
- Dependency scanning in CI (Phase 1+)  

---

## 6. Privacy by default

Do not publicly expose: email, phone, legal name (unless chosen), calendar, emails, contacts, provider data, files, private conversations, Alpha memory, location.

Profile visibility user-controlled. Defaults private for email/phone.

Voice: no silent always-on mic; continuous listening requires explicit future setting + clear UI + docs.

Tone detection (if any) is playful — not medical diagnosis.

---

## 7. Audit events (examples)

login, password reset, role change, subscription/entitlement change, provider connect/disconnect, external message send, calendar create, file deletion, memory deletion, support adjustment, reward, battle reward.

---

## 8. Observability without leaking secrets

Structured logs, error monitoring, API/DB/job health, auth failures, provider/Alpha/notification failures, latency, crash reporting.

Do not unnecessarily place private user content in operational logs.

---

## 9. Age gate

Initial public launch **18+**. No minor/guardian accounts in initial version without separately approved legal/technical design.

---

## 10. Immediate greenfield security findings

- No secrets currently committed (basic scan clean)  
- No auth system yet — must be built correctly in Phase 1–2  
- VS gitignore alone is not a security program  

---

## 11. Owner review items

- MFA required at launch or post-launch  
- Account deletion / retention policy  
- Whether owner bootstrap uses invite + break-glass procedure details  
- Production hosting region(s) and data residency expectations  
