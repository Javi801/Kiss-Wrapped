import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown, Tag, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useScrollFade } from '@/hooks/useScrollFade'
import { TEXT } from '@/lib/constants'
import { TAG_FIELDS, countTagUses, tagFieldValues } from '@/lib/helpers'
import { usePalette } from '@/lib/theme'
import {
  SETTINGS_DIALOG_CLASS,
  SETTINGS_OVERLAY_CLASS,
} from '@/components/app/settingsDialogTransition'

// Tag lists grouped by where their values are stored: on the person or on its events.
const TAG_GROUPS = [
  {
    titleKey: 'tagsPeopleSection',
    lists: [
      { field: 'howWeMet', labelKey: 'howWeMet' },
      { field: 'nationality', labelKey: 'nationality' },
    ],
  },
  {
    titleKey: 'tagsEventsSection',
    lists: [
      { field: 'situation', labelKey: 'eventSituation' },
      { field: 'place', labelKey: 'eventPlace' },
    ],
  },
]

// Confirmation text: a plain notice for an unused tag; for a tag in use, how many
// records use it and what deleting it does to them.
function deleteDescription(pending, t) {
  if (!pending?.count) return t.deleteTagConfirmDesc
  const { onEvents, required } = TAG_FIELDS[pending.field]
  const one = pending.count === 1
  const noun = onEvents ? (one ? t.tagEvent : t.tagEvents) : one ? t.tagPerson : t.tagPeople
  return [
    `${t.deleteTagInUse} ${pending.count} ${noun}.`,
    onEvents ? t.deleteTagInUseEventsDesc : t.deleteTagInUsePeopleDesc,
    required ? t.deleteTagInUseRequired : '',
  ]
    .filter(Boolean)
    .join(' ')
}

const ROW_REM = 2.75
// Rows the open list needs below its header; with less room, the headers scroll it up first.
const MIN_VISIBLE_ROWS = 3

function remToPx(rem) {
  const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
  return rem * (rootSize || 16)
}

// Header of one tag list: its name, how many tags it has, and whether it is open.
function TagListHeader({ label, count, expanded, onToggle, headerRef }) {
  const PALETTE = usePalette()

  return (
    <button
      ref={headerRef}
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        minHeight: '3rem',
        marginTop: '0.5rem',
        padding: '0 1rem',
        gap: '0.5rem',
        border: `1px solid ${PALETTE.inputBorder}`,
        borderRadius: expanded ? '1rem 1rem 0 0' : '1rem',
        backgroundColor: PALETTE.controlBg,
        ...TEXT.body,
        color: PALETTE.text,
        cursor: 'pointer',
      }}
    >
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      <span style={{ ...TEXT.caption, color: PALETTE.textSoft }}>{count}</span>
      <ChevronDown
        style={{
          height: '1rem',
          width: '1rem',
          color: PALETTE.accent,
          transform: expanded ? 'rotate(180deg)' : 'none',
        }}
      />
    </button>
  )
}

// Rows of the open list, laid over the headers below it: always from the bottom of its
// header to the end of the lists area, so every list ends at the same place, scrolling
// inside. Every tag has a delete button.
function TagListRows({ tags, counts, top, onRequestDelete, t }) {
  const PALETTE = usePalette()
  const scrollFadeRef = useScrollFade()

  return (
    <ul
      ref={scrollFadeRef}
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        border: `1px solid ${PALETTE.inputBorder}`,
        borderTop: 'none',
        borderRadius: '0 0 1rem 1rem',
        backgroundColor: PALETTE.card,
        boxShadow: `0 8px 20px ${PALETTE.shadow}`,
      }}
    >
      {tags.length === 0 && (
        <li style={{ ...TEXT.caption, color: PALETTE.textSoft, padding: '0.75rem 1rem' }}>
          {t.noTags}
        </li>
      )}
      {tags.map((tag, i) => (
        <li
          key={tag}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minHeight: `${ROW_REM}rem`,
            padding: '0.25rem 0.25rem 0.25rem 1rem',
            borderTop: i > 0 ? `1px solid ${PALETTE.inputBorder}` : 'none',
            backgroundColor: PALETTE.card,
          }}
        >
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflowWrap: 'anywhere',
              ...TEXT.body,
              color: PALETTE.text,
            }}
          >
            {tag}
          </span>
          <span style={{ ...TEXT.caption, color: PALETTE.textSoft, flexShrink: 0 }}>
            {counts[i] === 0
              ? t.tagUnused
              : `${counts[i]} ${counts[i] === 1 ? t.tagUse : t.tagUses}`}
          </span>
          <Button
            type="button"
            variant="ghost"
            aria-label={`${t.deleteTag}: ${tag}`}
            style={{
              width: '2.75rem',
              height: '2.75rem',
              flexShrink: 0,
              color: PALETTE.dangerEmphasis,
            }}
            onClick={() => onRequestDelete(tag, counts[i])}
          >
            <Trash2 style={{ height: '1rem', width: '1rem' }} />
          </Button>
        </li>
      ))}
    </ul>
  )
}

