import React, { useState, useRef } from 'react';
import { Wand2, Image as ImageIcon, X, Send, Loader2, Plus, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { i18n } from '../../i18n/ru';
import { compressImages, CompressedImage } from '../../utils/imageCompression';

interface AiFridgeInputProps {
  onParse: (text: string, images: string[]) => Promise<void>;
  onManualAdd: () => void;
  isLoading: boolean;
}

export const AiFridgeInput: React.FC<AiFridgeInputProps> = ({ 
  onParse, 
  onManualAdd,
  isLoading 
}) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MAX_PHOTOS = 5;
  const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_ORIGINAL_SIZE = 15 * 1024 * 1024;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && images.length === 0) return;
    onParse(text, images.map(img => img.dataUrl));
    setText('');
    setImages([]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    if (files.length + images.length > MAX_PHOTOS) {
      setError(i18n.fridge.errors.tooMany);
      if (e.target) e.target.value = '';
      return;
    }

    const invalidFormat = files.find(f => !ALLOWED_FORMATS.includes(f.type));
    if (invalidFormat) {
      setError(i18n.fridge.errors.invalidFormat);
      if (e.target) e.target.value = '';
      return;
    }

    const tooLarge = files.find(f => f.size > MAX_ORIGINAL_SIZE);
    if (tooLarge) {
      setError(i18n.fridge.errors.tooLarge);
      if (e.target) e.target.value = '';
      return;
    }

    setIsResizing(true);
    setError(null);
    
    try {
      const compressed = await compressImages(files);
      setImages(prev => [...prev, ...compressed]);
    } catch (err) {
      console.error("Failed to compress images:", err);
      setError(i18n.fridge.errors.compressionFailed);
    } finally {
      setIsResizing(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-[32px] border border-stone-100 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-stone-800 uppercase tracking-widest flex items-center gap-2">
          <Wand2 size={14} className="text-natural-primary" />
          {i18n.fridge.fastAdd}
        </h3>
        <button 
          onClick={onManualAdd}
          className="text-[10px] font-black text-natural-primary uppercase tracking-widest border-b border-natural-primary/30 hover:border-natural-primary transition-all flex items-center gap-1"
          id="btn-ai-manual"
        >
          <Plus size={10} />
          {i18n.common.add} вручную
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={i18n.fridge.parseHint}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-medium text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-natural-primary/5 focus:border-natural-primary/20 transition-all resize-none min-h-[100px] no-scrollbar"
            id="input-ai-text"
          />
          
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              multiple 
              className="hidden" 
            />
            <input 
              type="file" 
              ref={cameraInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              capture="environment"
              className="hidden" 
            />
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoading || images.length >= MAX_PHOTOS}
              className="p-2.5 bg-white text-stone-400 rounded-xl hover:text-natural-primary transition-colors shadow-sm disabled:opacity-50"
              id="btn-ai-camera"
            >
              <Camera size={18} />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || images.length >= MAX_PHOTOS}
              className="p-2.5 bg-white text-stone-400 rounded-xl hover:text-natural-primary transition-colors shadow-sm disabled:opacity-50"
              id="btn-ai-gallery"
            >
              <ImageIcon size={18} />
            </button>
            <button
              type="submit"
              disabled={isLoading || (!text.trim() && images.length === 0)}
              className="p-2.5 bg-natural-primary text-white rounded-xl shadow-lg shadow-natural-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              id="btn-ai-submit"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-[10px] font-bold text-red-500 px-1">{error}</p>
        )}

        <AnimatePresence>
          {images.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 overflow-hidden"
            >
              {images.map((img, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 group">
                  <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-stone-900/60 p-0.5 text-[6px] font-bold text-white text-center">
                    {img.compressedSize < 1024 * 1024 ? `${Math.round(img.compressedSize/1024)}KB` : `${(img.compressedSize/(1024*1024)).toFixed(1)}MB`}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <X size={8} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {(isLoading || isResizing) && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-1"
          >
            <div className="w-1.5 h-1.5 bg-natural-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-natural-primary uppercase tracking-widest">
              {isResizing ? i18n.fridge.processing : i18n.fridge.parsing}
            </span>
          </motion.div>
        )}
        
        <p className="text-[9px] font-bold text-stone-400 italic px-1 leading-tight">
          {i18n.fridge.photoDescription}
        </p>
      </form>
    </div>
  );
};

