import { describe, expect, it } from "vitest";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "./legalContent";

const text = (doc: typeof TERMS_OF_SERVICE) =>
  JSON.stringify([doc.intro, doc.sections]);

describe("the Terms and Privacy Policy", () => {
  it("name the real company and none of the old template's", () => {
    for (const doc of [TERMS_OF_SERVICE, PRIVACY_POLICY]) {
      expect(text(doc)).toContain("Arojem Solutions LLC");
      expect(text(doc)).not.toMatch(/Dephyned|VPN|Sponsored|at no cost/i);
    }
  });

  it("forbid uploading government IDs and point to the ID check", () => {
    const prohibited = TERMS_OF_SERVICE.sections.find(
      (s) => s.id === "prohibited-data",
    );
    expect(JSON.stringify(prohibited)).toMatch(/driver's licenses/);
    expect(JSON.stringify(prohibited)).toMatch(/ID checked/);
    expect(text(PRIVACY_POLICY)).toMatch(/We do not want or store the ID itself/);
  });

  it("have unique section anchors", () => {
    for (const doc of [TERMS_OF_SERVICE, PRIVACY_POLICY]) {
      const ids = doc.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
