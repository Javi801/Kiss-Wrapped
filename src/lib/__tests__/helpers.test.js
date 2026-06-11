import { describe, it, expect } from "vitest";
import { uid, normalizePeople, hexToRgb, mergeEventTagsFromPeople, mergePeopleFieldTags } from "@/lib/helpers";

describe("uid", () => {
  it("returns a non-empty alphanumeric string", () => {
    expect(uid()).toMatch(/^[a-z0-9]+$/);
  });
  it("returns a different value on each call", () => {
    expect(uid()).not.toBe(uid());
  });
  it("generates 1000 unique values with no collisions", () => {
    const ids = Array.from({ length: 1000 }, uid);
    expect(new Set(ids).size).toBe(1000);
  });
});

describe("hexToRgb", () => {
  it("converts #ffffff to white", () => {
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });
  it("converts #000000 to black", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });
  it("converts a mixed hex color correctly", () => {
    expect(hexToRgb("#e27396")).toEqual({ r: 226, g: 115, b: 150 });
  });
  it("accepts hex without # prefix", () => {
    expect(hexToRgb("ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });
  it("accepts uppercase hex", () => {
    expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe("mergeEventTagsFromPeople", () => {
  const person = (values, field = "situation") => ({
    events: values.map((v) => ({ [field]: v })),
  });

  it("returns existing tags unchanged when people have no events", () => {
    expect(mergeEventTagsFromPeople([], ["Party"], "situation")).toEqual(["Party"]);
  });

  it("appends new values found in events for the given field", () => {
    expect(mergeEventTagsFromPeople([person(["Date"])], [], "situation")).toEqual(["Date"]);
  });

  it("works for a different field (place)", () => {
    expect(mergeEventTagsFromPeople([person(["Café"], "place")], [], "place")).toEqual(["Café"]);
  });

  it("preserves existing tags at the front", () => {
    const result = mergeEventTagsFromPeople([person(["Trip"])], ["Party"], "situation");
    expect(result).toEqual(["Party", "Trip"]);
  });

  it("skips values that already exist in tags (case-insensitive)", () => {
    expect(mergeEventTagsFromPeople([person(["party"])], ["Party"], "situation")).toEqual(["Party"]);
    expect(mergeEventTagsFromPeople([person(["PARTY"])], ["Party"], "situation")).toEqual(["Party"]);
  });

  it("deduplicates across events (case-insensitive)", () => {
    const result = mergeEventTagsFromPeople([person(["Date", "date", "DATE"])], [], "situation");
    expect(result).toEqual(["Date"]);
  });

  it("deduplicates across multiple people", () => {
    const people = [person(["Date"]), person(["date"])];
    expect(mergeEventTagsFromPeople(people, [], "situation")).toEqual(["Date"]);
  });

  it("ignores empty and whitespace-only values", () => {
    expect(mergeEventTagsFromPeople([person(["", "  "])], [], "situation")).toEqual([]);
  });

  it("trims whitespace before comparing", () => {
    expect(mergeEventTagsFromPeople([person(["  Date  "])], ["Date"], "situation")).toEqual(["Date"]);
  });

  it("preserves the casing of existing tags when a duplicate arrives", () => {
    const result = mergeEventTagsFromPeople([person(["trip"])], ["Trip"], "situation");
    expect(result[0]).toBe("Trip");
  });

  it("preserves the casing of the first new occurrence", () => {
    const result = mergeEventTagsFromPeople([person(["First Date", "first date"])], [], "situation");
    expect(result).toEqual(["First Date"]);
  });

  it("handles events without the requested field", () => {
    const people = [{ events: [{ score: 3 }, { situation: undefined }] }];
    expect(mergeEventTagsFromPeople(people, [], "situation")).toEqual([]);
  });

  it("handles people with no events field", () => {
    expect(mergeEventTagsFromPeople([{ name: "Ana" }], [], "situation")).toEqual([]);
  });

  it("does not mutate the existingTags array", () => {
    const existing = ["Party"];
    mergeEventTagsFromPeople([person(["Trip"])], existing, "situation");
    expect(existing).toEqual(["Party"]);
  });
});

describe("normalizePeople", () => {
  it("returns an empty array for null", () => {
    expect(normalizePeople(null)).toEqual([]);
  });
  it("returns an empty array for undefined", () => {
    expect(normalizePeople(undefined)).toEqual([]);
  });
  it("returns an empty array for a non-array", () => {
    expect(normalizePeople("string")).toEqual([]);
  });
  it("preserves valid scores", () => {
    const people = [{ name: "Ana", events: [{ score: 3 }] }];
    expect(normalizePeople(people)[0].events[0].score).toBe(3);
  });
  it("preserves score 0 as valid", () => {
    const people = [{ name: "Ana", events: [{ score: 0 }] }];
    expect(normalizePeople(people)[0].events[0].score).toBe(0);
  });
  it("nullifies scores above 5", () => {
    const people = [{ name: "Ana", events: [{ score: 99 }] }];
    expect(normalizePeople(people)[0].events[0].score).toBeNull();
  });
  it("nullifies negative scores", () => {
    const people = [{ name: "Ana", events: [{ score: -1 }] }];
    expect(normalizePeople(people)[0].events[0].score).toBeNull();
  });
  it("nullifies float scores", () => {
    const people = [{ name: "Ana", events: [{ score: 2.5 }] }];
    expect(normalizePeople(people)[0].events[0].score).toBeNull();
  });
  it("normalizes missing realName to empty string", () => {
    const people = [{ name: "Ana", events: [] }];
    expect(normalizePeople(people)[0].realName).toBe("");
  });
  it("normalizes null realName to empty string", () => {
    const people = [{ name: "Ana", realName: null, events: [] }];
    expect(normalizePeople(people)[0].realName).toBe("");
  });
  it("preserves a truthy realName unchanged", () => {
    const people = [{ name: "Ana", realName: "Ana García", events: [] }];
    expect(normalizePeople(people)[0].realName).toBe("Ana García");
  });
  it("replaces a missing events field with an empty array", () => {
    const people = [{ name: "Ana" }];
    expect(normalizePeople(people)[0].events).toEqual([]);
  });
  it("replaces a non-array events field with an empty array", () => {
    const people = [{ name: "Ana", events: null }];
    expect(normalizePeople(people)[0].events).toEqual([]);
  });
  it("preserves all other person fields", () => {
    const people = [{ name: "Ana", age: 30, gender: "female", events: [] }];
    const result = normalizePeople(people)[0];
    expect(result.age).toBe(30);
    expect(result.gender).toBe("female");
  });
  it("preserves place, situation and observations on events", () => {
    const people = [
      {
        name: "Ana",
        events: [{ place: "café", situation: "first date", observations: "nice", score: 3 }],
      },
    ];
    const event = normalizePeople(people)[0].events[0];
    expect(event.place).toBe("café");
    expect(event.situation).toBe("first date");
    expect(event.observations).toBe("nice");
  });
  it("preserves null detail and undefined observations on events unchanged", () => {
    const people = [{ name: "Ana", events: [{ detail: null, observations: undefined, score: 1 }] }];
    const event = normalizePeople(people)[0].events[0];
    expect(event.detail).toBeNull();
    expect(event.observations).toBeUndefined();
  });
});

describe("mergePeopleFieldTags", () => {
  it("returns existing tags unchanged when people array is empty", () => {
    expect(mergePeopleFieldTags([], ["Party"], "howWeMet")).toEqual(["Party"]);
  });

  it("appends new values found in person fields", () => {
    expect(mergePeopleFieldTags([{ howWeMet: "App" }], [], "howWeMet")).toEqual(["App"]);
  });

  it("works for a different person field (activity)", () => {
    expect(mergePeopleFieldTags([{ activity: "works" }], [], "activity")).toEqual(["works"]);
  });

  it("preserves existing tags at the front", () => {
    const result = mergePeopleFieldTags([{ howWeMet: "App" }], ["Friends"], "howWeMet");
    expect(result).toEqual(["Friends", "App"]);
  });

  it("skips values that already exist in tags (case-insensitive)", () => {
    expect(mergePeopleFieldTags([{ howWeMet: "app" }], ["App"], "howWeMet")).toEqual(["App"]);
    expect(mergePeopleFieldTags([{ howWeMet: "APP" }], ["App"], "howWeMet")).toEqual(["App"]);
  });

  it("deduplicates across multiple people", () => {
    const people = [{ howWeMet: "App" }, { howWeMet: "app" }];
    expect(mergePeopleFieldTags(people, [], "howWeMet")).toEqual(["App"]);
  });

  it("ignores empty and whitespace-only values", () => {
    expect(mergePeopleFieldTags([{ howWeMet: "" }, { howWeMet: "  " }], [], "howWeMet")).toEqual([]);
  });

  it("trims whitespace before comparing", () => {
    expect(mergePeopleFieldTags([{ howWeMet: "  App  " }], ["App"], "howWeMet")).toEqual(["App"]);
  });

  it("preserves casing of existing tags on duplicate", () => {
    const result = mergePeopleFieldTags([{ howWeMet: "app" }], ["App"], "howWeMet");
    expect(result[0]).toBe("App");
  });

  it("preserves casing of first new occurrence", () => {
    const people = [{ howWeMet: "First Date" }, { howWeMet: "first date" }];
    expect(mergePeopleFieldTags(people, [], "howWeMet")).toEqual(["First Date"]);
  });

  it("skips people without the requested field", () => {
    expect(mergePeopleFieldTags([{ name: "Ana" }], [], "howWeMet")).toEqual([]);
  });

  it("does not mutate the existingTags array", () => {
    const existing = ["Friends"];
    mergePeopleFieldTags([{ howWeMet: "App" }], existing, "howWeMet");
    expect(existing).toEqual(["Friends"]);
  });
});
