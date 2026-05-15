import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";


import { PALETTE, ZODIAC_OPTIONS, TEXT } from "@/lib/constants";

/**
 * Renders the filters and organization controls for the people list.
 * It updates external state provided by the parent screen.
 */
export default function FiltersPanel({
  filters,
  setFilters,
  groupBy,
  setGroupBy,
  sortBy,
  setSortBy,
  peopleCount,
  t,
  language,
}) {
  // Reuse the same style across all form controls in the panel.
  const inputStyle = {
    borderColor: PALETTE.inputBorder,
    backgroundColor: "rgba(255,255,255,0.9)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Panel heading */}
      <div>
        <h3 style={{ ...TEXT.subheading, fontWeight: "600", color: PALETTE.text }}>
          {t.filtersOrg}
        </h3>
        <p style={{ ...TEXT.body, color: PALETTE.textSoft }}>
          {t.refineResults}
        </p>
      </div>

      {/* Age range */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.ageRange}</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.75rem" }}>
          <Input
            type="number"
            placeholder={t.min}
            value={filters.minAge}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, minAge: e.target.value }))
            }
            className="rounded-2xl"
            style={{ ...inputStyle }}
          />
          <Input
            type="number"
            placeholder={t.max}
            value={filters.maxAge}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, maxAge: e.target.value }))
            }
            className="rounded-2xl"
            style={{ ...inputStyle }}
          />
        </div>
      </div>

      {/* Activity filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.activity}</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {[
            { value: "studies", label: t.studies },
            { value: "works", label: t.works },
            { value: "studies and works", label: t.studiesWorks },
            { value: "other", label: t.other },
          ].map(({ value, label }) => {
            const isSelected = filters.activity.includes(value);
            return (
              <button
                key={value}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    activity: isSelected
                      ? prev.activity.filter((a) => a !== value)
                      : [...prev.activity, value],
                  }))
                }
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  border: `1px solid ${isSelected ? PALETTE.rose : PALETTE.inputBorder}`,
                  backgroundColor: isSelected ? PALETTE.rose : "rgba(255,255,255,0.9)",
                  color: isSelected ? "white" : PALETTE.text,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zodiac filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.zodiacSign}</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {ZODIAC_OPTIONS[language].map((item) => {
            const isSelected = filters.zodiacSign.includes(item);
            return (
              <button
                key={item}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    zodiacSign: isSelected
                      ? prev.zodiacSign.filter((z) => z !== item)
                      : [...prev.zodiacSign, item],
                  }))
                }
                style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  border: `1px solid ${isSelected ? PALETTE.rose : PALETTE.inputBorder}`,
                  backgroundColor: isSelected ? PALETTE.rose : "rgba(255,255,255,0.9)",
                  color: isSelected ? "white" : PALETTE.text,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event date range */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.eventDateRange}</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <DatePicker
            value={filters.eventDateFrom}
            onChange={(value) => setFilters((prev) => ({ ...prev, eventDateFrom: value }))}
            placeholder={t.dateFrom}
            className="rounded-2xl"
            style={{ ...inputStyle }}
          />
          <DatePicker
            value={filters.eventDateTo}
            onChange={(value) => setFilters((prev) => ({ ...prev, eventDateTo: value }))}
            placeholder={t.dateTo}
            className="rounded-2xl"
            style={{ ...inputStyle }}
          />
        </div>
      </div>

      {/* Grouping mode */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.groupBy}</Label>
        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="rounded-2xl" style={{ ...inputStyle }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t.groupName}</SelectItem>
            <SelectItem value="lastEventDate">{t.groupLastEvent}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sorting mode */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Label>{t.sortBy}</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="rounded-2xl" style={{ ...inputStyle }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t.sortName}</SelectItem>
            <SelectItem value="firstEventDate">{t.sortFirst}</SelectItem>
            <SelectItem value="lastEventDate">{t.sortLast}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset action */}
      <Button
        variant="outline"
        className="rounded-2xl"
        style={{ width: "100%", ...inputStyle }}
        onClick={() => {
          setFilters({
            minAge: "",
            maxAge: "",
            activity: [],
            zodiacSign: [],
            eventDateFrom: "",
            eventDateTo: "",
          });
          setGroupBy("name");
          setSortBy("name");
        }}
      >
        <RotateCcw style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
        {t.resetFilters}
      </Button>

      {/* Results count */}
      <p style={{ ...TEXT.caption, color: PALETTE.textSoft }}>
        {t.showingResults} {peopleCount}{" "}
        {peopleCount === 1 ? t.result : t.results}.
      </p>
    </div>
  );
}
