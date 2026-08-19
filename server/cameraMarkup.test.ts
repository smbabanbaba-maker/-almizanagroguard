import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homePageSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Home.tsx"),
  "utf8"
);

describe("Crop Health camera and gallery controls", () => {
  it("keeps a gallery picker and a separate rear-camera capture input", () => {
    expect(homePageSource).toContain("ref={fileInput}");
    expect(homePageSource).toContain("ref={cameraInput}");
    expect(homePageSource).toContain('accept="image/*"');
    expect(homePageSource).toContain('capture="environment"');
    expect(homePageSource).toContain("Upload photo");
    expect(homePageSource).toContain("Take photo");
  });
});
