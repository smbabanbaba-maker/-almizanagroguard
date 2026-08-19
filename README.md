# AL-MIZAN AI AGROGUARD

Al-Mizan AI AgroGuard is a responsive agricultural intelligence dashboard for farmers. The first workflow is tomato crop-health assessment: a farmer uploads or captures an image, the server sends it to a vision-capable model, validates the structured response, stores the image reference and analysis, and presents a cautious preliminary result with practical next steps.

> AI confidence is not the same as validated diagnostic accuracy. The product explicitly directs farmers to qualified agricultural experts when the image is unclear, confidence is low, symptoms are serious, or the crop is declining.

## Product scope

The workspace contains five sections: Home, Crop Health, Weather / Climate, Ask AgroGuard, and My Farm. The layout uses a persistent desktop sidebar and a mobile bottom navigation bar. Weather is intentionally labeled as pending until a trusted provider is configured; the product does not fabricate live conditions. Ask AgroGuard is a general agricultural guidance assistant and must not be used as a disease diagnosis interface.

## Architecture

The client is React 19 with TypeScript, Vite, Tailwind CSS 4, shadcn/ui primitives, and tRPC hooks. The server is Express with tRPC procedures and the scaffolded Manus authentication context. Drizzle ORM targets the provisioned MySQL-compatible database. Image bytes are uploaded server-side to the built-in object storage and only the storage key and URL are persisted.

The AI boundary is deliberately replaceable:

```text
server/ai/modelAdapter.ts     Provider/model adapter; current implementation uses the built-in vision-capable LLM
server/ai/resultParser.ts     Content normalization and Zod validation
server/ai/cropAnalysis.ts     Image validation, orchestration, and confidence banding
server/routers.ts             Secure tRPC procedure boundary
```

To change providers, implement `CropVisionModelAdapter` and pass the new adapter into `analyzeCropImage`; the frontend contract does not need to change.

## Database model

The schema includes `users`, `farms`, `crops`, `cropHealthScans`, `aiAnalysisResults`, and `recommendations`. A scan persists the crop type, storage reference, status, structured AI result, confidence, severity, recommendation, expert guidance, uncertainty reason, and UTC timestamp. The initial farm UI is intentionally lightweight but consumes persisted scan summaries when the user is authenticated.

## Environment variables

Platform-managed variables are injected by the project runtime. Copy `.env.example` for local documentation only; never commit a populated `.env` file.

The confidence bands default to high at 70 and medium at 50. These are configurable product thresholds, not scientifically validated accuracy claims.

## Local development

```bash
pnpm install
pnpm dev
```

The project uses the existing Manus OAuth flow. Database schema changes are generated with `pnpm drizzle-kit generate`, reviewed, and applied through the managed database migration workflow. Do not put AI or storage credentials in frontend code.

## Testing and verification

Run the following before delivery:

```bash
pnpm check
pnpm test
pnpm build
```

The current Vitest coverage verifies configurable confidence thresholds and invalid-threshold fallback behavior. Model accuracy evaluation remains a separate data-science workstream and should use held-out images, accuracy, precision, recall, F1, confusion matrices, and agricultural expert validation. A model-produced confidence number alone is not an accuracy metric.

## Operational safeguards

The server validates image MIME type, base64 format, and an 8 MB size limit before model invocation. Public AI endpoints use a short-lived in-memory rate bucket suitable for the prototype. For multi-instance production deployments, replace this with a shared rate-limit store. AI responses are parsed through a strict Zod schema, and content blocks from chat models are normalized before returning to the client.

## Roadmap

The next expansion points are a trusted weather provider, richer farm CRUD, local-language guidance including Hausa, voice support, a validated tomato model trained or adapted on appropriately licensed data, and expert-reviewed evaluation on African farm imagery. Additional crops should be added through model adapters and crop configuration rather than duplicating frontend workflows.

## Full-stack Vercel deployment

The project now exposes a Vercel-detected root Express entrypoint at `server.ts`. Vercel can capture this application as a Node.js function, while the local development entrypoint remains `server/_core/index.ts`. The Vercel build command runs `pnpm build:vercel`, builds the Vite client, and copies the resulting frontend to the root `public/` directory because Vercel serves static assets from `public/` for Express applications. The same Express app mounts `/api/health`, `/api/trpc`, OAuth routes, and the storage proxy.

Vercel does not receive environment-variable changes in an already-created deployment; after adding or changing variables, create a new deployment.[1] Select **Production**, **Preview**, and **Development** as appropriate in the Vercel project settings. The following table describes the server-side variables needed for a full deployment.

