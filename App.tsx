import React, { useState, useRef } from 'react';
import { Icons } from './components/Icon';
import { Button } from './components/Button';
import { DragDropZone } from './components/DragDropZone';
import { ZoomableImage } from './components/ZoomableImage';
import { generateOrEditImage } from './services/gemini';
import { AspectRatio, ImageState, GeneratedImage } from './types';

const ASPECT_RATIOS: AspectRatio[] = [
  "1:1", "3:4", "4:3", "16:9", "9:16", 
  "3:2", "2:3", "21:9", "9:21"
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [sourceImages, setSourceImages] = useState<ImageState[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  // To support continuous editing, we can set the generated image as a source
  const handleUseAsReference = () => {
    if (generatedImage) {
      // Basic detection of jpeg vs png based on string header
      // The model output is typically Base64 PNG.
      const newImage: ImageState = {
        data: generatedImage,
        mimeType: 'image/png' // Gemini usually returns png in inlineData
      };
      setSourceImages(prev => [...prev, newImage]);
      setGeneratedImage(null);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateOrEditImage({
        prompt,
        sourceImages: sourceImages,
        aspectRatio
      });
      
      setGeneratedImage(result);

      // Add to history
      const newHistoryItem: GeneratedImage = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        url: result,
        prompt: prompt,
        sourceImages: sourceImages.map(img => img.data),
        timestamp: Date.now(),
      };
      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreHistory = (item: GeneratedImage) => {
    setGeneratedImage(item.url);
    setPrompt(item.prompt);
    
    if (item.sourceImages && item.sourceImages.length > 0) {
      const restoredImages = item.sourceImages.map(data => {
          const mimeMatch = data.match(/data:([^;]+);/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
          return { data, mimeType };
      });
      setSourceImages(restoredImages);
    } else {
      setSourceImages([]);
    }
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `nano-banana-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 selection:bg-yellow-400/30 selection:text-yellow-200">
      {/* Navigation / Header */}
      <nav className="border-b border-gray-800 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Icons.Sparkles className="w-5 h-5 text-black" />
              </div>
              <h1 className="text-xl font-bold brand-font tracking-tight">
                Nano <span className="text-yellow-400">Banana</span> Studio
              </h1>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-xs font-medium text-yellow-400">Gemini 2.5 Flash Image</span>
               </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT COLUMN: Controls */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Prompt Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider">
                Prompt
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={sourceImages.length > 0
                    ? "Describe how to use these images (e.g., 'Combine these styles', 'Add sunglasses to the person')..." 
                    : "Describe the image you want to create..."}
                  className="w-full h-56 bg-gray-900/50 border border-gray-700 rounded-2xl p-4 text-lg placeholder-gray-600 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Image Upload Zone */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Reference Images <span className="text-gray-600 normal-case ml-1">(Optional)</span>
                </label>
                {sourceImages.length > 0 && (
                    <span className="text-xs text-yellow-400 font-medium">Mode: Multimodal Generation</span>
                )}
              </div>
              <DragDropZone 
                currentImages={sourceImages}
                onImagesChange={setSourceImages}
              />
            </div>

            {/* Settings: Aspect Ratio */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider">
                Output Aspect Ratio
              </label>
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all border flex-grow text-center
                      ${aspectRatio === ratio 
                        ? 'bg-yellow-400 text-black border-yellow-400' 
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600 hover:bg-gray-800'}
                    `}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <Button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isLoading}
              isLoading={isLoading}
              className="w-full py-4 text-lg shadow-xl"
              icon={<Icons.Wand2 className="w-5 h-5" />}
            >
              {sourceImages.length > 0 ? 'Generate with References' : 'Generate Image'}
            </Button>

            {error && (
              <div className="p-4 rounded-xl bg-red-900/20 border border-red-900/50 flex items-start gap-3 text-red-200">
                <Icons.AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Preview & History */}
          <div className="lg:col-span-7 flex flex-col h-full">
             
             {/* Main Preview Card */}
             <div className="relative bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden flex flex-col shadow-2xl min-h-[500px]">
                
                {/* Result Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                   <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-xs text-gray-300 pointer-events-auto">
                      {isLoading ? 'Processing...' : generatedImage ? 'Result' : 'Preview'}
                   </div>
                   {generatedImage && (
                     <div className="flex gap-2 pointer-events-auto">
                        <button 
                          onClick={handleUseAsReference}
                          className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/10 transition-colors border border-white/10"
                          title="Use as reference for next generation"
                        >
                          <Icons.Plus className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={handleDownload}
                          className="p-2 bg-yellow-400 text-black rounded-full hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20"
                          title="Download"
                        >
                          <Icons.Download className="w-5 h-5" />
                        </button>
                     </div>
                   )}
                </div>

                {/* Canvas Area */}
                <div className="flex-1 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] overflow-hidden">
                   {isLoading ? (
                     <div className="flex flex-col items-center gap-4 text-gray-400 animate-pulse p-8">
                        <Icons.Loader className="w-12 h-12 animate-spin text-yellow-400" />
                        <p className="text-sm font-medium">Synthesizing pixels...</p>
                     </div>
                   ) : generatedImage ? (
                     <ZoomableImage 
                       src={generatedImage} 
                       alt="Generated result"
                     />
                   ) : (
                     <div className="text-center space-y-4 opacity-20 select-none pointer-events-none p-8">
                        <div className="w-32 h-32 mx-auto rounded-full bg-gray-800 flex items-center justify-center">
                           <Icons.Image className="w-12 h-12 text-gray-500" />
                        </div>
                        <p className="text-xl font-bold text-gray-500">Ready to create</p>
                        <p className="text-gray-600">Enter a prompt or upload images to start</p>
                     </div>
                   )}
                </div>
             </div>

             {/* History Section */}
             {history.length > 0 && (
               <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Icons.History className="w-4 h-4" />
                      <h3 className="text-sm font-medium uppercase tracking-wider">Recent History</h3>
                    </div>
                    <button 
                      onClick={() => setHistory([])}
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {history.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => handleRestoreHistory(item)}
                        className={`
                          group relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all duration-200
                          ${generatedImage === item.url ? 'border-yellow-400 ring-1 ring-yellow-400/50' : 'border-gray-800 hover:border-gray-600'}
                        `}
                      >
                        <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                        
                        {/* Indicators */}
                        {item.sourceImages && item.sourceImages.length > 0 && (
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                            <Icons.Wand2 className="w-3 h-3 text-yellow-400" />
                            <span className="text-[10px] text-white font-medium">{item.sourceImages.length}</span>
                          </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center backdrop-blur-sm">
                           <p className="text-xs text-white line-clamp-2 mb-3 font-medium leading-relaxed">
                             {item.prompt}
                           </p>
                           <div className="flex gap-2">
                             <button
                               className="bg-yellow-400 text-black p-1.5 rounded-lg hover:bg-yellow-300 transition-colors"
                               title="Restore this version"
                             >
                               <Icons.RotateCcw className="w-4 h-4" />
                             </button>
                             <button
                               onClick={(e) => handleDeleteHistory(e, item.id)}
                               className="bg-red-500/20 text-red-400 p-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-500/30"
                               title="Delete"
                             >
                               <Icons.Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             <div className="mt-6 text-center lg:text-right">
                <p className="text-xs text-gray-600">
                  Powered by Gemini 2.5 Flash Image &bull; Fast &bull; Multimodal
                </p>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;