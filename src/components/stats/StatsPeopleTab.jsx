import { useMemo, useState } from "react";

import {
  getShortZodiacLabel,
  getZodiacForLanguage,
  translateActivity,
  translateGender,
} from "@/lib/format";
import { ZODIAC_OPTIONS } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import { calculateAge, calculateAgeAtEvent } from "@/lib/date";

import BarChartCard from "@/components/charts/BarChartCard";
import AreaChartCard from "@/components/charts/AreaChartCard";
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

  // Groups people by how many events they have, filling all integers from 0 to max.
  const numberOfEventsByNumberOfPersons = useMemo(() => {
    const map = new Map();

    for (const person of people) {
      const eventCount = person.events?.length || 0;
      map.set(eventCount, (map.get(eventCount) || 0) + 1);
    }

    if (map.size === 0) return [];
    const maxCount = Math.max(...map.keys());
    return Array.from({ length: maxCount + 1 }, (_, i) => ({
      label: String(i),
      value: map.get(i) || 0,
    }));
  }, [people]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <BarChartCard
        title={t.personsByFirstLetter}
        subtitle={t.firstLetterDist}
        data={personsByFirstLetter}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
        showAllTicks
      />

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
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
        tabs={
          <div style={{ display: "flex", gap: "0.25rem", padding: "0.25rem", background: PALETTE.accentMuted, borderRadius: "0.875rem", marginTop: "0.5rem" }}>
            {[{ label: t.ageCurrent, value: false }, { label: t.ageAtEvent, value: true }].map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setAgeAtEvent(value)}
                style={{
                  flex: 1,
                  padding: "0.3rem 0",
                  borderRadius: "0.625rem",
                  border: "none",
                  fontSize: "0.75rem",
                  fontWeight: ageAtEvent === value ? 600 : 400,
                  background: ageAtEvent === value ? `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})` : "transparent",
                  color: ageAtEvent === value ? "white" : PALETTE.textSoft,
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      <AgeRangeCard
        title={t.boxplotAgeRange}
        people={people}
        emptyText={t.noDataYet}
        t={t}
      />

      <AreaChartCard
        title={t.eventsByPersonCount}
        subtitle={t.eventCountBuckets}
        data={numberOfEventsByNumberOfPersons}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
      />
    </div>
  );
}
