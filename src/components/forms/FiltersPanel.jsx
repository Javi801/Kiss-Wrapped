import { Briefcase, Calendar, RotateCcw, SlidersHorizontal, Star } from "lucide-react";

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

import { ZODIAC_OPTIONS, TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";

const MONTH_NUM = {
  january:"01", february:"02", march:"03", april:"04", may:"05", june:"06",
  july:"07", august:"08", september:"09", october:"10", november:"11", december:"12",
  enero:"01", febrero:"02", marzo:"03", abril:"04", mayo:"05", junio:"06",
  julio:"07", agosto:"08", septiembre:"09", octubre:"10", noviembre:"11", diciembre:"12",
};

function formatZodiacDates(item) {
  const open = item.indexOf("(");
  if (open === -1) return item;
  const prefix = item.slice(0, open).trimEnd();
  const inner = item.slice(open + 1, item.lastIndexOf(")"));
  // English: "Month DD - Month DD"
  const en = inner.match(/^(\w+)\s+(\d+)\s*-\s*(\w+)\s+(\d+)$/);
  if (en) {
    const [, m1, d1, m2, d2] = en;
    return `${prefix} (${d1.padStart(2,"0")}/${MONTH_NUM[m1.toLowerCase()]} - ${d2.padStart(2,"0")}/${MONTH_NUM[m2.toLowerCase()]})`;
  }
  // Spanish: "DD Month - DD Month"
  const es = inner.match(/^(\d+)\s+(\w+)\s*-\s*(\d+)\s+(\w+)$/);
  if (es) {
    const [, d1, m1, d2, m2] = es;
    return `${prefix} (${d1.padStart(2,"0")}/${MONTH_NUM[m1.toLowerCase()]} - ${d2.padStart(2,"0")}/${MONTH_NUM[m2.toLowerCase()]})`;
  }
  return item;
}

const EMPTY_FILTERS = {
  minAge: "",
  maxAge: "",
  activity: [],
  zodiacSign: [],
  eventDateFrom: "",
  eventDateTo: "",
};

function Divider() {
  const PALETTE = usePalette();
  return <div style={{ height: "1px", background: `linear-gradient(90deg, ${PALETTE.line}, transparent)` }} />;
}

function SectionLabel({ icon: Icon, label }) {
  const PALETTE = usePalette();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.625rem" }}>
      <Icon size={12} style={{ color: PALETTE.accent, flexShrink: 0 }} />
      <span style={{ ...TEXT.label, textTransform: "uppercase", letterSpacing: "0.09em", color: PALETTE.accent }}>
        {label}
      </span>
    </div>
  );
}

function Chip({ label, selected, onClick }) {
  const PALETTE = usePalette();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "0.3rem 0.8rem",
        borderRadius: "9999px",
        border: selected ? "none" : `1px solid ${PALETTE.inputBorder}`,
        background: selected
          ? `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`
          : PALETTE.controlBg,
        color: selected ? "white" : PALETTE.textSoft,
        ...TEXT.body,
        fontWeight: selected ? "600" : "400",
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: selected ? `0 1px 4px ${PALETTE.accentShadow}` : "none",
      }}
    >
      {label}
    </button>
  );
}

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
  const PALETTE = usePalette();
  const inputStyle = {
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.inputBg,
    ...TEXT.input,
  };

  function toggleActivity(value) {
    setFilters((prev) => ({
      ...prev,
      activity: prev.activity.includes(value)
        ? prev.activity.filter((a) => a !== value)
        : [...prev.activity, value],
    }));
  }

  function toggleZodiac(value) {
    setFilters((prev) => ({
      ...prev,
      zodiacSign: prev.zodiacSign.includes(value)
        ? prev.zodiacSign.filter((z) => z !== value)
        : [...prev.zodiacSign, value],
    }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Reset + results count */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "-0.875rem 0" }}>
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft }}>
          {t.showingResults}{" "}
          <span style={{ ...TEXT.label, color: PALETTE.accent }}>{peopleCount}</span>{" "}
          {peopleCount === 1 ? t.result : t.results}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-2xl"
          style={{
            color: PALETTE.textSoft,
            gap: "0.375rem",
            fontSize: "0.8rem",
          }}
          onClick={() => {
            setFilters(EMPTY_FILTERS);
            setGroupBy("name");
            setSortBy("name");
          }}
        >
          <RotateCcw size={13} />
          {t.resetFilters}
        </Button>
      </div>

      <Divider />

      {/* Group & sort */}
      <div>
        <SectionLabel icon={SlidersHorizontal} label={`${t.groupBy} / ${t.sortBy}`} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Label style={{ ...TEXT.caption, color: PALETTE.textSoft }}>{t.groupBy}</Label>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="rounded-2xl" style={inputStyle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{t.groupName}</SelectItem>
              <SelectItem value="lastEventDate">{t.groupLastEvent}</SelectItem>
            </SelectContent>
          </Select>

          <Label style={{ ...TEXT.caption, color: PALETTE.textSoft, marginTop: "0.25rem" }}>{t.sortBy}</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="rounded-2xl" style={inputStyle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{t.sortName}</SelectItem>
              <SelectItem value="firstEventDate">{t.sortFirst}</SelectItem>
              <SelectItem value="lastEventDate">{t.sortLast}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Divider />

      {/* Age range */}
      <div>
        <SectionLabel icon={SlidersHorizontal} label={t.ageRange} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <Input
            type="number"
            placeholder={t.min}
            value={filters.minAge}
            onChange={(e) => setFilters((prev) => ({ ...prev, minAge: e.target.value }))}
            className="rounded-2xl"
            style={inputStyle}
          />
          <Input
            type="number"
            placeholder={t.max}
            value={filters.maxAge}
            onChange={(e) => setFilters((prev) => ({ ...prev, maxAge: e.target.value }))}
            className="rounded-2xl"
            style={inputStyle}
          />
        </div>
      </div>

      <Divider />

      {/* Activity */}
      <div>
        <SectionLabel icon={Briefcase} label={t.activity} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {[
            { value: "studies", label: t.studies },
            { value: "works", label: t.works },
            { value: "studies and works", label: t.studiesWorks },
            { value: "other", label: t.other },
          ].map(({ value, label }) => (
            <Chip
              key={value}
              label={label}
              selected={filters.activity.includes(value)}
              onClick={() => toggleActivity(value)}
            />
          ))}
        </div>
      </div>

      <Divider />

      {/* Event date range */}
      <div>
        <SectionLabel icon={Calendar} label={t.eventDateRange} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <DatePicker
            value={filters.eventDateFrom}
            onChange={(value) => setFilters((prev) => ({ ...prev, eventDateFrom: value }))}
            placeholder={t.dateFrom}
            className="rounded-2xl"
            style={inputStyle}
          />
          <DatePicker
            value={filters.eventDateTo}
            onChange={(value) => setFilters((prev) => ({ ...prev, eventDateTo: value }))}
            placeholder={t.dateTo}
            className="rounded-2xl"
            style={inputStyle}
          />
        </div>
      </div>

      <Divider />

      {/* Zodiac */}
      <div>
        <SectionLabel icon={Star} label={t.zodiacSign} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {ZODIAC_OPTIONS[language].map((item) => (
            <Chip
              key={item}
              label={formatZodiacDates(item)}
              selected={filters.zodiacSign.includes(item)}
              onClick={() => toggleZodiac(item)}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
