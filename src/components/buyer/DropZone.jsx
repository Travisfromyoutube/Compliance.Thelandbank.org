import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { uploadFile } from '../../lib/uploadFile';

export default function DropZone({ icon: Icon = Upload, title, subtitle, accept, onFilesAdded }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const processFiles = async (files) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const { url } = await uploadFile(file);
        onFilesAdded({ name: file.name, data: url, blobUrl: url, size: file.size });
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        // Fallback to local data URL so the form still works
        const reader = new FileReader();
        reader.onload = (event) => {
          onFilesAdded({ name: file.name, data: event.target.result, size: file.size });
        };
        reader.readAsDataURL(file);
      }
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={[
        'relative rounded-lg border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-all duration-200',
        dragActive
          ? 'border-accent bg-accent-light/30'
          : 'border-warm-200 bg-warm-100/30 hover:border-accent-blue hover:bg-accent-blue-light/20',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleChange}
        className="hidden"
        aria-label={title}
      />

      <div className={dragActive ? 'animate-gentle-pulse' : ''}>
        {uploading
          ? <Loader2 className="w-8 h-8 text-accent mx-auto mb-3 animate-spin" />
          : <Icon className="w-8 h-8 text-muted mx-auto mb-3" />}
      </div>
      <p className="text-base font-semibold text-text mb-1">
        {uploading ? 'Uploading...' : (title || 'Drag and drop files here')}
      </p>
      <p className="text-sm text-muted">{uploading ? 'Please wait' : (subtitle || 'or click to browse')}</p>
    </div>
  );
}
