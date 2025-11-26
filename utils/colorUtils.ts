
export interface HSL {
  h: number;
  s: number;
  l: number;
}

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
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Harmony Generators
export const generateTints = (h: number, s: number, l: number, steps = 5): string[] => {
  const tints = [];
  const stepSize = (100 - l) / (steps + 1);
  for (let i = 1; i <= steps; i++) {
    tints.push(hslToHex(h, s, Math.min(100, l + stepSize * i)));
  }
  return tints;
};

export const generateShades = (h: number, s: number, l: number, steps = 5): string[] => {
  const shades = [];
  const stepSize = l / (steps + 1);
  for (let i = 1; i <= steps; i++) {
    shades.push(hslToHex(h, s, Math.max(0, l - stepSize * i)));
  }
  return shades;
};

export const generateTones = (h: number, s: number, l: number, steps = 5): string[] => {
  const tones = [];
  const stepSize = s / (steps + 1);
  for (let i = 1; i <= steps; i++) {
    tones.push(hslToHex(h, Math.max(0, s - stepSize * i), l));
  }
  return tones;
};

export const generateHarmonies = (h: number, s: number, l: number) => {
  const normalize = (deg: number) => (deg < 0 ? deg + 360 : deg % 360);
  
  return {
    complementary: [hslToHex(normalize(h + 180), s, l)],
    splitComplementary: [hslToHex(normalize(h + 150), s, l), hslToHex(normalize(h + 210), s, l)],
    analogous: [hslToHex(normalize(h - 30), s, l), hslToHex(normalize(h + 30), s, l)],
    triadic: [hslToHex(normalize(h + 120), s, l), hslToHex(normalize(h + 240), s, l)],
    tetradic: [hslToHex(normalize(h + 90), s, l), hslToHex(normalize(h + 180), s, l), hslToHex(normalize(h + 270), s, l)],
    square: [hslToHex(normalize(h + 90), s, l), hslToHex(normalize(h + 180), s, l), hslToHex(normalize(h + 270), s, l)],
  };
};
