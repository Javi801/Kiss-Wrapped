import { useState, useRef, useEffect } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PALETTE, TEXT } from "@/lib/constants";

// Parses "yyyy.MM.dd" → { year, month, day } or null if invalid.
function parseAppDate(str) {
  if (!str || !/^\d{4}\.\d{2}\.\d{2}$/.test(str)) return null;
  const [y, m, d] = str.split(".").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return { year: y, month: m, day: d };
}

function toAppDate(year, month, day) {
  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
}

function getMonthLabel(year, month) {
  return new Intl.DateTimeFormat(navigator.language, { month: "long", year: "numeric" })
    .format(new Date(year, month - 1, 1));
}

const DAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const navBtn = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.75rem",
  height: "1.75rem",
  borderRadius: "50%",
  border: "none",
  backgroundColor: "transparent",
  color: PALETTE.textSoft,
  cursor: "pointer",
  transition: "background-color 0.1s",
};

/**
 * Date input + calendar dropdown.
 * Props mirror a regular Input: value (yyyy.MM.dd), onChange(newValue), placeholder, className, style.
 */
export function DatePicker({ value, onChange, placeholder, className, style }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  const todayD = today.getDate();

  const parsed = parseAppDate(value);

  const [viewYear, setViewYear] = useState(parsed?.year ?? todayY);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? todayM);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function handleTextChange(e) {
    const newVal = e.target.value;
    onChange(newVal);
    const p = parseAppDate(newVal);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }

  function prevMonth() {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  }

  function selectDay(day) {
    onChange(toAppDate(viewYear, viewMonth, day));
    setOpen(false);
  }

  // Build a Mon-first grid of day numbers (null = empty cell).
  const totalDays = new Date(viewYear, viewMonth, 0).getDate();
  const rawFirst = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=Sun
  const startOffset = (rawFirst + 6) % 7; // convert to Mon=0
  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Input row */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Input
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          className={className}
          style={{ ...style, flex: 1 }}
        />
        <button
          type="button"
          aria-label="Open calendar"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.25rem",
            height: "2.25rem",
            flexShrink: 0,
            borderRadius: "0.75rem",
            border: `1px solid ${PALETTE.inputBorder}`,
            backgroundColor: open ? PALETTE.blush : PALETTE.inputBg,
            color: PALETTE.rose,
            cursor: "pointer",
            transition: "background-color 0.15s",
          }}
        >
          <CalendarIcon size={16} />
        </button>
      </div>

      {/* Calendar dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 200,
            backgroundColor: PALETTE.card,
            border: `1px solid ${PALETTE.cardBorder}`,
            borderRadius: "1rem",
            padding: "1rem",
            boxShadow: "0 8px 32px rgba(226,115,150,0.18)",
            minWidth: "268px",
            userSelect: "none",
          }}
        >
          {/* Month navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <button
              type="button"
              onClick={prevMonth}
              style={navBtn}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PALETTE.blush)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <ChevronLeft size={14} />
            </button>

            <span style={{ ...TEXT.bodyStrong, color: PALETTE.text, textTransform: "capitalize" }}>
              {getMonthLabel(viewYear, viewMonth)}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              style={navBtn}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PALETTE.blush)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
            {DAY_HEADERS.map((d) => (
              <div
                key={d}
                style={{ textAlign: "center", ...TEXT.caption, color: PALETTE.textSoft, fontWeight: 600 }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;

              const isToday = day === todayD && viewMonth === todayM && viewYear === todayY;
              const isSelected = parsed && day === parsed.day && viewMonth === parsed.month && viewYear === parsed.year;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "50%",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: isSelected || isToday ? 600 : 400,
                    color: isSelected ? "white" : isToday ? PALETTE.rose : PALETTE.text,
                    backgroundColor: isSelected
                      ? PALETTE.rose
                      : isToday
                      ? PALETTE.blush
                      : "transparent",
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = PALETTE.blush;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = isToday ? PALETTE.blush : "transparent";
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
