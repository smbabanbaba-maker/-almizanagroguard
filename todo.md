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
- [x] Update README.md and document environment handling with architecture, setup, AI integration, database, storage, testing, and limitations (README lines 1-63 verified; managed platform secrets are intentionally not committed as .env.example values)
- [x] Run type checking, lint/format checks, tests, and production build; fix issues and remove unused code
- [x] Review repository status, secret-handling rules, ignore rules, and synchronize the completed project to smbabanbaba-maker/-almizanagroguard (clean status; .gitignore excludes .env files and build artifacts; remote main synchronized)
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
- [x] Correct the Vercel output configuration (static frontend output from dist/public with SPA rewrites; server-aware API deployment remains a separate concern)
- [x] Verify the public Vercel URL renders the AgroGuard UI and does not expose source files

## Vercel recheck

- [x] Recheck almizanagroguard.vercel.app and the current Vercel deployment status (custom domain now renders AgroGuard)

## Approved agritech-vision transfer

- [x] Inspect smbabanbaba-maker/agritech-vision branch, history, and existing application files
- [x] Integrate the validated AgroGuard application without exposing secrets or discarding unrelated repository work (original contents preserved on pre-agroguard-transfer)
- [x] Run validation checks on the integrated repository and push the confirmed branch (type check, tests, formatting, and production build passed; lint script was unavailable)
- [x] Decide the active deployment target: agritech-vision is not the selected public target; -almizanagroguard is the synchronized deployment repository

## Farmer weather widget

- [x] Add a dashboard weather widget with city/location, current condition, temperature, rain probability, humidity, wind speed, and practical field guidance
- [x] Add clear weather alerts and a visible modular integration boundary for replacing the current preview data with a real weather API
- [x] Verify the weather widget in light/dark desktop and mobile layouts, run checks, and save a checkpoint

## Weather widget repository sync

- [x] Sync the validated weather widget changes to smbabanbaba-maker/agritech-vision and verify the remote commit (5b1da7b)

## Vercel Ready deployment repair

- [x] Inspect the Ready deployment’s project, repository, branch, and status (47cec31 from -almizanagroguard main is Ready; Vercel build-log API access was unavailable)
- [x] Validate the Vercel source association shown in the dashboard and frontend build settings without exposing secrets (static frontend boundary documented; no separate relink action claimed)
- [x] Verify the resulting Ready deployment and public domain render AgroGuard UI (47cec31 Ready; public domain verified; deployment was created by the connected GitHub build)

## User-selected deployment target correction

- [x] Confirm and synchronize the latest AgroGuard code to smbabanbaba-maker/-almizanagroguard (main at 9d3c382)
- [x] Apply the Vercel configuration correction for -almizanagroguard and verify its production deployment (vercel.json correction is active in 47cec31; public URL verified; no separate relink action claimed)
- [x] Report the exact GitHub repository, branch, commit, and Vercel URL after verification (smbabanbaba-maker/-almizanagroguard, main, 47cec31, and almizanagroguard.vercel.app verified)

## Vercel runtime configuration

- [x] Add and validate explicit Vercel static-frontend configuration for AgroGuard (dist/public and SPA rewrites)
- [x] Sync the Vercel configuration to -almizanagroguard and verify the resulting deployment source (config is active on main; 47cec31 is Ready)

## GitHub Pages 404 fix

- [x] Inspect GitHub Pages source branch, workflow configuration, and repository output for -almizanagroguard
- [x] Add a GitHub Pages-compatible static build path or document the required server hosting target
- [x] Push the GitHub Pages fix and verify https://smbabanbaba-maker.github.io/-almizanagroguard/ no longer returns 404 (plain URL now renders AgroGuard)

## Latest GitHub Pages workflow recheck

- [x] Verify the workflow for latest commit 14e1d80 rather than the older failed 958589f run
- [x] Confirm the public Pages URL renders AgroGuard after the latest successful deployment (plain URL verified in a fresh browser check)

## GitHub Pages cache verification

- [x] Verify the non-cache-busted GitHub Pages URL in a fresh browser session (fresh session renders AgroGuard)
- [x] If stale content remains, document cache propagation and recheck after deployment completion (GitHub Pages returned cache-control max-age=600; latest query-busted artifact renders correctly)

## Vercel 404 investigation

