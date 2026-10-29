// The settings and the dialogs opened from them (tags, app guide, about) replace each other
// in one render. Their overlays do not fade and the closing window does not animate out, so
// no frame shows the home screen undimmed between the two. The `!` is needed because
// tailwind-merge keeps both `animate-in` and `animate-none`, leaving the winner to CSS order.
export const SETTINGS_DIALOG_CLASS = 'data-closed:animate-none!'
export const SETTINGS_OVERLAY_CLASS = 'data-open:animate-none! data-closed:animate-none!'
