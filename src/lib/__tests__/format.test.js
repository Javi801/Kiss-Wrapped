import { describe, it, expect } from "vitest";
import { COPY, GENDER_COLORS } from "@/lib/constants";
import {
  translateActivity,
  translateGender,
  personHasIncompleteEvent,
  hasScore,
  renderKisses,
  getShortZodiacLabel,
  getColorForCategory,
} from "@/lib/format";

const t = COPY.en;

describe("hasScore", () => {
  it("accepts 0", () => {
    expect(hasScore(0)).toBe(true);
  });
  it("accepts 5", () => {
    expect(hasScore(5)).toBe(true);
  });
  it("accepts all integers 1 through 4", () => {
    for (let i = 1; i <= 4; i++) expect(hasScore(i)).toBe(true);
  });
  it("rejects -1", () => {
    expect(hasScore(-1)).toBe(false);
  });
  it("rejects 6", () => {
    expect(hasScore(6)).toBe(false);
  });
  it("rejects a float", () => {
    expect(hasScore(2.5)).toBe(false);
  });
  it("rejects null", () => {
    expect(hasScore(null)).toBe(false);
  });
  it("rejects undefined", () => {
    expect(hasScore(undefined)).toBe(false);
  });
  it("rejects a numeric string", () => {
    expect(hasScore("3")).toBe(false);
  });
});

describe("renderKisses", () => {
  it("returns one 💋 for score 1", () => {
    expect(renderKisses(1, t)).toBe("💋");
  });
  it("returns three 💋 for score 3", () => {
    expect(renderKisses(3, t)).toBe("💋💋💋");
  });
  it("returns five 💋 for max score 5", () => {
    expect(renderKisses(5, t)).toBe("💋💋💋💋💋");
  });
  it("returns noScore text for score 0 (no kisses)", () => {
    expect(renderKisses(0, t)).toBe(t.noScore);
  });
  it("returns noScore text for null", () => {
    expect(renderKisses(null, t)).toBe(t.noScore);
  });
  it("returns noScore text for an invalid score", () => {
    expect(renderKisses(99, t)).toBe(t.noScore);
  });
});

describe("translateActivity", () => {
  it('translates "studies"', () => {
    expect(translateActivity("studies", t)).toBe(t.studies);
  });
  it('translates "works"', () => {
    expect(translateActivity("works", t)).toBe(t.works);
  });
  it('translates "studies and works"', () => {
    expect(translateActivity("studies and works", t)).toBe(t.studiesWorks);
  });
  it("falls back to other for unknown values", () => {
    expect(translateActivity("retired", t)).toBe(t.other);
  });
});

