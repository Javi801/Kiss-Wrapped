import { describe, it, expect } from "vitest";
import { COPY, GENDER_COLORS } from "@/lib/constants";
import {
  translateActivity,
  translateGender,
  eventIsMissingRequired,
  personHasIncompleteEvent,
  hasScore,
  renderKisses,
  getShortZodiacLabel,
  getZodiacForLanguage,
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
  it("returns noScore text for score 0", () => {
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

const COMPLETE_PERSON = {
  name: "Ana",
  birthYear: 2000,
  gender: "female",
  howWeMet: "school",
  zodiacSign: "♒ Aquarius",
  activity: "studies",
  events: [{ place: "café", situation: "first date" }],
};

describe("eventIsMissingRequired", () => {
  it("returns false when both place and situation are present", () => {
    expect(eventIsMissingRequired({ place: "café", situation: "first date" })).toBe(false);
  });
  it("returns true when place is absent", () => {
    expect(eventIsMissingRequired({ situation: "first date" })).toBe(true);
  });
  it("returns true when place is an empty string", () => {
    expect(eventIsMissingRequired({ place: "", situation: "first date" })).toBe(true);
  });
  it("returns true when place is only whitespace", () => {
    expect(eventIsMissingRequired({ place: "   ", situation: "first date" })).toBe(true);
  });
  it("returns true when situation is absent", () => {
    expect(eventIsMissingRequired({ place: "café" })).toBe(true);
  });
  it("returns true when situation is an empty string", () => {
    expect(eventIsMissingRequired({ place: "café", situation: "" })).toBe(true);
  });
  it("returns true when situation is only whitespace", () => {
    expect(eventIsMissingRequired({ place: "café", situation: "   " })).toBe(true);
  });
  it("returns true when both fields are absent", () => {
    expect(eventIsMissingRequired({})).toBe(true);
  });
});

describe("personHasIncompleteEvent", () => {
  it("returns false when all person and event fields are complete", () => {
    expect(personHasIncompleteEvent(COMPLETE_PERSON)).toBe(false);
  });
  it("returns false for a complete person with no events", () => {
    expect(personHasIncompleteEvent({ ...COMPLETE_PERSON, events: [] })).toBe(false);
  });
  it("returns false when events is undefined", () => {
    const { events: _, ...noEvents } = COMPLETE_PERSON;
    expect(personHasIncompleteEvent(noEvents)).toBe(false);
  });
  it("returns true when name is missing", () => {
    expect(personHasIncompleteEvent({ ...COMPLETE_PERSON, name: "" })).toBe(true);
  });
  it("returns true when birthYear is missing", () => {
    expect(personHasIncompleteEvent({ ...COMPLETE_PERSON, birthYear: null })).toBe(true);
  });
  it("returns true when gender is missing", () => {
    expect(personHasIncompleteEvent({ ...COMPLETE_PERSON, gender: "" })).toBe(true);
  });
  it("returns true when zodiacSign is missing", () => {
    expect(personHasIncompleteEvent({ ...COMPLETE_PERSON, zodiacSign: "" })).toBe(true);
  });
  it("returns true when activity is missing", () => {
    expect(personHasIncompleteEvent({ ...COMPLETE_PERSON, activity: "" })).toBe(true);
  });
  it("returns true when an event is missing place", () => {
    const person = { ...COMPLETE_PERSON, events: [{ situation: "first date" }] };
    expect(personHasIncompleteEvent(person)).toBe(true);
  });
  it("returns true when an event is missing situation", () => {
    const person = { ...COMPLETE_PERSON, events: [{ place: "café" }] };
    expect(personHasIncompleteEvent(person)).toBe(true);
  });
  it("returns true when only the second event is incomplete", () => {
    const person = {
      ...COMPLETE_PERSON,
      events: [
        { place: "café", situation: "first date" },
        { place: "park" },
      ],
    };
    expect(personHasIncompleteEvent(person)).toBe(true);
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

describe("getZodiacForLanguage", () => {
  it("translates an English zodiac string to Spanish", () => {
    expect(getZodiacForLanguage("♒ Aquarius (January 20 - February 19)", "es"))
      .toBe("♒ Acuario (20 enero - 19 febrero)");
  });
  it("translates a Spanish zodiac string to English", () => {
    expect(getZodiacForLanguage("♒ Acuario (20 enero - 19 febrero)", "en"))
      .toBe("♒ Aquarius (January 20 - February 19)");
  });
  it("returns the string unchanged when the language already matches", () => {
    const sign = "♒ Aquarius (January 20 - February 19)";
    expect(getZodiacForLanguage(sign, "en")).toBe(sign);
  });
  it("returns the original string when the emoji is not found in options", () => {
    expect(getZodiacForLanguage("? Unknown sign", "en")).toBe("? Unknown sign");
  });
  it("returns null for null", () => {
    expect(getZodiacForLanguage(null, "en")).toBeNull();
  });
  it("returns empty string for empty string", () => {
    expect(getZodiacForLanguage("", "es")).toBe("");
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
