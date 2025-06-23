// ─────────────────────────────────────────────────────────────
// src/components/useAdaptiveStreaming.ts | valet
// HLS/DASH streaming hook for <Video>
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import type { RefObject } from 'react';

export interface AdaptiveSource {
  src: string;
  type: 'application/vnd.apple.mpegurl' | 'application/dash+xml';
}

/**
 * Attach adaptive streaming playback to a video element.
 */
export function useAdaptiveStreaming(
  sources: AdaptiveSource[] | undefined,
  ref: RefObject<HTMLVideoElement>
) {
  useEffect(() => {
    const video = ref.current;
    if (!video || !sources || sources.length === 0) return;

    const { src, type } = sources[0];
    let hls: any;
    let dash: any;
    let cancelled = false;

    if (type === 'application/vnd.apple.mpegurl') {
      import('hls.js')
        .then(({ default: Hls }) => {
          if (cancelled || !video) return;
          if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
          }
        })
        .catch(() => void 0);
    } else if (type === 'application/dash+xml') {
      import('dashjs')
        .then((dashjs) => {
          if (cancelled || !video) return;
          dash = dashjs.MediaPlayer().create();
          dash.initialize(video, src, true);
        })
        .catch(() => void 0);
    }

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
      if (dash) dash.reset();
    };
  }, [sources, ref]);
}

export default useAdaptiveStreaming;