- [x] Inspect izanagroguard.vercel.app domain mapping and the linked Vercel project/deployment (public URL returns Vercel 404; sayyeed project list contains only farmx-rvrb)
- [x] Confirm the selected GitHub repository, branch, deployment, and build configuration (GitHub source is smbabanbaba-maker/-almizanagroguard main; Vercel project is not accessible in the listed scope)
- [x] Recheck the public Vercel URL after correction (custom domain now renders AgroGuard; no remaining public 404)

## Direct Vercel inspection

- [x] Open the Vercel project dashboard for direct inspection of access
- [x] Inspect the domain mapping, deployment source, build settings, and logs directly (dashboard confirms domain, GitHub main, commit 47cec31, root ./, Node 24.x, Ready; old deployment API/log access returned 403)
- [x] Recheck the public URL after any permitted correction or report the exact access blocker (custom domain now renders AgroGuard)

## Post-upload Vercel verification

- [x] Inspect the newly deployed Vercel project and latest deployment (authenticated dashboard shows latest 47cec31 Ready from main)
- [x] Verify the public Vercel URL renders AgroGuard and identify the remaining hosting boundary (custom domain renders Home; static frontend boundary documented)

## Vercel build request

- [x] Configure Vercel to build smbabanbaba-maker/-almizanagroguard from main as a static frontend deployment from dist/public
- [x] Trigger or verify the Vercel build and inspect its deployment result (commit 47cec31 Ready)
- [x] Confirm the public Vercel URL renders AgroGuard or document the exact remaining boundary (deployment URL and custom domain render Home; backend routes are not validated on Vercel)

## Vercel output correction

- [x] Change Vercel output routing to serve the Vite frontend from dist/public instead of routing every request only to dist/index.js
- [x] Sync the corrected Vercel configuration to -almizanagroguard/main and trigger a fresh deployment (47cec31)
- [x] Verify the Vercel deployment URL renders the AgroGuard UI (almizanagroguard-3yt5eox19-sayyeed.vercel.app)

## Vercel final verification gaps

- [x] Verify almizanagroguard.vercel.app itself renders AgroGuard after propagation or domain rebinding
- [x] Document that the current Vercel deployment serves the static frontend from dist/public and that full Node API/auth routes require a separate compatible server deployment
- [x] Validate the chosen Vercel hosting boundary and update the deployment checklist accurately (static frontend from dist/public; backend requires separate server-compatible hosting)

## Optional Vercel backend follow-up

- [x] Decide the current Vercel scope: static frontend hosting is the verified Vercel deliverable; no claim is made that backend routes run as Vercel server functions

## Gemini, OpenAI, and full Vercel deployment request

- [x] Audit the existing AI adapters, server routes, build output, and Vercel configuration
- [x] Add secure server-side Gemini and OpenAI provider configuration with selectable provider/model settings
- [x] Make the full-stack server/API deployment path Vercel-compatible without exposing API keys
- [x] Add tests for provider selection, missing-key handling, and AI error mapping
- [x] Validate type checking, tests, production build, and Vercel deployment configuration
- [x] Document the exact Vercel environment variables and deployment steps for Gemini and OpenAI

## Full backend deployment on Vercel

- [x] Audit current Express/tRPC entrypoint, Vercel configuration, build output, auth callbacks, storage proxy, and database environment requirements
- [x] Choose and document a Vercel-compatible API handler architecture for `/api/trpc` and OAuth routes
- [x] Implement Vercel API routing while preserving the local Express development server
- [x] Configure secure server-side Gemini/OpenAI provider variables and database connection requirements
- [x] Add tests for the Vercel handler, route mounting, and missing environment-variable failures
- [x] Validate production build and API route behavior locally; production endpoint verification requires the owner to redeploy after adding Vercel variables
- [x] Update README and Vercel setup instructions with the exact environment variables and limitations

## AgroGuard logo refresh

- [x] Define a distinctive no-text AgroGuard mark for agriculture, AI, crop protection, trust, and African innovation
- [x] Generate and review a dark-mode-friendly logo asset from the project storage URL (transparent-background export is not claimed beyond the generated asset’s available rendering)
- [x] Integrate the logo into desktop sidebar, mobile navigation/header, favicon, Apple touch icon, and browser theme metadata
- [x] Verify logo visibility, sizing, contrast, alignment, and responsiveness in the rendered dark dashboard at mobile 390px and desktop 1280px previews
- [x] Save a checkpoint with the completed logo integration after final checklist review

## GitHub synchronization after backend and logo work

