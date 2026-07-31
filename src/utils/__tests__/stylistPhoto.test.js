// src/utils/__tests__/stylistPhoto.test.js
import { getTimeOfDayBucket } from "../stylistPhoto";

describe("getTimeOfDayBucket", () => {
  it.each([
    [5, "morning"],
    [8, "morning"],
    [11, "morning"],
    [12, "afternoon"],
    [16, "afternoon"],
    [17, "evening"],
    [20, "evening"],
    [21, "night"],
    [2, "night"],
    [4, "night"],
  ])("classifies hour %i as %s", (hour, expected) => {
    const date = new Date(2026, 0, 1, hour);
    expect(getTimeOfDayBucket(date)).toBe(expected);
  });

  it("defaults to the current time when no date is given", () => {
    expect(["morning", "afternoon", "evening", "night"]).toContain(getTimeOfDayBucket());
  });
});
