import { useEffect, useRef, useState } from 'react'
import type { Icon } from '../game/types'
import { ICON_CATALOG } from '../game/catalog'

interface Props {
  icons: Icon[]
  valueOverrides: Map<string, number>
  reelIcons: Icon[]
  spinning: boolean
  animate: boolean
  colIndex: number
  locked: boolean
  isMagicPhase: boolean
  onDone?: () => void
  onCellClick: (rowIdx: number) => void
  onColumnClick: () => void
}

export function ReelColumn({
  icons,
  valueOverrides,
  reelIcons,
  spinning,
  animate,
  colIndex,
  locked,
  isMagicPhase,
  onDone,
  onCellClick,
  onColumnClick,
}: Props) {
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

    if (locked) {
      setAnimating(false)
      setDisplayIcons(icons)
      onDone?.()
      return
    }

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
    <div
      className={`flex flex-col gap-2 cursor-pointer ${isMagicPhase ? 'hover:opacity-80' : ''}`}
      role="list"
      aria-label={`Reel column ${colIndex + 1}`}
      onClick={onColumnClick}
    >
      {locked && (
        <div className="text-center text-xs text-amber-400 font-bold">🔒</div>
      )}
      {displayIcons.map((icon, i) => {
        const def = ICON_CATALOG[icon.definitionId]
        const effectiveValue = valueOverrides.get(icon.id) ?? def?.valuePerColumn
        const hasOverride = valueOverrides.has(icon.id)
        return (
          <div
            key={i}
            className={`icon-cell ${animating && !locked ? 'bg-blue-900 ring-2 ring-blue-400 brightness-125' : ''} ${
              isMagicPhase ? 'cursor-pointer hover:ring-2 hover:ring-purple-400' : ''
            } ${locked ? 'ring-2 ring-amber-500' : ''}`}
            role="listitem"
            onClick={(e) => {
              e.stopPropagation()
              onCellClick(i)
            }}
          >
            <span>{def?.label ?? '?'}</span>
            {hasOverride && (
              <span className="text-xs text-green-400 ml-1">(×{effectiveValue})</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