- [x] Inspect the selected GitHub remote, main branch, and working tree for all latest changes
- [x] Validate the pushed deployment files and tests before synchronization
- [x] Push the complete backend, provider, Vercel, documentation, and logo changes to GitHub main
- [x] Confirm the resulting commit is the source Vercel should build (main at 91e7f0a)

## Latest Vercel 404 report

- [x] Inspect the failing project URL, Vercel project mapping, and latest deployment status
- [x] Compare the mapped deployment with GitHub main commit 91e7f0a and the verified deployment URL
- [x] Apply or document the required domain, project, or deployment correction (removed invalid framework value, set outputDirectory to public, added API catch-all, and pushed d347a07)
- [x] Verify the correct public URL and save the corrected deployment checkpoint (almizanagroguard.vercel.app renders AgroGuard; agroguard-swart is stale)

- [x] Save a new checkpoint after the d347a07 Vercel 404 correction and record its version in the deployment findings

## Public logo and API provider request

- [x] Audit why the generated logo URL is broken on the public Vercel deployment (the `/manus-storage` image path was unavailable on Vercel)
- [x] Replace the broken logo reference with a Vercel-accessible public asset URL and update all logo placements (inline SVG mark, public SVG favicon, and Apple touch icon)
- [x] Research practical weather and agricultural API providers, including free-tier availability and African coverage (WeatherAPI.com, OpenWeather, and NASA POWER)
- [x] Add provider/source instructions and required Vercel environment variables to the project documentation
- [x] Validate the logo asset, production build, and public Vercel deployment after the fix (commit 12b3370; unique and stable URLs verified)
- [x] Save a checkpoint with the corrected public logo and API guidance after final checklist review

## Live weather integration

- [ ] Audit the current weather UI, server router, environment configuration, and provider boundary
- [ ] Implement a secure server-side weather provider endpoint with normalized response data
- [ ] Connect Home and Weather / Climate dashboard views to live weather data with loading, error, and fallback states
- [ ] Add tests for provider success, missing-key configuration, upstream errors, and response normalization
- [ ] Validate type checks, tests, formatting, production build, and public Vercel weather behavior
- [ ] Document the weather API signup, Vercel secret name, attribution, and deployment steps
- [ ] Save a checkpoint containing the live weather integration

## Latest AI and camera-access issue

- [ ] Inspect the failing `ag4u-sayyeed.vercel.app` URL, correct production URL, AI provider configuration, and current error mapping
- [ ] Make Ask AgroGuard return clear provider configuration errors and work with the selected OpenAI or Gemini key
- [ ] Confirm the crop-health input supports both gallery/file selection and direct phone-camera capture for all users
- [ ] Add tests for provider availability and camera/gallery input markup and validation
- [ ] Push the fixes to GitHub main, verify the correct Vercel deployment, and save a checkpoint

- [ ] Add a Vercel SPA fallback so direct routes such as `/crop-health`, `/weather`, `/ask`, and `/farm` do not return `404: NOT_FOUND` while preserving `/api/*` handlers

## Vercel-only production hosting

- [ ] Audit the Vercel project’s production environment variables, domain, build settings, API function, and database requirements
- [ ] Fix the production OpenAI/tRPC response path causing `Unexpected end of JSON input`
- [ ] Ensure all required OpenAI, auth, storage, and database secrets are configured in Vercel Production without committing values
- [ ] Verify Vercel-only Home, direct routes, `/api/health`, `/api/trpc`, Ask AgroGuard, Crop Health upload/camera, and database-dependent flows
- [ ] Document that Vercel is the production host and save a final checkpoint

- [ ] Exclude `/api/*` from the Vercel SPA fallback so `/api/health` and `/api/trpc` reach the serverless catch-all function

- [ ] Make the Vercel API catch-all’s server app import resolvable in the deployed Node ESM runtime

- [ ] Bundle the Vercel API catch-all as a self-contained serverless JavaScript function so Vercel does not need to resolve TypeScript source imports at runtime

- [ ] Rebuild the Vercel API function as CommonJS or leave CommonJS dependencies external so Express does not hit the ESM dynamic-require crash

- [ ] Remove the duplicate `api/[...path].js` and `api/[...path].cjs` conflict so Vercel can build the CommonJS function

- [ ] Expose the bundled CommonJS handler under a Vercel-detected `.js` catch-all with an `api/package.json` CommonJS boundary, then retest `/api/health`
