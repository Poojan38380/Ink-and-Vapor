// Ink & Vapor — Font loading synced with pretext

const DEFAULT_FONTS = [
  // Ink layer
  '400 17px "Playfair Display"',
  '700 17px "Playfair Display"',
  'italic 400 17px "Playfair Display"',
  'italic 700 17px "Playfair Display"',
  '400 13px Inter',
  '400 17px Georgia',
  'bold 72px "Playfair Display"',
  'italic 20px "Playfair Display"',
  // Vapor layer — Georgia at the exact weights/sizes used for char palette
  '300 15px Georgia',
  '500 15px Georgia',
  '800 15px Georgia',
  'italic 300 15px Georgia',
  'italic 500 15px Georgia',
  'italic 800 15px Georgia',
]

/** Wait for all fonts to be loaded */
export async function waitForFonts(fonts?: string[]): Promise<void> {
  const fontList = fonts ?? DEFAULT_FONTS
  // Trigger font loading
  await Promise.all(fontList.map(f => document.fonts.load(f)))
  await document.fonts.ready
}
