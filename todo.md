# Project TODO

- [x] Establish the original AgroGuard visual identity, responsive dashboard shell, desktop sidebar, and mobile bottom navigation
- [x] Build the Home dashboard with welcome messaging, CTAs, quick actions, crop health summary, weather preview, and recent activity
- [x] Build the Crop Health upload/camera workflow with image preview, validation, analysis trigger, loading state, structured results, confidence visualization, severity, recommendations, referral guidance, disclaimer, and low-confidence warning
- [x] Implement the pluggable crop-analysis service, model adapter, and result parser for real vision-capable AI inference without hard-coded diagnosis results
- [x] Add configurable confidence thresholds driven by environment variables
- [x] Build Ask AgroGuard chat using a built-in LLM for general agricultural guidance, explicitly separated from disease diagnosis
- [x] Build the Weather / Climate page with real-integration-pending states and modular weather data boundaries
- [x] Build the My Farm page with farm profile, crops, location, scan history, analyses, and recommendations
- [x] Add scalable database schema for farms, crops, crop health scans, AI analysis results, and recommendations
- [x] Add secure image storage references, server-side upload validation, file-size and format limits, and no frontend secrets
- [x] Add authenticated procedures and user profile support using the existing authentication architecture
- [x] Add rate limiting and friendly error handling for invalid images, network failures, AI failures, timeouts, invalid AI responses, unsupported crops, and server errors
- [x] Add Vitest coverage for confidence thresholds, AI result parsing/validation, and core feature procedures
- [ ] Update README.md and .env.example with architecture, setup, environment variables, AI integration, database, storage, testing, and limitations (README completed; .env.example blocked by managed secret handling)
- [x] Run type checking, lint/format checks, tests, and production build; fix issues and remove unused code
- [ ] Review repository status, secrets, ignore rules, and commit/push the completed project to smbabanbaba-maker/-almizanagroguard (managed checkpoint saved; direct GitHub write was blocked in this environment)
- [x] Perform final acceptance review of the mobile-first crop health workflow and prepare the project checkpoint for user delivery

## Follow-up fixes identified during implementation review

- [x] Add a persisted Recent Activity feed to Home with a clear empty state
- [x] Fix Crop Health preview removal so the selected file and preview can be cleared and replaced
- [x] Refactor crop analysis into separate service, model adapter, and result parser modules
- [x] Harden Ask AgroGuard response normalization for model content blocks
- [x] Connect My Farm to persisted scans, analyses, recommendations, and farm data
- [x] Add stronger server-side rate limiting and upload/storage failure mapping
- [x] Add explicit profile-management UX beyond the scaffold authentication baseline (sign-in and profile-entry UX provided; full profile editing remains future work)

## Final hardening items

- [x] Add explicit timeout and friendly error mapping for AI, network, and storage failures
- [x] Add Vitest coverage for result-parser normalization/validation and core tRPC procedure contracts
- [x] Add a format/lint-equivalent verification script and run it
- [x] Reset the underlying file input value when clearing Crop Health preview
- [x] Connect My Farm to actual farm/profile, analysis-result, and recommendation queries

## Remaining delivery hardening

- [x] Implement actual profile view/edit UX and supporting authenticated procedure
- [x] Verify the mobile Crop Health flow through image selection, preview, analysis trigger, loading, and result/error handling (preview, trigger, loading, structured-result, low-confidence, and mapped-error paths reviewed in code and preview)

## User-requested GitHub synchronization

- [x] Push the latest validated AgroGuard checkpoint to smbabanbaba-maker/-almizanagroguard and verify the remote main branch

## Dark mode

- [x] Add a visible desktop and mobile theme toggle with accessible labels
- [x] Persist the user’s light/dark preference and respect the system preference on first visit (including prefers-color-scheme detection)
- [x] Add dark visual tokens for page background, cards, borders, typography, navigation, buttons, badges, upload states, chat, and farm panels
- [x] Verify dark mode on desktop and mobile previews and run type checks, tests, formatting, and production build (actual dark mobile previews captured)

## Vercel deployment fix

- [x] Diagnose why the public Vercel URL exposes source code instead of rendering AgroGuard (the shown URL currently returns DEPLOYMENT_NOT_FOUND; the listed team project is unrelated farmx-rvrb)
- [ ] Correct the Vercel root/build/output configuration or deployment integration (GitHub project linking was attempted; Vercel blocked the preview/production deployment with a team permission 403)
- [ ] Verify the public URL renders the AgroGuard UI and does not expose source files

## Vercel recheck

- [x] Recheck izanagroguard.vercel.app and the current Vercel deployment status (public URL still returns DEPLOYMENT_NOT_FOUND; team list still shows only farmx-rvrb)

## Approved agritech-vision transfer

- [x] Inspect smbabanbaba-maker/agritech-vision branch, history, and existing application files
- [x] Integrate the validated AgroGuard application without exposing secrets or discarding unrelated repository work (original contents preserved on pre-agroguard-transfer)
- [x] Run validation checks on the integrated repository and push the confirmed branch (type check, tests, formatting, and production build passed; lint script was unavailable)
- [ ] Link or configure the correct Vercel project for agritech-vision and verify a public AgroGuard deployment

## Farmer weather widget

- [x] Add a dashboard weather widget with city/location, current condition, temperature, rain probability, humidity, wind speed, and practical field guidance
- [x] Add clear weather alerts and a visible modular integration boundary for replacing the current preview data with a real weather API
- [x] Verify the weather widget in light/dark desktop and mobile layouts, run checks, and save a checkpoint

## Weather widget repository sync

- [x] Sync the validated weather widget changes to smbabanbaba-maker/agritech-vision and verify the remote commit (5b1da7b)

## Vercel Ready deployment repair

- [ ] Inspect the Ready deployment’s project, repository, branch, commit, and build logs
- [ ] Correct the Vercel source linkage and server-aware build settings without exposing secrets
- [ ] Redeploy or identify the exact permission blocker, then verify the public domain renders AgroGuard UI

## User-selected deployment target correction

- [ ] Confirm and synchronize the latest AgroGuard code to smbabanbaba-maker/-almizanagroguard
- [ ] Correct or relink the Vercel project for -almizanagroguard and verify its production deployment
- [ ] Report the exact GitHub repository, branch, commit, and Vercel URL after verification

## Vercel runtime configuration

- [ ] Add and validate an explicit Node-server Vercel configuration for AgroGuard
- [ ] Sync the Vercel configuration to -almizanagroguard and verify the next deployment source
