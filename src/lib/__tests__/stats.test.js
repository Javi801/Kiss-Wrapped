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
