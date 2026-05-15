import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isFutureDate,
  isValidDateString,
  todayString,
  formatDisplayDate,
  formatShortDate,
  getMonthKey,
  getYearKey,
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
