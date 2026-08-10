# Voxora Mobile Strategy — Phase 0

**Document status:** OWNER APPROVED WITH AMENDMENTS (2026-08-10)  
**Primary platforms:** Android phones + iPhone (launch-critical); tablets supported/adaptive, not launch-blocking  
**Constraint:** Independent installed app — not a WebView wrapper product.

---

## 1. Decision summary (APPROVED)

| Topic | Decision |
|-------|----------|
| Shared codebase | **APPROVED** — Expo React Native + TypeScript |
| Native quality bar | Production **development builds / prebuild** — not Expo Go-only |
| Character rendering | **Rive primary** for living avatars/pets/state machines/reactions/compatible clothing; Skia/native may supplement effects/games |
| Games / battles presentation | Presentation may use Rive/Skia/other; **battle calculation never in Rive** |
| Expo SDK | Current **stable** production SDK at scaffold time (no beta/canary/experimental unless separately authorised) |
| Scaffold baseline (2026-08-10) | Expo SDK **57** / React Native **0.86** (stable as of audit) |

---

## 2. Answers to Phase 0 mobile questions (§100) — updated

### Which architecture should Android use?
Expo React Native with Android project via prebuild/dev client. Play Store installable app with native permissions, FCM push, secure storage, background constraints respected.

### Which architecture should iOS use?
Same Expo React Native codebase with iOS via prebuild. App Store installable with APNs, Keychain, privacy manifests as required.

### Can they share a codebase?
**Yes.** Approved.

### Why is this suitable?
One Android/iOS codebase with access to native functionality through development builds and native modules. Does not make Voxora a website, WebView wrapper, or consumer-AI extension.

### How will avatars / pets / clothing / animations render?
**Rive** as primary living-character runtime (state machines, layered compatible clothing/equipment, Idle→Listen→Think→Speak→React). Skia/native GPU may supplement particles/effects/high-performance/specialised games. Before mass asset production: art-pipeline PoC (one avatar + layered outfit + accessory + one pet + pet accessory + Idle/Listen/Think/Speak + pet reaction + runtime switching + equipped persistence).

### How will lip sync work?
**Preferred:** viseme/phoneme timing when speech provider supplies it. **Fallback:** audio-amplitude mouth movement. Architecture must allow visemes from the beginning. Never purely random mouth movement when real timing exists.

### How will games / pet battles work?
Games: modular Game Runtime later. Battles: server-authoritative calculation; client animates approved events only. Subscription does not auto-win.

### How will microphone/audio work?
OS permission at point of use. Visible mic state. **No continuous listening / wake-word in V1.** Architecture may remain capable of later wake-word after separate approval. Never simulate listening when permission fails.

### How will push / secure storage / background / files / deep linking work?
Unchanged intent from Phase 0 proposal: FCM/APNs; Keychain / Keystore-backed secure store; OS-appropriate limited background work with server jobs for durable work; scoped file pickers + authenticated uploads; Universal Links + App Links.

### Android / iOS minimums (OWNER AMENDMENT)

| Item | Approved |
|------|----------|
| Android min | **Android 10 / API 29** (product floor; stricter than Expo SDK 57’s Android 7+ floor) |
| iOS min | **iOS 16.4** (aligned with Expo SDK 57 documented iOS minimum — not “iOS 16+”) |
| If SDK/store requires higher | Use higher; document reason |
| Launch-critical devices | Android phones, iPhones |
| Tablets | Supported + responsive/adaptive architecture from the start; **not** initial development blockers |

### App Store / Google Play subscriptions
**APPROVED architecture:**
- iOS → StoreKit / Apple IAP  
- Android → Google Play Billing  
- Voxora server → validates purchases and controls entitlements  

ZAR commercial intention (R15/R25/R99/R125) remains; **do not hard-code into access logic**. No prohibited web-payment bypass.

---

## 3. Alternatives considered

| Option | Verdict |
|--------|---------|
| Expo RN + Rive (primary characters) | **APPROVED WITH SAFEGUARDS** |
| Flutter | Not selected |
| Fully native dual | Rejected for greenfield default |
| .NET MAUI | Rejected (VS gitignore is not a reason) |
| WebView wrapper | **Forbidden** |

---

## 4. Native vs shared responsibility matrix

Unchanged in principle from Phase 0 proposal: shared UI/domain/API client; native for mic, push, secure storage, biometrics, IAP, deep links, camera/files. See prior table in git history if needed — Phase 1 implements wrappers/interfaces, not full pillar UIs.

---

## 5. WebView policy

Finished Voxora must not be “open website in WebView.” Limited WebView only for specific compliant flows (e.g. OAuth) as documented exceptions.

---

## 6. Performance profiles

HIGH / STANDARD / LOW / REDUCED_MOTION remain planned. Character identity must remain meaningful under reduced motion.

---

## 7. Permissions strategy

Just-in-time only. Never request every permission immediately after install.

---

## 8. Versioning strategy

Android `versionCode`/`versionName`, iOS marketing/build numbers, API `/v1`, server `minAppVersion`, feature flags vs entitlements — as previously planned.

---

## 9. Design system note

Brand: pink, purple, blue, premium dark interface. Feel: modern, sophisticated, alive, immersive, personal, friendly, futuristic, polished, premium, playful without childish. Design tokens before mass screens (Phase 1 foundation).

---

## 10. Phase 1 mobile scope (authorised after docs baseline)

Genuine Expo app foundation: Android+iOS, navigation, lifecycle, env config, secure storage wrapper, API client, auth state, theme/tokens, a11y baseline, loading/error boundary, connectivity awareness, deep-link architecture, notification architecture **interface**.

**Do not** build fake pet/battle/game/provider/Bondfire/Wellness production pages in Phase 1.
