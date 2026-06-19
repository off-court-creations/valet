// ─────────────────────────────────────────────────────────────
// src/components/widgets/Dropzone.tsx | valet
// react-dropzone wrapper with theming, keyboard a11y, previews, and rejections
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useDropzone,
  type DropzoneOptions,
  type FileRejection,
  type DropEvent,
} from 'react-dropzone';
import Grid from '../layout/Grid';
import Stack from '../layout/Stack';
import Icon from '../primitives/Icon';
import { ProgressRing } from '../primitives/Progress';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { makeMix } from '../../system/intentVars';
import { useCompact } from '../../system/compactContext';
import { preset } from '../../css/stylePresets';
import { useComponentStrings } from '../../system/locale';
import type { DeepPartialStrings, ValetStrings } from '../../system/locale';
import type { Presettable, Sx } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface DropzoneProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrop' | 'style'>,
    Presettable {
  /** Allowable file types (same as react-dropzone `accept`) */
  accept?: DropzoneOptions['accept'];
  /** Minimum height for each preview tile while loading (px or CSS length). */
  previewMinHeight?: number | string;
  /** Minimum file size in bytes (react-dropzone `minSize`) */
  minSize?: DropzoneOptions['minSize'];
  /** Maximum file size in bytes (react-dropzone `maxSize`) */
  maxSize?: DropzoneOptions['maxSize'];
  /** Display previews for accepted files */
  showPreviews?: boolean;
  /** Show file icons and names rather than thumbnails */
  showFileList?: boolean;
  /** Called whenever the file list changes */
  onFilesChange?: (files: File[]) => void;
  /** Maximum file count */
  maxFiles?: number;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Callback for when files are dropped */
  onDrop?: DropzoneOptions['onDrop'];
  /** Callback for when files are rejected (type/size/count) */
  onDropRejected?: DropzoneOptions['onDropRejected'];
  /** Stretch to fill parent width */
  fullWidth?: boolean;
  /**
   * Instance-level overrides for this component's i18n strings (instructions,
   * per-file remove affordance, rejection fallback). Wins over the
   * `ValetLocaleProvider` value, which in turn wins over the built-in English
   * defaults (A11Y S8 resolution contract; see `src/system/locale.tsx`).
   */
  labels?: DeepPartialStrings<ValetStrings['dropzone']>;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                          */

/* The interactive drop target. Colours arrive as inline --valet-dz-* CSS vars
   (so the rule text stays static — no per-value class minting) and flip on
   drag-over: a dashed idle outline becomes a solid, intent-tinted "drop-armed"
   surface. Keyboard focus gets a themed ring; the mobile chrome kit suppresses
   the tap-highlight / long-press callout. Previews/errors render OUTSIDE this
   element so the whole-area click target only ever opens the picker. */
const DropArea = styled('div')`
  box-sizing: border-box;
  width: 100%;
  text-align: center;
  cursor: pointer;
  border-width: var(--valet-dz-stroke, 2px);
  border-style: var(--valet-dz-border-style, dashed);
  border-color: var(--valet-dz-border);
  border-radius: var(--valet-dz-radius, 10px);
  background: var(--valet-dz-bg);
  padding: var(--valet-dz-pad, 1rem);
  transition:
    border-color 150ms ease,
    background 150ms ease;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  &:focus-visible {
    outline: var(--valet-focus-width, 2px) solid var(--valet-dz-focus, currentColor);
    outline-offset: 2px;
  }
`;

/* Per-file remove control. Appearance (position/background) is supplied inline
   per usage; the shared chrome here is the focus ring, the tap-highlight reset,
   and a coarse-pointer >=44px invisible hit-expander (24px under compact) so the
   small glyph is comfortably tappable on touch. */
const RemoveButton = styled('button')`
  position: relative;
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  line-height: 1;
  cursor: pointer;
  border-radius: 4px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  &:focus-visible {
    outline: var(--valet-focus-width, 2px) solid var(--valet-dz-focus, currentColor);
    outline-offset: 2px;
  }
  @media (pointer: coarse) {
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      margin: auto;
      width: var(--valet-dz-rm-hit, 44px);
      height: var(--valet-dz-rm-hit, 44px);
    }
  }
`;

/*───────────────────────────────────────────────────────────*/
const iconMap: Record<string, string> = {
  jpg: 'carbon:image',
  jpeg: 'carbon:image',
  png: 'carbon:image',
  gif: 'carbon:image',
  svg: 'carbon:image',
  bmp: 'carbon:image',
  webp: 'carbon:image',
  mp3: 'carbon:music',
  wav: 'carbon:music',
  ogg: 'carbon:music',
  flac: 'carbon:music',
  mp4: 'carbon:video',
  webm: 'carbon:video',
  mov: 'carbon:video',
  mkv: 'carbon:video',
  pdf: 'carbon:pdf',
  doc: 'carbon:document',
  docx: 'carbon:document',
  txt: 'carbon:document',
  csv: 'carbon:csv',
  xls: 'carbon:csv',
  xlsx: 'carbon:csv',
  zip: 'carbon:zip',
  rar: 'carbon:zip',
  gz: 'carbon:zip',
};

const fileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return iconMap[ext] ?? 'carbon:document';
};

