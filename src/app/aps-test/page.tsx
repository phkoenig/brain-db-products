'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/ui/components/Button';
import { Alert } from '@/ui/components/Alert';
import { Progress } from '@/ui/components/Progress';
import { DefaultPageLayout } from '@/ui/layouts/DefaultPageLayout';
import { useDropzone } from 'react-dropzone';
import { Toaster, toast } from 'react-hot-toast';

// Define the shape of the Autodesk global object
declare global {
  interface Window {
    Autodesk: any;
  }
}

interface UploadedFile {
  file: File;
  status: 'uploading' | 'translating' | 'success' | 'failed';
  progress: number;
  urn?: string;
  error?: string;
}

export default function APSTestPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isViewerInitialized, setIsViewerInitialized] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  // Load Autodesk Viewer SDK
  useEffect(() => {
    const loadViewerScript = () => {
      if (window.Autodesk) {
        setIsSdkLoaded(true);
        return;
      }
      const script = document.createElement('script');
      script.src = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js";
      script.async = true;
      script.onload = () => {
        console.log("APS Viewer SDK loaded.");
        setIsSdkLoaded(true);
      };
      script.onerror = () => {
        toast.error("Failed to load Autodesk Viewer SDK.");
      };
      document.body.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css';
      document.head.appendChild(link);

      return () => {
        document.body.removeChild(script);
        document.head.removeChild(link);
      };
    };
    loadViewerScript();
  }, []);

  const initializeViewer = useCallback(async (urn: string) => {
    if (!isSdkLoaded || !viewerRef.current) {
      toast.error("Viewer SDK not loaded or container not ready.");
      return;
    }
    
    try {
      const tokenResponse = await fetch('/api/aps/viewer-token');
      if (!tokenResponse.ok) throw new Error("Failed to get viewer token");
      const { access_token } = await tokenResponse.json();

      const options = {
        env: 'AutodeskProduction',
        getAccessToken: (onGetAccessToken: (token: string, expire: number) => void) => {
          onGetAccessToken(access_token, 3599);
        },
      };

      window.Autodesk.Viewing.Initializer(options, () => {
        const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerRef.current!);
        viewer.start();
        const documentId = 'urn:' + urn;
        window.Autodesk.Viewing.Document.load(documentId, (doc) => {
          const viewables = doc.getRoot().getDefaultGeometry();
          viewer.loadDocumentNode(doc, viewables);
          setIsViewerInitialized(true);
          toast.success("Model loaded successfully!");
        }, (errorCode, errorMsg) => {
          console.error('Model Loading failed:', errorCode, errorMsg);
          toast.error(`Failed to load model: ${errorMsg} (${errorCode})`);
        });
      });
    } catch (error) {
      console.error("Viewer initialization failed:", error);
      toast.error("Viewer initialization failed.");
    }
  }, [isSdkLoaded]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const newFile: UploadedFile = { file, status: 'uploading', progress: 0 };
    setUploadedFiles([newFile]); // Replace previous files

    const toastId = toast.loading('Uploading file...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await fetch('/api/aps/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { urn } = await uploadResponse.json();
      toast.success('Upload complete!', { id: toastId });
      setUploadedFiles([{ ...newFile, status: 'translating', urn }]);

      await startTranslation(urn, newFile);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed.', { id: toastId });
      setUploadedFiles([{ ...newFile, status: 'failed', error: 'Upload failed' }]);
    }
  }, []);
  
  const startTranslation = async (urn: string, fileState: UploadedFile) => {
    const toastId = toast.loading('Starting translation...');

    try {
        const translateResponse = await fetch('/api/aps/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urn }),
        });

        if (!translateResponse.ok) {
            throw new Error('Translation failed to start');
        }
        
        toast.success('Translation started...', { id: toastId });
        setUploadedFiles([{ ...fileState, status: 'translating', urn: urn }]);
        
        // Monitor translation progress
        const intervalId = setInterval(async () => {
            const statusResponse = await fetch(`/api/aps/translate?urn=${urn}`);
            const { status, progress } = await statusResponse.json();

            setUploadedFiles([{ ...fileState, status: 'translating', urn: urn, progress: parseInt(progress) || 0 }]);

            if (status === 'success') {
                clearInterval(intervalId);
                toast.success('Translation successful!', { id: toastId });
                setUploadedFiles([{ ...fileState, status: 'success', urn: urn, progress: 100 }]);
            } else if (status === 'failed') {
                clearInterval(intervalId);
                toast.error('Translation failed.', { id: toastId });
                setUploadedFiles([{ ...fileState, status: 'failed', urn: urn, error: 'Translation failed' }]);
            }
        }, 5000); // Poll every 5 seconds

    } catch (error) {
        console.error('Translation error:', error);
        toast.error('Translation failed to start.', { id: toastId });
        setUploadedFiles([{ ...fileState, status: 'failed', urn, error: 'Translation failed to start' }]);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const selectedFile = uploadedFiles[0];

  return (
    <DefaultPageLayout>
      <Toaster position="bottom-right" />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">APS Viewer Test Page</h1>
        
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        >
          <input {...getInputProps()} />
          <p>Drag 'n' drop a file here, or click to select a file</p>
        </div>

        {selectedFile && (
          <div className="mt-4">
            <h2 className="font-semibold">{selectedFile.file.name}</h2>
            <div className="flex items-center gap-4">
              <span className="capitalize">{selectedFile.status}</span>
              {(selectedFile.status === 'uploading' || selectedFile.status === 'translating') && (
                <Progress value={selectedFile.progress} className="w-full" />
              )}
            </div>
            {selectedFile.status === 'failed' && (
              <Alert variant="destructive">{selectedFile.error}</Alert>
            )}
            <Button
              onClick={() => initializeViewer(selectedFile.urn!)}
              disabled={selectedFile.status !== 'success' || !isSdkLoaded}
              className="mt-2"
            >
              Anzeigen
            </Button>
          </div>
        )}

        <div className="mt-8 border rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <div ref={viewerRef} className="w-full h-full" />
        </div>
      </div>
    </DefaultPageLayout>
  );
}
