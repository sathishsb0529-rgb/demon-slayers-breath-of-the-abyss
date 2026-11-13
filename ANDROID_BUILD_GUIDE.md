# Android APK Build Guide — Demon Slayers: Breath of the Abyss

## Current Environment Status
This web/Android Capacitor workspace is **fully configured and synced** into the native Gradle project inside `./android/`, including:
- `capacitor.config.ts` (`appId: com.demonslayers.breathoftheabyss`, `webDir: dist`)
- Native Gradle wrapper & Capacitor Android project (`./android/`)
- Locked **sensorLandscape** orientation + hardware acceleration (`AndroidManifest.xml`)
- Immersive sticky fullscreen + screen wake lock (`MainActivity.java`)
- Hardware back-button handling in `src/App.tsx` + offline `localStorage` campaign/save persistence
- Fullscreen landscape PWA manifest & SVG icon (`public/manifest.json`, `public/icon.svg`)

> **Important Note on Binary `.apk` Compilation:**
> This cloud Linux container does **not** include Java JDK 17+, Android SDK (`sdkmanager` / `ANDROID_HOME`), or `gradle`/`adb` system binaries, so a signed `.apk` binary cannot be compiled directly inside this sandbox. You can build the `.apk` immediately on any machine with Android Studio / JDK 17 + Android SDK installed using the steps below.

---

## Option 1: Build Debug APK via Terminal (JDK 17 + Android SDK Required)

```bash
# 1. Build the latest Vite production web bundle & sync into ./android/
npm run android:sync

# 2. Compile the Debug APK via the bundled Gradle wrapper
cd android
./gradlew assembleDebug
```

Output APK location:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

Install directly onto a USB-connected Android phone:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Option 2: Open & Build in Android Studio

```bash
npm run android:sync
npm run android:open
```

1. Wait for Gradle Sync to finish in Android Studio.
2. Choose **Build → Build Bundle(s) / APK(s) → Build APK(s)** (for debug testing) or **Build → Generate Signed Bundle / APK** (for release Play Store / sideload APK).

---

## Option 3: Automated Cloud APK Build via GitHub Actions (No PC / Android Studio Needed)

This repository includes a ready-to-run GitHub Actions workflow at `.github/workflows/android-apk.yml` configured for this project's exact toolchain:
- **Node.js 22** (`npm ci` using `package-lock.json` + `.npmrc`)
- **Java 21** (required by Capacitor 8, AGP `8.13.0`, and Gradle `8.14.3`)
- **Android SDK API 36** (`platforms;android-36`, `build-tools;36.0.0`, `platform-tools` matching `android/variables.gradle`)

Steps from your Android phone:
1. Push this project to a GitHub repository (branch `main` or `master`, or trigger manually via **Actions → Build Android APK → Run workflow**).
2. Wait for the workflow run to finish with a green checkmark.
3. Scroll down to **Artifacts** and tap **demon-slayers-breath-of-the-abyss-debug-apk** to download the ZIP containing `app-debug.apk`.
4. Extract `app-debug.apk` on your Android phone and install it (enable *Install unknown apps* for your file manager/browser if prompted).
