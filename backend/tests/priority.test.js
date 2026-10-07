/**
 * Automated Tests: Priority Classification & SLA Engine
 */

const {
  inferPriority,
  calculateSlaDeadline,
  checkPriorityEscalation,
  SLA_HOURS,
} = require("../src/services/priorityService");

describe("Priority Classification & SLA Service", () => {
  describe("inferPriority()", () => {
    it("should classify life-safety hazards as P1_critical", () => {
      const p1Samples = [
        "Live wire exposed and sparking near school entrance",
        "Open manhole on main road causing fatal danger",
        "Electrical short circuit and fire near transformer",
        "Hospital approach road completely caved in with deep ditch",
      ];

      p1Samples.forEach((issue) => {
        expect(inferPriority(issue, "street_light")).toBe("P1_critical");
      });
    });

    it("should classify major community disruptions as P2_high", () => {
      const p2Samples = [
        "Major water pipeline burst flooding the entire colony",
        "Sewage water entering into houses since 2 days",
        "Deep pothole on main road causing severe traffic jam",
      ];

      p2Samples.forEach((issue) => {
        expect(inferPriority(issue, "drainage")).toBe("P2_high");
      });
    });

    it("should classify standard municipal issues as P3_medium", () => {
      expect(inferPriority("Street light bulb not working on pole 12", "street_light")).toBe("P3_medium");
      expect(inferPriority("Garbage bin overflowing near market", "garbage")).toBe("P3_medium");
    });

    it("should classify minor maintenance as P4_low", () => {
      expect(inferPriority("Need routine garden tree trimming in park", "road")).toBe("P4_low");
      expect(inferPriority("Request for wall painting whitewash on boundary", "other")).toBe("P4_low");
    });
  });

  describe("calculateSlaDeadline()", () => {
    it("should accurately project SLA deadline into future hours", () => {
      const base = new Date("2026-04-10T10:00:00Z");

      const p1Date = calculateSlaDeadline("P1_critical", base);
      expect(p1Date.getTime() - base.getTime()).toBe(SLA_HOURS.P1_critical * 3600 * 1000);

      const p2Date = calculateSlaDeadline("P2_high", base);
      expect(p2Date.getTime() - base.getTime()).toBe(SLA_HOURS.P2_high * 3600 * 1000);

      const p3Date = calculateSlaDeadline("P3_medium", base);
      expect(p3Date.getTime() - base.getTime()).toBe(SLA_HOURS.P3_medium * 3600 * 1000);
    });
  });

  describe("checkPriorityEscalation()", () => {
    it("should escalate P3 to P2 when multiple citizen reports accumulate", () => {
      expect(checkPriorityEscalation("P3_medium", 0)).toBe("P3_medium");
      expect(checkPriorityEscalation("P3_medium", 1)).toBe("P3_medium");
      expect(checkPriorityEscalation("P3_medium", 2)).toBe("P2_high");
      expect(checkPriorityEscalation("P3_medium", 5)).toBe("P2_high");
    });

    it("should escalate to P1_critical when 6+ citizen reports accumulate", () => {
      expect(checkPriorityEscalation("P2_high", 6)).toBe("P1_critical");
      expect(checkPriorityEscalation("P3_medium", 8)).toBe("P1_critical");
    });
  });
});
