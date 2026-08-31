# Android permissions — final set and rationale (CampusEduX)

`app.json` now declares an explicit `android.permissions` allow-list and an
`android.blockedPermissions` deny-list, and adds `expo-image-picker` as a
configured plugin with `cameraPermission: false` / `microphonePermission: false`.

Verify the final list against the generated `AndroidManifest.xml` on the next EAS
build (`eas build -p android --profile preview` then inspect, or
`npx expo prebuild -p android` locally and read `android/app/src/main/AndroidManifest.xml`).

## Permissions the app ships with

| Permission | Why | Triggered by | Optional? | If denied |
|---|---|---|---|---|
| `android.permission.INTERNET` | All network I/O — sign-in, content, payments, uploads | App start | No (normal permission, no prompt) | App cannot function offline; normal |
| `android.permission.POST_NOTIFICATIONS` | Show notifications (order/application/announcement updates). Delivered locally/in-app; **no remote push service or push token is used yet** | Android 13+ system prompt | **Yes** | User simply gets no system notifications; everything else works. Toggles in Settings → Notifications |
| `android.permission.READ_MEDIA_IMAGES` (Android 13+) / `android.permission.READ_EXTERNAL_STORAGE` (`maxSdkVersion="32"`) | Pick an existing image from the photo library | User taps "choose photo": Edit Profile avatar, Resume → Personal Details photo, Custom Project → Uploads image | **Yes** | User cannot attach an image; the rest of the app is unaffected |
| `android.permission.VIBRATE`, `android.permission.WAKE_LOCK`, `android.permission.RECEIVE_BOOT_COMPLETED` | Added automatically by `expo-notifications`; normal permissions, no prompt, no user-facing choice | — | n/a | n/a |

Document picking (`expo-document-picker`) uses the Storage Access Framework and
needs **no permission**.

## Permissions explicitly blocked (removed from the merged manifest)

| Blocked permission | Normally added by | Why we don't need it |
|---|---|---|
| `android.permission.CAMERA` | `expo-image-picker` default | The app never launches the camera — only `launchImageLibraryAsync` |
| `android.permission.RECORD_AUDIO` | `expo-image-picker` (video capture) | No audio or video capture anywhere |
| `android.permission.READ_MEDIA_VIDEO` | `expo-image-picker` | Only images are picked (`MediaTypeOptions.Images`) |
| `android.permission.READ_MEDIA_AUDIO` | media libs | No audio files are read |
| `android.permission.WRITE_EXTERNAL_STORAGE` | legacy media/file libs | Generated PDFs/shares go to app cache / SAF, never shared storage |
| `android.permission.SYSTEM_ALERT_WINDOW` | some libs | No overlay UI |

## Not present / not used

* `com.android.vending.BILLING` — payments are via **Razorpay**, not Google Play
  Billing. Mention this in the Play review notes so digital-goods purchases are
  not flagged as needing Play Billing (Razorpay is permitted for the goods/
  services CampusEduX sells; confirm against current Play Payments policy).
* No location, contacts, calendar, SMS, phone, biometric, Bluetooth, or
  background permissions.
