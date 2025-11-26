

export interface HSL {
  h: number;
  s: number;
  l: number;
}

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
const normalizeHue = (h: number) => {
    let n = h % 360;
    return n < 0 ? n + 360 : n;
};

// Normalize base color for palette generation to prevent washed out/white results
const normalizePaletteBase = (h: number, s: number, l: number) => {
  let nL = l;
  let nS = s;
  
  // Normalization Rules
  if (nL > 75) nL = 60;
  if (nL < 25) nL = 35;
  if (nS > 90) nS = 75;
  if (nS < 20) nS = 30;

  return { h, s: nS, l: nL };
};

export function hexToHSL(hex: string): HSL {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  h = normalizeHue(h);
  s = clamp(s, 0, 100);
  l = clamp(l, 0, 100);
  
  const sat = s / 100;
  const lit = l / 100;
  
  const a = sat * Math.min(lit, 1 - lit);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lit - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    // Explicitly clamp RGB 0-255 to avoid invalid hex (e.g. negative or >255 due to float errors)
    const val = Math.round(255 * color);
    const hex = Math.max(0, Math.min(255, val)).toString(16).padStart(2, '0');
    return hex;
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Harmony Generators
// Note: 'steps' param is kept for compatibility but logic uses fixed +10 offsets per requirements

export const generateTints = (h: number, s: number, l: number, steps = 5): string[] => {
  const { s: nS, l: nL } = normalizePaletteBase(h, s, l);
  const tints = [hslToHex(h, nS, nL)]; // Include Base
  
  // Formula: L + 10, +20, +30, +40
  for (let i = 1; i <= 4; i++) {
    // Clamp to 95% to prevent pure white washout
    const nextL = Math.min(95, nL + (i * 10));
    tints.push(hslToHex(h, nS, nextL));
  }
  return tints;
};

export const generateShades = (h: number, s: number, l: number, steps = 5): string[] => {
  const { s: nS, l: nL } = normalizePaletteBase(h, s, l);
  const shades = [hslToHex(h, nS, nL)]; // Include Base

  // Formula: L - 10, -20, -30, -40
  for (let i = 1; i <= 4; i++) {
    // Clamp to 5% to prevent pure black
    const nextL = Math.max(5, nL - (i * 10));
    shades.push(hslToHex(h, nS, nextL));
  }
  return shades;
};

export const generateTones = (h: number, s: number, l: number, steps = 5): string[] => {
  const { s: nS, l: nL } = normalizePaletteBase(h, s, l);
  const tones = [hslToHex(h, nS, nL)]; // Include Base

  // Formula: S - 10, -20, -30, -40
  for (let i = 1; i <= 4; i++) {
    const nextS = Math.max(0, nS - (i * 10));
    tones.push(hslToHex(h, nextS, nL));
  }
  return tones;
};

export const generateHarmonies = (h: number, s: number, l: number) => {
  // Normalize base first
  const { h: nH, s: nS, l: nL } = normalizePaletteBase(h, s, l);
  const hex = (deg: number) => hslToHex(deg, nS, nL);

  return {
    complementary: [
        hex(nH), 
        hex(nH + 180)
    ],
    splitComplementary: [
        hex(nH - 150),
        hex(nH),
        hex(nH + 150)
    ],
    analogous: [
        hex(nH - 30),
        hex(nH),
        hex(nH + 30)
    ],
    accentedAnalogic: [
        hex(nH - 30),
        hex(nH),
        hex(nH + 30),
        hex(nH + 180)
    ],
    triadic: [
        hex(nH),
        hex(nH + 120),
        hex(nH + 240) // same as -120
    ],
    tetradic: [
        hex(nH),
        hex(nH + 90),
        hex(nH + 180),
        hex(nH + 270)
    ],
    square: [
        hex(nH),
        hex(nH + 90),
        hex(nH + 180),
        hex(nH + 270)
    ],
  };
};