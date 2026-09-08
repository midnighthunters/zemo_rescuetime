# Manual actions

## Apple HealthKit signing

The app code, HealthKit entitlement, privacy descriptions, and Swift bridge are
configured in source control. Apple still requires the App ID and provisioning
profile to be updated in the Apple Developer account:

1. Open **Certificates, Identifiers & Profiles** in Apple Developer.
2. Select the App ID `com.zemolabs.rescuetime`.
3. Enable the **HealthKit** capability and save the App ID.
4. Regenerate the provisioning profile used by the iOS build.
5. Replace the `IOS_PROVISIONING_PROFILE_BASE64` CI secret and confirm
   `IOS_PROVISIONING_PROFILE_NAME` matches the regenerated profile.
6. Run the iOS build workflow and install the newly generated IPA. An existing
   app or Expo Go session cannot gain a native module through a JavaScript
   update.

Both iOS CI workflows verify the profile and archived application entitlement,
so a stale profile now fails with a specific HealthKit error before delivery.

## TestFlight Post-Upload Steps

After GitHub Actions finishes the `Upload production build to TestFlight` step:

### 1. Apple Processing Window
- Apple automatically processes the uploaded `.ipa`. This typically takes 5–15 minutes.
- You can track this under **App Store Connect** → **Apps** → **Rescue Animals Steps** → **TestFlight**.

### 2. Export Compliance (Missing Compliance)
- If a build appears with a yellow warning icon stating **Missing Compliance**:
  1. Click **Manage** (or click the build number).
  2. When asked *"Does your app use encryption?"*, select **Yes** (or **No** if standard HTTPS only).
  3. When asked *"Does your app qualify for exemptions?"*, select **Yes** (exempt under standard encryption / HTTPS).
  4. Click **Start Internal Testing**.
- *Note: `ITSAppUsesNonExemptEncryption` is set to `false` in `Info.plist` and `app.config.ts`, which automatically clears this requirement for subsequent builds.*

### 3. Internal Testing (Immediate Access)
- Internal testing does **not** require Apple review.
- In the **TestFlight** tab:
  1. Under **Internal Groups** (e.g. *App Store Connect Users*), click **+** to add testers.
  2. Ensure the newly processed build is selected.
  3. Testers will receive an invite email and can install the app immediately via the iOS TestFlight app.

### 4. External Testing (Beta App Review)
- To distribute to outside testers or via a public link:
  1. Under **External Groups**, click **+ Add Group** (e.g. "Public Beta").
  2. Add testers or enable the **Public Link**.
  3. In **Builds**, add the processed build.
  4. Provide **What to Test** notes (e.g. "HealthKit step counter verification, animal care unlock").
  5. Submit for **Beta App Review**. Apple approval typically takes 24–48 hours.

### 5. On-Device Verification of HealthKit
- Install the build on a physical iPhone (HealthKit step counting is not supported on iPad or simulators).
- Launch the app and confirm the Apple Health prompt displays:
  *"Rescue Animals Steps reads your step count so your walks can unlock animal care and rescue progress."*
- Open Apple **Health** → **Sharing** → **Apps** → **Rescue Animals Steps** to verify step read permissions are enabled.

