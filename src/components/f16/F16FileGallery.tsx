"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherX, FeatherImage, FeatherFile, FeatherCheck } from "@subframe/core";
import { F16File, useF16Files } from "@/hooks/useF16Files";

interface F16FileGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: F16File) => void;
  fileType?: 'image' | 'pdf';
  title?: string;
}

export function F16FileGallery({ 
  isOpen, 
  onClose, 
  onSelectFile, 
  fileType = 'image',
  title 
}: F16FileGalleryProps) {
  const [selectedFile, setSelectedFile] = useState<F16File | null>(null);
  const { files, loading, fetchFiles, getImageFiles, getPdfFiles } = useF16Files();
  
  const displayFiles = fileType === 'image' ? getImageFiles() : getPdfFiles();

  const handleSelect = () => {
    if (selectedFile) {
      onSelectFile(selectedFile);
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles(fileType);
    }
  }, [isOpen, fileType, fetchFiles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <span className="text-heading-2 font-heading-2 text-default-font">
            {title || `${fileType === 'image' ? 'Bilder' : 'PDFs'} auswählen`}
          </span>
          <IconButton
            icon={<FeatherX />}
            onClick={onClose}
          />
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="p-4 h-full overflow-y-auto">
            {loading ? (
              <div className="text-center p-8">
                <span className="text-body font-body text-subtext-color">
                  Lade Dateien...
                </span>
              </div>
            ) : displayFiles.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <span className="text-body font-body text-subtext-color">
                  {fileType === 'image' ? 'Keine Bilder verfügbar' : 'Keine PDFs verfügbar'}
                </span>
                <br />
                <span className="text-caption font-caption text-subtext-color">
                  Lade zuerst Dateien hoch
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayFiles.map((file) => (
                  <div
                    key={file.name}
                    className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      selectedFile?.name === file.name
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 mb-2 flex items-center justify-center">
                        {file.isImage ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <FeatherFile className="w-8 h-8 text-gray-400" />
                        )}
                        {file.isImage && (
                          <FeatherImage className="w-8 h-8 text-gray-400 hidden" />
                        )}
                      </div>
                      <div className="text-xs text-gray-600 truncate w-full" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatFileSize(file.size)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(file.uploadedAt)}
                      </div>
                    </div>
                    {selectedFile?.name === file.name && (
                      <div className="absolute top-2 right-2">
                        <FeatherCheck className="w-4 h-4 text-brand-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-subtext-color">
                <FeatherCheck className="w-4 h-4 text-green-600" />
                <span>Ausgewählt: {selectedFile.name}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="tertiary"
              onClick={onClose}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSelect}
              disabled={!selectedFile}
            >
              Auswählen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
