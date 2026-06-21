import { createContext, useContext } from 'react'
import { COPY } from './constants'

const CopyContext = createContext(COPY.en)

export function CopyProvider({ language, children }) {
  return <CopyContext.Provider value={COPY[language] ?? COPY.en}>{children}</CopyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCopy() {
  return useContext(CopyContext)
}
