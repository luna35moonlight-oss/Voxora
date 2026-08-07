# Voxora Mobile Strategy — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Primary platforms:** Android phones/tablets (supported), iPhone/iPad (supported)  
**Constraint:** Independent installed app — not a WebView wrapper product.

---

## 1. Decision summary (proposed)

| Topic | Proposal |
|-------|----------|
| Shared codebase | **Yes** — one TypeScript Expo React Native app targeting Android + iOS |
| Native quality bar | Expo Dev Client / prebuild (not Expo Go-only); custom native modules when required |
| Avatar/pet rendering | **Rive** state machines + layered artboards for clothing/equipment |
| Games / battles presentation | Rive/Skia presentation layer driven by **server-authoritative** battle/game results |
| Backend coupling | Versioned HTTPS API + WebSocket; secure token storage on device |

Alternatives considered: Flutter; fully native Kotlin+Swift; .NET MAUI. See §3.

---

## 2. Answers to Phase 0 mobile questions (§100)

### Which architecture should Android use?
Expo React Native with Android Gradle project generated via prebuild. Delivery as a Play Store installable app with native permissions, FCM push, biometric/secure storage, background constraints respected.

### Which architecture should iOS use?
Same Expo React Native codebase with iOS project via prebuild. Delivery as App Store installable app with APNs, Keychain, ATT/privacy manifests as required, background modes only where justified.

### Can they share a codebase?
**Yes.** Shared UI, domain stores, Scene Engine bindings, Interaction Runtime, and API clients. Platform-specific modules only for gaps (billing nuances, some background limits, permission UX copy).

### Why is this suitable for Voxora?
- One team can ship Android + iOS together (critical for greenfield).
- Strong ecosystem for mic/camera/files/push/secure storage via Expo modules.
- Rive provides performant, designer-friendly living characters with states (Idle/Listen/Talk) and layered cosmetics.
- TypeScript contracts can be shared with the API.
- Avoids “build website then wrap WebView” anti-pattern while still allowing shared logic.

**Not chosen solely because Node exists in the agent environment.** Chosen for cross-platform product fit.

### How will avatars render?
Rive runtime in React Native. Base avatar artboard + clothing/accessory layers bound to equipped item IDs from server inventory. Animation state machine driven by Interaction Runtime.

### How will pets render?
Same Scene Engine path as avatars, but species-specific Rive files/rigs. Species definition selects compatible rig, animation set, and slots. No generic “swap PNG” pet model.

### How will clothing layers render?
Logical slots (hair, top, bottom, etc. / pet head, body, battle slots) map to Rive nested artboards or swap inputs. Equipped set is data; renderer applies layers. Combinations are **not** stored as flattened images.

### How will animations work?
Named animation clips with metadata: id, rig compatibility, duration, loop, priority, interruptibility, cooldown, transition, fallback, performance tier. Interaction Runtime selects; Scene Engine plays; incompatible simultaneous animations blocked.

### How will lip sync work?
Preferred: viseme/timing from TTS provider when available. Fallback: audio-amplitude mouth openness. Never purely random mouth when timing exists. Speaking state also drives blink/head subtle motion.

### How will games work?
Game Module contract loads game packages inside Voxora. Client collects input and displays; server validates scores/rewards. Not hard-coded into Home.

### How will pet battles work?
Server authoritative simulation (seed, actions, damage). Client animates approved events only. Subscription tier does not auto-win.

### How will microphone/audio work?
OS permission requested at point of use. Visible mic state. Expo AV / speech recognition pipeline → transcript → Alpha. TTS for spoken Alpha/read-aloud. Continuous listening only if explicit setting later approved.

### How will push notifications work?
- iOS: APNs via Expo Notifications / FCM-compatible relay
- Android: FCM
- Server Notification Service fans out; respects user prefs, mute, dedupe keys
- Local notifications for exact-time reminders where OS allows

### How will secure storage work?
- iOS: Keychain via `expo-secure-store` (or equivalent)
- Android: EncryptedSharedPreferences / Keystore-backed secure store
- Forbidden: plain files, ordinary prefs, insecure JS storage, logs for refresh tokens

### How will background tasks work?
Use OS-appropriate background modes sparingly: notification receipt, limited background fetch/sync where permitted, not unbounded daemons. Long work runs on server jobs; device wakes via push where needed.

### How will files work?
Scoped storage / Photos picker / document picker APIs. Uploads to Voxora object storage with server authz. Offline drafts marked Pending.

### How will deep linking work?
Universal Links (iOS) + App Links (Android) for `voxora.co.za` paths and custom scheme fallback. Reminder/meeting notifications deep-link into the relevant surface.

### Android minimum requirements (proposed)
| Item | Proposal | Review |
|------|----------|--------|
| Min OS | Android 8.0 (API 26) or Android 10 (API 29) if security posture prefers newer | OWNER REVIEW |
| Arch | arm64-v8a primary; 32-bit only if store metrics require | OWNER REVIEW |
| Performance tiers | HIGH / STANDARD / LOW / REDUCED_MOTION | |

