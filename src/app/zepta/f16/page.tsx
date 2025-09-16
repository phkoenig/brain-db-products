"use client";

import React, { useState } from "react";
import { Button } from "@/ui/components/Button";
import { TextField } from "@/ui/components/TextField";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { FeatherPlus } from "@subframe/core";
import { FeatherSearch } from "@subframe/core";
import { useF16Blog } from "@/hooks/useF16Blog";
import { F16BlogPost } from "@/components/f16/F16BlogPost";
import { F16LivePreviewEditor } from "@/components/f16/F16LivePreviewEditor";
import { F16LoginDialog } from "@/components/f16/F16LoginDialog";

export default function F16Logbuch() {
  const { posts, loading, error, searchQuery, searchPosts, addComment, createPost, user } = useF16Blog();
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Prüfe URL-Parameter für Auth-Fehler
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      setAuthError('Authentifizierung fehlgeschlagen. Bitte versuche es erneut.');
      // Entferne den Fehler-Parameter aus der URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    searchPosts(event.target.value);
  };

  const handleNewPost = () => {
    if (user) {
      setIsCreatingPost(true);
    } else {
      setIsLoginDialogOpen(true);
    }
  };

  const handleSavePost = async (post: {
    title: string;
    content: string;
    excerpt: string;
    featured_image_url: string;
    tags: string[];
  }) => {
    const success = await createPost(post);
    if (success) {
      setIsCreatingPost(false);
    }
    return success;
  };

  const handleCancelPost = () => {
    setIsCreatingPost(false);
  };

  if (loading) {
    return (
      <div className="f16-portal">
        <DefaultPageLayout>
          <div className="container max-w-none flex h-full w-full flex-col items-center gap-4 bg-neutral-50 py-12">
            <div className="flex w-full max-w-[768px] flex-col items-start gap-8">
              <div className="text-center w-full">
                <span className="text-body font-body text-subtext-color">
                  Lade Blog-Posts...
                </span>
              </div>
            </div>
          </div>
        </DefaultPageLayout>
      </div>
    );
  }

      if (error) {
        return (
          <div className="f16-portal">
            <DefaultPageLayout>
              <div className="container max-w-none flex h-full w-full flex-col items-center gap-4 bg-neutral-50 py-12">
                <div className="flex w-full max-w-[768px] flex-col items-start gap-8">
                  <div className="text-center w-full">
                    <span className="text-body font-body text-red-600">
                      Fehler beim Laden der Posts: {error}
                    </span>
                  </div>
                </div>
              </div>
            </DefaultPageLayout>
          </div>
        );
      }

      if (authError) {
        return (
          <div className="f16-portal">
            <DefaultPageLayout>
              <div className="container max-w-none flex h-full w-full flex-col items-center gap-4 bg-neutral-50 py-12">
                <div className="flex w-full max-w-[768px] flex-col items-start gap-8">
                  <div className="text-center w-full">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                      <span className="text-body font-body text-red-600">
                        {authError}
                      </span>
                    </div>
                    <Button onClick={() => setAuthError(null)}>
                      Erneut versuchen
                    </Button>
                  </div>
                </div>
              </div>
            </DefaultPageLayout>
          </div>
        );
      }

  return (
    <div className="f16-portal">
      <DefaultPageLayout>
        <div className="container max-w-none flex h-full w-full flex-col items-center gap-4 bg-neutral-50 py-12">
          <div className="flex w-full max-w-[768px] flex-col items-start gap-8">
            <TextField
              className="h-auto w-full flex-none"
              variant="filled"
              label=""
              helpText=""
              icon={<FeatherSearch />}
            >
              <TextField.Input
                placeholder="Suche in Beiträgen"
                value={searchQuery}
                onChange={handleSearch}
              />
            </TextField>
            <div className="flex w-full flex-col items-start gap-6">
              <div className="flex w-full items-center justify-between">
                <span className="text-heading-1 font-heading-1 text-default-font">
                  LOGBUCH
                </span>
                <Button
                  icon={<FeatherPlus />}
                  onClick={handleNewPost}
                >
                  {user ? 'Neuer Beitrag' : 'Anmelden'}
                </Button>
              </div>
                  <div className="flex w-full flex-col items-start gap-8">
                    {isCreatingPost && (
                      <F16LivePreviewEditor
                        onSave={handleSavePost}
                        onCancel={handleCancelPost}
                      />
                    )}
                    
                    {posts.length === 0 && !isCreatingPost ? (
                      <div className="text-center w-full py-8">
                        <span className="text-body font-body text-subtext-color">
                          Keine Posts gefunden.
                        </span>
                      </div>
                    ) : (
                      posts.map((post) => (
                        <F16BlogPost
                          key={post.id}
                          post={post}
                          onAddComment={addComment}
                        />
                      ))
                    )}
                  </div>
            </div>
          </div>
        </div>
      </DefaultPageLayout>
          
          <F16LoginDialog
            isOpen={isLoginDialogOpen}
            onClose={() => setIsLoginDialogOpen(false)}
          />
        </div>
      );
    }
