import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { SCORE_OPTIONS, TEXT } from '@/lib/constants'
import { LIMITS } from '@/lib/config'
import { usePalette } from '@/lib/theme'
import { todayString, isValidDateString, isFutureDate } from '@/lib/date'
import { hasScore, renderKisses } from '@/lib/format'
import TagInput from '@/components/forms/TagInput'
import SpeechBubble from '@/components/forms/SpeechBubble'

/**
 * Form used for creating or editing an event.
 * `onSkip` adds an action that receives the current values without validating them.
 * `tagsHint` shows a speech bubble under the place field.
 */
export default function EventForm({
  initialValues,
  onSave,
  onCancel,
  onDelete,
  onSkip,
  skipLabel,
  tagsHint,
  t,
  situationTags = [],
  onAddSituationTag,
  placeTags = [],
  onAddPlaceTag,
  isParentOpen,
}) {
  const PALETTE = usePalette()
  const [date, setDate] = useState(initialValues?.date || todayString())
  const [details, setDetails] = useState(initialValues?.details || '')
  const [score, setScore] = useState(
    hasScore(initialValues?.score) ? String(initialValues.score) : 'none'
  )
  const [place, setPlace] = useState(initialValues?.place || '')
  const [situation, setSituation] = useState(initialValues?.situation || '')
  const [observations, setObservations] = useState(initialValues?.observations || '')

  const [errors, setErrors] = useState({})

  function submit(e) {
    e.preventDefault()

    const newErrors = {}
    if (!isValidDateString(date)) newErrors.date = t.validDateMsg
    else if (isFutureDate(date)) newErrors.date = t.futureDateMsg
    if (!place.trim()) newErrors.place = t.requiredPlace
    if (!situation.trim()) newErrors.situation = t.requiredSituation

    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    onSave({
      date,
      details: details.trim(),
      score: score === 'none' ? null : Number(score),
      place: place.trim(),
      situation: situation.trim(),
      observations: observations.trim(),
    })
  }

  const inputStyle = {
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.inputBg,
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label>{t.eventDate} *</Label>
        <DatePicker
          value={date}
          onChange={setDate}
          placeholder="2026.03.08"
          className="rounded-2xl"
          style={{ ...inputStyle }}
        />
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft }}>{t.dateFormatHelper}</p>
        {errors.date && <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{errors.date}</p>}
      </div>

      {/* Score */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label>{t.eventScore}</Label>
        <Select value={score} onValueChange={setScore}>
          <SelectTrigger className="rounded-2xl" style={{ ...inputStyle }}>
            <SelectValue placeholder={t.none} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t.none}</SelectItem>
            {SCORE_OPTIONS.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {renderKisses(value, t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Place */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label>{t.eventPlace} *</Label>
        <TagInput
          value={place}
          onChange={setPlace}
          tags={placeTags}
          onAddTag={onAddPlaceTag}
          placeholder={t.eventPlacePlaceholder}
          maxLength={LIMITS.tagLength}
          style={{ ...inputStyle }}
          addTagLabel={t.addTag}
          isParentOpen={isParentOpen}
        />
        {tagsHint && <SpeechBubble>{tagsHint}</SpeechBubble>}
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: 'right' }}>
          {place.length}/{LIMITS.tagLength}
        </p>
        {errors.place && <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{errors.place}</p>}
      </div>

      {/* Situation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label>{t.eventSituation} *</Label>
        <TagInput
          value={situation}
          onChange={setSituation}
          tags={situationTags}
          onAddTag={onAddSituationTag}
          placeholder={t.eventSituationPlaceholder}
          maxLength={LIMITS.tagLength}
          style={{ ...inputStyle }}
          addTagLabel={t.addTag}
          isParentOpen={isParentOpen}
        />
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: 'right' }}>
          {situation.length}/{LIMITS.tagLength}
        </p>
        {errors.situation && (
          <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{errors.situation}</p>
        )}
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label>{t.eventDetails}</Label>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t.eventDetailsPlaceholder}
          maxLength={LIMITS.eventNotesLength}
          className="rounded-2xl"
          style={{ ...inputStyle }}
        />
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: 'right' }}>
          {details.length}/{LIMITS.eventNotesLength}
        </p>
      </div>

      {/* Observations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label>{t.eventObservations}</Label>
        <Textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder={t.eventObservationsPlaceholder}
          maxLength={LIMITS.eventNotesLength}
          className="rounded-2xl"
          style={{ ...inputStyle }}
        />
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: 'right' }}>
          {observations.length}/{LIMITS.eventNotesLength}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            type="submit"
            className="rounded-2xl"
            style={{
              flex: '1 1 0%',
              color: PALETTE.textOnAccent,
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
            }}
          >
            {t.saveEvent}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              style={{ ...inputStyle }}
              onClick={onCancel}
            >
              {t.cancel}
            </Button>
          )}
          {onSkip && (
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              style={{ ...inputStyle }}
              onClick={() => onSkip({ date, details, score, place, situation, observations })}
            >
              {skipLabel}
            </Button>
          )}
        </div>
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl w-full"
                style={{ borderColor: PALETTE.danger, color: PALETTE.danger }}
              >
                {t.deleteEvent}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.deleteEventConfirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{t.deleteEventConfirmDesc}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  style={{ background: PALETTE.danger, color: PALETTE.textOnAccent }}
                  onClick={onDelete}
                >
                  {t.deleteEventConfirmAction}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  )
}
