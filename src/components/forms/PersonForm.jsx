import { useState } from 'react'
import { Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ChoiceToggle from '@/components/forms/ChoiceToggle'
import FormField from '@/components/forms/FormField'
import TagInput from '@/components/forms/TagInput'
import PartnerFields from '@/components/forms/PartnerFields'
import SpeechBubble from '@/components/forms/SpeechBubble'
import SubmitButton from '@/components/forms/SubmitButton'
import {
  toPersonFormState,
  toPersonPayload,
  validatePersonForm,
} from '@/components/forms/personFormValues'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { ACTIVITY, GENDERS, ZODIAC_OPTIONS, TEXT } from '@/lib/constants'
import { LIMITS } from '@/lib/config'
import { usePalette } from '@/lib/theme'
import { activityDetailPlaceholder, translateGender } from '@/lib/format'
import { isWithinZodiacPeriod } from '@/lib/date'

/**
 * Form used for creating or editing a person.
 * Handles validation and normalization before submit.
 * `onSkip` adds a second action that receives the current values without validating them.
 * `zodiacHint` shows a speech bubble under the zodiac select.
 */
export default function PersonForm({
  initialValues,
  onSave,
  onCancel,
  onSkip,
  skipLabel,
  zodiacHint,
  t,
  language,
  includeHowWeMet = true,
  includeRealName = false,
  includeNationality = false,
  includePartner = false,
  saveLabel,
  mode,
  howWeMetTags = [],
  onAddHowWeMetTag,
  nationalityTags = [],
  onAddNationalityTag,
  isParentOpen,
}) {
  const PALETTE = usePalette()
  // The add form addresses the user; any other mode speaks about the person.
  const isAdd = mode === 'add'
  const [form, setForm] = useState(() => toPersonFormState(initialValues, language))

  const [errors, setErrors] = useState({})
  const [birthdayAlreadyHappened, setBirthdayAlreadyHappened] = useState(
    initialValues?.birthdayAlreadyHappened ?? false
  )

  const showBirthdayCheckbox = isWithinZodiacPeriod(form.zodiacSign)

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'zodiacSign') setBirthdayAlreadyHappened(false)
  }

  // Validates, then sends the normalized values.
  function submit(e) {
    e.preventDefault()

    const nextErrors = validatePersonForm(form, { includeHowWeMet }, t)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    onSave(
      toPersonPayload(form, {
        initialValues,
        birthdayAlreadyHappened,
        includeHowWeMet,
        includeRealName,
        includeNationality,
      })
    )
  }

  // Shared input styling.
  const inputStyle = {
    borderColor: PALETTE.inputBorder,
    backgroundColor: PALETTE.inputBg,
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1rem' }}>
        {/* Name + Real name grouped */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <FormField
            label={t.name}
            required
            length={form.name.length}
            maxLength={LIMITS.nameLength}
            error={errors.name}
          >
            <Input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              maxLength={LIMITS.nameLength}
              className="rounded-2xl"
              style={{ ...inputStyle }}
            />
          </FormField>

          {includeRealName && (
            <FormField
              label={t.realName}
              length={form.realName.length}
              maxLength={LIMITS.nameLength}
            >
              <Input
                value={form.realName}
                onChange={(e) => update('realName', e.target.value)}
                maxLength={LIMITS.nameLength}
                className="rounded-2xl"
                placeholder={t.realNamePlaceholder}
                style={{ ...inputStyle }}
              />
            </FormField>
          )}
        </div>

        {/* Age + Gender */}
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}
        >
          <FormField label={t.age} required error={errors.age}>
            <Input
              type="number"
              value={form.age}
              onChange={(e) => update('age', e.target.value)}
              min={1}
              max={LIMITS.maxAge}
              className="rounded-2xl"
              style={{ ...inputStyle }}
            />
          </FormField>

          <FormField label={t.gender} required error={errors.gender}>
            <Select value={form.gender} onValueChange={(value) => update('gender', value)}>
              <SelectTrigger className="rounded-2xl" style={{ ...inputStyle }}>
                <SelectValue placeholder={t.select} />
              </SelectTrigger>

              <SelectContent>
                {GENDERS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {translateGender(item, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {/* Spans both columns so the prompt and options are not squeezed into the age column */}
          {showBirthdayCheckbox && (
            <div
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <p style={{ ...TEXT.caption, color: PALETTE.text }}>
                {isAdd ? t.birthdayAlreadyHappened : t.birthdayAlreadyHappenedThird}
              </p>
              <ChoiceToggle
                options={[
                  { value: true, label: t.birthdayYes },
                  { value: false, label: t.birthdayNo },
                ]}
                value={birthdayAlreadyHappened}
                onChange={setBirthdayAlreadyHappened}
              />
            </div>
          )}
        </div>

        {/* Nationality */}
        {includeNationality && (
          <FormField
            label={t.nationality}
            length={form.nationality.length}
            maxLength={LIMITS.nationalityLength}
          >
            <TagInput
              value={form.nationality}
              onChange={(val) => update('nationality', val)}
              tags={nationalityTags}
              onAddTag={onAddNationalityTag}
              maxLength={LIMITS.nationalityLength}
              placeholder={t.nationalityPlaceholder}
              className="rounded-2xl"
              style={{ ...inputStyle }}
              addTagLabel={t.addTag}
              isParentOpen={isParentOpen}
            />
          </FormField>
        )}

        {/* Partner marker + period */}
        {includePartner && (
          <PartnerFields
            status={form.partnerStatus}
            partnerFrom={form.partnerFrom}
            partnerTo={form.partnerTo}
            onChange={update}
            errors={errors}
            t={t}
          />
        )}

        {/* How we met */}
        {includeHowWeMet && (
          <FormField
            label={t.howWeMet}
            required
            length={form.howWeMet.length}
            maxLength={LIMITS.tagLength}
            error={errors.howWeMet}
          >
            <TagInput
              value={form.howWeMet}
              onChange={(val) => update('howWeMet', val)}
              tags={howWeMetTags}
              onAddTag={onAddHowWeMetTag}
              maxLength={LIMITS.tagLength}
              className="rounded-2xl"
              style={{ ...inputStyle }}
              addTagLabel={t.addTag}
              isParentOpen={isParentOpen}
            />
          </FormField>
        )}

        {/* Zodiac */}
        <FormField label={t.zodiacSign} required error={errors.zodiacSign}>
          <Select value={form.zodiacSign} onValueChange={(value) => update('zodiacSign', value)}>
            <SelectTrigger className="w-full rounded-2xl" style={{ ...inputStyle }}>
              <SelectValue placeholder={t.select} />
            </SelectTrigger>

            <SelectContent>
              {ZODIAC_OPTIONS[language].map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {zodiacHint && <SpeechBubble>{zodiacHint}</SpeechBubble>}
        </FormField>

        {/* Activity */}
        <FormField label={t.activity} required error={errors.activity}>
          <Select value={form.activity} onValueChange={(value) => update('activity', value)}>
            <SelectTrigger className="rounded-2xl" style={{ ...inputStyle }}>
              <SelectValue placeholder={t.select} />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value={ACTIVITY.studies}>{isAdd ? t.studiesForm : t.studies}</SelectItem>
              <SelectItem value={ACTIVITY.works}>{isAdd ? t.worksForm : t.works}</SelectItem>
              <SelectItem value={ACTIVITY.studiesAndWorks}>
                {isAdd ? t.studiesWorksForm : t.studiesWorks}
              </SelectItem>
              <SelectItem value={ACTIVITY.other}>{t.other}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {/* Specific — only visible after an activity is chosen */}
        {form.activity && (
          <FormField
            label={t.detail}
            length={form.detail.length}
            maxLength={LIMITS.personDetailLength}
          >
            <Textarea
              value={form.detail}
              onChange={(e) => update('detail', e.target.value)}
              placeholder={activityDetailPlaceholder(form.activity, t)}
              maxLength={LIMITS.personDetailLength}
              className="rounded-2xl"
              style={{ ...inputStyle }}
            />
          </FormField>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' }}>
        <SubmitButton>
          <Save style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />
          {saveLabel || t.savePerson}
        </SubmitButton>

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
            onClick={() =>
              onSkip({
                ...form,
                birthdayAlreadyHappened: showBirthdayCheckbox && birthdayAlreadyHappened,
              })
            }
          >
            {skipLabel}
          </Button>
        )}
      </div>
    </form>
  )
}
