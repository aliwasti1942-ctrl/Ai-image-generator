import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Icons } from './Icon';
import { ImageState } from '../types';

interface DragDropZoneProps {
  onImagesChange: (images: ImageState[]) => void;
  currentImages: ImageState[];
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({ onImagesChange, currentImages }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    const newImages: ImageState[] = [];
    const filesArray = Array.from(files);
    let processedCount = 0;

    if (filesArray.length === 0) return;

    filesArray.forEach(file => {
      if (!file.type.startsWith('image/')) {
        processedCount++;
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        newImages.push({
          data: result,
          mimeType: file.type
        });
        processedCount++;
        if (processedCount === filesArray.length) {
          onImagesChange([...currentImages, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [currentImages, onImagesChange]);

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const next = [...currentImages];
    next.splice(index, 1);
    onImagesChange(next);
  };

  if (currentImages.length > 0) {
    return (
      <div className="w-full space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {currentImages.map((img, idx) => (
            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/5 group">
              <img src={img.data} className="w-full h-full object-cover" />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-black/50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
              >
                <Icons.X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-2xl border border-dashed border-white/20 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Icons.Plus className="w-6 h-6 text-white/30" />
          </button>
        </div>
        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={(e) => e.target.files && processFiles(e.target.files)} />
      </div>
    );
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`
        w-full h-40 rounded-[2rem] border border-dashed transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-3
        ${isDragging 
          ? 'border-yellow-400 bg-yellow-400/5 shadow-[0_0_40px_rgba(250,204,21,0.1)]' 
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'}
      `}
    >
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={(e) => e.target.files && processFiles(e.target.files)} />
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isDragging ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/40'}`}>
        <Icons.Upload className="w-5 h-5" />
      </div>
      <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDragging ? 'text-yellow-400' : 'text-white/30'}`}>
        Import Texture
      </p>
    </div>
  );
};