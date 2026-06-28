import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpinControls } from '@/components/SpinControls'

const defaultSettings = { autoConvert: true, animate: true, spinMultiplier: 1 as const, autoClaim: false }

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

  // T010: US7 — Auto-claim checkbox
  it('renders "Auto-claim" checkbox label', () => {
    render(
      <SpinControls
        settings={defaultSettings}
        spinning={false}
        isMagicPhase={false}
        onSettingsChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Auto-claim')).toBeDefined()
  })

  it('auto-claim checkbox is unchecked when autoClaim is false', () => {
    render(
      <SpinControls
        settings={{ ...defaultSettings, autoClaim: false }}
        spinning={false}
        isMagicPhase={false}
        onSettingsChange={vi.fn()}
      />
    )
    const checkbox = screen.getByLabelText('Auto-claim') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  it('auto-claim checkbox is checked when autoClaim is true', () => {
    render(
      <SpinControls
        settings={{ ...defaultSettings, autoClaim: true }}
        spinning={false}
        isMagicPhase={false}
        onSettingsChange={vi.fn()}
      />
    )
    const checkbox = screen.getByLabelText('Auto-claim') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('ticking the auto-claim checkbox calls onSettingsChange with autoClaim: true', () => {
    const onSettingsChange = vi.fn()
    render(
      <SpinControls
        settings={{ ...defaultSettings, autoClaim: false }}
        spinning={false}
        isMagicPhase={false}
        onSettingsChange={onSettingsChange}
      />
    )
    fireEvent.click(screen.getByLabelText('Auto-claim'))
    expect(onSettingsChange).toHaveBeenCalledWith({ autoClaim: true })
  })
})
