import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
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
import FormField from '@/components/forms/FormField'
import TagInput from '@/components/forms/TagInput'
import SpeechBubble from '@/components/forms/SpeechBubble'
import SubmitButton from '@/components/forms/SubmitButton'

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
      <FormField label={t.eventDate} required error={errors.date}>
        <DatePicker
          value={date}
          onChange={setDate}
          placeholder="2026.03.08"
          className="rounded-2xl"
          style={{ ...inputStyle }}
        />
        <p style={{ ...TEXT.caption, color: PALETTE.textSoft }}>{t.dateFormatHelper}</p>
      </FormField>

      {/* Score */}
      <FormField label={t.eventScore}>
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
      </FormField>

      {/* Place */}
      <FormField
        label={t.eventPlace}
        required
        length={place.length}
        maxLength={LIMITS.tagLength}
        error={errors.place}
      >
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
      </FormField>

      {/* Situation */}
      <FormField
        label={t.eventSituation}
        required
        length={situation.length}
        maxLength={LIMITS.tagLength}
        error={errors.situation}
      >
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
      </FormField>

      {/* Details */}
      <FormField label={t.eventDetails} length={details.length} maxLength={LIMITS.eventNotesLength}>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t.eventDetailsPlaceholder}
          maxLength={LIMITS.eventNotesLength}
          className="rounded-2xl"
          style={{ ...inputStyle }}
        />
      </FormField>

      {/* Observations */}
      <FormField
        label={t.eventObservations}
        length={observations.length}
        maxLength={LIMITS.eventNotesLength}
      >
        <Textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder={t.eventObservationsPlaceholder}
          maxLength={LIMITS.eventNotesLength}
          className="rounded-2xl"
          style={{ ...inputStyle }}
        />
      </FormField>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <SubmitButton>{t.saveEvent}</SubmitButton>
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
