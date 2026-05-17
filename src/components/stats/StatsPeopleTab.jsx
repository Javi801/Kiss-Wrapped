import { useMemo, useState } from "react";

import {
  getShortZodiacLabel,
  translateActivity,
  translateGender,
  getColorForCategory,
} from "@/lib/format";
import { ZODIAC_OPTIONS, TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import { calculateAge, calculateAgeAtEvent } from "@/lib/date";

import BarChartCard from "@/components/charts/BarChartCard";
import PieChartCard from "@/components/charts/PieChartCard";
import RadarChartCard from "@/components/charts/RadarChartCard";
import AgeRangeCard from "@/components/stats/AgeRangeCard";

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
      const key = getShortZodiacLabel(person.zodiacSign);
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

  // Sums total events by zodiac sign. The displayed label uses the short zodiac name only.
  const eventsByZodiac = useMemo(() => {
    const map = new Map();

    for (const person of people) {
      const key = getShortZodiacLabel(person.zodiacSign);
      map.set(key, (map.get(key) || 0) + (person.events?.length || 0));
    }

    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [people]);

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

  // Counts how many people exist for each age (current age).
  const personsByAge = useMemo(() => {
    const map = new Map();

    for (const person of people) {
      const age = calculateAge(person.birthYear, person.zodiacSign) ?? person.age;
      const key = String(age);
      if (key !== "undefined" && key !== "null") map.set(key, (map.get(key) || 0) + 1);
    }

    return [...map.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([label, value]) => ({ label, value }));
  }, [people]);

  // Counts how many people were at each age at the time of their events.
  // A person contributes 1 to each distinct age they appeared at across all events.
  const personsByAgeAtEvent = useMemo(() => {
    const map = new Map();

    for (const person of people) {
      const seenAges = new Set();
      for (const event of (person.events || [])) {
        const age = calculateAgeAtEvent(person.birthYear, person.zodiacSign, event.date) ?? person.age;
        const key = String(age);
        if (key !== "undefined" && key !== "null") seenAges.add(key);
      }
      for (const key of seenAges) map.set(key, (map.get(key) || 0) + 1);
    }

    return [...map.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([label, value]) => ({ label, value }));
  }, [people]);

  // Counts people grouped by the first letter of their name.
  const personsByFirstLetter = useMemo(() => {
    const map = new Map();

    for (const person of people) {
      const key = person.name?.[0]?.toUpperCase() || "#";
      map.set(key, (map.get(key) || 0) + 1);
    }

    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));
  }, [people]);

  /**
   * Builds a custom color map for gender-related labels.
   * This keeps gender charts visually consistent across datasets.
   */
  const genderColorMap = useMemo(() => {
    const map = {};

    for (const item of [...personsByGender, ...eventsByGender]) {
      const custom = getColorForCategory(item.label);
      if (custom) map[item.label] = custom;
    }

    return map;
  }, [personsByGender, eventsByGender]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <BarChartCard
        title={t.eventsByZodiac}
        subtitle={t.groupedBySign}
        data={eventsByZodiac}
        emptyText={t.noDataYet}
        rotateXLabels={true}
        tooltipUnit={{ one: t.chartEvent, many: t.chartEvents }}
      />

      <RadarChartCard
        title={t.personsByZodiac}
        subtitle={t.zodiacDistribution}
        data={personsByZodiac}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
      />

      <BarChartCard
        title={t.eventsByActivity}
        subtitle={t.groupedByActivity}
        data={eventsByActivity}
        emptyText={t.noDataYet}
        rotateXLabels={true}
        tooltipUnit={{ one: t.chartEvent, many: t.chartEvents }}
      />

      <PieChartCard
        title={t.personsByActivity}
        subtitle={t.activityDistribution}
        data={personsByActivity}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
      />

      <PieChartCard
        title={t.personsByGender}
        subtitle={t.genderSplit}
        data={personsByGender}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartPerson, many: t.chartPersons }}
      />

      <BarChartCard
        title={t.eventsByGender}
        subtitle={t.eventsGenderSplit}
        data={eventsByGender}
        emptyText={t.noDataYet}
        customColors={genderColorMap}
        tooltipUnit={{ one: t.chartEvent, many: t.chartEvents }}
      />

      <BarChartCard
        title={t.personsByAge}
        subtitle={ageAtEvent ? t.ageAtEventDesc : t.ageDistribution}
        data={ageAtEvent ? personsByAgeAtEvent : personsByAge}
        emptyText={t.noDataYet}
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