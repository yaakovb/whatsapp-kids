# Android app (v0 stub)

Kotlin + ViewBinding scaffold with **Kid** and **Parent** modes.

- Kid: stub login → send / list messages  
- Parent: stub login → review the same inbox  

Talks to `services/api`. Emulator default base URL: `http://10.0.2.2:8787`.

## Open in Android Studio

1. Start the API (`cd services/api && npm install && npm start`).
2. Open this folder (`apps/android`) in Android Studio.
3. Let Gradle sync (wrapper may need generating once: `gradle wrapper` if missing).
4. Run on an emulator or device with network to the API host.

This is a skeleton — not Play Store ready.
