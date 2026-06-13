// ─────────────────────────────────────────────────────────────
// docs/src/components/DemoFontLoader.tsx  | valet-docs
// Loads demo-only fonts (Poppins, Brandon) without changing theme.
// ─────────────────────────────────────────────────────────────
import { useGoogleFonts } from '@archway/valet';
import brandonUrl from '../assets/fonts/BrandonGrotesque.otf';

export function DemoFontLoader() {
  // Ensure Poppins and Brandon are available for demos. Poppins is self-hosted
  // via @fontsource/poppins (imported in main.tsx); injectRemote:false makes
  // valet resolve it from that installed face instead of fonts.googleapis.com.
  // Brandon is a local OTF (unaffected by injectRemote).
  useGoogleFonts(['Poppins', { name: 'Brandon', src: brandonUrl }], {
    injectRemote: false,
  });
  return null;
}

export default DemoFontLoader;
