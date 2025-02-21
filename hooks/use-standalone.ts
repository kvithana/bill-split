import { useEffect, useState } from "react"

export function useStandalone() {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone: boolean }).standalone === true
    )

    const mediaQuery = window.matchMedia("(display-mode: standalone)")
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return isStandalone
}
