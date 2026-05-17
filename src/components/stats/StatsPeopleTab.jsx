import { useMemo, useState } from "react";

import {
  getShortZodiacLabel,
  getZodiacForLanguage,
  translateActivity,
  translateGender,
} from "@/lib/format";
import { ZODIAC_OPTIONS, TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import { calculateAge, calculateAgeAtEvent } from "@/lib/date";

import BarChartCard from "@/components/charts/BarChartCard";
import AgeRangeCard from "@/components/stats/AgeRangeCard";
import ActivityDonutCard from "@/components/stats/ActivityDonutCard";
import GenderDonutCard from "@/components/stats/GenderDonutCard";
import ZodiacRadarCard from "@/components/stats/ZodiacRadarCard";

/**
 * Renders the people-focused statistics tab.
 * It groups event and person data by zodiac, activity, gender, age, and name initials.
 */
export default function StatsPeopleTab({ people, t }) {
  const PALETTE = usePalette();
  const [ageAtEvent, setAgeAtEvent] = useState(false);

  // Counts people per zodiac sign, filling in zeros for all 12 signs.
  const personsByZodiac = useMemo(() => {
    const lang = t.studies === "estudia" ? "es" : "en";
    const allSigns = ZODIAC_OPTIONS[lang].map(getShortZodiacLabel);
    const map = new Map(allSigns.map((s) => [s, 0]));
    for (const person of people) {
      const key = getShortZodiacLabel(getZodiacForLanguage(person.zodiacSign, lang));
      if (map.has(key)) map.set(key, map.get(key) + 1);
    }
    return allSigns.map((label) => ({ label, value: map.get(label) }));
  }, [people, t]);

  // Counts people per translated activity label.
  const personsByActivity = useMemo(() => {
    const map = new Map();
    for (const person of people) {
      const label = translateActivity(person.activity, t);
      map.set(label, (map.get(label) || 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [people, t]);

  // Sums total events by zodiac sign keeping all 12 signs in zodiac order (for radar chart).
  const eventsByZodiacOrdered = useMemo(() => {
    const lang = t.studies === "estudia" ? "es" : "en";
    const allSigns = ZODIAC_OPTIONS[lang].map(getShortZodiacLabel);
    const map = new Map(allSigns.map((s) => [s, 0]));
    for (const person of people) {
      const key = getShortZodiacLabel(getZodiacForLanguage(person.zodiacSign, lang));
      if (map.has(key)) map.set(key, map.get(key) + (person.events?.length || 0));
    }
    return allSigns.map((label) => ({ label, value: map.get(label) }));
  }, [people, t]);

  // Sums total events by translated activity label.
  const eventsByActivity = useMemo(() => {
    const map = new Map();

    for (const person of people) {
      const label = translateActivity(person.activity, t);
      map.set(label, (map.get(label) || 0) + (person.events?.length || 0));
    }

    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [people, t]);

  // Counts how many people belong to each gender.
  const personsByGender = useMemo(() => {
    const map = new Map();

    for (const person of people) {
      const label = translateGender(person.gender, t);
      map.set(label, (map.get(label) || 0) + 1);
    }

    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [people, t]);

  // Sums total events by gender.
  const eventsByGender = useMemo(() => {
    const map = new Map();

    for (const person of people) {
      const label = translateGender(person.gender, t);
      map.set(label, (map.get(label) || 0) + (person.events?.length || 0));
    }

    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [people, t]);

  // Counts how many people exist for each age (current age), filling zeros for the full min–max range.
  const personsByAge = useMemo(() => {
    const ageMap = new Map();
    for (const person of people) {
      const age = calculateAge(person.birthYear, person.zodiacSign) ?? person.age;
      if (Number.isFinite(age)) ageMap.set(age, (ageMap.get(age) || 0) + 1);
    }
    if (!ageMap.size) return [];
    const min = Math.min(...ageMap.keys());
    const max = Math.max(...ageMap.keys());
    return Array.from({ length: max - min + 1 }, (_, i) => ({
      label: String(min + i),
      value: ageMap.get(min + i) || 0,
    }));
  }, [people]);

  // Counts how many people were at each age at the time of their events, filling zeros for the full min–max range.
  // A person contributes 1 to each distinct age they appeared at across all events.
  const personsByAgeAtEvent = useMemo(() => {
    const ageMap = new Map();
    for (const person of people) {
      const seenAges = new Set();
      for (const event of (person.events || [])) {
        const age = calculateAgeAtEvent(person.birthYear, person.zodiacSign, event.date) ?? person.age;
        if (Number.isFinite(age)) seenAges.add(age);
      }
      for (const age of seenAges) ageMap.set(age, (ageMap.get(age) || 0) + 1);
    }
    if (!ageMap.size) return [];
    const min = Math.min(...ageMap.keys());
    const max = Math.max(...ageMap.keys());
    return Array.from({ length: max - min + 1 }, (_, i) => ({
      label: String(min + i),
      value: ageMap.get(min + i) || 0,
    }));
  }, [people]);

  // Counts people grouped by the first letter of their name.
  const personsByFirstLetter = useMemo(() => {
    const spanishAlphabet = new Set("ABCDEFGHIJKLMNÑOPQRSTUVWXYZ");
    const map = new Map();

    for (const person of people) {
      const first = person.name?.[0]?.toUpperCase();
      const key = first && spanishAlphabet.has(first) ? first : "#";
      map.set(key, (map.get(key) || 0) + 1);
    }

    const spanishOrder = [...spanishAlphabet, "#"];
    return [...map.entries()]
      .sort((a, b) => spanishOrder.indexOf(a[0]) - spanishOrder.indexOf(b[0]))
      .map(([label, value]) => ({ label, value }));
  }, [people]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      <ZodiacRadarCard
        personsByZodiac={personsByZodiac}
        eventsByZodiac={eventsByZodiacOrdered}
        emptyText={t.noDataYet}
        t={t}
      />

      <ActivityDonutCard
        personsByActivity={personsByActivity}
        eventsByActivity={eventsByActivity}
        emptyText={t.noDataYet}
        t={t}
      />

      <GenderDonutCard
        personsByGender={personsByGender}
        eventsByGender={eventsByGender}
        emptyText={t.noDataYet}
        t={t}
      />

      <BarChartCard
        title={t.personsByAge}
        subtitle={ageAtEvent ? t.ageAtEventDesc : t.ageDistribution}
        data={ageAtEvent ? personsByAgeAtEvent : personsByAge}
        emptyText={t.noDataYet}
        maxXTicks={6}
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
        headerAction={
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
            <span style={{ ...TEXT.caption, color: ageAtEvent ? PALETTE.accent : PALETTE.textSoft }}>
              {t.ageAtEvent}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={ageAtEvent}
              onClick={() => setAgeAtEvent((prev) => !prev)}
              style={{
                width: "2.25rem",
                height: "1.25rem",
                borderRadius: "9999px",
                backgroundColor: ageAtEvent ? PALETTE.accent : PALETTE.line,
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background-color 0.2s",
                flexShrink: 0,
                padding: 0,
                outline: "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "0.125rem",
                  left: ageAtEvent ? "calc(100% - 1.125rem)" : "0.125rem",
                  width: "1rem",
                  height: "1rem",
                  borderRadius: "9999px",
                  backgroundColor: "white",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>
        }
      />

      <BarChartCard
        title={t.personsByFirstLetter}
        subtitle={t.firstLetterDist}
        data={personsByFirstLetter}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
      />

      <AgeRangeCard
        title={t.boxplotAgeRange}
        people={people}
        emptyText={t.noDataYet}
        t={t}
      />
    </div>
  );
}