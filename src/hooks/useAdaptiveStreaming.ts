// ─────────────────────────────────────────────────────────────
// src/hooks/useAdaptiveStreaming.ts  | valet
// placeholder hook for future adaptive video streaming
// ─────────────────────────────────────────────────────────────
import type { VideoSource } from '../components/Video';

export interface AdaptiveState {
  currentSources: VideoSource[];
  attach: (el: HTMLVideoElement | null) => void;
}

export function useAdaptiveStreaming(sources: VideoSource[]): AdaptiveState {
  const attach = () => void 0;
  return { currentSources: sources, attach };
}

export default useAdaptiveStreaming;
