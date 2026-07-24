// Utility for PDF font detection, font family normalization, dynamic web font loading, and fallback mapping

export interface FontDetails {
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  cleanName: string;
}

// Known web/google fonts to dynamically load if detected in PDF
const GOOGLE_FONTS_MAP: Record<string, string> = {
  'roboto': 'Roboto:wght@400;700',
  'open sans': 'Open+Sans:ital,wght@0,400;0,700;1,400;1,700',
  'lato': 'Lato:ital,wght@0,400;0,700;1,400',
  'montserrat': 'Montserrat:ital,wght@0,400;0,700;1,400',
  'poppins': 'Poppins:ital,wght@0,400;0,700;1,400',
  'inter': 'Inter:wght@400;700',
  'merriweather': 'Merriweather:ital,wght@0,400;0,700;1,400',
  'playfair display': 'Playfair+Display:ital,wght@0,400;0,700;1,400',
  'oswald': 'Oswald:wght@400;700',
  'raleway': 'Raleway:ital,wght@0,400;0,700;1,400',
  'nunito': 'Nunito:ital,wght@0,400;0,700;1,400',
  'ubuntu': 'Ubuntu:ital,wght@0,400;0,700;1,400',
  'lora': 'Lora:ital,wght@0,400;0,700;1,400',
  'ptsans': 'PT+Sans:ital,wght@0,400;0,700;1,400',
  'garamond': 'EB+Garamond:ital,wght@0,400;0,700;1,400',
  'libre baskerville': 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
  'cinzel': 'Cinzel:wght@400;700',
  'dancing script': 'Dancing+Script:wght@400;700',
  'great vibes': 'Great+Vibes',
  'pacifico': 'Pacifico',
  'caveat': 'Caveat:wght@400;700',
};

const loadedFontLinks = new Set<string>();

/**
 * Clean a raw PDF font string (e.g. "BCDEEE+Calibri-Bold", "TimesNewRomanPSMT", "Garamond,Italic")
 * into normalized font family name, font weight, and font style.
 */
export function parsePdfFontName(rawFontName?: string): FontDetails {
  if (!rawFontName || typeof rawFontName !== 'string') {
    return { fontFamily: 'Helvetica', fontWeight: 'normal', fontStyle: 'normal', cleanName: 'Helvetica' };
  }

  let name = rawFontName.trim();

  // Strip 6-letter random PDF subset prefix (e.g., "ABCDEF+Calibri-Bold" -> "Calibri-Bold")
  if (name.includes('+')) {
    name = name.split('+')[1] || name;
  }

  // Detect style and weight keywords
  const lowerName = name.toLowerCase();
  const isBold = lowerName.includes('bold') || lowerName.includes('black') || lowerName.includes('heavy') || lowerName.includes('700') || lowerName.includes('800') || lowerName.includes('900') || lowerName.includes('semibold') || lowerName.includes('demi');
  const isItalic = lowerName.includes('italic') || lowerName.includes('oblique') || lowerName.includes('slanted');

  // Strip standard suffix variations
  let cleanName = name
    .replace(/-(BoldItalic|BoldOblique|Bold|Italic|Oblique|Regular|Medium|Light|Thin|Black|Heavy|SemiBold|Condensed)/gi, '')
    .replace(/(BoldItalic|BoldOblique|Bold|Italic|Oblique|Regular|Medium|Light|Thin|Black|Heavy|SemiBold|Condensed)/gi, '')
    .replace(/PSMT$/i, '')
    .replace(/MT$/i, '')
    .replace(/MS$/i, '')
    .replace(/,.*$/, '');

  // Add spaces before capital letters if missing (e.g. "TimesNewRoman" -> "Times New Roman", "OpenSans" -> "Open Sans")
  cleanName = cleanName.replace(/([a-z])([A-Z])/g, '$1 $2').trim();

  // Specific canonical mappings
  const cleanLower = cleanName.toLowerCase();
  let finalFamily = cleanName;

  if (cleanLower.includes('times') || cleanLower.includes('roman')) {
    finalFamily = 'Times New Roman';
  } else if (cleanLower.includes('courier') || cleanLower.includes('mono')) {
    finalFamily = 'Courier New';
  } else if (cleanLower.includes('arial') || cleanLower.includes('helvetica') || cleanLower.includes('sans')) {
    if (cleanLower.includes('arial')) finalFamily = 'Arial';
    else if (cleanLower.includes('helvetica')) finalFamily = 'Helvetica';
  } else if (cleanLower.includes('calibri')) {
    finalFamily = 'Calibri';
  } else if (cleanLower.includes('cambria')) {
    finalFamily = 'Cambria';
  } else if (cleanLower.includes('georgia')) {
    finalFamily = 'Georgia';
  } else if (cleanLower.includes('verdana')) {
    finalFamily = 'Verdana';
  } else if (cleanLower.includes('tahoma')) {
    finalFamily = 'Tahoma';
  } else if (cleanLower.includes('trebuchet')) {
    finalFamily = 'Trebuchet MS';
  } else if (cleanLower.includes('garamond')) {
    finalFamily = 'Garamond';
  } else if (cleanLower.includes('palatino')) {
    finalFamily = 'Palatino';
  }

  return {
    fontFamily: finalFamily,
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal',
    cleanName: finalFamily,
  };
}

/**
 * Dynamically load Google Web Font if supported and not already loaded.
 */
export function loadWebFontIfNeeded(fontFamily: string): void {
  if (typeof window === 'undefined' || !fontFamily) return;

  const key = fontFamily.toLowerCase().trim();
  if (GOOGLE_FONTS_MAP[key] && !loadedFontLinks.has(key)) {
    loadedFontLinks.add(key);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS_MAP[key]}&display=swap`;
    document.head.appendChild(link);
  }
}

/**
 * Fallback font stack builder for CSS style.
 */
export function getFontFallbackStack(fontFamily: string): string {
  if (!fontFamily) return 'Helvetica, Arial, sans-serif';

  const lower = fontFamily.toLowerCase();
  if (lower.includes('times') || lower.includes('georgia') || lower.includes('garamond') || lower.includes('palatino') || lower.includes('cambria') || lower.includes('serif')) {
    return `"${fontFamily}", "Times New Roman", Times, Georgia, serif`;
  }
  if (lower.includes('courier') || lower.includes('mono') || lower.includes('code') || lower.includes('console')) {
    return `"${fontFamily}", "Courier New", Courier, monospace`;
  }
  return `"${fontFamily}", Arial, Helvetica, "Clear Sans", sans-serif`;
}
