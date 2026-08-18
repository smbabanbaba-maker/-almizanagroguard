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
