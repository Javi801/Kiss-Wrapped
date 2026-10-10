import { BarChart3, EyeOff, Heart, Upload, Users } from 'lucide-react'

// Sections of the app guide, in display order. `title` and `items` are translation keys.
// To add a section, add an entry here and its texts to every file in `lib/translations/`.
export const APP_GUIDE_SECTIONS = [
  {
    id: 'entry',
    icon: Heart,
    title: 'guideEntryTitle',
    items: ['guideEntryDecoy', 'guideEntryHeart', 'guideEntryReturn'],
  },
  {
    id: 'stats',
    icon: BarChart3,
    title: 'guideStatsTitle',
    items: ['guideStatsSource', 'guideStatsScores', 'guideStatsCharts'],
  },
  {
    id: 'partner',
    icon: Users,
    title: 'guidePartnerTitle',
    items: ['guidePartnerMark', 'guidePartnerEvents'],
  },
  {
    id: 'data',
    icon: Upload,
    title: 'guideDataTitle',
    items: ['guideDataExport', 'guideDataImport', 'guideDataClear'],
  },
  {
    id: 'privacy',
    icon: EyeOff,
    title: 'guidePrivacyTitle',
    items: ['guidePrivacyCover'],
  },
]
