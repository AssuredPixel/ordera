import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#C97B2A',
        'brand-light': '#F5ECD9',
        sidebar: '#1A1A2E',
        surface: '#F9FAFB',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        muted: '#6B7280',
        'border-light': '#E5E7EB',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
