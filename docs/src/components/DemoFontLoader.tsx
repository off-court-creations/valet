// ─────────────────────────────────────────────────────────────
// docs/src/components/DemoFontLoader.tsx  | valet-docs
// Loads demo-only fonts (Poppins, Brandon) without changing theme.
// ─────────────────────────────────────────────────────────────
import { useGoogleFonts } from '@archway/valet';
import brandonUrl from '../assets/fonts/BrandonGrotesque.otf';

export function DemoFontLoader() {
  // Ensure Poppins (Google) and Brandon (local) are available for demos
  useGoogleFonts(['Poppins', { name: 'Brandon', src: brandonUrl }]);
  return null;
}

export default DemoFontLoader;
