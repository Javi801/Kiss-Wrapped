import { useMemo } from "react";

import {
  getShortZodiacLabel,
  translateActivity,
  translateGender,
  getColorForCategory,
} from "@/lib/format";

import BarChartCard from "@/components/charts/BarChartCard";
import PieChartCard from "@/components/charts/PieChartCard";
import AgeRangeCard from "@/components/stats/AgeRangeCard";

/**
 * Renders the people-focused statistics tab.
 * It groups event and person data by zodiac, activity, gender, age, and name initials.
 */
export default function StatsPeopleTab({ people, t }) {
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

  // Counts how many people exist for each age.
  const personsByAge = useMemo(() => {
    const map = new Map();

    for (const person of people) {
      map.set(String(person.age), (map.get(String(person.age)) || 0) + 1);
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
      />

      <BarChartCard
        title={t.eventsByActivity}
        subtitle={t.groupedByActivity}
        data={eventsByActivity}
        emptyText={t.noDataYet}
        rotateXLabels={true}
      />

      <PieChartCard
        title={t.personsByGender}
        subtitle={t.genderSplit}
        data={personsByGender}
        emptyText={t.noDataYet}
      />

      <BarChartCard
        title={t.eventsByGender}
        subtitle={t.eventsGenderSplit}
        data={eventsByGender}
        emptyText={t.noDataYet}
        customColors={genderColorMap}
      />

      <BarChartCard
        title={t.personsByAge}
        subtitle={t.ageDistribution}
        data={personsByAge}
        emptyText={t.noDataYet}
      />

      <BarChartCard
        title={t.personsByFirstLetter}
        subtitle={t.firstLetterDist}
        data={personsByFirstLetter}
        emptyText={t.noDataYet}
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