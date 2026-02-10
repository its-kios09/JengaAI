import { useState, useRef } from 'react';
import type { DragEvent } from 'react';
import { Upload } from 'lucide-react';

type FileUploaderProps = {
  accept?: string;
  onFileSelect: (file: File) => void;
  uploading?: boolean;
};

export function FileUploader({ accept = '.csv,.json,.jsonl', onFileSelect, uploading }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOut = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors
        ${
          isDragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
            : 'border-surface-300 dark:border-surface-600 hover:border-primary-400 dark:hover:border-primary-500'
        }
        ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <Upload size={32} className="text-surface-400 dark:text-surface-500 mb-3" />
      <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
        {uploading ? 'Uploading...' : 'Drop your file here or click to browse'}
      </p>
      <p className="text-xs text-surface-400 dark:text-surface-500">Supports CSV, JSON, JSONL</p>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} />
    </div>
  );
}
