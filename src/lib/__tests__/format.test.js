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

describe("translateGender", () => {
  it('translates "male"', () => {
    expect(translateGender("male", t)).toBe(t.male);
  });
  it('translates "female"', () => {
    expect(translateGender("female", t)).toBe(t.female);
  });
  it("falls back to other for unknown values", () => {
    expect(translateGender("nonbinary", t)).toBe(t.other);
  });
});

describe("personHasIncompleteEvent", () => {
  it("returns false when all events have details", () => {
    const person = { events: [{ details: "coffee" }, { details: "dinner" }] };
    expect(personHasIncompleteEvent(person)).toBe(false);
  });
  it("returns true when at least one event has empty details", () => {
    const person = { events: [{ details: "coffee" }, { details: "" }] };
    expect(personHasIncompleteEvent(person)).toBe(true);
  });
  it("returns true when details is only whitespace", () => {
    const person = { events: [{ details: "   " }] };
    expect(personHasIncompleteEvent(person)).toBe(true);
  });
  it("returns false for an empty events array", () => {
    const person = { events: [] };
    expect(personHasIncompleteEvent(person)).toBe(false);
  });
  it("returns false when events is undefined", () => {
    const person = {};
    expect(personHasIncompleteEvent(person)).toBe(false);
  });
});

describe("getShortZodiacLabel", () => {
  it("strips the emoji and parenthetical from an English zodiac string", () => {
    expect(
      getShortZodiacLabel("♒ Aquarius (January 20 - February 19)")
    ).toBe("Aquarius");
  });
  it("handles a Spanish zodiac string with an accented character", () => {
    expect(getShortZodiacLabel("♊ Géminis (21 mayo - 20 junio)")).toBe(
      "Géminis"
    );
  });
  it("returns empty string for null", () => {
    expect(getShortZodiacLabel(null)).toBe("");
  });
  it("returns empty string for undefined", () => {
    expect(getShortZodiacLabel(undefined)).toBe("");
  });
  it("returns empty string for an empty string", () => {
    expect(getShortZodiacLabel("")).toBe("");
  });
});

describe("getColorForCategory", () => {
  it('returns male color for "male"', () => {
    expect(getColorForCategory("male")).toBe(GENDER_COLORS.male);
  });
  it('returns female color for "female"', () => {
    expect(getColorForCategory("female")).toBe(GENDER_COLORS.female);
  });
  it('returns other color for "other"', () => {
    expect(getColorForCategory("other")).toBe(GENDER_COLORS.other);
  });
  it('returns male color for "masculino" (Spanish)', () => {
    expect(getColorForCategory("masculino")).toBe(GENDER_COLORS.male);
  });
  it('returns female color for "femenino" (Spanish)', () => {
    expect(getColorForCategory("femenino")).toBe(GENDER_COLORS.female);
  });
  it('returns other color for "otro" (Spanish)', () => {
    expect(getColorForCategory("otro")).toBe(GENDER_COLORS.other);
  });
  it("returns null for an unrecognized label", () => {
    expect(getColorForCategory("zodiac")).toBeNull();
  });
});
