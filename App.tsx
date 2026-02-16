import React, { useState, useRef } from 'react';
import { Icons } from './components/Icon';
import { Button } from './components/Button';
import { DragDropZone } from './components/DragDropZone';
import { ZoomableImage } from './components/ZoomableImage';
import { generateOrEditImage } from './services/gemini';
import { AspectRatio, ImageState, GeneratedImage } from './types';

const ASPECT_RATIOS: AspectRatio[] = [
  "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9", "10:1", "3:1"
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [sourceImages, setSourceImages] = useState<ImageState[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  // Ref for auto-scrolling to the preview section
  const previewRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    
    // Smoothly scroll to preview section
    previewRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });

    setIsLoading(true);
    setError(null);
    try {
      const result = await generateOrEditImage({
        prompt,
        sourceImages: sourceImages,
        aspectRatio
      });
      setGeneratedImage(result);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleCopyToClipboard = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      setError("Clipboard access denied.");
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `wasti-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Floating Header - Fixed to top for modern app feel */}
      <div className="pt-8 px-4 sm:px-6 lg:px-8 sticky top-0 z-[100]">
        <nav className="max-w-7xl mx-auto glass-nav rounded-full px-8 py-4 flex items-center justify-between shadow-2xl ios-shadow border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/20 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <Icons.Sparkles className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white hidden sm:block ios-yellow-text-glow">
              Wasti <span className="text-yellow-400">Studio</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 px-5 py-2 bg-yellow-400/5 rounded-full border border-yellow-400/10 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
              <span className="text-[11px] font-bold text-yellow-400/80 uppercase tracking-[0.2em]">Gemini 2.5 Flash</span>
            </div>
          </div>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            <div className="glass-card rounded-[3rem] p-10 space-y-8 border-white/[0.05]">
              <div className="space-y-5">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-[11px] font-bold text-yellow-400/70 uppercase tracking-[0.25em]">Creative Prompt</h2>
                  <Icons.Wand2 className="w-4 h-4 text-yellow-400/30" />
                </div>
                <div className="relative group">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your vision..."
                    className="w-full h-48 bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-6 text-white placeholder-white/20 focus:border-yellow-400/30 focus:bg-white/[0.05] transition-all resize-none leading-relaxed text-lg"
                  />
                  <div className="absolute bottom-4 right-6 flex items-center gap-3 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                      <kbd className="bg-white/5 px-1 rounded border border-white/10">Enter</kbd> to Launch
                    </span>
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                      <kbd className="bg-white/5 px-1 rounded border border-white/10">Shift+Enter</kbd> for New Line
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.25em]">Texture References</h2>
                </div>
                <DragDropZone 
                  currentImages={sourceImages}
                  onImagesChange={setSourceImages}
                />
              </div>

              <div className="space-y-3 px-1">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em] ml-2">Frame Ratio</span>
                <div className="relative">
                  <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-2xl px-5 py-4 text-sm focus:border-yellow-400/30 outline-none appearance-none cursor-pointer hover:bg-white/[0.05] transition-colors"
                  >
                    {ASPECT_RATIOS.map(ratio => <option key={ratio} value={ratio} className="bg-[#111]">{ratio}</option>)}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                    <Icons.Plus className="w-4 h-4 rotate-45" />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={!prompt.trim() || isLoading}
                isLoading={isLoading}
                className="w-full py-6 text-xl rounded-[2rem] ios-shadow"
                icon={<Icons.Sparkles className="w-6 h-6" />}
              >
                Launch Creation
              </Button>
            </div>

            {error && (
              <div className="glass-card rounded-[2rem] p-5 border-red-500/20 flex items-center gap-4 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                <Icons.AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div ref={previewRef} className="lg:col-span-7 flex flex-col gap-8 scroll-mt-28">
             <div className="glass-card rounded-[3.5rem] overflow-hidden flex flex-col min-h-[600px] relative border-white/[0.05]">
                
                {/* Result Actions Overlay */}
                {generatedImage && !isLoading && (
                  <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
                    <div className="px-5 py-2.5 glass-nav rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-[0.3em] text-white/90 shadow-xl">
                      Ultra High Density
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleCopyToClipboard}
                        className={`p-3.5 rounded-full backdrop-blur-xl border transition-all duration-300 shadow-xl ${isCopied ? 'bg-green-500 text-black border-green-400 scale-110' : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:scale-105'}`}
                        title="Copy to Clipboard"
                      >
                        {isCopied ? <Icons.Check className="w-5 h-5" /> : <Icons.Copy className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={handleDownload}
                        className="p-3.5 bg-yellow-400 text-black rounded-full hover:scale-110 transition-all shadow-2xl shadow-yellow-400/40"
                        title="Download Asset"
                      >
                        <Icons.Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 flex items-center justify-center checkerboard-bg relative p-10">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-8 z-10">
                      <div className="relative">
                        <Icons.Loader className="w-16 h-16 animate-spin text-yellow-400" />
                        <div className="absolute inset-0 bg-yellow-400/30 blur-[40px] rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-[12px] font-bold tracking-[0.4em] text-yellow-400 uppercase animate-pulse">Synthesizing</p>
                        <p className="text-[10px] text-white/20 font-medium tracking-widest uppercase">Evolving Vision into Reality</p>
                      </div>
                    </div>
                  ) : generatedImage ? (
                    <ZoomableImage src={generatedImage} alt="Generated Asset" />
                  ) : (
                    <div className="flex flex-col items-center gap-8 opacity-20 select-none transform scale-90">
                       <div className="w-28 h-28 rounded-[2.5rem] bg-white/[0.05] flex items-center justify-center border border-white/[0.08] shadow-inner">
                          <Icons.Image className="w-12 h-12 text-white" />
                       </div>
                       <div className="text-center space-y-2">
                         <p className="text-sm font-bold uppercase tracking-[0.3em] text-white">Visual Matrix Ready</p>
                         <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Describe to materialize</p>
                       </div>
                    </div>
                  )}
                </div>
             </div>

             {/* History Track */}
             {history.length > 0 && (
               <div className="glass-card rounded-[2.5rem] p-8 space-y-6 border-white/[0.05]">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.3em] flex items-center gap-3">
                      <Icons.History className="w-4 h-4 text-gray-600" /> Collection
                    </h3>
                    <button onClick={() => setHistory([])} className="text-[10px] font-bold text-red-400/40 hover:text-red-400 uppercase tracking-[0.15em] transition-colors">Clear Library</button>
                  </div>
                  
                  <div className="flex gap-5 overflow-x-auto pb-4 custom-scrollbar">
                    {history.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => { setGeneratedImage(item.url); setPrompt(item.prompt); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                        className={`flex-shrink-0 group relative w-32 aspect-square rounded-[1.75rem] overflow-hidden border cursor-pointer transition-all duration-500 ${generatedImage === item.url ? 'border-yellow-400 ring-[6px] ring-yellow-400/10' : 'border-white/5 hover:border-white/20 hover:scale-[1.05]'}`}
                      >
                        <img src={item.url} alt="History" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                           <Icons.Maximize className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}
          </div>
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-8 mt-20 text-center">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto mb-8"></div>
        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.3em] leading-relaxed">
          &copy; {new Date().getFullYear()} WASTI IMAGE STUDIO. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}

export default App;