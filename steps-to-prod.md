# Steps to Production: Google Play Store

Bringing the **Make Use** Flutter app (`apps/mobile`) from development to a production release on the Google Play Store involves securing the app, configuring build settings, and setting up the Play Store listing.

## 1. Developer Account & Basics
* **Google Play Console Setup:** Create a [Google Play Developer account](https://play.google.com/console/about/). It requires a one-time registration fee of $25.
* **App Identifier:** Ensure the app has a unique Android Package Name (e.g., `com.makeuse.marketplace`). This is set in the `android/app/build.gradle` file under `applicationId`.

## 2. Branding (Icons and Assets)
Before publishing, the default Flutter icons need to be replaced with the custom **Make Use** branding.
* The easiest way is to use the `flutter_launcher_icons` package. Supply your high-res logo, and it automatically generates all the required icon sizes for Android screens.

## 3. Securing the Application (Keystore)
Google requires all Android apps to be digitally signed before they are uploaded.
* **Generate an Upload Key:** Use Java's `keytool` via the terminal to generate a `.jks` or `.keystore` file. This is your digital signature for the app.
* **Keep it Safe:** This file and its passwords **must never be lost or committed to a public GitHub repository**. If you lose the key, you cannot update the app later!
* **Configure Gradle:** Create a `key.properties` file locally and configure the `android/app/build.gradle` file to automatically use this keystore when building the production release.

## 4. Versioning and Permissions
* **Version Control:** Every time you upload an update to the Play Store, the `versionCode` (an integer like `1`, `2`, `3`) in your `pubspec.yaml` must be incremented.
* **Permissions:** For the Make Use app, we use the device camera for the *Visual Diagnostics*. We need to review the `AndroidManifest.xml` to explicitly declare `<uses-permission android:name="android.permission.CAMERA" />` and provide explanations for why we need it to satisfy Google's privacy reviews.

## 5. Building the App Bundle
Once everything is configured, instead of generating a standard `.apk`, generate an **Android App Bundle (.aab)**. App Bundles allow Google Play to generate optimized APKs specific to each user's device configuration, keeping the download size small.
* **The Command:** In the `apps/mobile` directory, run:
  ```bash
  flutter build appbundle
  ```

## 6. The Play Console Listing
Inside the Google Play Console, create a new App and fill out the store presence:
* **Metadata:** Title, Short Description, and Full Description (highlighting the AI device assessment and 24-hour payouts).
* **Graphics:** Upload the App Icon, a Feature Graphic (1024x500 banner), and at least 2-3 screenshots of the Make Use Wizard flow on a phone frame.
* **Privacy Policy:** You **must** host a Privacy Policy on a website (like on the Next.js landing page) and link to it in the console, especially because you are uploading user-generated photos and handling payments.

## 7. Release Tracks
* **Testing:** To start, upload the `.aab` file to the **Internal Testing** or **Closed Testing** track. This allows you to install the production build on your phone to test it.
* **Production:** Once verified, promote that release to the **Production** track!