| Variable                         | Required use                               | Example or source                                |
| -------------------------------- | ------------------------------------------ | ------------------------------------------------ |
| `DATABASE_URL`                   | MySQL/TiDB connection used by Drizzle ORM  | TLS-enabled database connection string           |
| `JWT_SECRET`                     | Session-cookie signing secret              | Long random secret                               |
| `VITE_APP_ID`                    | Manus OAuth application identifier         | Manus project configuration                      |
| `OAUTH_SERVER_URL`               | OAuth server base URL                      | Manus OAuth configuration                        |
| `VITE_OAUTH_PORTAL_URL`          | Browser login portal URL                   | Manus OAuth configuration                        |
| `OWNER_OPEN_ID` and `OWNER_NAME` | Project owner identity and admin bootstrap | Manus project configuration                      |
| `GEMINI_API_KEY`                 | Server-only Gemini provider key            | Google AI Studio key; never use a `VITE_` prefix |
| `AGROGUARD_AI_PROVIDER`          | Gemini-only selector                       | `gemini`                                         |
| `AGROGUARD_AI_MODEL`             | Gemini model override                      | `gemini-3.6-flash`                               |

AgroGuard is configured for **Gemini only**. Set `AGROGUARD_AI_PROVIDER=gemini`, `AGROGUARD_AI_MODEL=gemini-3.6-flash`, and provide `GEMINI_API_KEY`. The server uses Gemini for both Ask AgroGuard and Crop Health; no API key is read by the React client. Gemini 2.0 Flash is shut down and Gemini 2.5 Flash is unavailable to new users, so the server safely falls back to Gemini 3.6 Flash if an older or non-Gemini Vercel variable remains in place. If the key is absent or rejected, the server returns a clear configuration error instead of making an unauthenticated upstream request.

After deployment, verify `https://your-domain.vercel.app/api/health` returns a JSON status of `ok`, then verify `https://your-domain.vercel.app/api/trpc/auth.me` responds with the unauthenticated tRPC result. Complete OAuth, database, storage, and AI checks only after the corresponding Vercel variables have been added. The MySQL-compatible database must be reachable from Vercel’s server runtime; use the database provider’s TLS/SSL connection option for production.

References:

[1]: https://vercel.com/docs/environment-variables "Vercel Environment Variables"
[2]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel"
[3]: https://vercel.com/docs/functions/runtimes/node-js "Vercel Node.js Runtime"

## Weather and agriculture API options

The current Weather / Climate interface intentionally uses a clearly labeled preview until a trusted provider is configured. For the first live integration, WeatherAPI.com is a practical low-volume option: its current free plan lists 100,000 calls per month and a 3-day forecast, with limited alerts and air quality.[4] OpenWeather is a strong alternative when global latitude/longitude coverage, geocoding, air pollution, and richer timeline features are important; its current One Call 4.0 page advertises the first 1,000 calls per day free.[5] NASA POWER is useful for longer-term climate, solar, and meteorological indicators and is globally available, but it is better treated as a climate-data complement than as a minute-to-minute alert service.[6]

Keep weather requests server-side. Add only the provider key to Vercel Environment Variables, then have a server procedure request the provider and return a normalized weather snapshot to the React client. Do not put `WEATHER_API_KEY`, `OPENWEATHER_API_KEY`, or any other provider secret in a `VITE_` variable. Check the provider’s attribution, commercial-use, and rate-limit terms before a public launch.

References:

[4]: https://www.weatherapi.com/pricing.aspx "WeatherAPI.com Pricing"
[5]: https://openweathermap.org/price "OpenWeather Pricing"
[6]: https://power.larc.nasa.gov/docs/services/api/temporal/hourly/ "NASA POWER Hourly API"

## Gemini and Crop Health access notes

The selected production AI provider is Gemini, with `gemini-3.6-flash` as the default model and `GEMINI_API_KEY` stored only on the server. Both Ask AgroGuard and Crop Health use the Gemini OpenAI-compatible endpoint from Vercel. If either feature displays a provider-configuration message, add these variables under the Vercel project’s Production environment and redeploy:

```text
GEMINI_API_KEY=your_server_only_google_ai_studio_key
AGROGUARD_AI_PROVIDER=gemini
AGROGUARD_AI_MODEL=gemini-3.6-flash
```

Crop Health now uses separate controls for **Upload photo** and **Take photo**. The upload control opens the device gallery/file picker, while the camera control uses the mobile browser’s rear-camera capture hint. Users can also drag and drop an image on desktop. The stable production URL is `https://almizanagroguard.vercel.app/`; older aliases such as `ag4u-sayyeed.vercel.app` may return Vercel `404: NOT_FOUND` and should not be used.

## Vercel-only production boundary

Production deployment runs from the GitHub repository on Vercel. Vercel invokes the bundled CommonJS functions under `api/`; the Manus preview server is not required to serve the production frontend or public Ask AgroGuard/Crop Health requests. Configure `GEMINI_API_KEY`, `AGROGUARD_AI_PROVIDER=gemini`, and `AGROGUARD_AI_MODEL=gemini-3.6-flash` in the Vercel Production environment, then redeploy.

Crop Health returns the AI assessment independently of optional image/database persistence. If legacy storage or database variables are unavailable, the assessment is still returned and the persistence step is skipped with a server-side warning. This prevents a storage integration problem from being shown to farmers as an AI connection failure.
