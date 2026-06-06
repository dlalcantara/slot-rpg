import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        food: '#f59e0b',
        copper: '#b45309',
        silver: '#94a3b8',
        gold: '#eab308',
        crowns: '#a855f7',
      },
    },
  },
  plugins: [],
}

export default config
