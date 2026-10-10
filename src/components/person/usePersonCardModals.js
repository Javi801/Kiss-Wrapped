import { useEffect, useState } from 'react'

/**
 * Owns the modal state of a person card (edit-person and event dialogs) and
 * keeps `modalBackRef` pointing at the close callback of whichever is open.
 */
export default function usePersonCardModals(modalBackRef) {
  const [editingPerson, setEditingPerson] = useState(false)
  const [eventModal, setEventModal] = useState({
    open: false,
    mode: 'add',
    event: null,
  })

  useEffect(() => {
    if (!modalBackRef) return
    modalBackRef.current = editingPerson ? () => setEditingPerson(false) : null
    return () => {
      if (editingPerson) modalBackRef.current = null
    }
  }, [editingPerson, modalBackRef])

  useEffect(() => {
    if (!modalBackRef) return
    modalBackRef.current = eventModal.open
      ? () => setEventModal((prev) => ({ ...prev, open: false }))
      : null
    return () => {
      if (eventModal.open) modalBackRef.current = null
    }
  }, [eventModal.open, modalBackRef])

  return { editingPerson, setEditingPerson, eventModal, setEventModal }
}
