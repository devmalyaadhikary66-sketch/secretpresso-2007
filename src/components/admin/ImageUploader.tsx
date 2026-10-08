import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import { imageStorageService, formatBytes, ALLOWED_IMAGE_MIME_TYPES } from '../../services/imageStorageService';
import { ImageEntityType, StoredImageRecord } from '../../types/imageStorage';
import { SafeImage } from '../common/SafeImage';

interface ImageUploaderProps {
  currentImageId?: string | null;
  currentImageUrl?: string | null;
  label?: string;
  helperText?: string;
  entityType?: ImageEntityType;
  entityId?: string;
  onImageUploaded: (imageId: string, record: StoredImageRecord) => void;
  onImageDeleted?: (deletedImageId: string) => void;
  aspectRatioClass?: string; // e.g. "aspect-video", "aspect-square", "aspect-[3/4]"
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImageId,
  currentImageUrl,
  label = 'Upload Image',
  helperText = 'JPG, PNG, WEBP, AVIF up to 15 MB. Persistently saved in IndexedDB.',
  entityType = 'other',
  entityId,
  onImageUploaded,
  onImageDeleted,
  aspectRatioClass = 'aspect-video',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Active identifier can be an imageId or URL
  const activeIdentifier = currentImageId || currentImageUrl || null;

  const handleFileSelection = useCallback(
    async (file: File) => {
      setErrorMessage(null);
      setSuccessMessage(null);

      // 1. Validation
      const validation = imageStorageService.validateImageFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid image file.');
        return;
      }

      setIsProcessing(true);
      setProcessStep('Validating file...');

      try {
        // Step 2 & 3: Save to IndexedDB & Verify read-back immediately
        setProcessStep('Saving to IndexedDB...');
        const record = await imageStorageService.saveImage(file, {
          entityType,
          entityId,
          fileName: file.name,
        });

        setProcessStep('Verifying storage integrity...');
        // Confirm verification
        const verified = await imageStorageService.getImage(record.id);
        if (!verified || !verified.blob) {
          throw new Error('Image could not be saved. Verification failed.');
        }

        setProcessStep('Complete!');
        setSuccessMessage(`Saved persistently as ${record.id}`);
        setTimeout(() => setSuccessMessage(null), 4000);

        // Update product / section reference
        onImageUploaded(record.id, record);
      } catch (err: any) {
        console.error('Image upload failed:', err);
        setErrorMessage(
          err.message && err.message.includes('Image could not be saved')
            ? err.message
            : 'Image could not be saved. Please try again.'
        );
        // Note: Old image remains completely untouched!
      } finally {
        setIsProcessing(false);
        setProcessStep('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [entityType, entityId, onImageUploaded]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentImageId && !currentImageUrl) {
      setShowDeleteConfirm(false);
      return;
    }

    const idToDelete = currentImageId;
    setShowDeleteConfirm(false);

    if (idToDelete) {
      try {
        await imageStorageService.deleteImage(idToDelete);
      } catch (err) {
        console.warn('Failed to delete image record from IndexedDB:', err);
      }
    }

    if (onImageDeleted && idToDelete) {
      onImageDeleted(idToDelete);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
            {label}
          </label>
          {currentImageId && (
            <span className="text-[10px] font-mono text-[#cfa851] bg-[#cfa851]/10 px-2 py-0.5 rounded border border-[#cfa851]/20">
              {currentImageId}
            </span>
          )}
        </div>
      )}

      {/* Main Upload / Preview Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative group rounded-xl border-2 transition cursor-pointer overflow-hidden flex flex-col items-center justify-center ${aspectRatioClass} ${
          isDragging
            ? 'border-[#cfa851] bg-[#cfa851]/10'
            : activeIdentifier
            ? 'border-[#382319] bg-[#120b08] hover:border-[#cfa851]/50'
            : 'border-dashed border-[#382319] hover:border-[#cfa851]/70 bg-[#160d09]/60 hover:bg-[#1a0f0b]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_MIME_TYPES.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        {/* Existing Image Preview */}
        {activeIdentifier && !isProcessing && (
          <div className="absolute inset-0 w-full h-full">
            <SafeImage
              src={currentImageUrl || undefined}
              imageId={currentImageId || undefined}
              className="w-full h-full object-contain bg-black/40"
              alt="Uploaded Preview"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center">
              <RefreshCw className="w-6 h-6 text-[#fae8be] mb-1.5 animate-pulse" />
              <p className="text-xs font-semibold text-white">Click or drop to replace image</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Existing image is safely preserved</p>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10">
            <Loader2 className="w-8 h-8 text-[#cfa851] animate-spin mb-2" />
            <p className="text-xs font-bold text-[#fae8be]">{processStep}</p>
            <p className="text-[10px] text-zinc-400 mt-1">
              Writing directly to IndexedDB (SECRETPRESSO_LocalStorage)
            </p>
          </div>
        )}

        {/* Empty Placeholder */}
        {!activeIdentifier && !isProcessing && (
          <div className="p-4 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#261710] border border-[#3e271c] flex items-center justify-center text-[#cfa851] mb-2 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-zinc-200">
              Drag & drop image, or <span className="text-[#cfa851] underline">browse</span>
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">{helperText}</p>
          </div>
        )}
      </div>

      {/* Action Toolbar if Image Exists */}
      {activeIdentifier && !isProcessing && (
        <div className="flex items-center justify-between text-xs pt-1 px-1">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Persistent in LocalStorage</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-medium text-zinc-300 hover:text-[#cfa851] transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Replace</span>
            </button>
            <span className="text-zinc-600">|</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="text-[11px] font-medium text-red-400 hover:text-red-300 transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete Image</span>
            </button>
          </div>
        </div>
      )}

      {/* Validation / Error Alert */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{successMessage}</span>
        </div>
      )}

      {/* Explicit Delete Confirmation Modal (Requirement 8) */}
      {showDeleteConfirm && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#160d09] border border-[#3e271c] w-full max-w-sm rounded-2xl p-5 shadow-2xl text-zinc-100"
          >
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="p-2 rounded-xl bg-red-950/80 border border-red-500/30">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Delete Stored Image</h4>
                <p className="text-[11px] text-zinc-400">IndexedDB Record Removal</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Are you sure you want to permanently delete this image?
              <br />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                This will remove the file from your local IndexedDB storage.
              </span>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#261710] hover:bg-[#341f15] text-zinc-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 transition cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
