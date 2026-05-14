import { describe, it, expect } from "vitest";
import { COPY } from "@/lib/constants";
import { getFirstEventDate, getLastEventDate, getStatsData } from "@/lib/stats";

const t = COPY.en;

const makePerson = (name, events = [], extra = {}) => ({
  id: name.toLowerCase(),
  name,
  age: 25,
  gender: "female",
  zodiacSign: "♒ Aquarius (January 20 - February 19)",
  activity: "works",
  howWeMet: "app",
  events,
  ...extra,
});

const makeEvent = (date, score = null, details = "test detail") => ({
  id: `${date}-${score}`,
  date,
  score,
  details,
});

describe("getFirstEventDate", () => {
  it("returns null for a person with no events", () => {
    expect(getFirstEventDate(makePerson("Ana"))).toBeNull();
  });
  it("returns null when events is undefined", () => {
    expect(getFirstEventDate({ name: "Ana" })).toBeNull();
  });
  it("returns the only event date when there is one", () => {
    const p = makePerson("Ana", [makeEvent("2024.03.15")]);
    expect(getFirstEventDate(p)).toBe("2024.03.15");
  });
  it("returns the earliest date among multiple events", () => {
    const p = makePerson("Ana", [
      makeEvent("2024.06.01"),
      makeEvent("2023.01.15"),
      makeEvent("2024.01.01"),
    ]);
    expect(getFirstEventDate(p)).toBe("2023.01.15");
  });
  it("does not mutate the original events array", () => {
    const events = [makeEvent("2024.06.01"), makeEvent("2023.01.15")];
    const p = makePerson("Ana", events);
    getFirstEventDate(p);
    expect(p.events[0].date).toBe("2024.06.01");
  });
});
