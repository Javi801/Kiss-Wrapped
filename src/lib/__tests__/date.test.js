import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isFutureDate,
  isValidDateString,
  todayString,
  formatDisplayDate,
  formatShortDate,
  getMonthKey,
  getYearKey,
  getZodiacEndDate,
  getZodiacStartDate,
  isWithinZodiacPeriod,
  calculateAge,
  calculateAgeAtEvent,
  deriveBirthYear,
} from "@/lib/date";

describe("isValidDateString", () => {
  it("accepts a valid date", () => {
    expect(isValidDateString("2024.03.15")).toBe(true);
  });
  it("accepts the first day of a month", () => {
    expect(isValidDateString("2024.01.01")).toBe(true);
  });
  it("rejects dash separators", () => {
    expect(isValidDateString("2024-03-15")).toBe(false);
  });
  it("rejects slash separators", () => {
    expect(isValidDateString("2024/03/15")).toBe(false);
  });
  it("rejects month 00", () => {
    expect(isValidDateString("2024.00.15")).toBe(false);
  });
  it("rejects month 13", () => {
    expect(isValidDateString("2024.13.01")).toBe(false);
  });
  it("rejects day 00", () => {
    expect(isValidDateString("2024.01.00")).toBe(false);
  });
  it("rejects day 32", () => {
    expect(isValidDateString("2024.01.32")).toBe(false);
  });
  it("rejects Feb 30", () => {
    expect(isValidDateString("2024.02.30")).toBe(false);
  });
  it("accepts Feb 29 on a leap year", () => {
    expect(isValidDateString("2024.02.29")).toBe(true);
  });
  it("rejects Feb 29 on a non-leap year", () => {
    expect(isValidDateString("2023.02.29")).toBe(false);
  });
  it("rejects an empty string", () => {
    expect(isValidDateString("")).toBe(false);
  });
  it("rejects null", () => {
    expect(isValidDateString(null)).toBe(false);
  });
  it("rejects undefined", () => {
    expect(isValidDateString(undefined)).toBe(false);
  });
  it("rejects a partial string", () => {
    expect(isValidDateString("2024.03")).toBe(false);
  });
});

describe("todayString", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns today formatted as yyyy.MM.dd", () => {
    vi.setSystemTime(new Date("2024-06-15T12:00:00"));
    expect(todayString()).toBe("2024.06.15");
  });
  it("pads single-digit month and day with zeros", () => {
    vi.setSystemTime(new Date("2024-01-05T12:00:00"));
    expect(todayString()).toBe("2024.01.05");
  });
});

describe("formatDisplayDate", () => {
  it("converts yyyy.MM.dd to dd/MM/yyyy", () => {
    expect(formatDisplayDate("2024.03.15")).toBe("15/03/2024");
  });
  it("returns em dash for an empty string", () => {
    expect(formatDisplayDate("")).toBe("—");
  });
  it("returns the raw value for an invalid string", () => {
    expect(formatDisplayDate("bad")).toBe("bad");
  });
  it("returns em dash for undefined", () => {
    expect(formatDisplayDate(undefined)).toBe("—");
  });
});

describe("getMonthKey", () => {
  it("extracts yyyy-MM from a valid date", () => {
    expect(getMonthKey("2024.03.15")).toBe("2024-03");
  });
  it("returns null for an invalid date", () => {
    expect(getMonthKey("bad")).toBeNull();
  });
  it("returns null for an empty string", () => {
    expect(getMonthKey("")).toBeNull();
  });
});

describe("getYearKey", () => {
  it("extracts yyyy from a valid date", () => {
    expect(getYearKey("2024.03.15")).toBe("2024");
  });
  it("returns null for an invalid date", () => {
    expect(getYearKey("bad")).toBeNull();
  });
  it("returns null for an empty string", () => {
    expect(getYearKey("")).toBeNull();
  });
});

describe("formatShortDate", () => {
  it("formats a valid date in English", () => {
    expect(formatShortDate("2024.01.15")).toMatch(/15\s+Jan\s+2024/i);
  });
  it("formats a valid date in Spanish", () => {
    expect(formatShortDate("2024.01.15", "es")).toMatch(/15\s+ene\s+2024/i);
  });
  it("returns em dash for an empty string", () => {
    expect(formatShortDate("")).toBe("—");
  });
  it("returns the raw value for an invalid date string", () => {
    expect(formatShortDate("bad")).toBe("bad");
  });
  it("returns em dash for undefined", () => {
    expect(formatShortDate(undefined)).toBe("—");
  });
});

