import { describe, it, expect } from "vitest";
import { uid, normalizePeople, hexToRgb } from "@/lib/helpers";

describe("uid", () => {
  it("returns a non-empty alphanumeric string", () => {
    expect(uid()).toMatch(/^[a-z0-9]+$/);
  });
  it("returns a different value on each call", () => {
    expect(uid()).not.toBe(uid());
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
});
