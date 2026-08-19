"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_config = require("dotenv/config");
var import_node_path = __toESM(require("node:path"), 1);

// server/app.ts
var import_express = __toESM(require("express"), 1);
var import_express2 = require("@trpc/server/adapters/express");

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
var import_cookie2 = require("cookie");

// server/db.ts
var import_drizzle_orm = require("drizzle-orm");
var import_mysql2 = require("drizzle-orm/mysql2");

// drizzle/schema.ts
var import_mysql_core = require("drizzle-orm/mysql-core");
var users = (0, import_mysql_core.mysqlTable)("users", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  openId: (0, import_mysql_core.varchar)("openId", { length: 64 }).notNull().unique(),
  name: (0, import_mysql_core.text)("name"),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }),
  loginMethod: (0, import_mysql_core.varchar)("loginMethod", { length: 64 }),
  role: (0, import_mysql_core.mysqlEnum)("role", ["user", "admin"]).default("user").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: (0, import_mysql_core.timestamp)("lastSignedIn").defaultNow().notNull()
});
var farms = (0, import_mysql_core.mysqlTable)("farms", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  userId: (0, import_mysql_core.int)("userId").notNull(),
  name: (0, import_mysql_core.varchar)("name", { length: 160 }).notNull(),
  location: (0, import_mysql_core.varchar)("location", { length: 255 }),
  latitude: (0, import_mysql_core.decimal)("latitude", { precision: 10, scale: 7 }),
  longitude: (0, import_mysql_core.decimal)("longitude", { precision: 10, scale: 7 }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var crops = (0, import_mysql_core.mysqlTable)("crops", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  farmId: (0, import_mysql_core.int)("farmId").notNull(),
  name: (0, import_mysql_core.varchar)("name", { length: 80 }).notNull(),
  variety: (0, import_mysql_core.varchar)("variety", { length: 120 }),
  plantedAt: (0, import_mysql_core.timestamp)("plantedAt"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["active", "harvested", "archived"]).default("active").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var cropHealthScans = (0, import_mysql_core.mysqlTable)("cropHealthScans", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  userId: (0, import_mysql_core.int)("userId"),
  farmId: (0, import_mysql_core.int)("farmId"),
  cropId: (0, import_mysql_core.int)("cropId"),
  cropType: (0, import_mysql_core.varchar)("cropType", { length: 80 }).notNull(),
  imageKey: (0, import_mysql_core.varchar)("imageKey", { length: 512 }).notNull(),
  imageUrl: (0, import_mysql_core.varchar)("imageUrl", { length: 1024 }).notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["processing", "complete", "failed"]).default("processing").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var aiAnalysisResults = (0, import_mysql_core.mysqlTable)("aiAnalysisResults", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  scanId: (0, import_mysql_core.int)("scanId").notNull(),
  crop: (0, import_mysql_core.varchar)("crop", { length: 80 }).notNull(),
  possibleCondition: (0, import_mysql_core.varchar)("possibleCondition", { length: 255 }).notNull(),
  confidence: (0, import_mysql_core.decimal)("confidence", { precision: 5, scale: 2 }).notNull(),
  severity: (0, import_mysql_core.varchar)("severity", { length: 80 }).notNull(),
  recommendation: (0, import_mysql_core.text)("recommendation").notNull(),
  expertRequired: (0, import_mysql_core.int)("expertRequired").default(0).notNull(),
  expertGuidance: (0, import_mysql_core.text)("expertGuidance"),
  uncertaintyReason: (0, import_mysql_core.text)("uncertaintyReason"),
  rawJson: (0, import_mysql_core.text)("rawJson"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var recommendations = (0, import_mysql_core.mysqlTable)("recommendations", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  userId: (0, import_mysql_core.int)("userId"),
  scanId: (0, import_mysql_core.int)("scanId"),
  farmId: (0, import_mysql_core.int)("farmId"),
  title: (0, import_mysql_core.varchar)("title", { length: 180 }).notNull(),
  body: (0, import_mysql_core.text)("body").notNull(),
  source: (0, import_mysql_core.varchar)("source", { length: 80 }).default("agroguard-ai").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});

// server/_core/env.ts
var nonEmpty = (value) => value?.trim() || "";
var ENV = {
  appId: nonEmpty(process.env.VITE_APP_ID),
  cookieSecret: nonEmpty(process.env.JWT_SECRET),
  databaseUrl: nonEmpty(process.env.DATABASE_URL),
  oAuthServerUrl: nonEmpty(process.env.OAUTH_SERVER_URL),
  ownerOpenId: nonEmpty(process.env.OWNER_OPEN_ID),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: nonEmpty(process.env.BUILT_IN_FORGE_API_URL),
  forgeApiKey: nonEmpty(process.env.BUILT_IN_FORGE_API_KEY),
  openAiApiKey: nonEmpty(process.env.OPENAI_API_KEY),
  geminiApiKey: nonEmpty(process.env.GEMINI_API_KEY),
  aiProvider: nonEmpty(process.env.AGROGUARD_AI_PROVIDER).toLowerCase() || "builtin",
  aiModel: nonEmpty(process.env.AGROGUARD_AI_MODEL)
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = (0, import_mysql2.drizzle)(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  ["name", "email", "loginMethod"].forEach((field) => {
    if (user[field] !== void 0) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function updateUserProfile(userId, name, email) {
  const db = await getDb();
  if (!db) return void 0;
  await db.update(users).set({ name, email, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(users.id, userId));
  return db.select().from(users).where((0, import_drizzle_orm.eq)(users.id, userId)).limit(1).then((rows) => rows[0]);
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.openId, openId)).limit(1);
  return result[0];
}
async function saveCropAnalysis(input) {
  const db = await getDb();
  if (!db) return { scanId: void 0 };
  const scan = await db.insert(cropHealthScans).values({
    userId: input.userId,
    cropType: input.cropType,
    imageKey: input.imageKey,
    imageUrl: input.imageUrl,
    status: "complete"
  });
  const scanId = Number(scan.insertId);
  await db.insert(aiAnalysisResults).values({
    scanId,
    crop: input.result.crop,
    possibleCondition: input.result.possible_condition,
    confidence: input.result.confidence.toFixed(2),
    severity: input.result.severity,
    recommendation: input.result.recommendation,
    expertRequired: input.result.expert_required ? 1 : 0,
    expertGuidance: input.result.expert_guidance,
    uncertaintyReason: input.result.uncertainty_reason,
    rawJson: JSON.stringify(input.result)
  });
  await db.insert(recommendations).values({
    userId: input.userId,
    scanId,
    title: "Crop health next step",
    body: input.result.recommendation
  });
  return { scanId };
}
async function getRecentScans(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cropHealthScans).where((0, import_drizzle_orm.eq)(cropHealthScans.userId, userId)).orderBy((0, import_drizzle_orm.desc)(cropHealthScans.createdAt)).limit(10);
}
async function getFarmOverview(userId) {
  const db = await getDb();
  if (!db) return { farms: [], scans: [], analyses: [], recommendations: [] };
  const [farmRows, scanRows, recommendationRows] = await Promise.all([
    db.select().from(farms).where((0, import_drizzle_orm.eq)(farms.userId, userId)).limit(10),
    db.select().from(cropHealthScans).where((0, import_drizzle_orm.eq)(cropHealthScans.userId, userId)).orderBy((0, import_drizzle_orm.desc)(cropHealthScans.createdAt)).limit(10),
    db.select().from(recommendations).where((0, import_drizzle_orm.eq)(recommendations.userId, userId)).orderBy((0, import_drizzle_orm.desc)(recommendations.createdAt)).limit(10)
  ]);
  const scanIds = scanRows.map((scan) => scan.id);
  const analysisRows = scanIds.length ? await db.select().from(aiAnalysisResults).where((0, import_drizzle_orm.inArray)(aiAnalysisResults.scanId, scanIds)).orderBy((0, import_drizzle_orm.desc)(aiAnalysisResults.createdAt)).limit(10) : [];
  return {
    farms: farmRows,
    scans: scanRows,
    analyses: analysisRows,
    recommendations: recommendationRows
  };
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
var import_axios = __toESM(require("axios"), 1);
var import_cookie = require("cookie");
var import_jose = require("jose");
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => import_axios.default.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = (0, import_cookie.parse)(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new import_jose.SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await (0, import_jose.jwtVerify)(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = (0, import_cookie2.parse)(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
var import_zod3 = require("zod");

// server/_core/systemRouter.ts
var import_zod = require("zod");

// server/_core/notification.ts
var import_server = require("@trpc/server");
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
var import_server2 = require("@trpc/server");
var import_superjson = __toESM(require("superjson"), 1);
var t = import_server2.initTRPC.context().create({
  transformer: import_superjson.default
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new import_server2.TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new import_server2.TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    import_zod.z.object({
      timestamp: import_zod.z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    import_zod.z.object({
      title: import_zod.z.string().min(1, "title is required"),
      content: import_zod.z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveProvider = () => ENV.aiProvider;
var resolveApiUrl = () => {
  switch (resolveProvider()) {
    case "openai":
      return "https://api.openai.com/v1/chat/completions";
    case "gemini":
      return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    default:
      return ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
  }
};
var resolveApiKey = () => {
  switch (resolveProvider()) {
    case "openai":
      return ENV.openAiApiKey;
    case "gemini":
      return ENV.geminiApiKey;
    default:
      return ENV.forgeApiKey;
  }
};
var resolveDefaultModel = () => {
  if (ENV.aiModel) return ENV.aiModel;
  if (resolveProvider() === "openai") return "gpt-4o-mini";
  if (resolveProvider() === "gemini") return "gemini-1.5-flash";
  return void 0;
};
var assertApiKey = () => {
  if (!resolveApiKey()) {
    throw new Error(`${resolveProvider()} AI provider is not configured`);
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
var RETRY_MAX_RETRIES = 4;
var RETRY_BASE_DELAY_MS = 500;
var RETRY_MAX_DELAY_MS = 3e4;
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var parseRetryAfter = (value) => {
  if (!value) return void 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1e3);
  const at = Date.parse(value);
  return Number.isNaN(at) ? void 0 : Math.max(0, at - Date.now());
};
var computeBackoffDelay = (attempt, retryAfterMs) => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};
var fetchWithBackoff = async (url, init) => {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }
      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("LLM request failed after exhausting retries");
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens
  } = params;
  const payload = {
    messages: messages.map(normalizeMessage)
  };
  const resolvedModel = model ?? resolveDefaultModel();
  if (resolvedModel) {
    payload.model = resolvedModel;
  }
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }
  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const apiKey = resolveApiKey();
  const headers = {
    "content-type": "application/json"
  };
  if (resolveProvider() === "gemini") {
    headers["x-goog-api-key"] = apiKey;
  } else {
    headers.authorization = `Bearer ${apiKey}`;
  }
  const response = await fetchWithBackoff(resolveApiUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/ai/modelAdapter.ts
var BuiltInVisionModelAdapter = class {
  async analyze(imageDataUrl, cropType) {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are AgroGuard's ${cropType} crop-health vision model. Provide a cautious preliminary agricultural assessment. Never claim certainty, never invent an image observation, and recommend expert help when the image is unclear or symptoms are serious. Return only the requested JSON.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Assess this ${cropType} leaf or plant image. Identify the crop, possible condition, confidence from 0 to 100, severity, practical preliminary recommendation, whether an agricultural expert is required, expert guidance, and a reason for uncertainty when confidence is not high.`
            },
            {
              type: "image_url",
              image_url: { url: imageDataUrl, detail: "high" }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "agroguard_crop_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              crop: { type: "string" },
              possible_condition: { type: "string" },
              confidence: { type: "number" },
              severity: { type: "string" },
              recommendation: { type: "string" },
              expert_required: { type: "boolean" },
              expert_guidance: { type: "string" },
              uncertainty_reason: { type: "string" }
            },
            required: [
              "crop",
              "possible_condition",
              "confidence",
              "severity",
              "recommendation",
              "expert_required",
              "expert_guidance",
              "uncertainty_reason"
            ],
            additionalProperties: false
          }
        }
      }
    });
    return { content: response.choices?.[0]?.message?.content };
  }
};

// server/ai/resultParser.ts
var import_zod2 = require("zod");
var cropAnalysisSchema = import_zod2.z.object({
  crop: import_zod2.z.string().min(1).max(80),
  possible_condition: import_zod2.z.string().min(1).max(255),
  confidence: import_zod2.z.number().min(0).max(100),
  severity: import_zod2.z.string().min(1).max(80),
  recommendation: import_zod2.z.string().min(1).max(4e3),
  expert_required: import_zod2.z.boolean(),
  expert_guidance: import_zod2.z.string().max(2e3).optional().default(
    "Consult a qualified agricultural expert if symptoms spread, the crop declines quickly, or the result is unclear."
  ),
  uncertainty_reason: import_zod2.z.string().max(1e3).optional().default("")
});
function contentToText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content.map(
      (part) => typeof part === "string" ? part : part?.text ?? part?.content ?? ""
    ).join("");
  if (content && typeof content === "object" && "text" in content)
    return String(content.text);
  return JSON.stringify(content ?? "");
}
function parseCropAnalysis(content) {
  const text2 = contentToText(content).trim();
  try {
    return cropAnalysisSchema.parse(JSON.parse(text2));
  } catch {
    throw new Error(
      "The AI returned an invalid analysis. Please try another clear image."
    );
  }
}

// server/ai/cropAnalysis.ts
var MAX_IMAGE_BYTES = 8 * 1024 * 1024;
var allowedMime = /* @__PURE__ */ new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
]);
function getConfidenceThresholds() {
  const high = Number(process.env.AGROGUARD_CONFIDENCE_HIGH ?? 70);
  const medium = Number(process.env.AGROGUARD_CONFIDENCE_MEDIUM ?? 50);
  if (!Number.isFinite(high) || !Number.isFinite(medium) || high <= medium || medium < 0 || high > 100)
    return { high: 70, medium: 50 };
  return { high, medium };
}
function validateImageDataUrl(imageDataUrl) {
  const match = imageDataUrl.match(
    /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=]+)$/i
  );
  if (!match || !allowedMime.has(match[1].toLowerCase()))
    throw new Error("Please upload a JPG, PNG, WEBP, or HEIC image.");
  const bytes = Math.ceil(match[2].length * 3 / 4);
  if (bytes > MAX_IMAGE_BYTES)
    throw new Error("Images must be smaller than 8 MB.");
  return {
    mimeType: match[1].toLowerCase(),
    bytes: Buffer.from(match[2], "base64")
  };
}
async function analyzeCropImage(imageDataUrl, cropType = "tomato", adapter = new BuiltInVisionModelAdapter()) {
  const { bytes, mimeType } = validateImageDataUrl(imageDataUrl);
  if (cropType.toLowerCase() !== "tomato")
    throw new Error(
      "The first AgroGuard model is configured for tomato images only."
    );
  const response = await adapter.analyze(imageDataUrl, cropType);
  const result = parseCropAnalysis(response.content);
  const thresholds = getConfidenceThresholds();
  const confidenceBand = result.confidence >= thresholds.high ? "high" : result.confidence >= thresholds.medium ? "medium" : "low";
  return { result, imageBytes: bytes, mimeType, confidenceBand };
}

// server/routers.ts
var questionSchema = import_zod3.z.object({
  question: import_zod3.z.string().trim().min(1).max(1200)
});
var imageSchema = import_zod3.z.object({
  imageDataUrl: import_zod3.z.string().min(100).max(12e6),
  cropType: import_zod3.z.string().trim().min(1).max(80).default("tomato")
});
var rateBuckets = /* @__PURE__ */ new Map();
function checkRateLimit(key, limit = 8) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + 6e4 });
    return;
  }
  if (bucket.count >= limit)
    throw new Error(
      "You have reached the short-term request limit. Please wait a minute and try again."
    );
  bucket.count += 1;
}
async function withTimeout(promise, message, ms = 45e3) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
function friendlyAiError(error) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("timeout"))
    return new Error(
      "AgroGuard took too long to respond. Please try again with a clearer image."
    );
  if (/413|payload too large|request entity too large/i.test(message))
    return new Error(
      "This image is too large for secure AI analysis. Please choose a smaller photo."
    );
  if (/401|403|api key|unauthorized/i.test(message))
    return new Error(
      "The AI provider key in Vercel was not accepted. Please check the production AI key."
    );
  if (/400.*(image|input|model|response_format)/i.test(message))
    return new Error(
      "The AI provider rejected this image request. Please try a clear JPG or PNG crop photo."
    );
  if (/invalid|configured/i.test(message)) return error;
  return new Error(
    "We couldn't complete the AI assessment right now. Please check your connection and try again."
  );
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  cropHealth: router({
    analyze: publicProcedure.input(imageSchema).mutation(async ({ input, ctx }) => {
      checkRateLimit(`scan:${ctx.user?.id ?? ctx.req.ip ?? "guest"}`);
      let analysis;
      try {
        analysis = await withTimeout(
          analyzeCropImage(input.imageDataUrl, input.cropType),
          "AI analysis timeout"
        );
      } catch (error) {
        console.error("[AgroGuard] Crop analysis failed", {
          message: error instanceof Error ? error.message : String(error)
        });
        throw friendlyAiError(error);
      }
      const extension = analysis.mimeType.split("/")[1].replace("jpeg", "jpg");
      let stored;
      try {
        stored = await withTimeout(
          storagePut(
            `crop-scans/${ctx.user?.id ?? "guest"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`,
            analysis.imageBytes,
            analysis.mimeType
          ),
          "Storage upload timeout"
        );
      } catch (error) {
        console.warn("[AgroGuard] Optional image persistence skipped", {
          message: error instanceof Error ? error.message : String(error)
        });
      }
      let scanId;
      if (stored) {
        try {
          const saved = await saveCropAnalysis({
            userId: ctx.user?.id,
            cropType: input.cropType,
            imageKey: stored.key,
            imageUrl: stored.url,
            result: analysis.result
          });
          scanId = saved.scanId;
        } catch (error) {
          console.warn("[AgroGuard] Optional analysis persistence skipped", {
            message: error instanceof Error ? error.message : String(error)
          });
        }
      }
      return {
        crop: analysis.result.crop,
        possibleCondition: analysis.result.possible_condition,
        confidence: analysis.result.confidence,
        severity: analysis.result.severity,
        recommendation: analysis.result.recommendation,
        expertRequired: analysis.result.expert_required,
        expertGuidance: analysis.result.expert_guidance,
        uncertaintyReason: analysis.result.uncertainty_reason,
        confidenceBand: analysis.confidenceBand,
        scanId
      };
    }),
    recent: protectedProcedure.query(({ ctx }) => getRecentScans(ctx.user.id))
  }),
  profile: router({
    update: protectedProcedure.input(
      import_zod3.z.object({
        name: import_zod3.z.string().trim().min(2).max(120),
        email: import_zod3.z.string().email().max(320)
      })
    ).mutation(
      ({ ctx, input }) => updateUserProfile(ctx.user.id, input.name, input.email)
    )
  }),
  farm: router({
    overview: protectedProcedure.query(
      ({ ctx }) => getFarmOverview(ctx.user.id)
    )
  }),
  agroguard: router({
    ask: publicProcedure.input(questionSchema).mutation(async ({ input, ctx }) => {
      checkRateLimit(`ask:${ctx.user?.id ?? ctx.req.ip ?? "guest"}`);
      let response;
      try {
        response = await withTimeout(
          invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are Ask AgroGuard, a careful agricultural extension assistant. Provide practical general guidance for African smallholder farmers. You may discuss crop care, soil, watering, pests, and climate-smart practices. You must clearly state that text-only guidance is not a disease diagnosis and direct the user to the Crop Health image workflow for image-based assessment. Do not claim to be a licensed agronomist."
              },
              { role: "user", content: input.question }
            ]
          }),
          "AgroGuard chat timeout"
        );
      } catch (error) {
        throw friendlyAiError(error);
      }
      const content = response.choices?.[0]?.message?.content;
      const answer = contentToText(content).trim();
      return {
        answer: answer || "I could not prepare guidance right now. Please try again."
      };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/app.ts
function createApp() {
  const app2 = (0, import_express.default)();
  app2.disable("x-powered-by");
  app2.use(import_express.default.json({ limit: "50mb" }));
  app2.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
  app2.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "almizan-ai-agroguard" });
  });
  registerStorageProxy(app2);
  registerOAuthRoutes(app2);
  app2.use(
    "/api/trpc",
    (0, import_express2.createExpressMiddleware)({
      router: appRouter,
      createContext
    })
  );
  return app2;
}

// server.ts
var app = createApp();
var publicDir = import_node_path.default.resolve(process.cwd(), "public");
var indexFile = import_node_path.default.join(publicDir, "index.html");
app.get("*", (_req, res) => {
  res.sendFile(indexFile);
});
var server_default = app;
