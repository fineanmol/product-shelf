# External configuration checklist

Two findings from the security audit can't be fixed in code — they require changes in external dashboards (EmailJS, Firebase/Google Cloud Console). This is a manual checklist for whoever has access to those consoles.

## 1. Restrict the EmailJS public key to this domain

**Where:** EmailJS dashboard → Account → Security (or API Keys, depending on EmailJS's current UI) → the key currently hardcoded in `src/components/product/ProductInterestModal.jsx` (`hjrAAqHXUVuBPn-AD`) and now also referenced by a new feedback-notification integration.

**What to do:**
1. Log into the EmailJS dashboard for the account that owns service `service_kff4yqy`.
2. Find the public key's allowed-origins / domain-restriction setting.
3. Add `product-shelf-inventory.web.app` (and any custom domain / staging preview domains actually in use) as the only allowed origin(s).
4. Save, then reload the live site and submit a test "I'm interested" form to confirm it still works with the restriction in place.

**Why it matters:** the public key is visible in the client bundle to anyone. Without a domain restriction, someone can extract it and call the EmailJS API directly from outside the app, potentially exhausting the account's send quota or sending spam that appears to come from this service.

**If a new feedback-status-update EmailJS template was added** (check the `feedback-notify-submitter` fix for a placeholder template ID like `template_feedback_status_update`): also create that template in the EmailJS dashboard before that code path can succeed in production. See that commit's message for the exact field names the code sends.

## 2. Enable Firebase App Check

**Where:** Firebase Console → your `product-shelf-inventory` project → Build → App Check.

**What to do:**
1. Register the web app for App Check using reCAPTCHA v3 (simplest) or reCAPTCHA Enterprise.
2. Enforce App Check for Realtime Database and Storage (Firebase Console → App Check → APIs tab → toggle "Enforce" for both, once you've verified the app is sending valid attestations — Firebase lets you run in "monitor" mode first to check for false positives before enforcing).
3. Optionally also restrict the Firebase Web API key in Google Cloud Console (APIs & Services → Credentials) to the site's HTTP referrers, as defense-in-depth alongside App Check.

**Why it matters:** this repo's RTDB/Storage security rules govern who can read/write specific data, but nothing currently verifies that requests are coming from the real web app versus a scripted/automated client hitting the API directly. App Check adds that verification layer on top of the rules already fixed in this branch.

**Suggested order:** do this after the rules changes in this branch are deployed and confirmed stable — App Check enforcement can briefly break legitimate traffic if turned on before the app itself is sending valid attestation tokens, so monitor-mode first, enforce second.
