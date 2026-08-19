import type { IncomingMessage, ServerResponse } from "node:http";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type VercelRequest = IncomingMessage & {
  body?: unknown;
};

type VercelResponse = ServerResponse;

const readBody = async (req: VercelRequest): Promise<string | undefined> => {
  if (req.body !== undefined) {
    const text = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    return text;
  }

  if (req.method === "GET" || req.method === "HEAD") return undefined;

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length > 0 ? Buffer.concat(chunks).toString("utf8") : undefined;
};

const createPublicContext = (
  req: VercelRequest,
  res: VercelResponse
): TrpcContext => ({
  req: req as TrpcContext["req"],
  res: res as TrpcContext["res"],
  user: null,
});

const writeFetchResponse = async (
  res: VercelResponse,
  response: Response
) => {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
};

const handleTrpc = async (req: VercelRequest, res: VercelResponse) => {
  const protocol =
    typeof req.headers["x-forwarded-proto"] === "string"
      ? req.headers["x-forwarded-proto"]
      : "https";
  const host = req.headers.host ?? "localhost";
  const url = `${protocol}://${host}${req.url ?? "/api/trpc"}`;
  const body = await readBody(req);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(", "));
  }

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: new Request(url, {
      method: req.method,
      headers,
      body,
    }),
    router: appRouter,
    createContext: () => createPublicContext(req, res),
    onError: ({ path, error }) => {
      console.error("[Vercel tRPC] request failed", path, error.message);
    },
  });

  await writeFetchResponse(res, response);
};

export default async function vercelHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  const pathname = (req.url ?? "").split("?", 1)[0];

  if (pathname === "/api/health") {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ status: "ok", service: "almizan-ai-agroguard" }));
    return;
  }

  if (pathname.startsWith("/api/trpc")) {
    try {
      await handleTrpc(req, res);
    } catch (error) {
      console.error("[Vercel handler] unhandled request error", error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "AI service temporarily unavailable" }));
      }
    }
    return;
  }

  res.statusCode = 404;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ error: "Not found" }));
}
