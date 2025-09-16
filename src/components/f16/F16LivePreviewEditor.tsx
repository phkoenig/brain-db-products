"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { FeatherUpload, FeatherImage, FeatherX, FeatherSend, FeatherEdit3 } from '@subframe/core';
import { useF16Files } from '@/hooks/useF16Files';

interface F16LivePreviewEditorProps {
  onSave: (post: {
    title: string;
    content: string;
    excerpt: string;
    featured_image_url: string;
    tags: string[];
  }) => Promise<boolean>;
  onCancel: () => void;
}

export function F16LivePreviewEditor({ onSave, onCancel }: F16LivePreviewEditorProps) {
  const [title, setTitle] = useState('Titel deines Blog-Beitrags...');
  const [content, setContent] = useState('Schreibe hier den Inhalt deines Blog-Beitrags. Du kannst mehrere Absätze verwenden und deine Gedanken strukturiert darstellen...');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useF16Files();

  const handleSave = async () => {
    if (!title.trim() || title === 'Titel deines Blog-Beitrags...' || !content.trim() || content === 'Schreibe hier den Inhalt deines Blog-Beitrags. Du kannst mehrere Absätze verwenden und deine Gedanken strukturiert darstellen...') {
      setError('Titel und Inhalt sind erforderlich');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const success = await onSave({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || content.trim().substring(0, 150) + '...',
        featured_image_url: featuredImageUrl.trim(),
        tags: tagsArray
      });

      if (success) {
        // Reset form
        setTitle('Titel deines Blog-Beitrags...');
        setContent('Schreibe hier den Inhalt deines Blog-Beitrags. Du kannst mehrere Absätze verwenden und deine Gedanken strukturiert darstellen...');
        setExcerpt('');
        setFeaturedImageUrl('');
        setTags('');
        setError(null);
        setIsEditing(false);
      } else {
        setError('Fehler beim Speichern des Beitrags. Bitte versuche es erneut.');
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const result = await uploadFile(file);
    
    if (result.success && result.file) {
      setFeaturedImageUrl(result.file.url);
      setUploadError(null);
    } else {
      setUploadError(result.error || 'Upload fehlgeschlagen');
    }
    
    setUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleTitleClick = () => {
    if (title === 'Titel deines Blog-Beitrags...') {
      setTitle('');
    }
    setIsEditing(true);
  };

  const handleContentClick = () => {
    if (content === 'Schreibe hier den Inhalt deines Blog-Beitrags. Du kannst mehrere Absätze verwenden und deine Gedanken strukturiert darstellen...') {
      setContent('');
    }
    setIsEditing(true);
  };



  const handleTitleBlur = () => {
    if (!title.trim()) {
      setTitle('Titel deines Blog-Beitrags...');
    }
  };

  const handleContentBlur = () => {
    if (!content.trim()) {
      setContent('Schreibe hier den Inhalt deines Blog-Beitrags. Du kannst mehrere Absätze verwenden und deine Gedanken strukturiert darstellen...');
    }
  };



  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-lg bg-white border-2 border-dashed border-brand-200 px-6 py-6 shadow-sm">
      {/* Header mit Edit-Button */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-heading-2 font-heading-2 text-default-font">
            Neuer Beitrag
          </span>
          <IconButton
            icon={<FeatherEdit3 />}
            onClick={() => setIsEditing(!isEditing)}
            className="text-brand-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            size="small"
            icon={<FeatherX />}
            onClick={onCancel}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 w-full">
          <span className="text-body font-body text-red-600">
            {error}
          </span>
        </div>
      )}

      {/* Live Preview - sieht aus wie echter Blog-Post */}
      <div className="flex w-full flex-col items-start gap-4 rounded-lg bg-default-background px-6 py-6 shadow-sm">
        {/* Titel Input */}
        <div className="w-full">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onClick={handleTitleClick}
            onBlur={handleTitleBlur}
            className={`w-full text-heading-2 font-heading-2 text-default-font bg-transparent border-none outline-none resize-none ${
              title === 'Titel deines Blog-Beitrags...' ? 'text-subtext-color' : ''
            }`}
            placeholder=""
          />
        </div>

        {/* Bild Placeholder oder echtes Bild */}
        <div className="w-full">
          {featuredImageUrl ? (
            <img
              className="w-full flex-none rounded-md object-contain"
              src={featuredImageUrl}
              alt="Featured"
            />
          ) : (
            <div 
              className="h-80 w-full flex-none rounded-md bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors"
              onClick={isEditing ? triggerFileUpload : undefined}
            >
              {isEditing ? (
                <div className="text-center">
                  <FeatherUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="text-body font-body text-subtext-color">
                    Klicke hier, um ein Bild hochzuladen
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <FeatherImage className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <span className="text-body font-body text-subtext-color">
                    Bild wird hier angezeigt
                  </span>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Content Input */}
        <div className="w-full">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onClick={handleContentClick}
            onBlur={handleContentBlur}
            className={`w-full text-body font-body text-default-font bg-transparent border-none outline-none resize-none ${
              content === 'Schreibe hier den Inhalt deines Blog-Beitrags. Du kannst mehrere Absätze verwenden und deine Gedanken strukturiert darstellen...' ? 'text-subtext-color' : ''
            }`}
            rows={6}
            placeholder=""
          />
        </div>


        {/* Upload Buttons - nur sichtbar wenn editing */}
        {isEditing && (
          <div className="w-full border-t border-gray-200 pt-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="small"
                icon={<FeatherUpload />}
                onClick={triggerFileUpload}
                disabled={uploading}
              >
                {uploading ? 'Lädt hoch...' : 'Datei hochladen'}
              </Button>
            </div>
            
            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-2 mt-2">
                <span className="text-body font-body text-red-600 text-sm">
                  {uploadError}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex w-full items-center justify-end gap-3 pt-4 border-t border-neutral-border">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button
            icon={<FeatherSend />}
            onClick={handleSave}
            disabled={!title.trim() || title === 'Titel deines Blog-Beitrags...' || !content.trim() || content === 'Schreibe hier den Inhalt deines Blog-Beitrags. Du kannst mehrere Absätze verwenden und deine Gedanken strukturiert darstellen...' || isSubmitting}
          >
            {isSubmitting ? 'Speichere...' : 'Beitrag erstellen'}
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

    </div>
  );
}
