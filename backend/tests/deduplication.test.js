/**
 * Automated Tests: Complaint Deduplication & Similarity Engine
 */

const {
  tokenize,
  computeSimilarity,
} = require("../src/services/deduplicationService");

describe("Deduplication & Incident Clustering Engine", () => {
  describe("tokenize()", () => {
    it("should lowercase, remove punctuation, and filter stopwords", () => {
      const tokens = tokenize("Street light near pole 42, Vadodara is not working!");
      expect(tokens).toContain("light");
      expect(tokens).toContain("pole");
      expect(tokens).toContain("working");
      // Stopwords filtered
      expect(tokens).not.toContain("the");
      expect(tokens).not.toContain("is");
      expect(tokens).not.toContain("vadodara");
    });
  });

  describe("computeSimilarity()", () => {
    it("should compute high similarity for complaints describing the same incident at same pole", () => {
      const complaintA = {
        address: "Akota, near tube well pole 42",
        issue: "Street light pole 42 is dark and sparking since night",
      };

      const complaintB = {
        address: "Tube well pole 42, Akota road",
        issue: "Pole 42 streetlight sparking wire exposed",
      };

      const score = computeSimilarity(complaintA, complaintB);
      expect(score).toBeGreaterThanOrEqual(0.65);
    });

    it("should compute low similarity for completely unrelated civic complaints", () => {
      const complaintA = {
        address: "Alkapuri circle, near bank",
        issue: "Pothole on the asphalt surface",
      };

      const complaintB = {
        address: "Manjalpur sector 7, water tank",
        issue: "Garbage bin overflowing with plastic bags",
      };

      const score = computeSimilarity(complaintA, complaintB);
      expect(score).toBeLessThan(0.35);
    });

    it("should detect duplicate phrasing with minor spelling or word variations", () => {
      const complaintA = {
        address: "Sayajigunj cross road",
        issue: "Drainage water overflow flooding road near garden",
      };

      const complaintB = {
        address: "Sayajigunj crossing area",
        issue: "Drainage water overflowing and flooding road near garden",
      };

      const score = computeSimilarity(complaintA, complaintB);
      expect(score).toBeGreaterThanOrEqual(0.60);
    });
  });
});
