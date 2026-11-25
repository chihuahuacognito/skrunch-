// Single source of design tokens. Dark theme only, values from the redesign spec (section 5), which copies the
// Claude Design mockups in docs/design.
export const tokens = {
  color: {
    bg: '#111318',
    sc: '#1D2024',
    sch: '#272A2F',
    schh: '#32353A',
    on: '#E2E2E9',
    onv: '#C4C6D0',
    ol: '#8E9099',
    olv: '#44474E',
    pri: '#A8C7FF',
    onpri: '#0B305F',
    pric: '#254777',
    onpric: '#D5E3FF',
    just: '#FF8F4A',
    recov: '#FFCF5C',
    rest: '#6CB0FF',
    empty: '#3A3E45',
    errc: '#93000A',
    onerrc: '#FFDAD6',
    okc: '#1F3D2E',
    onokc: '#B8F0CF',
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 40 },
  radius: { card: 20, inner: 14, pill: 28 },
  font: { size: { label: 11, sub: 13, body: 15, name: 18, target: 24, title: 30 } },
} as const;

export type Tokens = typeof tokens;
