# White Wolf Moon Dash — Phase 2.5 Early Game Vertical Slice

**Document status:** APPROVED PHASE 2.5 VERTICAL SLICE  
**Product owner:** Maryke Farrell  
**Scope boundary:** This does **not** authorise the full Voxora Games Platform. Full Games remains Phase 13.

---

## 1. Purpose

White Wolf Moon Dash is an approved early end-to-end gameplay proof inside Voxora:

mobile gameplay -> API -> server-owned attempt reservation -> result submission -> persistence -> leaderboard position -> manual promotional prize handling.

No additional games, game store, multiplayer platform, pet games, or full Games Platform work is authorised by this slice.

---

## 2. Authoritative rules

- Game name: **White Wolf Moon Dash**
- Runs inside Voxora.
- Maximum **10 tries per user per UTC day**.
- Server owns daily attempt count and UTC reset boundary.
- Server reserves an attempt before gameplay begins.
- Reserved attempts count once reserved; abandoned/lost/disconnected/forfeited runs are not silently refunded.
- Completed or forfeited runs submit an outcome.
- High score and leaderboard position are server-side.
- Tie rule: highest verified score ranks first; if tied, the earliest authoritative server completion timestamp ranks higher.
- First and Second leaderboard positions may qualify for prize recognition.
- Leaderboard position is not the same as verified winner status.
- Legendary Avatar redeem codes are never generated or granted by the mobile app.
- Legendary Avatar redeem codes are manually issued by the Voxora team after Owner review.
- Maryke Farrell is currently the sole privileged Owner and only authorised human prize administrator unless explicitly changed later.

The mobile device is never authoritative for attempt count, leaderboard position, winner verification, prize issuance, or avatar ownership.

---

## 3. Run security model

Every score-eligible run uses a server-created attempt record. The record supports:

- server-generated run ID;
- user ID;
- reservation timestamp;
- UTC attempt date;
- attempt number;
- start state;
- completion/forfeit/expiry state;
- submitted score;
- submission timestamp;
- validation status;
- created/updated timestamps.

Run IDs are user-bound and single-use for score submission. Duplicate or foreign-user submissions are rejected.

Attempt reservation uses server-side transaction protection with a conditional daily counter increment. Two simultaneous start requests must not reserve more than the 10 permitted daily attempts.

---

## 4. Validation posture

The server validates:

- run exists;
- run belongs to authenticated user;
- run was reserved by the server;
- run is not already finalized;
- run has not expired;
- score is numeric, integer, non-negative, and within the approved maximum accepted score;
- winning outcomes meet the target score;
- duration is plausible when submitted;
- replay/duplicate submission is rejected.

**Current limitation:** the Phase 2.5 implementation does not yet perform complete deterministic server replay of every client move. Client score remains a claim bounded by current validation rules, not cheat-proof truth.

Full move-log replay, signed telemetry, competition rules, and exceptional technical-failure refund policy remain Owner/product decisions before public promotional launch.

---

## 5. Prize lifecycle

Moon Dash prize type: **LEGENDARY AVATAR REDEEM CODE**.

Approved conceptual flow:

Leaderboard result -> provisional status -> Owner verification -> prize approved -> redeem code/reference issued -> valid redemption -> authoritative avatar ownership grant.

Phase 3 must route any future Legendary Avatar prize redemption through the same Avatar Catalogue / Avatar Ownership system as all other legitimate Voxora avatars. Do not create a separate MoonDashAvatarSystem or hard-code a special avatar directly into a user profile.

Promotional competition terms are not invented in Phase 2.5.

**PROMOTIONAL COMPETITION TERMS — OWNER / LEGAL REVIEW REQUIRED BEFORE PUBLIC LAUNCH**
