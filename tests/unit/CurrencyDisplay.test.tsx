import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'

const allZero = {
  food: 0, copper: 0, silver: 0, gold: 0, crowns: 0,
  air: 0, water: 0, earth: 0, fire: 0,
}

describe('CurrencyDisplay', () => {
  it('renders all 7 money+elemental currency labels', () => {
    render(<CurrencyDisplay currencies={allZero} spinCount={0} />)
    for (const label of ['Copper', 'Silver', 'Gold', 'Air', 'Water', 'Earth', 'Fire']) {
      expect(screen.getByText(label)).toBeDefined()
    }
  })

  it('displays correct elemental currency values', () => {
    render(<CurrencyDisplay currencies={{ ...allZero, air: 5, fire: 3 }} spinCount={0} />)
    const values = screen.getAllByText('5')
    expect(values.length).toBeGreaterThan(0)
  })

  it('renders exactly 10 currency cells', () => {
    render(<CurrencyDisplay currencies={allZero} spinCount={0} />)
    const cells = screen.getAllByTestId('currency-cell')
    expect(cells).toHaveLength(10)
  })

  it('first 5 cells contain Apple, Copper, Silver, Gold, Crowns labels', () => {
    render(<CurrencyDisplay currencies={allZero} spinCount={0} />)
    const cells = screen.getAllByTestId('currency-cell')
    const text = cells.slice(0, 5).map((c) => c.textContent ?? '')
    expect(text[0]).toContain('Apple')
    expect(text[1]).toContain('Copper')
    expect(text[2]).toContain('Silver')
    expect(text[3]).toContain('Gold')
    expect(text[4]).toContain('Crowns')
  })

  it('last 5 cells contain Air, Water, Earth, Fire, Spins labels', () => {
    render(<CurrencyDisplay currencies={allZero} spinCount={0} />)
    const cells = screen.getAllByTestId('currency-cell')
    const text = cells.slice(5, 10).map((c) => c.textContent ?? '')
    expect(text[0]).toContain('Air')
    expect(text[1]).toContain('Water')
    expect(text[2]).toContain('Earth')
    expect(text[3]).toContain('Fire')
    expect(text[4]).toContain('Spins')
  })

  it('each cell contains the correct emoji character', () => {
    render(<CurrencyDisplay currencies={allZero} spinCount={0} />)
    for (const emoji of ['🍎', '🟤', '⚪', '🟡', '👑', '💨', '💧', '🌿', '🔥', '🎰']) {
      expect(screen.getByText(emoji)).toBeDefined()
    }
  })
})
