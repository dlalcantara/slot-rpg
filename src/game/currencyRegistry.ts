import type { CurrencyDefinition } from './types'

export const CURRENCY_REGISTRY: Record<string, CurrencyDefinition> = {
  food: {
    key: 'food',
    label: 'Food',
    startingAmount: 100,
    autoConvertTo: null,
    convertibleFrom: null,
    winCondition: null,
    lossCondition: { threshold: 0 },
  },
  copper: {
    key: 'copper',
    label: 'Copper',
    startingAmount: 0,
    autoConvertTo: { currency: 'silver', threshold: 100, rate: 100 },
    convertibleFrom: { currency: 'silver', rate: 100 },
    winCondition: null,
    lossCondition: null,
  },
  silver: {
    key: 'silver',
    label: 'Silver',
    startingAmount: 0,
    autoConvertTo: { currency: 'gold', threshold: 100, rate: 100 },
    convertibleFrom: { currency: 'gold', rate: 100 },
    winCondition: null,
    lossCondition: null,
  },
  gold: {
    key: 'gold',
    label: 'Gold',
    startingAmount: 0,
    autoConvertTo: null,
    convertibleFrom: null,
    winCondition: null,
    lossCondition: null,
  },
  crowns: {
    key: 'crowns',
    label: 'Crowns',
    startingAmount: 0,
    autoConvertTo: null,
    convertibleFrom: null,
    winCondition: { threshold: 100 },
    lossCondition: null,
  },
}

export const CURRENCY_ORDER = ['food', 'gold', 'silver', 'copper', 'crowns']
