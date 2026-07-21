// Theme tokens for dark / light mode.
//
// These are SEMANTIC, not literal: a screen asks for `c.text` or `c.accent`, never
// for "#fff". That matters because several roles invert between the two themes —
// `accent` is white on dark but black on light, and `accentText` does the opposite.
// A literal find/replace of '#fff' would turn every primary button into white text
// on a white background, which is exactly why the tokens exist.

export const DARK = {
  key: 'dark',

  bg: '#000',            // screen background
  surface: '#111',       // cards, sheets
  elevated: '#1A1A1A',   // inputs, tiles, chips
  border: '#1E1E1E',     // hairlines on surface
  borderStrong: '#2A2A2A',

  text: '#fff',          // primary copy
  textDim: '#8A8A8A',    // secondary copy, labels
  textFaint: '#555',     // hints, disabled
  icon: '#fff',
  iconDim: '#8A8A8A',

  accent: '#fff',        // primary button fill  ── inverts
  accentText: '#000',    // copy ON the primary button ── inverts
  accentDim: '#1A1A1A',  // disabled primary fill

  overlay: 'rgba(0,0,0,0.72)',
  danger: '#FF5555',
  dangerText: '#fff',
};

export const LIGHT = {
  key: 'light',

  bg: '#FFFFFF',
  surface: '#F4F4F5',
  elevated: '#EAEAEC',
  border: '#E2E2E5',
  borderStrong: '#D3D3D7',

  text: '#0A0A0A',
  textDim: '#6B6B70',
  textFaint: '#9A9AA0',
  icon: '#0A0A0A',
  iconDim: '#6B6B70',

  accent: '#0A0A0A',     // inverted vs dark
  accentText: '#FFFFFF', // inverted vs dark
  accentDim: '#D3D3D7',

  overlay: 'rgba(0,0,0,0.45)',
  danger: '#D92D20',
  dangerText: '#fff',
};

export const THEMES = { dark: DARK, light: LIGHT };

export const themeFor = (key) => THEMES[key] || DARK;
