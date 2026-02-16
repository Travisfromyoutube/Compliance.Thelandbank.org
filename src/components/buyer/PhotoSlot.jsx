import React, { useRef, useState } from 'react';
import { Camera, X, RefreshCw, Loader2 } from 'lucide-react';
import { uploadFile } from '../../lib/uploadFile';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function PhotoSlot({ label, photo, onUpload, onRemove }) {
  const inputRef = useRef(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleClick = () => {
    if (!uploading) inputRef.current?.click();
  };

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    setUploadError(null);

    // Client-side size check
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 10 MB.`);
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      onUpload({ name: file.name, data: url, blobUrl: url, size: file.size });
    } catch (err) {
      console.error(`Photo upload failed for ${label}:`, err);
      setUploadError('Upload failed - saved locally');
      // Fallback to local data URL
      const reader = new FileReader();
      reader.onload = (ev) => {
        onUpload({ name: file.name, data: ev.target.result, size: file.size });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 600);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        aria-label={`Upload photo for ${label}`}
      />

      {photo ? (
        /* ── Filled state ──────────────────────────────── */
        <div
          className={[
            'relative w-full aspect-[4/3] rounded-lg overflow-hidden group cursor-pointer',
            'border-2 transition-all duration-200',
            justUploaded ? 'border-accent' : 'border-warm-200 hover:border-accent-blue',
          ].join(' ')}
          onClick={handleClick}
        >
          <img
            src={photo.data}
            alt={label}
            className="w-full h-full object-cover"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <span className="flex items-center gap-1.5 text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">
              <RefreshCw className="w-3 h-3" />
              Replace
            </span>
          </div>
          {/* Remove button - always visible on mobile, hover on desktop */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-1.5 right-1.5 p-1 bg-white/90 border border-border rounded-full hover:bg-danger-light hover:border-danger transition-colors sm:opacity-0 sm:group-hover:opacity-100"
            aria-label={`Remove ${label} photo`}
          >
            <X className="w-3.5 h-3.5 text-text hover:text-danger" />
          </button>
        </div>
      ) : (
        /* ── Empty state ───────────────────────────────── */
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className={[
            'w-full aspect-[4/3] rounded-lg',
            'bg-warm-100/50 border-2 border-dashed border-warm-200',
            'hover:border-accent hover:bg-accent-light/20',
            'transition-all duration-200 cursor-pointer',
            'flex flex-col items-center justify-center gap-2',
            'disabled:opacity-60 disabled:cursor-wait',
          ].join(' ')}
        >
          {uploading
            ? <Loader2 className="w-5 h-5 text-accent animate-spin" />
            : <Camera className="w-5 h-5 text-text/40" />}
          <span className="text-xs font-medium text-text/50">
            {uploading ? 'Uploading...' : (
              <>
                <span className="hidden sm:inline">Click to upload</span>
                <span className="sm:hidden">Tap to take photo</span>
              </>
            )}
          </span>
        </button>
      )}

      {/* Slot label badge */}
      <span className="mt-2 text-xs font-label font-semibold uppercase tracking-wide text-text/60 text-center leading-tight">
        {label}
      </span>

      {/* Error message */}
      {uploadError && (
        <span className="mt-1 text-[10px] text-warning font-medium text-center leading-tight">
          {uploadError}
        </span>
      )}
    </div>
  );
}
