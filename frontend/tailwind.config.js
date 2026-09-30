/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Unbounded', 'Syne', 'sans-serif'],
        heading: ['Syne', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        voyage: {
          deep: '#050C1A',
          night: '#0A1628',
          hull: '#122238',
          mist: '#1D334D',
          'teal-deep': '#0D3B43',
          teal: '#175865',
          'teal-light': '#2A7B88',
          foam: '#6DB7BD',
          sand: '#FAF5EB',
          'sand-warm': '#E8DFC8',
          'sand-dune': '#D4C3A3',
          'sand-muted': '#8F836E',
          coral: '#E07A5F',
          'coral-vibrant': '#F26444',
          gold: '#F4A261',
          amber: '#E76F51',
          safe: '#2A9D8F',
          warn: '#E9C46A',
          danger: '#D62828',
        },
      },
      keyframes: {
        bobbing: {
          '0%, 100%': { transform: 'translateY(0px) rotate(-1deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1.5deg)' },
        },
        waveshift: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-24px)' },
        },
      },
      animation: {
        'ship-bob': 'bobbing 6s ease-in-out infinite',
        'wave-drift': 'waveshift 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
