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
import Panel from '../layout/Panel';
import Grid from '../layout/Grid';
import Stack from '../layout/Stack';
import Icon from '../primitives/Icon';
import { ProgressRing } from '../primitives/Progress';
import { useTheme } from '../../system/themeStore';
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
  const t = useComponentStrings('dropzone', labels);
  const previewsRef = useRef<Map<File, string>>(new Map());
  const [loaded, setLoaded] = useState<Set<File>>(() => new Set());

  const toCssSize = (v: number | string | undefined, fallback: string) =>
    v == null ? fallback : typeof v === 'number' ? `${v}px` : String(v);

  // Create/revoke object URLs as files change (image files only)
  useEffect(() => {
    const map = previewsRef.current;
    // add new URLs
    files.forEach((f) => {
      if (isImageFile(f) && !map.has(f)) map.set(f, URL.createObjectURL(f));
    });
    // revoke removed URLs
    for (const [f, url] of Array.from(map.entries())) {
      if (!files.includes(f)) {
        URL.revokeObjectURL(url);
        map.delete(f);
      }
    }
  }, [files]);

  // Revoke everything on unmount
  useEffect(() => {
    const map = previewsRef.current;
    return () => {
      for (const [, url] of Array.from(map.entries())) URL.revokeObjectURL(url);
      map.clear();
    };
  }, []);

  const handleDrop = useCallback(
    (accepted: File[], rej: FileRejection[], evt: DropEvent) => {
      const next = multiple ? [...files, ...accepted] : accepted.slice(0, 1);
      const limited = maxFiles ? next.slice(0, maxFiles) : next;
      setFiles(limited);
      /* react-dropzone fires onDrop on every drop (accepted and/or
         rejected), so syncing here both surfaces fresh rejections and
         clears stale ones after a later successful drop. */
      setRejections(rej);
      onFilesChange?.(limited);
      onDropCb?.(accepted, rej, evt);
    },
    [files, multiple, maxFiles, onFilesChange, onDropCb],
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
                src={previewsRef.current.get(f)}
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
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'linear-gradient(180deg, #00000010, #00000022)',
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
          <button
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
              border: `${theme.stroke(1)} solid ${theme.colors.text}33`,
              borderRadius: 4,
              cursor: 'pointer',
              padding: '2px 6px',
              fontSize: '0.75rem',
            }}
          >
            ×
          </button>
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
          <button
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
              cursor: 'pointer',
              padding: '2px 4px',
            }}
          >
            {t.remove}
          </button>
        </Stack>
      ))}
    </Stack>
  );

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

  const setPanelRef: React.RefCallback<HTMLDivElement> = (node) => {
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

  return (
    <Panel
      {...rest}
      {...rootProps}
      ref={setPanelRef}
      variant='outlined'
      fullWidth={fullWidth}
      role='button'
      aria-labelledby={instructionId}
      aria-describedby={rejections.length ? errorsId : undefined}
      sx={{
        width: fullWidth ? `calc(100% - ${theme.spacing(1)} * 2)` : undefined,
        textAlign: 'center',
        cursor: 'pointer',
        ...sx,
      }}
      className={[presetCls, className, isDragActive ? 'drag-active' : '']
        .filter(Boolean)
        .join(' ')}
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
      {previews || fileList}
      {rejections.length > 0 && (
        <div
          id={errorsId}
          aria-live='polite'
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
    </Panel>
  );
};

export default Dropzone;
