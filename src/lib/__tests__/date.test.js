import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isValidDateString,
  todayString,
  formatDisplayDate,
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

