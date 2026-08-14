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
