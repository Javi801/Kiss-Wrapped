import { createContext, useContext } from 'react'
import { PALETTES } from './constants'

const ThemeContext = createContext(PALETTES.pink)

export function ThemeProvider({ theme, children }) {
  return (
    <ThemeContext.Provider value={PALETTES[theme] ?? PALETTES.pink}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePalette() {
  return useContext(ThemeContext)
}
