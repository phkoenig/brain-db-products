"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface F16File {
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  isImage: boolean;
  isPdf: boolean;
}

export function useF16Files() {
  const { user } = useAuth();
  const [files, setFiles] = useState<F16File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async (fileType?: 'image' | 'pdf') => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (fileType) {
        params.append('type', fileType);
      }

      const response = await fetch(`/api/zepta/f16/files/list?${params}`, {
        headers: {
          'x-user-id': user.id
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const { files: fetchedFiles } = await response.json();
      setFiles(fetchedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<{ success: boolean; file?: F16File; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/zepta/f16/files/upload', {
        method: 'POST',
        headers: {
          'x-user-id': user.id
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Upload failed' };
      }

      const { file: uploadedFile } = await response.json();
      
      // Refresh files list
      await fetchFiles();
      
      return { success: true, file: uploadedFile };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Upload failed' 
      };
    }
  };

  const getImageFiles = () => files.filter(file => file.isImage);
  const getPdfFiles = () => files.filter(file => file.isPdf);

  useEffect(() => {
    if (user?.id) {
      fetchFiles();
    }
  }, [user?.id]);

  return {
    files,
    loading,
    error,
    fetchFiles,
    uploadFile,
    getImageFiles,
    getPdfFiles
  };
}
