import { describe, expect, it } from "vitest";
import {
  buildReferralNote,
  buildSpokenAssessment,
} from "../client/src/pages/Home";
import { appRouter } from "./routers";

const assessment = {
  crop: "Tomato",
  healthStatus: "Possible issue",
  possibleCondition: "Possible leaf spot",
  confidence: 85,
  recommendation: "Remove heavily affected leaves and avoid wetting foliage.",
  careSteps: ["Remove spotted leaves", "Water at the root zone"],
  expertRequired: true,
  severity: "Moderate",
  visibleSymptoms: ["Dark spots on leaves"],
  expertGuidance: "Ask an extension officer to confirm the cause.",
};

describe("farmer experience helpers", () => {
  it("creates an English spoken assessment with the main next steps", () => {
    const spoken = buildSpokenAssessment(assessment);
    expect(spoken).toContain("Tomato");
    expect(spoken).toContain("Possible leaf spot");
    expect(spoken).toContain("Remove spotted leaves");
    expect(spoken).toContain("agricultural expert review is recommended");
  });

  it("creates a referral note without treatment brand or dosage instructions", () => {
    const note = buildReferralNote(assessment);
    expect(note).toContain("AgroGuard crop review request");
    expect(note).toContain("Possible leaf spot");
    expect(note).toContain("original crop photo");
    expect(note).not.toMatch(/dose|mixing ratio|purchase/i);
  });

  it("rejects an invalid farm profile before persistence", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "test-farmer" },
    } as any);
    await expect(
      caller.farm.saveProfile({ name: "A", crops: [] })
    ).rejects.toThrow();
  });
});
