
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
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Harmony Generators
export const generateTints = (h: number, s: number, l: number, steps = 7): string[] => {
  const tints = [];
  // Tints: lighten towards 100%
  // We want 'steps' swatches ranging from slightly lighter than base to very light.
  // If we want exactly 7 swatches, we can split the remaining lightness range.
  for (let i = 1; i <= steps; i++) {
    // L + (remaining * (i / (steps + 1)))
    // Ensures we don't hit pure 100 unless we want to.
    const delta = (100 - l) * (i / (steps + 1));
    tints.push(hslToHex(h, s, l + delta));
  }
  return tints;
};

export const generateShades = (h: number, s: number, l: number, steps = 7): string[] => {
  const shades = [];
  // Shades: darken towards 0%
  for (let i = 1; i <= steps; i++) {
    // L - (L * (i / (steps + 1)))
    const delta = l * (i / (steps + 1));
    shades.push(hslToHex(h, s, l - delta));
  }
  return shades;
};

export const generateTones = (h: number, s: number, l: number, steps = 7): string[] => {
  const tones = [];
  // Tones: desaturate towards 0%
  for (let i = 1; i <= steps; i++) {
    const delta = s * (i / (steps + 1));
    tones.push(hslToHex(h, s - delta, l));
  }
  return tones;
};

export const generateHarmonies = (h: number, s: number, l: number) => {
  const hex = (d: number, sa: number, li: number) => hslToHex(d, sa, li);

  return {
    complementary: [
        hex(h + 180, s, l),
        hex(h, s, l) // Included base for context or swap order if needed, 
        // Actually Affinity typically shows the complementary color. 
        // Request said "Complementary (2)". Usually Base + Comp.
        // Let's provide Comp + Base or Base + Comp. 
        // If strict Affinity: It usually shows the complementary relationship.
        // We'll return [Base, Comp] or similar.
        // Prompt said: "Complementary (2): H + 180" -> wait, just 1 color?
        // Prompt list: "Complementary (2 swatches)".
        // So Base + Comp.
    ],
    splitComplementary: [
        hex(h - 150, s, l),
        hex(h, s, l),
        hex(h + 150, s, l)
    ],
    analogous: [
        hex(h - 30, s, l),
        hex(h, s, l),
        hex(h + 30, s, l)
    ],
    accentedAnalogic: [
        hex(h - 30, s, l),
        hex(h + 30, s, l),
        hex(h + 180, s, l),
        hex(h + 180 - 30, s, l),
        hex(h + 180 + 30, s, l)
    ],
    triadic: [
        hex(h, s, l),
        hex(h + 120, s, l),
        hex(h + 240, s, l)
    ],
    tetradic: [
        hex(h, s, l),
        hex(h + 90, s, l),
        hex(h + 180, s, l),
        hex(h + 270, s, l)
    ],
    square: [
        hex(h, 80, l), // Normalized saturation ~80% per prompt
        hex(h + 90, 80, l),
        hex(h + 180, 80, l),
        hex(h + 270, 80, l)
    ],
  };
};
