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
import { PALETTE } from "@/lib/constants";
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
    <div className="space-y-4 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: PALETTE.text }}
          >
            {t.analyticsTitle}
          </h2>
          <p className="text-sm" style={{ color: PALETTE.textSoft }}>
            {activeTab?.helper || t.analyticsDesc}
          </p>
        </div>

        {/* TODO: fix PDF export bug before re-enabling
        <Button
          variant="outline"
          className="rounded-2xl bg-white/85"
          style={{ borderColor: "#ecd6e0" }}
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" />
          {t.exportPdf}
        </Button>
        */}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {statTabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className="flex items-center gap-2 rounded-2xl px-4 py-3 text-left transition"
              style={{
                border: active ? "none" : "1px solid #ecd6e0",
                background: active
                  ? `linear-gradient(90deg, ${PALETTE.rose}, ${PALETTE.roseSoft})`
                  : "rgba(255,255,255,0.86)",
                color: active ? "white" : PALETTE.text,
                boxShadow: active
                  ? "0 6px 16px rgba(226,115,150,0.18)"
                  : "none",
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
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
            <div className="flex items-center gap-2" style={{ color: PALETTE.rose }}>
              <CheckCircle2 className="h-5 w-5 shrink-0" />
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
            <div className="flex items-center gap-2" style={{ color: PALETTE.deep }}>
              <TriangleAlert className="h-5 w-5 shrink-0" />
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