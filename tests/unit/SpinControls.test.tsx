import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpinControls } from '@/components/SpinControls'

const defaultSettings = { autoConvert: true, animate: true, spinMultiplier: 1 as const }

describe('SpinControls', () => {
  it('does not render any x1 button', () => {
    render(
      <SpinControls
        settings={defaultSettings}
        spinning={false}
        isMagicPhase={false}
        onSettingsChange={vi.fn()}
      />
    )
    expect(screen.queryByText(/x1/i)).toBeNull()
  })
})
