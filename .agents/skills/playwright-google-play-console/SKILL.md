---
name: playwright-google-play-console
description: >-
  Playwright automation workflows for Google Play Console release management,
  AAB bundle uploading, version validation, and track rollouts.
---

# Playwright Google Play Console Automation Skill Guide

## 1. Environment & App Credentials
- **Console URL**: `https://play.google.com/console`
- **Developer Account ID**: `6520683278796888668` (Google Account: `nikhilgoyal7503@gmail.com`)
- **App ID**: `4972113770213821021` (`Animal Rescue Step Counter` / `com.zemolabs.rescuetime`)
- **Internal Testing URL**:
  `https://play.google.com/console/u/0/developers/6520683278796888668/app/4972113770213821021/tracks/internal-testing`

---

## 2. Best Tooling Practice: `browser_run_code_unsafe`
Because Google Play Console is an Angular/Material Web Component Single Page Application (using custom prefixes like `_ngcontent-*`, `simple-html`, and shadow roots), declarative clicking can occasionally miss dynamically rendered elements. 

Always prefer executing targeted Playwright async functions using `browser_run_code_unsafe`:
```javascript
async (page) => {
  // Direct interaction with Playwright Page API
}
```

---

## 3. End-to-End Release Automation Procedure

### Step 1: Navigate to Internal Testing
```javascript
await page.goto('https://play.google.com/console/u/0/developers/6520683278796888668/app/4972113770213821021/tracks/internal-testing');
await page.waitForLoadState('networkidle');
```

### Step 2: Create New Release
Locate and click the "Create new release" button:
```javascript
await page.getByRole('button', { name: 'Create new release' }).click();
await page.waitForURL(/.*\/releases\/.*\/prepare/);
```

### Step 3: Upload the App Bundle (`.aab`)
> [!IMPORTANT]
> Google Play Console **rejects `.apk` files** for new releases. You **must** upload the compiled `.aab` file (e.g., `android/app/build/outputs/bundle/release/app-release.aab`).

Target the hidden file input with `accept=".aab"`:
```javascript
const aabPath = 'C:\\AnnusMirabilis\\ZEMOLABS\\AURORA\\E2_RescueTime\\android\\app\\build\\outputs\\bundle\\release\\app-release.aab';
const fileInput = await page.$('input[type="file"][accept*=".aab"]');
await fileInput.setInputFiles(aabPath);
```

### Step 4: Monitor Upload & Distribution Optimization
Wait through both phases:
1. **Network Upload**: Progress bar shows transfer (`bytes-transfer-text`, e.g. `48.2 MB`).
2. **Play Console Processing**: Alert displays: `"You can leave this page while your ... upload is optimised for distribution."`

Poll until the release artifact appears in the table:
```javascript
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(3000);
  const tables = await page.$$eval('[role="grid"]', els => els.map(e => e.innerText));
  if (tables.some(t => t.includes('1.0.6') || t.includes('Enhanced'))) {
    break;
  }
}
```

### Step 5: Fill Release Details & Release Notes
1. **Release Name**: Google Play Console auto-populates this (e.g. `8 (1.0.6)`).
2. **Release Notes**:
   - To avoid malformed XML tags (`Line 1: tag not closed for en-GB>...`), click the `"Copy from a previous release"` button:
     ```javascript
     const copyBtn = await page.$('button:has-text("Copy from a previous release")');
     if (copyBtn) await copyBtn.click();
     ```
   - Alternatively, inject cleanly formatted language tags:
     ```javascript
     const notes = '<en-GB>Performance optimizations and updated 500x500 assets.</en-GB>';
     await page.fill('textarea[aria-label="Release notes"]', notes);
     ```

### Step 6: Advance to Review (Step 2)
Click the "Next" button in the bottom right corner:
```javascript
await page.getByRole('button', { name: 'Next' }).click();
await page.waitForURL(/.*\/releases\/.*\/review/);
```

### Step 7: Review Validation & Publish
1. **Warnings Check**: Warnings (e.g., small unsupported device deltas due to ABI restriction) are expected and non-blocking. Ensure there are 0 blocking Errors (red).
2. **Publish**: Click `"Save and publish"` (or `"Start rollout to Internal testing"`):
   ```javascript
   const publishBtn = await page.$('button:has-text("Save and publish")') || 
                      await page.$('button:has-text("Start rollout to Internal testing")');
   await publishBtn.click();
   ```

### Step 8: Confirm Active Status
Verify on the Releases tab:
- Status shows: `Available to internal testers`.
- Release version matches the latest `versionCode` (e.g., `8 (1.0.6)`).
