// Ink & Vapor — Font loading synced with pretext

const DEFAULT_FONTS = [
  '400 17px "Playfair Display"',
  '700 17px "Playfair Display"',
  'italic 400 17px "Playfair Display"',
  'italic 700 17px "Playfair Display"',
  '400 13px Inter',
  '400 17px Georgia',
  'bold 72px "Playfair Display"',
  'italic 20px "Playfair Display"',
]

/** Wait for all fonts to be loaded */
export async function waitForFonts(fonts?: string[]): Promise<void> {
  const fontList = fonts ?? DEFAULT_FONTS
  // Trigger font loading
  await Promise.all(fontList.map(f => document.fonts.load(f)))
  await document.fonts.ready
}
