import { useState, useEffect } from 'react';
import { imageStorageService } from '../services/imageStorageService';

export interface UseStoredImageResult {
  imageUrl: string | null;
  isLoading: boolean;
  isStored: boolean;
  error: string | null;
  fileSize?: number;
  fileName?: string;
}

/**
 * Hook to resolve an image identifier (Stored imageId like 'img_123...' or standard URL)
 * into an ephemeral rendering URL. Automatically revokes the object URL on cleanup.
 * NEVER stores the object URL permanently.
 */
export function useStoredImage(imageIdOrUrl?: string | null): UseStoredImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStored, setIsStored] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);
  const [fileName, setFileName] = useState<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    let createdObjectUrl: string | null = null;

    if (!imageIdOrUrl || typeof imageIdOrUrl !== 'string' || imageIdOrUrl.trim() === '') {
      setImageUrl(null);
      setIsLoading(false);
      setIsStored(false);
      setError(null);
      setFileSize(undefined);
      setFileName(undefined);
      return;
    }

    const trimmed = imageIdOrUrl.trim();

    // If it's a standard HTTP or data URL, use it directly without IndexedDB query
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      setImageUrl(trimmed);
      setIsLoading(false);
      setIsStored(false);
      setError(null);
      return;
    }

    // It's a stored image ID (e.g. "img_173456789_xyz")
    setIsLoading(true);
    setIsStored(true);
    setError(null);

    imageStorageService
      .getImage(trimmed)
      .then((record) => {
        if (!active) return;
        if (!record || !record.blob) {
          setError('Image unavailable');
          setImageUrl(null);
          setIsLoading(false);
          return;
        }

        createdObjectUrl = URL.createObjectURL(record.blob);
        setImageUrl(createdObjectUrl);
        setFileSize(record.fileSize);
        setFileName(record.fileName);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn(`Could not load stored image ${trimmed}:`, err);
        setError('Image unavailable');
        setImageUrl(null);
        setIsLoading(false);
      });

    return () => {
      active = false;
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [imageIdOrUrl]);

  return { imageUrl, isLoading, isStored, error, fileSize, fileName };
}
