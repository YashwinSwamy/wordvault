# Word Vault — Mobile App Development

> Living document. Update as features are built, decisions are made, or scope changes.

---

## Goal

Build a React Native mobile app (Expo) for Word Vault that reuses the existing Flask backend. Target: vocabulary learning, collaboration, and on-the-go use — all from a phone.

**Principles:**

- Code should be as simple as possible — one component per screen, hooks + context (no Redux), no premature abstractions
- Feature parity with the web app
- Single codebase for both iOS and Android

**Platform targets:** iOS + Android via Expo (one codebase). Expo Go for development; App Store / Play Store for distribution.

**Widgets:** Not in scope for v1. Requires ejecting from Expo managed workflow and writing native Swift/Kotlin. Revisit after core app ships.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK (managed workflow) |
| Navigation | Expo Router (file-based) |
| API | axios — same base URL as web (`https://api.wordvault.in/api`) |
| Auth token storage | `expo-secure-store` (replaces localStorage) |
| Google OAuth | `expo-auth-session` |
| Offline cache | `@react-native-async-storage/async-storage` |
| Push notifications | `expo-notifications` |
| Animations | `react-native-reanimated` (built into Expo) |
| Haptics | `expo-haptics` |

---

## Project Layout

```
wordvault/
├── backend/        ← Flask API (unchanged)
├── frontend/       ← React web app (unchanged)
├── APP_DEV.md      ← this file
└── mobile/         ← Expo app (Expo SDK 54, tabs template)
    ├── app.json
    ├── src/
    │   ├── api.ts          ← ported from frontend/src/api.js
    │   ├── auth.ts         ← SecureStore token helpers
    │   ├── AuthContext.tsx ← auth state + signIn/signOut
    │   ├── colors.ts       ← shared color palette
    │   └── types.ts        ← Word, Collection, User types
    └── app/
        ├── _layout.tsx
        ├── (auth)/
        │   ├── _layout.tsx
        │   ├── login.tsx
        │   ├── register.tsx
        │   └── forgot-password.tsx
        ├── (tabs)/
        │   ├── _layout.tsx
        │   ├── index.tsx       ← Collections home
        │   └── settings.tsx
        └── collection/
            ├── [id].tsx        ← Word list + add/delete
            └── [id]/
                └── flashcards.tsx  ← Phase 3
```

---

## Screens

### Auth

- [x] Login (email/password)
- [x] Register
- [x] Forgot password
- [ ] Google OAuth (needs backend redirect URI for mobile)

### Main (tab bar)
- [x] Home — list all collections (owned + shared)
- [x] Settings — username display + sign out
- [ ] Settings — change username, change password, delete account

### Collection (stack)

- [x] Word list — add, delete
- [ ] Word list — search, swipe-to-delete
- [ ] Add word — live dictionary lookup as you type
- [ ] Flashcard mode — 3D flip, haptics, progress counter
- [ ] Members — invite by email, remove member

---

## Phases

| Phase | Scope | Status |
|---|---|---|
| 1 | Bootstrap Expo + Auth screens + Collections list | Done |
| 2 | Word list + Add word + Dictionary lookup | Not started |
| 3 | Flashcard mode with animations + haptics | Not started |
| 4 | Offline cache + Settings screen | Not started |
| 5 | Push notifications (daily reminders) | Not started |

---

## API Endpoints Used

All from existing backend — no backend changes needed for Phase 1–3.

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
GET    /api/auth/google           ← OAuth start
GET    /api/collections/
POST   /api/collections/
GET    /api/words/?collection_id=
POST   /api/words/
DELETE /api/words/<id>
PATCH  /api/words/<id>
POST   /api/collections/<id>/invite
GET    /api/collections/<id>/members
PATCH  /api/settings/username
PATCH  /api/settings/password
DELETE /api/settings/account
```

---

## Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-16 | Use Expo managed workflow | Expo Go lets us test on real device instantly without Xcode/Android Studio |
| 2026-05-16 | Reuse existing Flask backend as-is | No API changes needed for core features; avoids scope creep |
| 2026-05-16 | Expo Router over React Navigation | File-based routing matches mental model from web; simpler deep linking |

---

## Notes & Open Questions

- Google OAuth on mobile requires a custom URI scheme — needs testing with `expo-auth-session` and the existing backend callback URL
- Consider whether to release on App Store / Play Store or keep as Expo Go only for now
