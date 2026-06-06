import { useEffect, useRef, useState } from 'react'
import type { Icon } from '../game/types'
import { ICON_CATALOG } from '../game/catalog'

interface Props {
  icons: Icon[]
  reelIcons: Icon[]
  spinning: boolean
  animate: boolean
  colIndex: number
  onDone?: () => void
}

export function ReelColumn({ icons, reelIcons, spinning, animate, colIndex, onDone }: Props) {
  const [animating, setAnimating] = useState(false)
  const [displayIcons, setDisplayIcons] = useState<Icon[]>(icons)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!spinning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
      intervalRef.current = null
      stopTimerRef.current = null
      setAnimating(false)
      setDisplayIcons(icons)
      return
    }

    // When animate is off, immediately show result and signal done
    if (!animate) {
      setAnimating(false)
      setDisplayIcons(icons)
      onDone?.()
      return
    }

    const pool = reelIcons.length > 0 ? reelIcons : icons

    setAnimating(true)
    intervalRef.current = setInterval(() => {
      setDisplayIcons(
        icons.map(() => pool[Math.floor(Math.random() * pool.length)])
      )
    }, 200)

    const stopDelay = 1500 + colIndex * 600
    stopTimerRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      setAnimating(false)
      setDisplayIcons(icons)
      onDone?.()
    }, stopDelay)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
    }
  }, [spinning]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-2" role="list" aria-label={`Reel column ${colIndex + 1}`}>
      {displayIcons.map((icon, i) => {
        const def = ICON_CATALOG[icon.definitionId]
        return (
          <div
            key={i}
            className={`icon-cell ${animating ? 'bg-blue-900 ring-2 ring-blue-400 brightness-125' : ''}`}
            role="listitem"
          >
            {def?.label ?? '?'}
          </div>
        )
      })}
    </div>
  )
}
