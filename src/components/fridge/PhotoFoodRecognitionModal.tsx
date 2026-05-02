import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Loader2, Sparkles, Image as ImageIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhotoRecognitionInput, PhotoRecognitionResult, RecognizedFoodDraft } from '../../types/photoRecognition';
import { recognizeFoodFromPhotos } from '../../services/photoFoodRecognitionService';
import { i18n } from '../../i18n/ru';
import { compressImages, CompressedImage } from '../../utils/imageCompression';
import { tempImageService } from '../../services/tempImageService';

interface PhotoRecognitionResultBase {
  status: "success" | "partial" | "failed";
  warnings: string[];
}

interface PhotoRecognitionModalProps<T extends PhotoRecognitionResultBase> {
  onResult: (result: T) => void;
  onCancel: () => void;
  onRecognize: (images: string[]) => Promise<T>;
  mode?: 'food' | 'product';
  title?: string;
}

export const PhotoRecognitionModal = <T extends PhotoRecognitionResultBase>({ 
  onResult, 
  onCancel,
  onRecognize,
  mode = 'product',
  title
}: PhotoRecognitionModalProps<T>) => {
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MAX_PHOTOS = mode === 'food' ? 3 : 5;
  const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_ORIGINAL_SIZE = 15 * 1024 * 1024; // 15MB

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRecognize = async () => {
    if (images.length === 0) return;
    setIsRecognizing(true);
    setError(null);

    try {
      const dataUrls = images.map(img => img.dataUrl);
      const result = await onRecognize(dataUrls);
      
      if (result.status === 'failed') {
        setError(result.warnings[0] || i18n.fridge.recognitionFailed);
      } else {
        // Clear local state after success
        tempImageService.clearLocalImageState(() => setImages([]));
        onResult(result);
      }
    } catch (err) {
      setError(i18n.fridge.recognitionFailed);
    } finally {
      setIsRecognizing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl p-6 pb-12 sm:pb-8 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-natural-primary/10 rounded-2xl flex items-center justify-center text-natural-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-natural-primary">{title || i18n.fridge.addByPhoto}</h2>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{i18n.fridge.photoHinter}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-stone-300 hover:text-stone-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8 relative">
          {(isRecognizing || isResizing) && (
            <div className="absolute inset-x-0 -top-4 bottom-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-natural-primary rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Loader2 size={24} className="animate-spin" />
              </div>
              <p className="text-[10px] font-black uppercase text-natural-primary tracking-widest animate-pulse">
                {isResizing ? i18n.fridge.processing : i18n.fridge.recognizing}
              </p>
            </div>
          )}

          {/* Image Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-3xl overflow-hidden border-2 border-stone-100 group">
                <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-stone-900/60 p-1 text-[8px] font-bold text-white text-center">
                  {formatSize(img.compressedSize)}
                </div>
                <button 
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg scale-100 sm:scale-0 sm:group-hover:scale-100 transition-transform"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < MAX_PHOTOS && (
              <div className="contents">
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isResizing || isRecognizing}
                  className="aspect-square rounded-3xl border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 hover:border-natural-primary/30 hover:bg-stone-50 transition-all gap-2 disabled:opacity-50"
                  id="btn-photo-camera"
                >
                  <Camera size={24} />
                  <span className="text-[8px] font-black uppercase tracking-widest">{i18n.fridge.camera}</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isResizing || isRecognizing}
                  className="aspect-square rounded-3xl border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 hover:border-natural-primary/30 hover:bg-stone-50 transition-all gap-2 disabled:opacity-50"
                  id="btn-photo-gallery"
                >
                  <ImageIcon size={24} />
                  <span className="text-[8px] font-black uppercase tracking-widest">{i18n.fridge.gallery}</span>
                </button>
              </div>
            )}
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            multiple 
            className="hidden" 
          />

          <input 
            type="file" 
            ref={cameraInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            capture="environment"
            className="hidden" 
          />

          {images.length > 0 && !isResizing && !isRecognizing && (
            <div className="flex items-center justify-center gap-2 py-2 bg-natural-primary/5 rounded-2xl border border-natural-primary/10">
              <div className="w-1.5 h-1.5 bg-natural-primary rounded-full animate-pulse" />
              <p className="text-[10px] font-bold text-natural-primary uppercase tracking-widest">
                {i18n.fridge.readyToRecognize}
              </p>
            </div>
          )}

          {!isRecognizing && images.length === 0 && (
             <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-stone-50 rounded-[32px] border border-stone-100 flex items-center justify-center text-stone-200 mx-auto">
                    <ImageIcon size={28} />
                </div>
                <p className="text-[10px] font-bold text-stone-400 italic max-w-[180px] mx-auto leading-relaxed">{i18n.fridge.uploadPhoto}</p>
             </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-500 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleRecognize}
              disabled={images.length === 0 || isRecognizing}
              className={`w-full py-5 rounded-[32px] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
                images.length === 0 || isRecognizing
                  ? 'bg-stone-100 text-stone-400'
                  : 'bg-natural-primary text-white shadow-xl shadow-natural-primary/20 active:scale-95'
              }`}
              id="btn-photo-submit"
            >
              {isRecognizing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {i18n.fridge.recognizing}
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  {i18n.fridge.recognize}
                </>
              )}
            </button>
            
            <button 
                onClick={onCancel}
                className="w-full py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors"
                id="btn-photo-cancel"
            >
                {i18n.common.cancel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

