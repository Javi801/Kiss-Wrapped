import { useState } from 'react'
import { ChevronDown, Tag, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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

import { TEXT } from '@/lib/constants'
import { TAG_FIELDS, countTagUses, tagFieldValues } from '@/lib/helpers'
import { usePalette } from '@/lib/theme'

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

// One collapsible tag list; every tag has a delete button.
function TagList({ label, tags, counts, expanded, onToggle, onRequestDelete, t }) {
  const PALETTE = usePalette()

  return (
    <div
      className="rounded-2xl"
      style={{
        border: `1px solid ${PALETTE.inputBorder}`,
        backgroundColor: PALETTE.controlBg,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          minHeight: '3rem',
          padding: '0 1rem',
          gap: '0.5rem',
          ...TEXT.body,
          color: PALETTE.text,
          cursor: 'pointer',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        <span style={{ ...TEXT.caption, color: PALETTE.textSoft }}>{tags.length}</span>
        <ChevronDown
          style={{
            height: '1rem',
            width: '1rem',
            color: PALETTE.accent,
            transform: expanded ? 'rotate(180deg)' : 'none',
          }}
        />
      </button>

      {expanded && (
        <ul style={{ borderTop: `1px solid ${PALETTE.inputBorder}` }}>
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
                minHeight: '2.75rem',
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
      )}
    </div>
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
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
                {t.tags}
              </DialogTitle>
            </div>
            <DialogDescription style={{ textAlign: 'center' }}>{t.tagsIntro}</DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {TAG_GROUPS.map((group) => (
              <section
                key={group.titleKey}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                <span style={{ ...TEXT.label, color: PALETTE.textSoft, paddingLeft: '0.25rem' }}>
                  {t[group.titleKey]}
                </span>
                {group.lists.map(({ field, labelKey }) => {
                  const list = tags[field]
                  return (
                    <TagList
                      key={field}
                      label={t[labelKey]}
                      tags={list}
                      counts={countTagUses(list, tagFieldValues(people, field))}
                      expanded={expandedField === field}
                      onToggle={() => setExpandedField((prev) => (prev === field ? null : field))}
                      onRequestDelete={(tag, count) => onRequestDelete(field, tag, count)}
                      t={t}
                    />
                  )
                })}
              </section>
            ))}
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
