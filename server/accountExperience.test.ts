import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sdk } from "./_core/sdk";

const homeSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Home.tsx"),
  "utf8"
);
const routerSource = readFileSync(
  resolve(process.cwd(), "server/routers.ts"),
  "utf8"
);

describe("farmer account experience", () => {
  it("keeps English Login and Register controls plus account logout in the dashboard", () => {
    expect(homeSource).toContain("Create your AgroGuard account");
    expect(homeSource).toContain("Log in to save");
    expect(homeSource).toContain("Log out");
    expect(homeSource).toContain("auth.register.useMutation");
    expect(homeSource).toContain("auth.login.useMutation");
  });

  it("keeps detailed history and notification center controls in My Farm", () => {
    expect(homeSource).toContain("Crop health history");
    expect(homeSource).toContain("Saved crop assessment");
    expect(homeSource).toContain("Notifications");
    expect(homeSource).toContain("Mark read");
  });

  it("signs and verifies a local account session without contacting OAuth", async () => {
    const token = await sdk.createSessionToken("local_test_farmer", {
      name: "Test Farmer",
      expiresInMs: 60_000,
    });
    await expect(sdk.verifySession(token)).resolves.toMatchObject({
      openId: "local_test_farmer",
      name: "Test Farmer",
    });
  });

  it("hashes passwords and sets an HTTP-only session from the router", () => {
    expect(routerSource).toContain("bcrypt.hash(input.password, 12)");
    expect(routerSource).toContain("bcrypt.compare(input.password");
    expect(routerSource).toContain("ctx.res.cookie(COOKIE_NAME, sessionToken");
    expect(routerSource).toContain("notifications: router");
  });
});
