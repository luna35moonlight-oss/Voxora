# Voxora Security — Phase 0

**Document status:** OWNER APPROVED WITH AMENDMENTS (2026-08-10)  
**Bootstrap owner identity (account email seed):** `luna35moonlight@gmail.com`  
**Support:** `support@voxora.co.za`  
**Rule:** Do not hard-code `if email == ownerEmail then admin/owner` in the mobile/browser client.

---

## 1. Phase 0 security questions (§107)

| Question | Answer |
|----------|--------|
| Account authentication | Email/password with modern hashing; OIDC IdPs only when really integrated |
| Session protection | Short-lived access tokens + rotated refresh tokens hashed at rest; device binding metadata; secure mobile storage |
| Owner access assignment | Server-side bootstrap/role assignment + audited elevation; not client email checks |
| RBAC | Roles: User, Support, Moderator, Admin, Owner, Service Account; permission checks on API |
| Capabilities / entitlements | Entitlement Service + per-route guards (Phase 2+ commercial; Phase 1 foundations) |
| File protection | Authz on object access; signed short-lived URLs; virus scanning later as needed |
| Per-user DB isolation | Queries scoped by user/membership; automated authz tests |
| User deletion | Defined deletion/anonymisation workflow (legal retention **DEFERRED**) |
| Audit log protection | Append-only, restricted access, no public API |
| Backup protection | Encrypted backups, restricted restore roles, env separation |
| App secrets | Secret manager / env injection; never in client binaries or git |

---

## 2. Authentication details

- Password hashing: **Argon2id** preferred  
- Email verification tokens: hashed, expiring, single-use, attempt limits, resend throttling  
- Phone OTP: real provider (vendor **DEFERRED**); **Verified** only after success  
- Rate limits on auth endpoints  
- Lockout / abuse prevention progressive delays  

---

## 3. MFA (OWNER DECISION 2026-08-10)

| Role | Policy |
|------|--------|
| Architecture | MFA-capable from **Phase 1** |
| Owner | MFA **mandatory** before production privileged access |
| Admin | MFA **mandatory** |
| Moderator | MFA **mandatory** |
| Support | MFA **mandatory** |
| Ordinary user | MFA **capability** required; final mandatory vs optional launch rule **DEFERRED** |

Owner/bootstrap role elevation must be: server-side, auditable, restricted, revocable, protected.

Never:

```text
if email === "luna35moonlight@gmail.com" then makeOwner()
```

in mobile or browser code.

---

## 4. Mobile secure storage

| Platform | Store |
|----------|-------|
| iOS | Keychain via secure store module |
| Android | Keystore-backed encrypted storage |

Forbidden for sensitive tokens: plain files, ordinary unencrypted preferences, insecure JS storage, logs.

---

## 5. OAuth / provider security

- PKCE for mobile OAuth where applicable  
- Tokens only on server vault  
- Webhook signature verification  
- Minimal scopes; capability verification after connect  
- Revocation path on disconnect  

---

## 6. Application security controls

- Input validation (schema)  
- Output encoding appropriate to channel  
- CSRF where cookie/web admin applicable  
- CORS allowlists  
- CSP for any web admin/marketing surfaces  
- Secure file handling  
- Environment separation (dev/staging/prod)  
- Dependency scanning in CI (Phase 1+)  

---

## 7. Privacy by default

Do not publicly expose: email, phone, legal name (unless chosen), calendar, emails, contacts, provider data, files, private conversations, Alpha memory, location.

Profile visibility user-controlled. Defaults private for email/phone.

Voice: **no silent always-on mic in V1**; continuous listening/wake-word deferred to separately approved future release. Mic must have visible listening state and proper OS permissions.

Tone detection (if any) is playful — not medical diagnosis.

---

## 8. Audit events (examples)

login, password reset, role change, subscription/entitlement change, provider connect/disconnect, external message send, calendar create, file deletion, memory deletion, support adjustment, reward, battle reward, MFA enrollment/challenge.

---

## 9. Observability without leaking secrets

Structured logs, error monitoring, API/DB/job health, auth failures, provider/Alpha/notification failures, latency, crash reporting.

Do not unnecessarily place private user content in operational logs.

---

## 10. Age gate

Initial public launch **18+**. No minor/guardian accounts in initial version without separately approved legal/technical design.

---

## 11. Billing security note

Digital entitlements via Apple IAP / Google Play Billing with **server-side receipt validation**. Do not trust client-only purchase flags. Do not hard-code ZAR price labels into access logic.

---

## 12. Phase 1 security minimums (authorised)

- modern password hashing  
- email-verification architecture  
- session/token architecture + refresh rotation  
- secure refresh-token storage  
- rate limiting + auth abuse controls  
- validation  
- server-side RBAC + permissions  
- environment separation + secrets handling  
- security headers where applicable  
- safe CORS  
- audit logging  
- secure mobile session storage abstraction  
- MFA schema/capability foundation for privileged roles  

Production secrets must never be committed.
