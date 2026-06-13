# Security Policy

<!--
  MAINTAINER ACTION REQUIRED (Ben) before this file merges to `main`:

  Enable Private Vulnerability Reporting for this repository —
  GitHub → Settings → Security ("Code security and analysis") →
  "Private vulnerability reporting" → Enable.

  Until PVR is enabled, the "Report a vulnerability" button referenced
  below does not exist and reporters have no private channel. This file
  lands on the overhaul epic branch now; the enable-PVR step is carried
  by the release runbook so it happens before the merge to main.
-->

## Supported Versions

valet is pre-1.0. Security fixes are applied to the **latest published 0.x
minor** only. Older minors do not receive patches — upgrade to the newest
release to stay supported.

| Version                              | Supported          |
| ------------------------------------ | ------------------ |
| 0.34.x (latest published 0.x minor)  | :white_check_mark: |
| < 0.34                               | :x:                |

This table tracks the latest published minor; when a new 0.x minor ships,
support moves with it.

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues,
discussions, or pull requests.**

Use GitHub's Private Vulnerability Reporting instead:

1. Open the repository's **Security** tab:
   <https://github.com/off-court-creations/valet/security>
2. Click **Report a vulnerability** and fill in the draft advisory form
   (direct link:
   <https://github.com/off-court-creations/valet/security/advisories/new>).

Where possible, include the affected version(s), reproduction steps or a
proof of concept, and your assessment of the impact.

## What to Expect

- **Acknowledgement** of your report within **3 business days**.
- **Triage outcome** (accepted, declined, or more information needed) within
  **7 days** of acknowledgement.
- Status updates at least every **14 days** while a fix is in progress.
- Accepted fixes ship as a patch release of the supported minor, with a
  published advisory. We are happy to credit reporters unless you ask us
  not to.
- This is a small open-source project; the timelines above are best-effort
  commitments, not a contractual SLA.

## Scope

In scope:

- The published npm packages built from this repository:
  `@archway/valet`, `@archway/valet-mcp`, and `create-valet-app`.
- Untrusted-content rendering paths (for example `Markdown`, code
  highlighting, and `Icon` SVG handling).
- The docs site build and deploy pipeline in this repository.

Out of scope:

- **AI provider key handling (`aiKeyStore`, `LLMChat`, `KeyModal`) — the
  dev-tool posture.** valet's in-browser key store is a *development
  convenience*: keys are AES-GCM encrypted at rest in
  `localStorage`/`sessionStorage`, but any code running in the same origin
  can drive the store and use the key. Putting provider API keys in an
  end user's browser is outside valet's threat model — production apps
  should proxy AI calls through a server they control. Reports that reduce
  to "same-origin script can use the stored key" describe this documented
  posture, not a vulnerability; hardening ideas are still welcome as
  regular issues.
- Vulnerabilities in third-party dependencies with no valet-specific
  exploit path (please report those upstream — but do tell us privately if
  valet's usage makes one exploitable).
- Issues that require an already-compromised browser, a malicious browser
  extension, or an attacker-controlled developer machine.