/**
 * Tags dialog opened from the settings: the how-we-met, nationality, situation and
 * place tag lists with how many people or events use each tag. `tags` holds the
 * lists by field name. `pendingDelete` (`{ field, tag, count }` or null) is the tag
 * waiting for confirmation, with how many records use it; it lives in the parent so
 * the back button can close it.
 */
export default function TagsDialog({
  open,
  onOpenChange,
  t,
  people,
  tags,
  pendingDelete,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  const PALETTE = usePalette()
  const [expandedField, setExpandedField] = useState(null)
  // Where the open list starts, in px from the top of the lists area.
  const [overlayTop, setOverlayTop] = useState(0)
  const areaRef = useRef(null)
  const headersRef = useRef(null)
  const headerRefs = useRef({})

  useLayoutEffect(() => {
    if (!expandedField) return undefined

    const place = () => {
      const area = areaRef.current
      const headers = headersRef.current
      const header = headerRefs.current[expandedField]
      if (!area || !headers || !header) return
      // A header close to the bottom is scrolled to the top, so its list gets some rows.
      const room = area.getBoundingClientRect().bottom - header.getBoundingClientRect().bottom
      if (room < remToPx(MIN_VISIBLE_ROWS * ROW_REM)) {
        headers.scrollTop +=
          header.getBoundingClientRect().top - headers.getBoundingClientRect().top
      }
      setOverlayTop(header.getBoundingClientRect().bottom - area.getBoundingClientRect().top)
    }

    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [expandedField])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* Fixed height, so opening or closing a list never resizes it or shifts its scroll.
            No subtitle, to leave the open list as much room as possible. */}
        <DialogContent
          className={`h-[calc(100svh-2rem)] rounded-2xl ${SETTINGS_DIALOG_CLASS}`}
          overlayClassName={SETTINGS_OVERLAY_CLASS}
          style={{ background: PALETTE.dialogBg, borderColor: PALETTE.dialogBorder }}
          bodyClassName="flex flex-1 flex-col gap-0"
          aria-describedby={undefined}
        >
          <DialogHeader style={{ flexShrink: 0, marginBottom: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 14px ${PALETTE.accentGlow}`,
                }}
              >
                <Tag style={{ height: '1.5rem', width: '1.5rem', color: PALETTE.textOnAccent }} />
              </div>
              <DialogTitle style={{ ...TEXT.subheading, color: PALETTE.accentEmphasis2 }}>
                {t.manageTags}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* The lists area fills the rest of the dialog. The headers scroll inside it, and
              stay still while a list is open, so the list keeps its place on top of them. */}
          <div ref={areaRef} style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <div
              ref={headersRef}
              style={{
                height: '100%',
                overflowY: expandedField ? 'hidden' : 'auto',
                overscrollBehavior: 'contain',
              }}
            >
              {TAG_GROUPS.map((group, groupIndex) => (
                <Fragment key={group.titleKey}>
                  <span
                    style={{
                      display: 'block',
                      marginTop: groupIndex > 0 ? '1rem' : 0,
                      paddingLeft: '0.25rem',
                      ...TEXT.label,
                      color: PALETTE.textSoft,
                    }}
                  >
                    {t[group.titleKey]}
                  </span>
                  {group.lists.map(({ field, labelKey }) => (
                    <TagListHeader
                      key={field}
                      label={t[labelKey]}
                      count={tags[field].length}
                      expanded={expandedField === field}
                      onToggle={() => setExpandedField((prev) => (prev === field ? null : field))}
                      headerRef={(node) => {
                        headerRefs.current[field] = node
                      }}
                    />
                  ))}
                </Fragment>
              ))}
            </div>

            {expandedField && (
              <TagListRows
                tags={tags[expandedField]}
                counts={countTagUses(tags[expandedField], tagFieldValues(people, expandedField))}
                top={overlayTop}
                onRequestDelete={(tag, count) => onRequestDelete(expandedField, tag, count)}
                t={t}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) onCancelDelete()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTagConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              <strong style={{ overflowWrap: 'anywhere' }}>{pendingDelete?.tag}</strong>{' '}
              {deleteDescription(pendingDelete, t)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              style={{ background: PALETTE.danger, color: PALETTE.textOnAccent }}
              onClick={onConfirmDelete}
            >
              {pendingDelete?.count ? t.deleteTagAnywayAction : t.deleteTagConfirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
