import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TEXT } from "@/lib/constants";
import { usePalette } from "@/lib/theme";
import FullscreenChartWrapper from "./FullscreenChartWrapper";

const TROPHIES = ["🥇", "🥈", "🥉"];

export default function MultiYearTopCard({ top3, t }) {
  const PALETTE = usePalette();
  const [expanded, setExpanded] = useState(null);

  const cardStyle = { borderColor: PALETTE.cardBorder, backgroundColor: PALETTE.cardBg };

  return (
    <FullscreenChartWrapper>
    <Card
      className="rounded-3xl"
      style={{ boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", backdropFilter: "blur(8px)", ...cardStyle }}
    >
      <CardHeader style={{ paddingBottom: "0.5rem" }}>
        <CardTitle style={{ ...TEXT.title, color: PALETTE.text }}>{t.multiYearTopTitle}</CardTitle>
        <CardDescription style={{ color: PALETTE.textSoft }}>{t.multiYearTopDesc}</CardDescription>
      </CardHeader>

      <CardContent>
        {top3.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {top3.map((item, i) => {
              const isOpen = expanded === i;
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : i)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "0.75rem",
                      border: "none",
                      background: isOpen ? PALETTE.accentShadow : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "1.5rem", lineHeight: 1, flexShrink: 0 }}>
                      {TROPHIES[i]}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          ...TEXT.bodyStrong,
                          color: PALETTE.text,
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.label}
                      </p>
                      <p style={{ ...TEXT.caption, color: PALETTE.textSoft, margin: 0 }}>
                        {item.value} {item.value === 1 ? t.chartYear : t.years}
                        {" · "}
                        {item.totalEvents} {item.totalEvents === 1 ? t.chartEvent : t.chartEvents}
                      </p>
                    </div>
                    <span style={{ color: PALETTE.textSoft, fontSize: 11, flexShrink: 0 }}>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: "0.25rem 0.75rem 0.5rem 3.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.2rem",
                      }}
                    >
                      {item.years.map((year) => (
                        <div
                          key={year}
                          style={{ display: "flex", justifyContent: "space-between" }}
                        >
                          <span style={{ ...TEXT.caption, color: PALETTE.textSoft }}>{year}</span>
                          <span style={{ ...TEXT.caption, color: PALETTE.textSoft }}>
                            {item.yearCounts[year]}{" "}
                            {item.yearCounts[year] === 1 ? t.chartEvent : t.chartEvents}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-2xl"
            style={{
              border: "1px dashed",
              borderColor: PALETTE.inputBorder,
              padding: "2rem",
              textAlign: "center",
              ...TEXT.body,
              color: PALETTE.textSoft,
            }}
          >
            {t.noMultiYearPeopleYet}
          </div>
        )}
      </CardContent>
    </Card>
    </FullscreenChartWrapper>
  );
}
