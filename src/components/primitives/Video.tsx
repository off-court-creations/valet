// ─────────────────────────────────────────────────────────────
// src/components/primitives/Video.tsx  | valet
// flexible <Video /> component with lazy loading & fullscreen
// ─────────────────────────────────────────────────────────────
import React, { useRef, useState, useEffect, KeyboardEvent } from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Public types                                               */
export interface VideoSource {
  src: string;
  type: 'video/mp4' | 'video/webm' | string;
}
export interface VideoTrack {
  src: string;
  kind: 'subtitles' | 'captions' | 'chapters';
  srclang: string;
  label: string;
  default?: boolean;
}

/** Props for the {@link Video} component. */
export interface VideoProps extends Presettable {
  /** One or more video sources (MP4/WebM). */
  sources: VideoSource[];
  /** Poster image URL displayed before playback. */
  poster?: string;
  /** Caption or subtitle tracks. */
  tracks?: VideoTrack[];
  /** Display native controls. Defaults to `true`. */
  controls?: boolean;
  /** Autoplay when ready. Defaults to `true`. */
  autoPlay?: boolean;
  /** Mute audio. Defaults to `true` for autoplay compliance. */
  muted?: boolean;
  /** Loop video. */
  loop?: boolean;
  /** CSS width value, e.g. `100%` or `640px`. */
  width?: string;
  /** CSS height value, e.g. `auto` or `360px`. */
  height?: string;
  /** Lazy load when in viewport. */
  lazy?: boolean;
  /** Custom CSS object-fit. Defaults to `contain`. */
  objectFit?: 'contain' | 'cover';
  /** Playback callback. */
  onPlay?(): void;
  /** Pause callback. */
  onPause?(): void;
  /** Fires on each loop. */
  onLoop?(): void;
  /** Error callback. */
  onError?(e: ErrorEvent): void;
  /** Class name passthrough. */
  className?: string;
  /** Style passthrough. */
  style?: React.CSSProperties;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                          */
const VideoWrapper = styled('div')<{
  $w?: string;
  $h?: string;
  $fit: 'contain' | 'cover';
}>`
  position: relative;
  width: ${({ $w }) => $w || '100%'};
  height: ${({ $h }) => $h || 'auto'};
  overflow: hidden;

  video {
    width: 100%;
    height: 100%;
    object-fit: ${({ $fit }) => $fit};
  }
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const Video: React.FC<VideoProps> = ({
  sources,
  poster,
  tracks,
  controls = true,
  autoPlay = true,
  muted = true,
  loop = false,
  width,
  height,
  lazy,
  objectFit = 'contain',
  onPlay,
  onPause,
  onLoop,
  onError,
  className,
  style,
  preset: p,
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(!lazy);

  useEffect(() => {
    if (!lazy || ready || !('IntersectionObserver' in window)) return;
    const vid = ref.current;
    if (!vid) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setReady(true);
      },
      { threshold: 0.1 },
    );
    io.observe(vid);
    return () => io.disconnect();
  }, [lazy, ready]);

  useEffect(() => {
    const vid = ref.current;
    if (!vid || !loop) return;
    const handler = () => onLoop?.();
    vid.addEventListener('ended', handler);
    return () => vid.removeEventListener('ended', handler);
  }, [loop, onLoop]);

  const togglePlay = () => {
    const vid = ref.current;
    if (!vid) return;
    if (vid.paused) vid.play().catch(() => void 0);
    else vid.pause();
  };

  const handleKey = (e: KeyboardEvent<HTMLVideoElement>) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      togglePlay();
    }
    if (e.key.toLowerCase() === 'c') {
      const t = ref.current?.textTracks[0];
      if (t) t.mode = t.mode === 'showing' ? 'disabled' : 'showing';
    }
  };

  const presetCls = p ? preset(p) : '';

  return (
    <VideoWrapper
      $w={width}
      $h={height}
      $fit={objectFit}
      className={[presetCls, className].filter(Boolean).join(' ')}
      style={style}
    >
      <video
        ref={ref}
        controls={controls}
        autoPlay={autoPlay && ready}
        muted={muted}
        loop={loop}
        playsInline
        preload="metadata"
        poster={poster}
        tabIndex={0}
        onPlay={onPlay}
        onPause={onPause}
        onError={(e) => onError?.(e as unknown as ErrorEvent)}
        onKeyDown={handleKey}
      >
        {ready &&
          sources.map((s, i) => <source key={i} src={s.src} type={s.type} />)}
        {ready && tracks?.map((t, i) => <track key={i} {...t} />)}
      </video>
    </VideoWrapper>
  );
};

export default Video;
