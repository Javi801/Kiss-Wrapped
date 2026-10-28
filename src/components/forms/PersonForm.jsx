import { useState } from 'react'
import { Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TagInput from '@/components/forms/TagInput'
import PartnerFields from '@/components/forms/PartnerFields'
import SpeechBubble from '@/components/forms/SpeechBubble'
import { Label } from '@/components/ui/label'
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
import {
  activityDetailPlaceholder,
  translateGender,
  translatePartnerError,
  getZodiacForLanguage,
} from '@/lib/format'
import { calculateDisplayAge, deriveBirthYear, isWithinZodiacPeriod } from '@/lib/date'
import { PARTNER_STATUSES, validatePartnerFields } from '@/lib/partner'

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
  includePartner = false,
  saveLabel,
  mode,
  howWeMetTags = [],
  onAddHowWeMetTag,
  isParentOpen,
}) {
  const PALETTE = usePalette()
  // The add form addresses the user; any other mode speaks about the person.
  const isAdd = mode === 'add'
  // Local form state initialization.
  const [form, setForm] = useState(() => {
    if (!initialValues) {
      return {
        name: '',
        realName: '',
        age: '',
        gender: '',
        howWeMet: '',
        zodiacSign: '',
        activity: '',
        detail: '',
        partnerStatus: 'never',
        partnerFrom: '',
        partnerTo: '',
      }
    }
    const zodiacSign = getZodiacForLanguage(initialValues.zodiacSign, language)
    const displayAge = initialValues.birthYear
      ? String(
          calculateDisplayAge(
            initialValues.birthYear,
            zodiacSign,
            initialValues.birthdayAlreadyHappened
          ) ?? ''
        )
      : String(initialValues.age ?? '')
    return {
      ...initialValues,
      zodiacSign,
      age: displayAge,
      realName: initialValues.realName ?? '',
      howWeMet: initialValues.howWeMet ?? '',
      detail: initialValues.detail ?? '',
      partnerStatus: PARTNER_STATUSES.includes(initialValues.partnerStatus)
        ? initialValues.partnerStatus
        : 'never',
      partnerFrom: initialValues.partnerFrom ?? '',
      partnerTo: initialValues.partnerTo ?? '',
    }
  })

  const [errors, setErrors] = useState({})
  const [birthdayAlreadyHappened, setBirthdayAlreadyHappened] = useState(
    initialValues?.birthdayAlreadyHappened ?? false
  )

  const showBirthdayCheckbox = isWithinZodiacPeriod(form.zodiacSign)

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'zodiacSign') setBirthdayAlreadyHappened(false)
  }

  // Validate required fields and data types.
  function validate() {
    const next = {}

    if (!form.name.trim()) next.name = t.requiredName

    if (!String(form.age).trim()) next.age = t.requiredAge
    else if (
      !Number.isInteger(Number(form.age)) ||
      Number(form.age) <= 0 ||
      Number(form.age) > LIMITS.maxAge
    )
      next.age = t.validAge

    if (!form.gender) next.gender = t.requiredGender

    if (includeHowWeMet && !form.howWeMet.trim()) next.howWeMet = t.requiredHowWeMet

    if (!form.zodiacSign) next.zodiacSign = t.requiredZodiac

    if (!form.activity) next.activity = t.requiredActivity

    // Partner period: optional start; a past partner needs a valid end after the start.
    const partnerErrors = validatePartnerFields({
      partnerStatus: form.partnerStatus,
      partnerFrom: form.partnerFrom.trim(),
      partnerTo: form.partnerTo.trim(),
    })
    for (const [field, code] of Object.entries(partnerErrors)) {
      next[field] = translatePartnerError(code, t)
    }

    setErrors(next)

    return Object.keys(next).length === 0
  }

  // Submit handler that normalizes values before sending.
  function submit(e) {
    e.preventDefault()

    if (!validate()) return

    const { age, ...rest } = form
    onSave({
      ...rest,
      partnerStatus: form.partnerStatus,
      partnerFrom: form.partnerStatus !== 'never' ? form.partnerFrom.trim() : '',
      partnerTo: form.partnerStatus === 'past' ? form.partnerTo.trim() : '',
      birthYear: deriveBirthYear(
        Number(age),
        form.zodiacSign,
        showBirthdayCheckbox && birthdayAlreadyHappened
      ),
      birthdayAlreadyHappened: showBirthdayCheckbox
        ? birthdayAlreadyHappened
        : (initialValues?.birthdayAlreadyHappened ?? false),
      detail: form.detail.trim(),
      howWeMet: includeHowWeMet ? form.howWeMet.trim() : initialValues?.howWeMet || '',
      name: form.name.trim(),
      realName: includeRealName ? form.realName.trim() : initialValues?.realName || '',
    })
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label>{t.name} *</Label>
            <Input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              maxLength={LIMITS.nameLength}
              className="rounded-2xl"
              style={{ ...inputStyle }}
            />
            <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: 'right' }}>
              {form.name.length}/{LIMITS.nameLength}
            </p>
            {errors.name && <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{errors.name}</p>}
          </div>

          {includeRealName && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label>{t.realName}</Label>
              <Input
                value={form.realName}
                onChange={(e) => update('realName', e.target.value)}
                maxLength={LIMITS.nameLength}
                className="rounded-2xl"
                placeholder={t.realNamePlaceholder}
                style={{ ...inputStyle }}
              />
              <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: 'right' }}>
                {form.realName.length}/{LIMITS.nameLength}
              </p>
            </div>
          )}
        </div>

        {/* Age + Gender */}
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label>{t.age} *</Label>
            <Input
              type="number"
              value={form.age}
              onChange={(e) => update('age', e.target.value)}
              min={1}
              max={LIMITS.maxAge}
              className="rounded-2xl"
              style={{ ...inputStyle }}
            />
            {errors.age && <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{errors.age}</p>}
            {showBirthdayCheckbox && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <p style={{ ...TEXT.caption, color: PALETTE.text }}>
                  {isAdd ? t.birthdayAlreadyHappened : t.birthdayAlreadyHappenedThird}
                </p>
                <div
                  style={{
                    display: 'flex',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    border: `1px solid ${PALETTE.inputBorder}`,
                    width: 'fit-content',
                    backgroundColor: PALETTE.inputBg,
                  }}
                >
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setBirthdayAlreadyHappened(val)}
                      style={{
                        padding: '0.25rem 1rem',
                        ...TEXT.caption,
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor:
                          birthdayAlreadyHappened === val ? PALETTE.accent : 'transparent',
                        color:
                          birthdayAlreadyHappened === val ? PALETTE.textOnAccent : PALETTE.text,
                        transition: 'background-color 0.15s, color 0.15s',
                      }}
                    >
                      {val ? t.birthdayYes : t.birthdayNo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label>{t.gender} *</Label>
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

            {errors.gender && (
              <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{errors.gender}</p>
            )}
          </div>
        </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label>{t.howWeMet} *</Label>
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
            <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: 'right' }}>
              {form.howWeMet.length}/{LIMITS.tagLength}
            </p>
            {errors.howWeMet && (
              <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{errors.howWeMet}</p>
            )}
          </div>
        )}

        {/* Zodiac */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Label>{t.zodiacSign} *</Label>
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

          {errors.zodiacSign && (
            <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{errors.zodiacSign}</p>
          )}
        </div>

        {/* Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Label>{t.activity} *</Label>
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

          {errors.activity && (
            <p style={{ ...TEXT.caption, color: PALETTE.danger }}>{errors.activity}</p>
          )}
        </div>

        {/* Specific — only visible after an activity is chosen */}
        {form.activity && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label>{t.detail}</Label>
            <Textarea
              value={form.detail}
              onChange={(e) => update('detail', e.target.value)}
              placeholder={activityDetailPlaceholder(form.activity, t)}
              maxLength={LIMITS.personDetailLength}
              className="rounded-2xl"
              style={{ ...inputStyle }}
            />
            <p style={{ ...TEXT.caption, color: PALETTE.textSoft, textAlign: 'right' }}>
              {form.detail.length}/{LIMITS.personDetailLength}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' }}>
        <Button
          type="submit"
          className="rounded-2xl"
          style={{
            flex: '1 1 0%',
            color: PALETTE.textOnAccent,
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            background: `linear-gradient(90deg, ${PALETTE.accent}, ${PALETTE.accentSoft})`,
            // The gradient would repeat under the default transparent border.
            border: 'none',
          }}
        >
          <Save style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />
          {saveLabel || t.savePerson}
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
