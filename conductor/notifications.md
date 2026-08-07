# Voxora Notifications & Reminders — Phase 0

**Document status:** OWNER REVIEW REQUIRED  
**Rule:** One central Notification Service. Reminders are real schedules, not decorative cards.

---

## 1. Notification request fields

- recipient  
- type  
- source  
- priority  
- content  
- channel  
- schedule  
- expiry  
- deep link  
- deduplication key  
- user preference respect  

### Channels (potential)

in-app, push, local, email, Alpha, avatar, pet

---

## 2. Reminder entity

- reminder ID, owner, content  
- trigger time, time zone, recurrence  
- notification channels, source, status, expiry  
- deep link, completion/dismissal  

Reminders are separate from calendar events (though calendar may create related reminders).

---

## 3. Example: meeting in 15 minutes

1. Reminder engine triggers  
2. Push/local notification where allowed  
3. Home surfaces the meeting  
4. Alpha may remind  
5. Avatar Attention animation  
6. Pet species-compatible attention behaviour  
7. User sees open/join action where available  

Respect mute, notification settings, reduced motion, privacy, platform capability.

---

## 4. Platform delivery

| Platform | Mechanism |
|----------|-----------|
| Android | FCM push; local notifications via OS APIs |
| iOS | APNs; local notifications |
| Server | Schedulers + jobs; webhook-driven provider events |

Permission requested when the user enables valuable notification features — not immediately after install.

---

## 5. Deduplication & reliability

- dedupe keys prevent double fire  
- jobs retry with backoff  
- failed deliveries monitored  
- do not log sensitive reminder bodies in clear operational logs unnecessarily  

---

## 6. Interaction Runtime link

Notification/reminder events (`REMINDER_TRIGGERED`, `MEETING_STARTING_SOON`, `NEW_EMAIL`) enter the event catalogue and may drive avatar/pet attention — subject to priority arbitration.
