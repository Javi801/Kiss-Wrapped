import { UserPlus, Users, BarChart3, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { PALETTE } from "@/lib/constants";
import StatTile from "@/components/shared/StatTile";
import SettingsTile from "@/components/shared/SettingsTile";
import LanguageSelector from "@/components/app/LanguageSelector";

/**
 * Renders the main dashboard screen.
 * It shows summary metrics, primary actions, and app-level settings.
 */
export default function MainScreen({
  onNavigate,
  onClearData,
  people,
  t,
  language,
  setLanguage,
}) {
  // Count all events across every saved person.
  const totalEvents = people.reduce(
    (sum, person) => sum + (person.events?.length || 0),
    0,
  );

  return (
    <div className="space-y-5">
      {/* Hero summary card */}
      <Card
        className="overflow-hidden rounded-[30px] border-0 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${PALETTE.rose}, ${PALETTE.roseSoft}, ${PALETTE.sky})`,
        }}
      >
        <CardContent className="relative p-6">
          {/* Decorative blurred circles */}
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

          <h1 className="text-2xl font-bold tracking-tight">{t.heroTitle}</h1>

          {/* Summary metrics */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatTile
              label={t.peopleSaved}
              value={people.length}
              accent={true}
            />
            <StatTile
              label={t.totalEvents}
              value={totalEvents}
              accent={true}
            />
          </div>

          {/* App settings */}
          <div className="mt-5">
            <SettingsTile accent={true}>
              <LanguageSelector
                language={language}
                setLanguage={setLanguage}
                t={t}
              />
            </SettingsTile>
          </div>

        </CardContent>
      </Card>

      {/* Main action buttons */}
      <div className="grid gap-3">
        <Button
          className="h-14 justify-start rounded-3xl text-base text-white shadow-sm"
          style={{
            background: `linear-gradient(90deg, ${PALETTE.rose}, ${PALETTE.roseSoft})`,
          }}
          onClick={() => onNavigate("add")}
        >
          <UserPlus className="mr-3 h-5 w-5" />
          {t.addNewPerson}
        </Button>

        <Button
          variant="outline"
          className="h-14 justify-start rounded-3xl text-base shadow-sm"
          style={{
            borderColor: "#ecd6e0",
            backgroundColor: "rgba(255,255,255,0.86)",
          }}
          onClick={() => onNavigate("people")}
        >
          <Users className="mr-3 h-5 w-5" style={{ color: PALETTE.rose }} />
          {t.viewEditPeople}
        </Button>

        <Button
          variant="outline"
          className="h-14 justify-start rounded-3xl text-base shadow-sm"
          style={{
            borderColor: "#ecd6e0",
            backgroundColor: "rgba(255,255,255,0.86)",
          }}
          onClick={() => onNavigate("stats")}
        >
          <BarChart3
            className="mr-3 h-5 w-5"
            style={{ color: PALETTE.sky2 }}
          />
          {t.viewStatistics}
        </Button>

        <Button
          variant="outline"
          className="h-14 justify-start rounded-3xl text-base text-red-600 shadow-sm"
          style={{
            borderColor: "#ecd6e0",
            backgroundColor: "rgba(255,255,255,0.86)",
          }}
          onClick={onClearData}
        >
          <Trash2 className="mr-3 h-5 w-5" />
          {t.clearLocalData}
        </Button>
      </div>
    </div>
  );
}