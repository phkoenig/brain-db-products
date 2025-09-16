"use client";

import React, { useState } from 'react';
import { Button } from '@/ui/components/Button';
import { TextField } from '@/ui/components/TextField';
import { FeatherX } from '@subframe/core';

interface F16NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: {
    title: string;
    content: string;
    excerpt: string;
    featured_image_url: string;
    tags: string[];
  }) => Promise<boolean>;
}

export function F16NewPostModal({ isOpen, onClose, onSave }: F16NewPostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
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
        setTitle('');
        setContent('');
        setExcerpt('');
        setFeaturedImageUrl('');
        setTags('');
        setError(null);
        onClose();
      } else {
        setError('Fehler beim Speichern des Beitrags. Bitte versuche es erneut.');
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-heading-2 font-heading-2 text-default-font">
            Neuer Blog-Beitrag
          </h2>
          <Button
            variant="tertiary"
            size="small"
            icon={<FeatherX />}
            onClick={handleClose}
            disabled={isSubmitting}
          />
        </div>
        
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <span className="text-body font-body text-red-600">
                {error}
              </span>
            </div>
          )}
          
          <TextField
            label="Titel *"
            helpText="Der Titel des Blog-Beitrags"
            value={title}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTitle(event.target.value)}
          >
            <TextField.Input placeholder="z.B. Projektupdate: Erste Meilensteine" />
          </TextField>

          <TextField
            label="Kurzbeschreibung"
            helpText="Eine kurze Zusammenfassung des Beitrags"
            value={excerpt}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setExcerpt(event.target.value)}
          >
            <TextField.Input placeholder="Automatisch generiert, wenn leer gelassen" />
          </TextField>

          <TextField
            label="Bild-URL (optional)"
            helpText="URL zu einem Bild für den Beitrag"
            value={featuredImageUrl}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFeaturedImageUrl(event.target.value)}
          >
            <TextField.Input placeholder="https://example.com/image.jpg" />
          </TextField>

          <TextField
            label="Tags (optional)"
            helpText="Tags durch Komma getrennt"
            value={tags}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTags(event.target.value)}
          >
            <TextField.Input placeholder="projekt, update, meilenstein" />
          </TextField>

          <div>
            <label className="text-body-bold font-body-bold text-default-font mb-2 block">
              Inhalt *
            </label>
            <textarea
              className="w-full h-40 p-3 border border-neutral-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-brand-600"
              placeholder="Schreibe hier den Inhalt deines Blog-Beitrags..."
              value={content}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setContent(event.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-neutral-50">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim() || isSubmitting}
          >
            {isSubmitting ? 'Speichere...' : 'Beitrag erstellen'}
          </Button>
        </div>
      </div>
    </div>
  );
}
