import { useMemo, useState } from "react";
import { BarChart3, Clock3, UserRound, BadgePercent, Download, CheckCircle2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PALETTE, TEXT } from "@/lib/constants";
import { exportStatsPdf, saveErrorLog } from "@/lib/pdf-export";

import StatsOverviewTab from "@/components/stats/StatsOverviewTab";
import StatsTimeTab from "@/components/stats/StatsTimeTab";
import StatsPeopleTab from "@/components/stats/StatsPeopleTab";
import StatsScoresTab from "@/components/stats/StatsScoresTab";

/**
 * Renders the full statistics screen with tab navigation.
 * It prepares shared data and delegates each section to a dedicated tab component.
 */
export default function StatsScreen({ people, t }) {
  const [tab, setTab] = useState("overview");
  // null = idle, "success" = exported OK, Error instance = export failed
  const [pdfStatus, setPdfStatus] = useState(null);

  // eslint-disable-next-line no-unused-vars -- re-enable once PDF export bug is fixed
  async function handleExport() {
    const hasEvents = people.some((p) => p.events?.length > 0);
    if (people.length === 0 || !hasEvents) {
      setPdfStatus("empty");
      return;
    }
    try {
      await exportStatsPdf(people, t);
      setPdfStatus("success");
    } catch (err) {
      setPdfStatus(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Flatten all events and preserve their parent person.
   * This shared dataset is reused across multiple stats tabs.
   */
  const allEvents = useMemo(
    () =>
      people.flatMap((person) =>
        (person.events || []).map((event) => ({ ...event, person })),
      ),
    [people],
  );

  // Define the available tab options and their labels.
  const statTabs = [
    {
      key: "overview",
      label: t.overview,
      icon: BarChart3,
      helper: t.statsGroupOverview,
    },
    {
      key: "time",
      label: t.time,
      icon: Clock3,
      helper: t.statsGroupTime,
    },
    {
      key: "people",
      label: t.peopleStats,
      icon: UserRound,
      helper: t.statsGroupPeople,
    },
    {
      key: "scores",
      label: t.scores,
      icon: BadgePercent,
      helper: t.statsGroupScores,
    },
  ];

  // Resolve the active tab metadata for subtitle rendering.
  const activeTab = statTabs.find((item) => item.key === tab);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
        <div>
          <h2
            style={{ ...TEXT.heading, letterSpacing: "-0.025em", color: PALETTE.text }}
          >
            {t.analyticsTitle}
          </h2>
          <p style={{ ...TEXT.body, color: PALETTE.textSoft }}>
            {activeTab?.helper || t.analyticsDesc}
          </p>
        </div>

        {/* TODO: fix PDF export bug before re-enabling
        <Button
          variant="outline"
          className="rounded-2xl bg-white/85"
            style={{ borderColor: PALETTE.inputBorder }}
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" />
          {t.exportPdf}
        </Button>
        */}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.5rem" }}>
        {statTabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className="rounded-2xl"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                paddingLeft: "1rem",
                paddingRight: "1rem",
                paddingTop: "0.75rem",
                paddingBottom: "0.75rem",
                textAlign: "left",
                transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                border: active ? "none" : `1px solid ${PALETTE.inputBorder}`,
                background: active
                  ? `linear-gradient(90deg, ${PALETTE.rose}, ${PALETTE.roseSoft})`
                  : PALETTE.controlBg,
                color: active ? "white" : PALETTE.text,
                boxShadow: active
                  ? "0 6px 16px rgba(226,115,150,0.18)"
                  : "none",
              }}
            >
              <Icon style={{ height: "1rem", width: "1rem", flexShrink: 0 }} />
              <span style={{ ...TEXT.body, fontWeight: "500" }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <StatsOverviewTab people={people} allEvents={allEvents} t={t} />
      ) : null}

      {tab === "time" ? (
        <StatsTimeTab people={people} allEvents={allEvents} t={t} />
      ) : null}

      {tab === "people" ? <StatsPeopleTab people={people} t={t} /> : null}

      {tab === "scores" ? (
        <StatsScoresTab people={people} allEvents={allEvents} t={t} />
      ) : null}

      {/* Empty data dialog */}
      <Dialog
        open={pdfStatus === "empty"}
        onOpenChange={(open) => { if (!open) setPdfStatus(null); }}
      >
        <DialogContent
          showCloseButton={false}
          className="rounded-2xl"
          style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: PALETTE.deep2 }}>{t.pdfEmptyTitle}</DialogTitle>
            <DialogDescription style={{ color: PALETTE.textSoft }}>{t.pdfEmptyDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="rounded-xl"
              style={{ background: `linear-gradient(90deg, ${PALETTE.rose}, ${PALETTE.roseSoft})`, color: "white", border: "none" }}
              onClick={() => setPdfStatus(null)}
            >
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success dialog */}
      <Dialog
        open={pdfStatus === "success"}
        onOpenChange={(open) => { if (!open) setPdfStatus(null); }}
      >
        <DialogContent
          showCloseButton={false}
          className="rounded-2xl"
          style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}
        >
          <DialogHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: PALETTE.rose }}>
              <CheckCircle2 style={{ height: "1.25rem", width: "1.25rem", flexShrink: 0 }} />
              <DialogTitle style={{ color: PALETTE.rose }}>{t.pdfSuccessTitle}</DialogTitle>
            </div>
            <DialogDescription style={{ color: PALETTE.textSoft }}>{t.pdfSuccessDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="rounded-xl"
              style={{ background: `linear-gradient(90deg, ${PALETTE.rose}, ${PALETTE.roseSoft})`, color: "white", border: "none" }}
              onClick={() => setPdfStatus(null)}
            >
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error dialog */}
      <Dialog
        open={pdfStatus instanceof Error}
        onOpenChange={(open) => { if (!open) setPdfStatus(null); }}
      >
        <DialogContent
          showCloseButton={false}
          className="rounded-2xl"
          style={{ background: PALETTE.bgSoft, borderColor: PALETTE.line }}
        >
          <DialogHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: PALETTE.deep }}>
              <TriangleAlert style={{ height: "1.25rem", width: "1.25rem", flexShrink: 0 }} />
              <DialogTitle style={{ color: PALETTE.deep }}>{t.pdfErrorTitle}</DialogTitle>
            </div>
            <DialogDescription style={{ color: PALETTE.textSoft }}>{t.pdfErrorDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              style={{ borderColor: PALETTE.line, color: PALETTE.text }}
              onClick={() => setPdfStatus(null)}
            >
              {t.close}
            </Button>
            <Button
              className="rounded-xl"
              style={{ background: PALETTE.deep, color: "white", border: "none" }}
              onClick={() => {
                saveErrorLog(pdfStatus).catch(console.error);
                setPdfStatus(null);
              }}
            >
              {t.savePdfErrorLog}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
