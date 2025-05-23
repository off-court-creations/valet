// src/components/Parallax.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from 'react';
  import { preset } from '../css/stylePresets';
  import type { Presettable } from '../types';
  
  /*───────────────────────────────────────────────────────────────*/
  /* 1 ▸ Shared context & hook                                     */
  
  interface ParallaxState {
    scrollY: number;
    scrollX: number;
  }
  
  const ParallaxCtx = createContext<ParallaxState>({ scrollY: 0, scrollX: 0 });
  
  /** Read current scroll offsets (provided by <ParallaxScroll>). */
  export const useParallax = () => useContext(ParallaxCtx);
  
  /*───────────────────────────────────────────────────────────────*/
  /* 2 ▸ Utility                                                   */
  
  /** Find first scrollable ancestor (the <Surface> container). */
  const findScrollParent = (node: HTMLElement | null): HTMLElement | Window => {
    let el: HTMLElement | null = node?.parentElement ?? null;
    while (el) {
      const { overflowY, overflowX } = getComputedStyle(el);
      if (/(auto|scroll)/.test(`${overflowY}${overflowX}`)) return el;
      el = el.parentElement;
    }
    return window;
  };
  
  /*───────────────────────────────────────────────────────────────*/
  /* 3 ▸ ParallaxScroll – root wrapper                             */
  
  export interface ParallaxScrollProps
    extends React.HTMLAttributes<HTMLDivElement>,
      Presettable {
    /** Track horizontal scroll in addition to vertical. */
    trackX?: boolean;
  }
  
  export const ParallaxScroll: React.FC<ParallaxScrollProps> = ({
    children,
    trackX = false,
    preset: p,
    style,
    className,
    ...props
  }) => {
    const selfRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<ParallaxState>({ scrollY: 0, scrollX: 0 });
  
    useEffect(() => {
      if (!selfRef.current) return;
      const scrollParent = findScrollParent(selfRef.current);
  
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y =
            scrollParent === window
              ? window.scrollY
              : (scrollParent as HTMLElement).scrollTop;
          const x =
            trackX
              ? scrollParent === window
                ? window.scrollX
                : (scrollParent as HTMLElement).scrollLeft
              : 0;
          setState({ scrollY: y, scrollX: x });
          ticking = false;
        });
      };
  
      /* kick once */
      onScroll();
      scrollParent.addEventListener('scroll', onScroll, { passive: true });
      return () => scrollParent.removeEventListener('scroll', onScroll);
    }, [trackX]);
  
    const presetClasses = p ? preset(p) : '';
  
    return (
      <ParallaxCtx.Provider value={state}>
        <div
          ref={selfRef}
          className={[presetClasses, className].filter(Boolean).join(' ')}
          style={{ position: 'relative', overflow: 'hidden', ...style }}
          {...props}
        >
          {children}
        </div>
      </ParallaxCtx.Provider>
    );
  };
  
  /*───────────────────────────────────────────────────────────────*/
  /* 4 ▸ Generic ParallaxLayer                                     */
  
  export interface ParallaxLayerProps
    extends React.HTMLAttributes<HTMLDivElement>,
      Presettable {
    speed?: number; // 1 = native, 0.5 = slower, 2 = faster
    axis?: 'y' | 'x';
  }
  
  export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
    children,
    speed = 0.5,
    axis = 'y',
    preset: p,
    style,
    className,
    ...props
  }) => {
    const { scrollY, scrollX } = useParallax();
    const offset = useMemo(() => {
      const d = axis === 'y' ? scrollY : scrollX;
      return d * (speed - 1);
    }, [scrollY, scrollX, speed, axis]);
  
    const transform =
      axis === 'y'
        ? `translate3d(0, ${offset}px, 0)`
        : `translate3d(${offset}px, 0, 0)`;
  
    const presetClasses = p ? preset(p) : '';
  
    return (
      <div
        className={[presetClasses, className].filter(Boolean).join(' ')}
        style={{
          position: 'relative',
          willChange: 'transform',
          transform,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  };
  
  /*───────────────────────────────────────────────────────────────*/
  /* 5 ▸ NEW ▸ ParallaxBackground                                  */
  /*     – Image or video that fills its parent and parallax-moves */
  
  type MediaType = 'image' | 'video';
  
  export interface ParallaxBackgroundProps
    extends Omit<ParallaxLayerProps, 'children'>,
      Presettable {
    /** Source for JPG / WEBP / WEBM (auto-detects type if omitted). */
    src: string;
    /** Force media type (otherwise guessed by file extension). */
    mediaType?: MediaType;
    /** Optional poster frame for video. */
    poster?: string;
    /** Video attributes */
    loop?: boolean;
    muted?: boolean;
    autoPlay?: boolean;
    preload?: 'none' | 'metadata' | 'auto';
  }
  
  export const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({
    src,
    mediaType,
    poster,
    speed = 0.5,
    axis = 'y',
    preset: p,
    className,
    style,
    loop = true,
    muted = true,
    autoPlay = true,
    preload = 'auto',
    ...props
  }) => {
    /* ----- detect media type by extension if not provided ----- */
    const guessedType: MediaType = useMemo(() => {
      if (mediaType) return mediaType;
      return /\.(webm|mp4|mov)$/i.test(src) ? 'video' : 'image';
    }, [mediaType, src]);
  
    /* ----- video play / pause when in viewport (perf) ---------- */
    const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null);
    useEffect(() => {
      if (guessedType !== 'video' || !('IntersectionObserver' in window)) return;
      const vid = mediaRef.current as HTMLVideoElement | null;
      if (!vid) return;
  
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            vid.play().catch(() => void 0);
          } else {
            vid.pause();
          }
        },
        { threshold: 0.1 }
      );
      io.observe(vid);
      return () => io.disconnect();
    }, [guessedType]);
  
    const presetClasses = p ? preset(p) : '';
  
    /* ----- inner media element -------------------------------- */
    const mediaEl =
      guessedType === 'video' ? (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          poster={poster}
          loop={loop}
          muted={muted}
          playsInline
          autoPlay={autoPlay}
          preload={preload}
          /*👇 object-fit keeps coverage regardless of transform */
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <img
          ref={mediaRef as React.RefObject<HTMLImageElement>}
          src={src}
          loading="lazy"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      );
  
    return (
      <ParallaxLayer
        speed={speed}
        axis={axis}
        preset={p}
        className={[presetClasses, className].filter(Boolean).join(' ')}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none', // let UI on top be interactive
          ...style,
        }}
        {...props}
      >
        {mediaEl}
      </ParallaxLayer>
    );
  };
  
  /*───────────────────────────────────────────────────────────────*/
  /* 6 ▸ Exports                                                   */
  
  export default ParallaxScroll;
  