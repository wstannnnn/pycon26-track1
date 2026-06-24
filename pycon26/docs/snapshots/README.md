# UI Flow Snapshots

These screenshots capture the primary Job and Skills Track user flow.

## Journey Captured

The captured journey follows the UI/UX path discussed for the demo: landing page, login, authenticated dashboard, pathway exploration, and learner profile analysis. The final dashboard result is expected to show recommended roles, priority skills, suggested actions, and source-backed similarity evidence.

## Snapshot List

- `01-landing.png`: landing page.
- `02-login.png`: empty login form.
- `03-login-filled.png`: login form with demo user credentials.
- `04-dashboard-pathway-empty.png`: authenticated dashboard with the pathway explorer in its empty state.
- `05-pathway-result.png`: generated pathway result for `Customer Support Specialist` to `Data Analyst`.
- `06-profile-analysis-empty.png`: Analyze My Profile tab in its empty state.
- `07-profile-analysis-form.png`: profile analysis form filled with demo learner data.
- `08-profile-analysis-result.png`: learner analysis result with recommended roles, priority skills, actions, and similarity evidence.

The screenshots were captured at a `1440px` desktop viewport from the local app using:

```text
Frontend: http://localhost:3000
Backend: http://127.0.0.1:8000
```

To regenerate the screenshots, start the backend, frontend, ChromaDB-backed data, and local LLM, then run:

```sh
node pycon26/docs/snapshots/capture-flow.mjs
```

The script requires Playwright. If it is not already installed, run:

```sh
npm install playwright
```
