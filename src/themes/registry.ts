// Ink & Vapor — Default theme (Midnight Galaxy base)

import type { RGB } from '../shared/colors'

export interface Theme {
  id: string
  name: string
  bg: string
  bgGradientCenter: RGB
  bgGradientEdge: RGB
  inkColor: RGB
  inkAccent: RGB
  dropCapColor: RGB
  headlineColor: RGB
  headlineAccent: RGB
  boundaryColor: RGB
  boundaryGlow: RGB
  cursorColor: RGB
  headlineFont: string
  bodyFont: string
  dropCapFont: string
  grainIntensity: number
}

export const midnightGalaxy: Theme = {
  id: 'midnight-galaxy',
  name: 'Midnight Galaxy',
  bg: '#06060f',
  bgGradientCenter: { r: 14, g: 14, b: 26 },
  bgGradientEdge: { r: 4, g: 4, b: 8 },
  inkColor: { r: 220, g: 210, b: 185 },
  inkAccent: { r: 196, g: 163, b: 90 },
  dropCapColor: { r: 245, g: 200, b: 120 },
  headlineColor: { r: 255, g: 250, b: 240 },
  headlineAccent: { r: 196, g: 163, b: 90 },
  boundaryColor: { r: 167, g: 119, b: 227 },
  boundaryGlow: { r: 110, g: 142, b: 251 },
  cursorColor: { r: 196, g: 163, b: 90 },
  headlineFont: 'bold 72px "Playfair Display"',
  bodyFont: '17px Georgia',
  dropCapFont: 'bold 68px "Playfair Display"',
  grainIntensity: 0.025,
}

export const goldenHour: Theme = {
  id: 'golden-hour',
  name: 'Golden Hour',
  bg: '#1a0f06',
  bgGradientCenter: { r: 32, g: 22, b: 12 },
  bgGradientEdge: { r: 10, g: 6, b: 3 },
  inkColor: { r: 230, g: 200, b: 150 },
  inkAccent: { r: 200, g: 120, b: 50 },
  dropCapColor: { r: 245, g: 166, b: 35 },
  headlineColor: { r: 255, g: 235, b: 200 },
  headlineAccent: { r: 220, g: 140, b: 60 },
  boundaryColor: { r: 220, g: 100, b: 80 },
  boundaryGlow: { r: 245, g: 166, b: 35 },
  cursorColor: { r: 245, g: 166, b: 35 },
  headlineFont: 'bold 72px "Playfair Display"',
  bodyFont: '17px Georgia',
  dropCapFont: 'bold 68px "Playfair Display"',
  grainIntensity: 0.03,
}

export const oceanDepths: Theme = {
  id: 'ocean-depths',
  name: 'Ocean Depths',
  bg: '#060a10',
  bgGradientCenter: { r: 12, g: 20, b: 36 },
  bgGradientEdge: { r: 4, g: 6, b: 12 },
  inkColor: { r: 200, g: 220, b: 230 },
  inkAccent: { r: 80, g: 200, b: 180 },
  dropCapColor: { r: 100, g: 220, b: 200 },
  headlineColor: { r: 220, g: 240, b: 255 },
  headlineAccent: { r: 80, g: 200, b: 220 },
  boundaryColor: { r: 60, g: 140, b: 200 },
  boundaryGlow: { r: 40, g: 180, b: 220 },
  cursorColor: { r: 80, g: 200, b: 200 },
  headlineFont: 'bold 72px "Playfair Display"',
  bodyFont: '17px Georgia',
  dropCapFont: 'bold 68px "Playfair Display"',
  grainIntensity: 0.02,
}

export const themes: Theme[] = [midnightGalaxy, goldenHour, oceanDepths]

export function getTheme(id: string): Theme {
  return themes.find(t => t.id === id) ?? midnightGalaxy
}
