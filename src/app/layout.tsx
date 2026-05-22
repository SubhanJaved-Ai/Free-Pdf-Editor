import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AetherPDF — World-Class Premium browser-based PDF Editor",
  description: "The ultimate next-generation client-first PDF workspace. Edit native text paragraphs, custom fonts, vector graphics, pages, shapes, and signatures with unmatched speed.",
  openGraph: {
    title: "AetherPDF — World-Class Premium PDF Editor",
    description: "Futuristic client-first offline-first vector PDF editing engine.",
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Core UI Font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Signature Fonts — 50 premium cursive/handwriting/script fonts (Batch 1: 25) */}
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script&family=Pacifico&family=Caveat&family=Sacramento&family=Satisfy&family=Parisienne&family=Allura&family=Alex+Brush&family=Yellowtail&family=Kaushan+Script&family=Marck+Script&family=Tangerine&family=Merienda&family=Rochester&family=Clicker+Script&family=Courgette&family=Pinyon+Script&family=Italianno&family=Bad+Script&family=Handlee&family=Cookie&family=Mr+Dafoe&family=Berkshire+Swash&family=Petit+Formal+Script&display=swap" rel="stylesheet" />
        {/* Signature Fonts — Batch 2: 25 additional premium fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Whisper&family=Euphoria+Script&family=Rouge+Script&family=Monsieur+La+Doulaise&family=Mrs+Saint+Delafield&family=Ruthie&family=Herr+Von+Muellerhoff&family=Miss+Fajardose&family=Dr+Sugiyama&family=Meie+Script&family=Bilbo+Swash+Caps&family=Sevillana&family=Meddon&family=Niconne&family=Aguafina+Script&family=Qwigley&family=League+Script&family=Style+Script&family=Ms+Madi&family=Shalimar&family=Luxurious+Script&family=Bonheur+Royale&family=Ballet&family=Petemoss&family=Fleur+De+Leah&display=swap" rel="stylesheet" />
        {/* Professional Text Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter&family=Poppins&family=Roboto&family=Open+Sans&family=Lato&family=Montserrat&family=Nunito&family=Source+Sans+Pro&family=Work+Sans&family=Ubuntu&family=DM+Sans&family=Merriweather&family=Playfair+Display&family=Libre+Baskerville&family=Lora&family=Crimson+Text&family=EB+Garamond&family=PT+Serif&family=Bebas+Neue&family=Raleway&family=Oswald&family=Quicksand&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-obsidian-950 text-foreground">
        {children}
      </body>
    </html>
  );
}
export const runtime = 'edge'; // Edge compatible app rendering
