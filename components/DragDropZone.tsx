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

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFiles = useCallback((files: FileList | File[]) => {
    const newImages: ImageState[] = [];
    const filesArray = Array.from(files);
    let processedCount = 0;

    if (filesArray.length === 0) return;

    filesArray.forEach(file => {
      if (!file.type.startsWith('image/')) {
        // Skip non-image files
        processedCount++;
        if (processedCount === filesArray.length && newImages.length > 0) {
             onImagesChange([...currentImages, ...newImages]);
        }
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

  // Handle global paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        const filesToProcess: File[] = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) filesToProcess.push(blob);
          }
        }
        if (filesToProcess.length > 0) {
           e.preventDefault();
           processFiles(filesToProcess);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [processFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset value so same file can be selected again if needed
    if (e.target.value) e.target.value = '';
  };

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  const clearAll = () => {
    onImagesChange([]);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Render List View if images exist
  if (currentImages.length > 0) {
    return (
      <div className="w-full">
         <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-2">
            {currentImages.map((img, idx) => (
               <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-700 bg-gray-900 shadow-md">
                  <img 
                    src={img.data} 
                    alt={`Reference ${idx + 1}`} 
                    className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button 
                    onClick={(e) => handleRemove(e, idx)} 
                    className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80"
                    title="Remove image"
                  >
                     <Icons.X className="w-3 h-3" />
                  </button>
               </div>
            ))}
            
            {/* Add More Button */}
            <div
              onClick={triggerFileSelect}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`
                aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all gap-1
                ${isDragging 
                  ? 'border-yellow-400 bg-yellow-400/10' 
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-800'}
              `}
            >
               <Icons.Plus className="w-6 h-6 text-gray-500" />
               <span className="text-xs text-gray-500 font-medium">Add</span>
            </div>
         </div>
         
         <div className="flex justify-between items-center px-1">
            <span className="text-xs text-gray-500">{currentImages.length} image{currentImages.length !== 1 ? 's' : ''} loaded</span>
            <button 
              onClick={clearAll} 
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
               <Icons.Trash2 className="w-3 h-3" /> Clear All
            </button>
         </div>
         <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            multiple
            onChange={handleFileSelect}
          />
      </div>
    );
  }

  // Render Empty State
  return (
    <div
      onClick={triggerFileSelect}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        w-full h-64 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4
        ${isDragging 
          ? 'border-yellow-400 bg-yellow-400/5 shadow-[0_0_30px_rgba(250,204,21,0.15)]' 
          : 'border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-800/50'}
      `}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        multiple
        onChange={handleFileSelect}
      />
      
      <div className={`p-4 rounded-full ${isDragging ? 'bg-yellow-400/10 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>
        <Icons.Upload className="w-8 h-8" />
      </div>
      
      <div className="text-center px-4">
        <p className={`text-lg font-medium ${isDragging ? 'text-yellow-400' : 'text-gray-200'}`}>
          Drop reference images here
        </p>
        <p className="text-sm text-gray-500 mt-1">
          or click to upload multiple files
        </p>
      </div>
    </div>
  );
};