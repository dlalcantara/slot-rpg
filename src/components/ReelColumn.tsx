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
  respinToken: number
  isTargetingMode: boolean
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
  respinToken,
  isTargetingMode,
  onDone,
  onCellClick,
  onColumnClick,
}: Props) {
  const [animating, setAnimating] = useState(false)
  const [displayIcons, setDisplayIcons] = useState<Icon[]>(icons)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Global spin animation
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

  // US2: re-sync display when icons prop changes and no animation is running
  useEffect(() => {
    if (!animating) {
      setDisplayIcons(icons)
    }
  }, [icons, animating])

  // US3: per-column respin animation pulse
  const respinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const respinStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (respinToken === 0) return // initial mount, no animation
    if (!animate) return // animate off: US2 effect handles immediate update

    const pool = reelIcons.length > 0 ? reelIcons : icons
    setAnimating(true)
    respinIntervalRef.current = setInterval(() => {
      setDisplayIcons(pool.map(() => pool[Math.floor(Math.random() * pool.length)]))
    }, 200)

    respinStopRef.current = setTimeout(() => {
      if (respinIntervalRef.current) clearInterval(respinIntervalRef.current)
      respinIntervalRef.current = null
      setAnimating(false)
      // US2 effect will sync displayIcons to icons (new column) on animating→false
    }, 1000)

    return () => {
      if (respinIntervalRef.current) clearInterval(respinIntervalRef.current)
      if (respinStopRef.current) clearTimeout(respinStopRef.current)
    }
  }, [respinToken]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`flex flex-col gap-2 relative ${isMagicPhase || isTargetingMode ? 'cursor-pointer' : ''}`}
      role="list"
      aria-label={`Reel column ${colIndex + 1}`}
      onClick={onColumnClick}
    >
      {/* US4: clear, persistent locked indicator */}
      {locked && (
        <div
          role="status"
          aria-label="locked"
          className="flex items-center justify-center gap-1 rounded-md bg-amber-900 border-2 border-amber-400 px-2 py-0.5"
        >
          <span className="text-amber-300 text-xs font-bold">🔒 Locked</span>
        </div>
      )}

      {/* US5: column click target affordance when targeting mode is active */}
      {isTargetingMode && (
        <button
          type="button"
          aria-label={`Select column ${colIndex + 1}`}
          className="absolute inset-0 z-10 rounded-xl border-2 border-dashed border-purple-400 bg-purple-900/20 hover:bg-purple-900/40 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors"
          onClick={(e) => { e.stopPropagation(); onColumnClick() }}
        />
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
