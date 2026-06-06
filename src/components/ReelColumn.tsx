import { useEffect, useRef, useState } from 'react'
import type { Icon } from '../game/types'
import { ICON_CATALOG } from '../game/catalog'

interface Props {
  icons: Icon[]
  spinning: boolean
  colIndex: number
  onDone?: () => void
}

export function ReelColumn({ icons, spinning, colIndex, onDone }: Props) {
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!spinning) {
      setAnimating(false)
      return
    }
    const delay = colIndex * 300
    const total = 5000 + delay
    const t = setTimeout(() => {
      setAnimating(true)
      const stop = setTimeout(() => {
        setAnimating(false)
        if (colIndex === 4) onDone?.()
      }, total)
      timerRef.current = stop
    }, delay)
    timerRef.current = t
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [spinning, colIndex, onDone])

  return (
    <div className="flex flex-col gap-1" role="list" aria-label={`Reel column ${colIndex + 1}`}>
      {icons.map((icon, i) => {
        const def = ICON_CATALOG[icon.definitionId]
        return (
          <div
            key={`${icon.id}-${i}`}
            className={`icon-cell ${animating ? 'opacity-50' : ''}`}
            role="listitem"
          >
            {def?.label ?? '?'}
          </div>
        )
      })}
    </div>
  )
}