describe("isFutureDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for a date strictly after today", () => {
    expect(isFutureDate("2024.06.16")).toBe(true);
  });
  it("returns true for a date in a future month", () => {
    expect(isFutureDate("2024.07.01")).toBe(true);
  });
  it("returns false for today", () => {
    expect(isFutureDate("2024.06.15")).toBe(false);
  });
  it("returns false for a past date", () => {
    expect(isFutureDate("2024.06.14")).toBe(false);
  });
  it("returns false for a date in a past year", () => {
    expect(isFutureDate("2023.12.31")).toBe(false);
  });
  it("returns false for an invalid date string", () => {
    expect(isFutureDate("not-a-date")).toBe(false);
  });
  it("returns false for null", () => {
    expect(isFutureDate(null)).toBe(false);
  });
  it("returns false for undefined", () => {
    expect(isFutureDate(undefined)).toBe(false);
  });
});

const ARIES_EN = "♈ Aries (March 21 - April 19)";
const ARIES_ES = "♈ Aries (21 marzo - 19 abril)";
const CAPRICORN_EN = "♑ Capricorn (December 22 - January 19)";

describe("getZodiacEndDate", () => {
  it("parses the end date from an English zodiac string", () => {
    expect(getZodiacEndDate(ARIES_EN)).toEqual({ month: 4, day: 19 });
  });
  it("parses the end date from a Spanish zodiac string", () => {
    expect(getZodiacEndDate(ARIES_ES)).toEqual({ month: 4, day: 19 });
  });
  it("handles Capricorn whose period ends in January", () => {
    expect(getZodiacEndDate(CAPRICORN_EN)).toEqual({ month: 1, day: 19 });
  });
  it("returns null for null", () => {
    expect(getZodiacEndDate(null)).toBeNull();
  });
  it("returns null for an empty string", () => {
    expect(getZodiacEndDate("")).toBeNull();
  });
  it("returns null when the end date uses an unknown month name", () => {
    expect(getZodiacEndDate("♈ Aries (March 21 - Foo 19)")).toBeNull();
  });
  it("returns null when the date range separator is missing", () => {
    expect(getZodiacEndDate("♈ Aries (March 21 April 19)")).toBeNull();
  });
});

describe("getZodiacStartDate", () => {
  it("parses the start date from an English zodiac string", () => {
    expect(getZodiacStartDate(ARIES_EN)).toEqual({ month: 3, day: 21 });
  });
  it("parses the start date from a Spanish zodiac string", () => {
    expect(getZodiacStartDate(ARIES_ES)).toEqual({ month: 3, day: 21 });
  });
  it("handles Capricorn whose period starts in December", () => {
    expect(getZodiacStartDate(CAPRICORN_EN)).toEqual({ month: 12, day: 22 });
  });
  it("returns null for null", () => {
    expect(getZodiacStartDate(null)).toBeNull();
  });
  it("returns null for an empty string", () => {
    expect(getZodiacStartDate("")).toBeNull();
  });
  it("returns null when the start date uses an unknown Spanish month name", () => {
    expect(getZodiacStartDate("♈ Aries (21 foo - 19 abril)")).toBeNull();
  });
});

describe("isWithinZodiacPeriod", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("returns true when today is within the period", () => {
    vi.setSystemTime(new Date("2026-04-05T12:00:00"));
    expect(isWithinZodiacPeriod(ARIES_EN)).toBe(true);
  });
  it("returns true on the start day", () => {
    vi.setSystemTime(new Date("2026-03-21T12:00:00"));
    expect(isWithinZodiacPeriod(ARIES_EN)).toBe(true);
  });
  it("returns true on the end day", () => {
    vi.setSystemTime(new Date("2026-04-19T12:00:00"));
    expect(isWithinZodiacPeriod(ARIES_EN)).toBe(true);
  });
  it("returns false the day after the period ends", () => {
    vi.setSystemTime(new Date("2026-04-20T12:00:00"));
    expect(isWithinZodiacPeriod(ARIES_EN)).toBe(false);
  });
  it("returns false before the period starts", () => {
    vi.setSystemTime(new Date("2026-03-10T12:00:00"));
    expect(isWithinZodiacPeriod(ARIES_EN)).toBe(false);
  });
  it("returns true for Capricorn in January (year-spanning)", () => {
    vi.setSystemTime(new Date("2026-01-10T12:00:00"));
    expect(isWithinZodiacPeriod(CAPRICORN_EN)).toBe(true);
  });
  it("returns true for Capricorn in December (year-spanning)", () => {
    vi.setSystemTime(new Date("2026-12-25T12:00:00"));
    expect(isWithinZodiacPeriod(CAPRICORN_EN)).toBe(true);
  });
  it("returns false for Capricorn in February (outside year-spanning period)", () => {
    vi.setSystemTime(new Date("2026-02-01T12:00:00"));
    expect(isWithinZodiacPeriod(CAPRICORN_EN)).toBe(false);
  });
  it("returns false for null", () => {
    expect(isWithinZodiacPeriod(null)).toBe(false);
  });
});