### iOS minimum requirements (proposed)
| Item | Proposal | Review |
|------|----------|--------|
| Min OS | iOS 16+ (balance of adoption vs modern APIs) | OWNER REVIEW |
| Devices | iPhone required; iPad supported where layouts adapt | |

### How will App Store and Google Play subscription/payment requirements affect Voxora?
**Critical commercial/legal constraint — OWNER REVIEW REQUIRED.**

Likely impacts:
- Digital subscriptions unlocking in-app features (Bondfire quotas, avatar/pet catalogue, Wellness, games) typically must use **Apple In-App Purchase** and **Google Play Billing**.
- External web payment for the same digital entitlements may violate store rules unless using allowed external-link programs (region/program dependent).
- Server remains entitlement authority, but purchase receipts must be validated with Apple/Google.
- Pricing display, trials, grace periods, and cancellation UX must align with store policies **and** owner commercial rules.
- South African Rand (R15/R25/R99/R125) must be mapped to store product IDs and available storefront currencies.

Phase 0 does **not** invent a bypass. Recorded in `open-questions.md`.

---

## 3. Alternatives considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Expo React Native + Rive | Shared code, strong device APIs, Rive living characters | Game/battle performance needs care; native escape hatches sometimes required | **Recommended** |
| Flutter + Rive/Flame | Excellent UI performance, good animation | Separate language from TS API contracts; hiring/skills split | Viable alternative |
| Kotlin + Swift fully native | Max platform fidelity | Dual implementation cost for every pillar | Reject for greenfield unless owner mandates |
| .NET MAUI | Aligns with VS gitignore history | Weaker fit for living character + game tooling ecosystem for this product shape | Not recommended as default |
| WebView wrapper around site | Fast fake “app” | **Forbidden by spec** as finished product | Reject |

---

## 4. Native vs shared responsibility matrix

| Capability | Shared JS/TS | Native module / OS |
|------------|--------------|--------------------|
| UI screens, navigation | Yes | |
| Entitlement-aware UI gating | Yes (server truth) | |
| Scene/Interaction orchestration | Yes | Rive native runtime |
| Mic / recording | Bridge | OS permission + audio session |
| STT / TTS | Bridge + provider SDK/API | OS speech APIs where used |
| Push | Token registration shared | FCM/APNs |
| Secure tokens | API via secure store wrapper | Keychain / Keystore |
| Biometrics | Wrapper | LocalAuthentication / BiometricPrompt |
| Background sync | Trigger handlers | OS background limits |
| IAP | Purchase flow wrapper | StoreKit / Play Billing |
| Deep links | Router | Universal/App Links |
| Camera/photos/files | Expo pickers | OS privacy prompts |

---

## 5. WebView policy

A finished Voxora mobile app **must not** be “open website in WebView.”

If a limited WebView is later used for a specific compliant flow (e.g. OAuth, help article), it must be documented as an exception, not the application architecture.

---

## 6. Performance profiles

| Profile | Behaviour |
|---------|-----------|
| HIGH | Full layers, effects, lip sync fidelity |
| STANDARD | Production default |
| LOW | Fewer particles/effects; shorter transitions; functionality preserved |
| REDUCED_MOTION | Accessibility; pets/avatars remain meaningful via static poses + soft fades |

---

## 7. Permissions strategy

Request **just-in-time**, never all-at-install:

- Mic → when user starts voice
- Notifications → when enabling reminders/push value
- Calendar/Contacts → when connecting those features
- Camera/Photos → when capture/upload used
- Exact alarm / battery exemptions → only if product-critical and justified

---

## 8. Versioning strategy (Phase 0 plan)

| Concern | Plan |
|---------|------|
| Android `versionCode` / `versionName` | Monotonic; store-required |
| iOS `CFBundleShortVersionString` / `CFBundleVersion` | Semver display + build number |
| API compatibility | URL versioning `/v1`; additive changes preferred |
| Min supported app version | Server can return `minAppVersion` and force upgrade for breaking security changes |
| Feature flags | Server flags gate offering; entitlements gate user access |
| Backwards compatibility | Old clients degrade gracefully; do not assume instant updates |

---

## 9. Design system note for mobile

Brand colours: pink, purple, blue, premium dark interface.  
Feel: modern, sophisticated, alive, immersive, personal, friendly, futuristic, polished, premium, playful without childish.

Design tokens and components must be established before mass screen production (`roadmap` Phase 1). Home must feel like a digital home, not a business dashboard.

---

## 10. Mobile risks requiring owner review

1. Final min Android/iOS versions  
2. Store billing vs web billing for ZAR subscriptions  
3. Art direction + Rive pipeline ownership  
4. Whether iPad/Android tablet are launch-blocking or best-effort  
5. Continuous listening / wake-word (default: off / not in initial launch)