/** Only image MIME types get object-URL `<img>` previews. */
const isImageFile = (f: File) => f.type.startsWith('image/');

/*───────────────────────────────────────────────────────────*/
export const Dropzone: React.FC<DropzoneProps> = ({
  accept,
  previewMinHeight,
  minSize,
  maxSize,
  maxFiles,
  multiple = true,
  showPreviews = true,
  showFileList = false,
  onDrop: onDropCb,
  onDropRejected: onDropRejectedCb,
  onFilesChange,
  preset: p,
  fullWidth = false,
  className,
  labels,
  sx,
  ...rest
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const { theme } = useTheme();
  const effCompact = useCompact();
  const t = useComponentStrings('dropzone', labels);
  const [previewUrls, setPreviewUrls] = useState<Map<File, string>>(() => new Map());
  // Mirror of the latest URL map so the unmount effect can revoke without a
  // stale closure (state is a fresh Map each change; a ref tracks the current).
  const previewUrlsRef = useRef(previewUrls);
  previewUrlsRef.current = previewUrls;
  const [loaded, setLoaded] = useState<Set<File>>(() => new Set());

  const toCssSize = (v: number | string | undefined, fallback: string) =>
    v == null ? fallback : typeof v === 'number' ? `${v}px` : String(v);

  // Create/revoke object URLs as files change (image files only). The URLs live
  // in STATE (not a ref) so a freshly minted URL re-renders the <img> that
  // consumes it — minting into a ref leaves the first render's `src` undefined
  // and the tile stuck on its spinner forever. createObjectURL/revoke run in the
  // effect BODY (once per files change), never inside a setState updater — which
  // StrictMode double-invokes, double-minting and leaking a URL.
  useEffect(() => {
    const prev = previewUrlsRef.current;
    let changed = false;
    const next = new Map(prev);
    // add new URLs
    files.forEach((f) => {
      if (isImageFile(f) && !next.has(f)) {
        next.set(f, URL.createObjectURL(f));
        changed = true;
      }
    });
    // revoke removed URLs
    for (const [f, url] of Array.from(next.entries())) {
      if (!files.includes(f)) {
        URL.revokeObjectURL(url);
        next.delete(f);
        changed = true;
      }
    }
    if (changed) {
      previewUrlsRef.current = next;
      setPreviewUrls(next);
    }
    // Prune load-state for files that are gone, so removed files don't retain
    // their File reference for the component's lifetime (pure → StrictMode-safe).
    setLoaded((prevLoaded) => {
      if (!prevLoaded.size) return prevLoaded;
      let dropped = false;
      const nextLoaded = new Set<File>();
      for (const f of prevLoaded) {
        if (files.includes(f)) nextLoaded.add(f);
        else dropped = true;
      }
      return dropped ? nextLoaded : prevLoaded;
    });
  }, [files]);

  // Revoke every outstanding URL on unmount (reads the live ref, not a closure).
  useEffect(
    () => () => {
      for (const [, url] of previewUrlsRef.current) URL.revokeObjectURL(url);
    },
    [],
  );

  const handleDrop = useCallback(
    (accepted: File[], rej: FileRejection[], evt: DropEvent) => {
      const next = multiple ? [...files, ...accepted] : accepted.slice(0, 1);
      const limited = maxFiles ? next.slice(0, maxFiles) : next;
      setFiles(limited);
      /* react-dropzone enforces `maxFiles` per-drop only, so an append that
         crosses the cumulative limit would silently discard the overflow.
         Surface those files through the same rejection region as type/size
         errors instead of dropping them without feedback. */
      const overflow = maxFiles ? next.slice(maxFiles) : [];
      const overflowRej: FileRejection[] = overflow.map((file) => ({
        file,
        errors: [{ code: 'too-many-files', message: t.tooManyFiles }],
      }));
      /* react-dropzone fires onDrop on every drop (accepted and/or rejected),
         so syncing here both surfaces fresh rejections and clears stale ones
         after a later successful drop. */
      setRejections([...rej, ...overflowRej]);
      onFilesChange?.(limited);
      onDropCb?.(accepted, rej, evt);
    },
    [files, multiple, maxFiles, onFilesChange, onDropCb, t],
  );

  const handleRejected = useCallback(
    (rej: FileRejection[], evt: DropEvent) => {
      setRejections(rej);
      onDropRejectedCb?.(rej, evt);
    },
    [onDropRejectedCb],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    minSize,
    maxSize,
    maxFiles,
    multiple,
    onDrop: handleDrop,
    onDropRejected: handleRejected,
  });
  const presetCls = p ? preset(p) : '';

  // Remove helper — pure: no callbacks or side effects inside the state
  // updater (StrictMode double-invokes updaters); URL revocation is owned
  // by the object-URL effect above, keyed on `files`.
  const removeAt = useCallback(
    (idx: number) => {
      const next = files.filter((_, i) => i !== idx);
      setFiles(next);
      onFilesChange?.(next);
    },
    [files, onFilesChange],
  );

  const previews = showPreviews && files.length > 0 && (
    <Grid
      columns={4}
      gap={0.5}
      sx={{ width: '100%' }}
    >
      {files.map((f, i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            minHeight: toCssSize(previewMinHeight, '140px'),
            borderRadius: 6,
            overflow: 'hidden',
            background:
              isImageFile(f) && loaded.has(f) ? 'transparent' : theme.colors.backgroundAlt,
          }}
        >
          {isImageFile(f) ? (
            <>
              <img
                src={previewUrls.get(f)}
                alt={f.name}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: 6,
                  opacity: loaded.has(f) ? 1 : 0,
                  transition: 'opacity 200ms ease-out',
                }}
                onLoad={() => setLoaded((prev) => (prev.has(f) ? prev : new Set(prev).add(f)))}
                onError={() => setLoaded((prev) => (prev.has(f) ? prev : new Set(prev).add(f)))}
              />
              {!loaded.has(f) && (
                /* Spinner-centering overlay; the loading tint comes from the
                   tile's own backgroundAlt fill (no hardcoded gradient). */
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <ProgressRing size={40} />
                </div>
              )}
            </>
          ) : (
            /* Non-image files never get an object-URL <img>; show an icon tile. */
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                padding: theme.spacing(0.5),
              }}
            >
              <Stack sx={{ alignItems: 'center', gap: theme.spacing(0.5), maxWidth: '100%' }}>
                <Icon
                  icon={fileIcon(f.name)}
                  size='lg'
                />
                <span
                  style={{
                    fontSize: '0.75rem',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.name}
                </span>
              </Stack>
            </div>
          )}
          <RemoveButton
            type='button'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              removeAt(i);
            }}
            aria-label={t.removeFile(f.name)}
            title={t.removeFileTitle}
            style={{
              position: 'absolute',
              top: 4,
              insetInlineEnd: 4,
              background: theme.colors.backgroundAlt,
              color: theme.colors.text,
              border: `${theme.stroke(1)} solid ${theme.colors.divider}`,
              padding: '2px 6px',
              fontSize: '0.75rem',
            }}
          >
            ×
          </RemoveButton>
        </div>
      ))}
    </Grid>
  );

  const fileList = showFileList && !showPreviews && files.length > 0 && (
    <Stack sx={{ width: '100%' }}>
      {files.map((f, i) => (
        <Stack
          key={i}
          direction='row'
          sx={{ alignItems: 'center', gap: theme.spacing(0.5) }}
        >
          <Icon icon={fileIcon(f.name)} />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {f.name}
          </span>
          <RemoveButton
            type='button'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              removeAt(i);
            }}
            aria-label={t.removeFile(f.name)}
            title={t.removeFileTitle}
            style={{
              background: 'transparent',
              color: theme.colors.text,
              border: 'none',
              padding: '2px 4px',
            }}
          >
            {t.remove}
          </RemoveButton>
        </Stack>
      ))}
    </Stack>
  );

  // Helpers for instructions / a11y
  const instr = isDragActive ? t.instructionsActive : t.instructionsIdle;
  const sizeHint = useMemo(() => {
    const human = (n: number) =>
      n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.ceil(n / 1024)}KB`;
    const parts: string[] = [];
    if (maxSize) parts.push(`up to ${human(maxSize)}`);
    if (minSize) parts.push(`min ${human(minSize)}`);
    return parts.length ? parts.join(', ') : undefined;
  }, [maxSize, minSize]);

  const acceptHint = useMemo(() => {
    if (!accept) return undefined;
    if (typeof accept === 'string') return accept;
    const keys = Object.keys(accept || {});
    return keys.length ? keys.join(', ') : undefined;
  }, [accept]);

  // Pull out dropzone's ref so we can forward a typed ref without `any`
  const { ref: dropzoneRef, ...rootProps } = getRootProps();

  const setRootRef: React.RefCallback<HTMLDivElement> = (node) => {
    if (!dropzoneRef) return;
    if (typeof dropzoneRef === 'function') {
      // react-dropzone expects to receive the root element
      (dropzoneRef as (instance: HTMLDivElement | null) => void)(node);
    } else {
      (dropzoneRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  // IDs for a11y linkage
  const instructionId = React.useId();
  const errorsId = React.useId();

  // Drop-armed vs idle chrome, delivered as inline CSS vars (cardinality-safe,
  // makeMix is parse-safe for non-hex theme colours).
  const dropAreaVars: Record<string, string> = {
    '--valet-dz-border': isDragActive
      ? theme.colors.primary
      : (theme.colors.divider ?? theme.colors.backgroundAlt),
    '--valet-dz-bg': isDragActive
      ? makeMix(theme.colors.primary, theme.colors.background, 0.1)
      : 'transparent',
    '--valet-dz-border-style': isDragActive ? 'solid' : 'dashed',
    '--valet-dz-stroke': theme.stroke(2),
    '--valet-dz-pad': theme.spacing(2),
  };

  return (
    <div
      {...rest}
      data-valet-component='Dropzone'
      className={[presetCls, className].filter(Boolean).join(' ') || undefined}
      style={
        {
          display: fullWidth ? 'block' : 'inline-block',
          width: fullWidth ? '100%' : undefined,
          // Shared hooks for the drop target + remove buttons.
          '--valet-dz-focus': theme.colors.primary,
          '--valet-dz-rm-hit': effCompact ? '24px' : '44px',
          ...(sx as object),
        } as React.CSSProperties
      }
    >
      {/* Interactive drop target — only the picker affordance lives here. */}
      <DropArea
        {...rootProps}
        ref={setRootRef}
        role='button'
        aria-labelledby={instructionId}
        aria-describedby={rejections.length ? errorsId : undefined}
        /* `drag-active` stays a documented styling hook; the visible drag
           feedback itself comes from the --valet-dz-* vars below. */
        className={isDragActive ? 'drag-active' : undefined}
        style={dropAreaVars as React.CSSProperties}
      >
        <input {...getInputProps()} />
        <Icon
          icon='mdi:cloud-upload'
          size='lg'
        />
        <div id={instructionId}>
          {instr}
          {(acceptHint || sizeHint) && (
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
              {acceptHint && <span>Accepted: {acceptHint}</span>}
              {acceptHint && sizeHint && <span> • </span>}
              {sizeHint && <span>{sizeHint}</span>}
            </div>
          )}
        </div>
      </DropArea>

      {/* Previews / file list render OUTSIDE the drop target so clicking a
          thumbnail (or its remove button) never re-opens the file picker. */}
      {previews || fileList}

      {rejections.length > 0 && (
        <div
          id={errorsId}
          role='alert'
          style={{ marginTop: theme.spacing(0.5) }}
        >
          {rejections.map((r, i) => (
            <div
              key={`${r.file.name}-${i}`}
              style={{ fontSize: '0.75rem', color: theme.colors.error }}
            >
              {r.file.name}: {r.errors[0]?.message ?? t.fileRejected}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropzone;
