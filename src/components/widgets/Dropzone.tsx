// ─────────────────────────────────────────────────────────────
// src/components/widgets/Dropzone.tsx | valet
// react-dropzone wrapper with theming and previews
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useState, forwardRef } from 'react';
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
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface DropzoneProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrop'>,
    Presettable {
  /** Allowable file types (same as react-dropzone `accept`) */
  accept?: DropzoneOptions['accept'];
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
  /** Stretch to fill parent width */
  fullWidth?: boolean;
}

/*───────────────────────────────────────────────────────────*/
export const Dropzone = forwardRef<HTMLDivElement, DropzoneProps>(
  (
    {
      accept,
      maxFiles,
      multiple = true,
      showPreviews = true,
      showFileList = false,
      onDrop: onDropCb,
      onFilesChange,
      preset: p,
      fullWidth = false,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
  const [files, setFiles] = useState<File[]>([]);
  const { theme } = useTheme();

  const handleDrop = useCallback(
    (accepted: File[], _rej: FileRejection[], _evt: DropEvent) => {
      const next = multiple ? [...files, ...accepted] : accepted.slice(0, 1);
      const limited = maxFiles ? next.slice(0, maxFiles) : next;
      setFiles(limited);
      onFilesChange?.(limited);
      onDropCb?.(accepted, _rej, _evt);
    },
    [files, multiple, maxFiles, onFilesChange, onDropCb],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({ accept, maxFiles, multiple, onDrop: handleDrop });
  const presetCls = p ? preset(p) : '';

  const previews = showPreviews && files.length > 0 && (
    <Grid columns={4} gap={0.5} style={{ width: '100%' }}>
      {files.map((f, i) => (
        <img
          key={i}
          src={URL.createObjectURL(f)}
          alt={f.name}
          style={{ width: '100%', height: 'auto', borderRadius: 4 }}
        />
      ))}
    </Grid>
  );

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

  const fileList = showFileList && !showPreviews && files.length > 0 && (
    <Stack spacing={0.5} style={{ width: '100%' }}>
      {files.map((f, i) => (
        <Stack key={i} direction="row" spacing={0.5} style={{ alignItems: 'center' }}>
          <Icon icon={fileIcon(f.name)} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
        </Stack>
      ))}
    </Stack>
  );

  const rootProps = getRootProps();

  return (
    <Panel
      {...rest}
      {...rootProps}
      ref={(el) => {
        (rootProps.ref as (node: HTMLDivElement | null) => void)(el);
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      variant="alt"
      fullWidth={fullWidth}
      style={{
        width: fullWidth ? `calc(100% - ${theme.spacing(1)} * 2)` : undefined,
        textAlign: 'center',
        cursor: 'pointer',
        ...style,
      }}
      className={[presetCls, className, isDragActive ? 'drag-active' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <input {...getInputProps()} />
      <Icon icon="mdi:cloud-upload" size="lg" />
      <div>{isDragActive ? 'Drop files here…' : 'Drag files or click to browse'}</div>
      {previews || fileList}
    </Panel>
  );
});

export default Dropzone;
