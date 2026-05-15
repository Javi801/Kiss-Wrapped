import { useMemo, useState } from "react";
import { Search, Filter, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { PALETTE, TEXT } from "@/lib/constants";
import { formatDisplayDate } from "@/lib/date";
import { getFirstEventDate, getLastEventDate } from "@/lib/stats";

import EmptyState from "@/components/people/EmptyState";
import PersonCard from "@/components/person/PersonCard";
import FiltersPanel from "@/components/forms/FiltersPanel";

/**
 * Displays the full people list with search, filters, sorting, and grouping.
 * It keeps all list-specific UI state isolated from the app root.
 */
export default function PeopleManagerScreen({
  people,
  onUpdatePerson,
  onDeletePerson,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onDeleteAllEvents,
  t,
  language,
}) {
  // Search query entered by the user.
  const [query, setQuery] = useState("");

  // Active filter values for the list.
  const [filters, setFilters] = useState({
    minAge: "",
    maxAge: "",
    activity: [],
    zodiacSign: [],
    eventDateFrom: "",
    eventDateTo: "",
  });

  // Current grouping mode.
  const [groupBy, setGroupBy] = useState("name");

  // Current sorting mode.
  const [sortBy, setSortBy] = useState("name");

  /**
   * Filters and sorts the people list.
   * Search checks name, detail, howWeMet, and event details.
   */
  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase();

    const result = people.filter((person) => {
      // Build one searchable text block for simple matching.
      const searchable = [
        person.name,
        person.detail || "",
        person.howWeMet || "",
        ...(person.events || []).map((event) => event.details || ""),
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !q || searchable.includes(q);
      const matchesMinAge =
        !filters.minAge || person.age >= Number(filters.minAge);
      const matchesMaxAge =
        !filters.maxAge || person.age <= Number(filters.maxAge);
      const matchesActivity =
        filters.activity.length === 0 || filters.activity.includes(person.activity);
      const matchesZodiac =
        filters.zodiacSign.length === 0 || filters.zodiacSign.includes(person.zodiacSign);
      const matchesEventDate = (() => {
        if (!filters.eventDateFrom && !filters.eventDateTo) return true;
        return (person.events || []).some((event) => {
          if (!event.date) return false;
          if (filters.eventDateFrom && event.date < filters.eventDateFrom) return false;
          if (filters.eventDateTo && event.date > filters.eventDateTo) return false;
          return true;
        });
      })();

      return (
        matchesQuery &&
        matchesMinAge &&
        matchesMaxAge &&
        matchesActivity &&
        matchesZodiac &&
        matchesEventDate
      );
    });

    // Apply the selected ordering after filtering.
    return [...result].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "firstEventDate") {
        const aDate = getFirstEventDate(a) || "9999.99.99";
        const bDate = getFirstEventDate(b) || "9999.99.99";
        return aDate.localeCompare(bDate);
      }

      const aDate = getLastEventDate(a) || "0000.00.00";
      const bDate = getLastEventDate(b) || "0000.00.00";
      return bDate.localeCompare(aDate);
    });
  }, [people, query, filters, sortBy]);

  /**
   * Groups already filtered people based on the selected grouping mode.
   * The output is normalized into sorted [groupName, members] tuples.
   */
  const grouped = useMemo(() => {
    const groups = {};

    for (const person of filteredPeople) {
      let key = t.ungrouped;

      if (groupBy === "name") {
        key = person.name[0]?.toUpperCase() || "#";
      }

      if (groupBy === "lastEventDate") {
        key = getLastEventDate(person) || t.noEvents;
      }

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(person);
    }

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPeople, groupBy, t]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h2
          style={{ ...TEXT.heading, letterSpacing: "-0.025em", color: PALETTE.text }}
        >
          {t.personListTitle}
        </h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Search input */}
        <div style={{ position: "relative", flex: "1 1 0%" }}>
          <Search
            style={{ pointerEvents: "none", position: "absolute", left: "0.75rem", top: "50%", height: "1rem", width: "1rem", transform: "translateY(-50%)", color: PALETTE.rose }}
          />
          <Input
            className="rounded-2xl"
            style={{
              paddingLeft: "2.25rem",
              borderColor: PALETTE.inputBorder,
              backgroundColor: PALETTE.controlBg,
            }}
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filters drawer */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="rounded-2xl"
              style={{
                borderColor: PALETTE.inputBorder,
                backgroundColor: PALETTE.controlBg,
              }}
            >
              <Filter style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
              {t.filters}
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            style={{
              width: "92%",
              maxWidth: "24rem",
              overflowY: "auto",
              borderLeftColor: PALETTE.cardBorder,
              background: `linear-gradient(180deg, #f4edfb 0%, #eae5f7 50%, #d6ecfe 100%)`,
            }}
          >
            <SheetHeader style={{ padding: "1.25rem 1rem 0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <div style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "0.625rem",
                  background: `linear-gradient(135deg, ${PALETTE.rose}, ${PALETTE.roseSoft})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(226,115,150,0.3)",
                }}>
                  <Filter size={14} style={{ color: "white" }} />
                </div>
                <SheetTitle style={{
                  background: `linear-gradient(90deg, ${PALETTE.text}, ${PALETTE.rose})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  letterSpacing: "-0.02em",
                }}>
                  {t.refineList}
                </SheetTitle>
              </div>
            </SheetHeader>

            <div style={{ marginTop: "0.75rem" }}>
              <FiltersPanel
                filters={filters}
                setFilters={setFilters}
                groupBy={groupBy}
                setGroupBy={setGroupBy}
                sortBy={sortBy}
                setSortBy={setSortBy}
                peopleCount={filteredPeople.length}
                t={t}
                language={language}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {filteredPeople.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {grouped.map(([group, members]) => (
            <div key={group} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* Group header */}
              <div
                className="rounded-2xl"
                style={{ position: "sticky", top: 0, zIndex: 10, paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", backdropFilter: "blur(8px)", backgroundColor: PALETTE.surfaceBg }}
              >
                <p
                  style={{ ...TEXT.label, textTransform: "uppercase", letterSpacing: "0.16em", color: PALETTE.rose }}
                >
                  {groupBy === "lastEventDate" && group !== t.noEvents
                    ? formatDisplayDate(group)
                    : group}
                </p>
              </div>

              {/* Group members */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {members.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onUpdatePerson={onUpdatePerson}
                    onDeletePerson={onDeletePerson}
                    onAddEvent={onAddEvent}
                    onUpdateEvent={onUpdateEvent}
                    onDeleteEvent={onDeleteEvent}
                    onDeleteAllEvents={onDeleteAllEvents}
                    t={t}
                    language={language}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={t.noPeopleFound}
          description={t.tryDifferent}
          action={
            <Button
              variant="outline"
              className="rounded-2xl"
              style={{ borderColor: PALETTE.inputBorder, backgroundColor: "white" }}
              onClick={() => {
                setQuery("");
                setFilters({
                  minAge: "",
                  maxAge: "",
                  activity: [],
                  zodiacSign: [],
                  eventDateFrom: "",
                  eventDateTo: "",
                });
              }}
            >
              {t.clearSearch}
            </Button>
          }
        />
      )}
    </div>
  );
}