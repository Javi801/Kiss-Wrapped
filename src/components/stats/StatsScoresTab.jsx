import { useMemo } from 'react'

import { getScoredVsUnscored, getScoresByKisses } from '@/lib/stats'

import PieChartCard from '@/components/charts/PieChartCard'
import BarChartCard from '@/components/charts/BarChartCard'

/**
 * Renders the score-focused statistics tab.
 * It shows rating coverage and score distribution.
 */
export default function StatsScoresTab({ allEvents, t }) {
  // Groups scored events by kisses label, leaving the zero-kiss score out.
  const scoresByKisses = useMemo(
    () => getScoresByKisses(allEvents, t, { includeZero: false }),
    [allEvents, t]
  )

  // Compares scored events against unscored events.
  const scoredVsUnscored = useMemo(() => getScoredVsUnscored(allEvents, t), [allEvents, t])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PieChartCard
        title={t.scoredVsUnscored}
        subtitle={t.scoredVsUnscoredDesc}
        data={scoredVsUnscored}
        emptyText={t.noDataYet}
        tooltipUnit={{ one: t.chartEvent, many: t.chartEvents }}
      />

      <BarChartCard
        title={t.scoreDistribution}
        subtitle={t.scoreDistributionDesc}
        data={scoresByKisses.filter((item) => item.value > 0)}
        emptyText={t.noDataYet}
        rotateXLabels={true}
        tooltipUnit={{ one: t.chartEvent, many: t.chartEvents }}
      />
    </div>
  )
}
