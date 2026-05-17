import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import { buildDayGrid } from "@/lib/calendar";

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const YEAR_PAGE_SIZE = 12;

// Clickable period title with calendar dropdown for week/month/year granularities.
// Uses a portal so the dropdown always renders above the Recharts SVG.
export default function TimelineCalendarPopup({ gran, offset, onOffsetChange, locale, title }) {
  const P = usePalette();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  const todayD = today.getDate();

  const initialCalView = gran === "week" ? "days" : gran === "month" ? "months" : "years";

  const [calView, setCalView] = useState(initialCalView);
  const [viewYear, setViewYear] = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM);
  const [yearPageStart, setYearPageStart] = useState(todayY - Math.floor(YEAR_PAGE_SIZE / 2));

  const fmtMonthYear = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale],
  );
  const fmtShortMonth = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short" }),
    [locale],
  );

  const dayHeaders = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        capitalize(
          new Intl.DateTimeFormat(locale, { weekday: "narrow" })
            .format(new Date(2024, 0, 1 + i))
            .replace(/\.$/, ""),
        ),
      ),
    [locale],
  );

  function getCurrentViewDate() {
    if (gran === "week") {
      const dow = today.getDay();
      const mon = new Date(today);
      mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
      return { year: mon.getFullYear(), month: mon.getMonth() + 1 };
    }
    if (gran === "month") {
      const ref = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      return { year: ref.getFullYear(), month: ref.getMonth() + 1 };
    }
    return { year: today.getFullYear() + offset, month: 1 };
  }

  function toggleOpen() {
    if (open) { setOpen(false); return; }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
    }

    const { year, month } = getCurrentViewDate();
    setViewYear(year);
    setViewMonth(month);
    setYearPageStart(year - Math.floor(YEAR_PAGE_SIZE / 2));
    setCalView(initialCalView);
    setOpen(true);
  }

  // Close on outside click (check both trigger and dropdown)
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function isFutureDay(day) {
    if (viewYear > todayY || (viewYear === todayY && viewMonth > todayM)) return true;
    return viewYear === todayY && viewMonth === todayM && day > todayD;
  }
  function isFutureMonth(m) {
    return viewYear > todayY || (viewYear === todayY && m > todayM);
  }
  function isFutureYear(yr) { return yr > todayY; }

  const isNextDisabled =
    (calView === "days" && viewYear === todayY && viewMonth === todayM) ||
    (calView === "months" && viewYear >= todayY) ||
    (calView === "years" && yearPageStart + YEAR_PAGE_SIZE - 1 >= todayY);

  function handleCalPrev() {
    if (calView === "days") {
      if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
      else setViewMonth((m) => m - 1);
    } else if (calView === "months") {
      setViewYear((y) => y - 1);
    } else {
      setYearPageStart((s) => s - YEAR_PAGE_SIZE);
    }
  }

  function handleCalNext() {
    if (isNextDisabled) return;
    if (calView === "days") {
      if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
      else setViewMonth((m) => m + 1);
    } else if (calView === "months") {
      setViewYear((y) => y + 1);
    } else {
      setYearPageStart((s) => s + YEAR_PAGE_SIZE);
    }
  }

  // Title click cycles for faster navigation:
  // week: days → months → years → days
  // month: months → years → months
  // year: no cycling
  const canCycleTitle = gran === "week" || (gran === "month" && calView !== "years");

  function handleTitleClick() {
    if (gran === "week") {
      if (calView === "days") { setYearPageStart(viewYear - Math.floor(YEAR_PAGE_SIZE / 2)); setCalView("months"); }
      else if (calView === "months") { setYearPageStart(viewYear - Math.floor(YEAR_PAGE_SIZE / 2)); setCalView("years"); }
      else setCalView("days");
    } else if (gran === "month") {
      if (calView === "months") { setYearPageStart(viewYear - Math.floor(YEAR_PAGE_SIZE / 2)); setCalView("years"); }
      else setCalView("months");
    }
  }

  function selectDay(day) {
    if (isFutureDay(day)) return;
    const sel = new Date(viewYear, viewMonth - 1, day);
    sel.setHours(0, 0, 0, 0);
    const selDow = sel.getDay();
    const selMon = new Date(sel);
    selMon.setDate(sel.getDate() - (selDow === 0 ? 6 : selDow - 1));
    const todayDow = today.getDay();
    const todayMon = new Date(today);
    todayMon.setDate(today.getDate() - (todayDow === 0 ? 6 : todayDow - 1));
    onOffsetChange(Math.round((selMon - todayMon) / 86400000) / 7);
    setOpen(false);
  }

  function selectMonth(month) {
    if (isFutureMonth(month)) return;
    if (gran === "month") {
      onOffsetChange((viewYear - today.getFullYear()) * 12 + (month - 1 - today.getMonth()));
      setOpen(false);
    } else {
      setViewMonth(month);
      setCalView("days");
    }
  }

  function selectYear(year) {
    if (isFutureYear(year)) return;
    if (gran === "year") {
      onOffsetChange(year - today.getFullYear());
      setOpen(false);
    } else {
      setViewYear(year);
      setCalView("months");
    }
  }

  let calTitleLabel;
  if (calView === "days") calTitleLabel = capitalize(fmtMonthYear.format(new Date(viewYear, viewMonth - 1, 1)));
  else if (calView === "months") calTitleLabel = String(viewYear);
  else calTitleLabel = `${yearPageStart} – ${yearPageStart + YEAR_PAGE_SIZE - 1}`;

  const cells = buildDayGrid(viewYear, viewMonth);

  function gridItemStyle({ isSelected, isToday, isDisabled }) {
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      cursor: isDisabled ? "default" : "pointer",
      fontSize: "0.8125rem",
      fontWeight: isSelected || isToday ? 600 : 400,
      color: isDisabled ? P.line : isSelected ? "white" : isToday ? P.accent : P.text,
      backgroundColor:
        isSelected && !isDisabled
          ? P.accent
          : isToday && !isSelected && !isDisabled
            ? P.accentMuted
            : "transparent",
      transition: "background-color 0.1s",
      borderRadius: "0.5rem",
    };
  }

  const navBtnStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1.75rem",
    height: "1.75rem",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "transparent",
    color: P.textSoft,
    cursor: "pointer",
    transition: "background-color 0.1s",
  };

  const dropdown = open && createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
        transform: "translateX(-50%)",
        zIndex: 9999,
        backgroundColor: P.card,
        border: `1px solid ${P.cardBorder}`,
        borderRadius: "1rem",
        padding: "1rem",
        boxShadow: "0 8px 32px rgba(226,115,150,0.18)",
        minWidth: "260px",
        userSelect: "none",
      }}
    >
      {/* Calendar header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <button
          type="button"
          onClick={handleCalPrev}
          style={navBtnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = P.accentMuted)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <ChevronLeft size={14} />
        </button>

        <button
          type="button"
          onClick={canCycleTitle ? handleTitleClick : undefined}
          style={{
            background: "none",
            border: "none",
            cursor: canCycleTitle ? "pointer" : "default",
            padding: "0.125rem 0.5rem",
            borderRadius: "0.5rem",
            ...TEXT.bodyStrong,
            color: P.text,
            textTransform: "capitalize",
            transition: "background-color 0.1s",
          }}
          onMouseEnter={(e) => { if (canCycleTitle) e.currentTarget.style.backgroundColor = P.accentMuted; }}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {calTitleLabel}
        </button>

        <button
          type="button"
          onClick={handleCalNext}
          disabled={isNextDisabled}
          style={{
            ...navBtnStyle,
            cursor: isNextDisabled ? "default" : "pointer",
            color: isNextDisabled ? P.line : P.textSoft,
          }}
          onMouseEnter={(e) => { if (!isNextDisabled) e.currentTarget.style.backgroundColor = P.accentMuted; }}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day grid (week gran) */}
      {calView === "days" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
            {dayHeaders.map((d, i) => (
              <div key={i} style={{ textAlign: "center", ...TEXT.caption, color: P.textSoft, fontWeight: 600 }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const isToday = day === todayD && viewMonth === todayM && viewYear === todayY;
              const isDisabled = isFutureDay(day);

              const dDate = new Date(viewYear, viewMonth - 1, day);
              dDate.setHours(0, 0, 0, 0);
              const dDow = dDate.getDay();
              const dMon = new Date(dDate);
              dMon.setDate(dDate.getDate() - (dDow === 0 ? 6 : dDow - 1));
              const todayDow = today.getDay();
              const todayMon = new Date(today);
              todayMon.setDate(today.getDate() - (todayDow === 0 ? 6 : todayDow - 1));
              const weekOffset = Math.round((dMon - todayMon) / 86400000) / 7;
              const isSelected = weekOffset === offset;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  disabled={isDisabled}
                  style={{ ...gridItemStyle({ isSelected, isToday, isDisabled }), aspectRatio: "1", borderRadius: "50%" }}
                  onMouseEnter={(e) => { if (!isSelected && !isDisabled) e.currentTarget.style.backgroundColor = P.accentMuted; }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isDisabled)
                      e.currentTarget.style.backgroundColor = isToday ? P.accentMuted : "transparent";
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Month grid */}
      {calView === "months" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const isDisabled = isFutureMonth(m);
            const isToday = m === todayM && viewYear === todayY;
            let isSelected = false;
            if (gran === "month") {
              const ref = new Date(today.getFullYear(), today.getMonth() + offset, 1);
              isSelected = ref.getFullYear() === viewYear && ref.getMonth() + 1 === m;
            }
            return (
              <button
                key={m}
                type="button"
                onClick={() => selectMonth(m)}
                disabled={isDisabled}
                style={{ ...gridItemStyle({ isSelected, isToday, isDisabled }), padding: "0.4rem 0", textTransform: "capitalize" }}
                onMouseEnter={(e) => { if (!isSelected && !isDisabled) e.currentTarget.style.backgroundColor = P.accentMuted; }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isDisabled)
                    e.currentTarget.style.backgroundColor = isToday ? P.accentMuted : "transparent";
                }}
              >
                {capitalize(fmtShortMonth.format(new Date(2000, m - 1, 1)).replace(/\.$/, ""))}
              </button>
            );
          })}
        </div>
      )}

      {/* Year grid */}
      {calView === "years" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
          {Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => yearPageStart + i).map((yr) => {
            const isDisabled = isFutureYear(yr);
            const isToday = yr === todayY;
            const isSelected = gran === "year" && yr === today.getFullYear() + offset;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => selectYear(yr)}
                disabled={isDisabled}
                style={{ ...gridItemStyle({ isSelected, isToday, isDisabled }), padding: "0.4rem 0" }}
                onMouseEnter={(e) => { if (!isSelected && !isDisabled) e.currentTarget.style.backgroundColor = P.accentMuted; }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isDisabled)
                    e.currentTarget.style.backgroundColor = isToday ? P.accentMuted : "transparent";
                }}
              >
                {yr}
              </button>
            );
          })}
        </div>
      )}
    </div>,
    document.body,
  );

  return (
    <div style={{ position: "relative", flex: 1, display: "flex", justifyContent: "center" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        style={{
          ...TEXT.body,
          color: P.text,
          fontWeight: 500,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.125rem 0.5rem",
          borderRadius: "0.5rem",
          transition: "background-color 0.1s",
          width: "100%",
          textAlign: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = P.accentMuted)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        {title}
      </button>
      {dropdown}
    </div>
  );
}
