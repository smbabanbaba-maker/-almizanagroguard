import "dotenv/config";
import path from "node:path";
import { createApp } from "./server/app";

const app = createApp();
const publicDir = path.resolve(process.cwd(), "public");
const indexFile = path.join(publicDir, "index.html");

app.get("*", (_req, res) => {
  res.sendFile(indexFile);
});

export default app;