describe("calculateAge", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("returns currentYear - birthYear after the zodiac end", () => {
    vi.setSystemTime(new Date("2026-04-20T12:00:00")); // day after Aries ends
    expect(calculateAge(2000, ARIES_EN)).toBe(26);
  });
  it("returns currentYear - birthYear - 1 before the zodiac end", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00")); // before Aries start
    expect(calculateAge(2000, ARIES_EN)).toBe(25);
  });
  it("returns currentYear - birthYear - 1 within the period before the end", () => {
    vi.setSystemTime(new Date("2026-04-05T12:00:00")); // within Aries, before April 19
    expect(calculateAge(2000, ARIES_EN)).toBe(25);
  });
  it("returns null for null birthYear", () => {
    expect(calculateAge(null, ARIES_EN)).toBeNull();
  });
  it("returns null for null zodiacSign", () => {
    expect(calculateAge(2000, null)).toBeNull();
  });
  it("returns null for an unrecognized zodiac sign", () => {
    expect(calculateAge(2000, "Unknown Sign")).toBeNull();
  });
});

describe("deriveBirthYear", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("returns currentYear - age after the zodiac end", () => {
    vi.setSystemTime(new Date("2026-04-20T12:00:00")); // after Aries ends April 19
    expect(deriveBirthYear(26, ARIES_EN)).toBe(2000);
  });
  it("returns currentYear - age - 1 before the zodiac end", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00")); // before Aries
    expect(deriveBirthYear(25, ARIES_EN)).toBe(2000);
  });
  it("with birthdayAlreadyHappened=true inside the period uses currentYear - age", () => {
    vi.setSystemTime(new Date("2026-04-05T12:00:00")); // within Aries
    expect(deriveBirthYear(25, ARIES_EN, true)).toBe(2001);
  });
  it("with birthdayAlreadyHappened=false inside the period uses currentYear - age - 1", () => {
    vi.setSystemTime(new Date("2026-04-05T12:00:00")); // within Aries
    expect(deriveBirthYear(25, ARIES_EN, false)).toBe(2000);
  });
  it("deriveBirthYear and calculateAge are inverses (after zodiac end)", () => {
    vi.setSystemTime(new Date("2026-04-20T12:00:00"));
    const birthYear = deriveBirthYear(26, ARIES_EN);
    expect(calculateAge(birthYear, ARIES_EN)).toBe(26);
  });
  it("deriveBirthYear and calculateAge are inverses (before zodiac end)", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00"));
    const birthYear = deriveBirthYear(25, ARIES_EN);
    expect(calculateAge(birthYear, ARIES_EN)).toBe(25);
  });
  it("falls back to currentYear - age for an unrecognized zodiac sign", () => {
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));
    expect(deriveBirthYear(25, "Unknown Sign")).toBe(2001);
  });
});

describe("calculateAgeAtEvent", () => {
  it("returns null when birthYear is missing", () => {
    expect(calculateAgeAtEvent(null, ARIES_EN, "2026.04.20")).toBeNull();
  });

  it("returns null when event date is missing", () => {
    expect(calculateAgeAtEvent(2000, ARIES_EN, "")).toBeNull();
  });

  it("falls back to calendar-year age when zodiac sign is missing", () => {
    expect(calculateAgeAtEvent(2000, null, "2026.04.20")).toBe(26);
  });

  it("falls back to calendar-year age when zodiac sign cannot be parsed", () => {
    expect(calculateAgeAtEvent(2000, "Unknown Sign", "2026.04.20")).toBe(26);
  });

  it("uses the zodiac end date to calculate age at an event", () => {
    expect(calculateAgeAtEvent(2000, ARIES_EN, "2026.04.18")).toBe(25);
    expect(calculateAgeAtEvent(2000, ARIES_EN, "2026.04.19")).toBe(26);
  });
});
