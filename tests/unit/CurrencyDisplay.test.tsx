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
})
