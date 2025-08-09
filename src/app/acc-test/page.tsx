'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/ui/components/Button';
import { toast } from 'react-hot-toast';

interface TestResult {
  success: boolean;
  timestamp: string;
  tests: {
    token: { status: string; message: string };
    projects: { status: string; count?: number; message: string };
    projectDetails: { status: string; message: string };
    projectContents: { status: string; message: string };
  };
  data?: {
    projects: Array<{ id: string; name: string; status: string; projectType?: string; }>;
    firstProject?: { id: string; name: string; status: string; projectType?: string; value?: number; currency?: string; };
    projectContents?: { 
      folders: number; 
      items: number; 
      data: Array<any>; 
      debugResults?: any[];
      files?: number;
      sampleFiles?: Array<{ id: string; name: string; type?: string; size: number; status: { status: string; icon: string; description: string; cost: number; }; }>;
    };
  };
  recommendations?: string[];
  error?: { message: string; stack?: string; };
}

export default function ACCTestPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runACCTest = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log('🔍 ACC Test: Starting ACC authentication test...');
      
      const response = await fetch('/api/acc/test');
      const result: TestResult = await response.json();
      
      setTestResult(result);
      
      if (result.success) {
        toast.success('ACC Test erfolgreich!');
        console.log('🔍 ACC Test: Success:', result);
      } else {
        toast.error('ACC Test fehlgeschlagen!');
        console.error('🔍 ACC Test: Failed:', result.error);
      }
      
    } catch (error) {
      console.error('🔍 ACC Test: Error:', error);
      toast.error('ACC Test fehlgeschlagen!');
      
      setTestResult({
        success: false,
        timestamp: new Date().toISOString(),
        tests: {
          token: { status: '❌ Failed', message: 'Network error' },
          projects: { status: '❌ Failed', message: 'Network error' },
          projectDetails: { status: '❌ Failed', message: 'Network error' },
          projectContents: { status: '❌ Failed', message: 'Network error' }
        },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const runSimpleACCTest = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log('🔍 ACC Simple Test: Starting simple ACC test...');
      
      const response = await fetch('/api/acc/test-simple');
      const result = await response.json();
      
      // Konvertiere das Ergebnis in das erwartete Format
      const convertedResult: TestResult = {
        success: result.success,
        timestamp: result.timestamp,
        tests: {
          token: result.details?.token || { status: '❌ Failed', message: 'Unknown' },
          projects: { 
            status: result.summary?.workingEndpoints > 0 ? '✅ Success' : '❌ Failed', 
            message: result.summary?.availableServices?.join(', ') || 'No services available' 
          },
          projectDetails: { status: '⚠️ Skipped', message: 'Simple test mode' },
          projectContents: { status: '⚠️ Skipped', message: 'Simple test mode' }
        },
        data: {
          projects: [],
          recommendations: result.recommendations || []
        },
        error: result.error
      };
      
      setTestResult(convertedResult);
      
      if (result.success) {
        toast.success('ACC Simple Test erfolgreich!');
        console.log('🔍 ACC Simple Test: Success:', result);
      } else {
        toast.error('ACC Simple Test fehlgeschlagen!');
        console.error('🔍 ACC Simple Test: Failed:', result.error);
      }
      
    } catch (error) {
      console.error('🔍 ACC Simple Test: Error:', error);
      toast.error('ACC Simple Test fehlgeschlagen!');
      
      setTestResult({
        success: false,
        timestamp: new Date().toISOString(),
        tests: {
          token: { status: '❌ Failed', message: 'Network error' },
          projects: { status: '❌ Failed', message: 'Network error' },
          projectDetails: { status: '❌ Failed', message: 'Network error' },
          projectContents: { status: '❌ Failed', message: 'Network error' }
        },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const runCorrectACCTest = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log("🔍 ACC Test: Running correct ACC test...");
      const response = await fetch('/api/acc/test-correct');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("🔍 ACC Test: Correct test results:", data);
      
      // Convert to TestResult format for consistency
      const testResult: TestResult = {
        success: data.success,
        timestamp: data.timestamp,
        tests: {
          token: { status: data.summary.token, message: data.details?.token?.message || '' },
          projects: { status: typeof data.summary.projects === 'string' ? data.summary.projects : `${data.summary.projects} projects`, message: '' },
          projectDetails: { status: data.summary.projectDetails, message: '' },
          projectContents: { status: data.summary.projectContents, message: '' }
        },
        data: {
          projects: data.details?.projects?.data || [],
          firstProject: data.details?.projectDetails?.data,
          projectContents: data.details?.projectContents?.data
        },
        error: data.error
      };
      
      // Add recommendations separately to avoid TypeScript error
      if (data.recommendations) {
        (testResult as any).recommendations = data.recommendations;
      }
      
      setTestResult(testResult);
      
      if (data.success) {
        toast.success('Korrekter ACC Test erfolgreich!');
        console.log('🔍 Korrekter ACC Test: Success:', data);
      } else {
        toast.error('Korrekter ACC Test fehlgeschlagen!');
        console.error('🔍 Korrekter ACC Test: Failed:', data.error);
      }
      
    } catch (error) {
      console.error("🔍 ACC Test: Error running correct test:", error);
      toast.error('Korrekter ACC Test fehlgeschlagen!');
      
      setTestResult({
        success: false,
        timestamp: new Date().toISOString(),
        tests: {
          token: { status: '❌ Failed', message: 'Network error' },
          projects: { status: '❌ Failed', message: 'Network error' },
          projectDetails: { status: '❌ Failed', message: 'Network error' },
          projectContents: { status: '❌ Failed', message: 'Network error' }
        },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const runContentsACCTest = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log("🔍 ACC Test: Running contents test...");
      const response = await fetch('/api/acc/test-contents');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("🔍 ACC Test: Contents test results:", data);
      
      // Convert to TestResult format for consistency
      const testResult: TestResult = {
        success: data.success,
        timestamp: data.timestamp,
        tests: {
          token: { status: data.summary.token, message: data.details?.token?.message || '' },
          projects: { status: typeof data.summary.projects === 'string' ? data.summary.projects : `${data.summary.projects} projects`, message: '' },
          projectDetails: { status: '⚠️ Skipped', message: 'Contents test mode' },
          projectContents: { status: data.summary.projectContents, message: '' }
        },
        data: {
          projects: data.details?.projects?.data || [],
          firstProject: data.details?.projectContents?.projectName ? {
            id: data.details?.projectContents?.projectId || '',
            name: data.details?.projectContents?.projectName || '',
            status: 'active',
            projectType: 'test'
          } : undefined,
          projectContents: data.details?.projectContents?.data
        },
        error: data.error
      };
      
      // Add recommendations separately to avoid TypeScript error
      if (data.recommendations) {
        (testResult as any).recommendations = data.recommendations;
      }
      
      setTestResult(testResult);
      
      if (data.success) {
        toast.success('ACC Contents Test erfolgreich!');
        console.log('🔍 ACC Contents Test: Success:', data);
      } else {
        toast.error('ACC Contents Test fehlgeschlagen!');
        console.error('🔍 ACC Contents Test: Failed:', data.error);
      }
      
    } catch (error) {
      console.error("🔍 ACC Test: Error running contents test:", error);
      toast.error('ACC Contents Test fehlgeschlagen!');
      
      setTestResult({
        success: false,
        timestamp: new Date().toISOString(),
        tests: {
          token: { status: '❌ Failed', message: 'Network error' },
          projects: { status: '❌ Failed', message: 'Network error' },
          projectDetails: { status: '❌ Failed', message: 'Network error' },
          projectContents: { status: '❌ Failed', message: 'Network error' }
        },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const runDebugProject = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log("🔍 ACC Debug: Running project debug...");
      const response = await fetch('/api/acc/debug-project');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("🔍 ACC Debug: Debug results:", data);
      
      // Convert to TestResult format for consistency
      const testResult: TestResult = {
        success: data.success,
        timestamp: new Date().toISOString(),
        tests: {
          token: { status: "✅ Success", message: "Token used for debug" },
          projects: { status: data.success ? "✅ Success" : "❌ Failed", message: data.testProject ? `${data.testProject.name} (${data.testProject.id})` : "No projects" },
          projectDetails: { status: "⚠️ Debug Mode", message: "Testing different API endpoints" },
          projectContents: { status: data.results?.some((r: any) => r.success) ? "✅ Found Working API" : "❌ All Failed", message: "" }
        },
        data: {
          projects: data.testProject ? [data.testProject] : [],
          projectContents: data.results ? {
            files: 0,
            folders: 0,
            sampleFiles: [],
            debugResults: data.results
          } : undefined
        },
        error: data.error
      };
      
      setTestResult(testResult);
      
      if (data.success) {
        toast.success('ACC Debug erfolgreich!');
        console.log('🔍 ACC Debug: Success:', data);
      } else {
        toast.error('ACC Debug fehlgeschlagen!');
        console.error('🔍 ACC Debug: Failed:', data.error);
      }
      
    } catch (error) {
      console.error("🔍 ACC Debug: Error running debug:", error);
      toast.error('ACC Debug fehlgeschlagen!');
      
      setTestResult({
        success: false,
        timestamp: new Date().toISOString(),
        tests: {
          token: { status: '❌ Failed', message: 'Network error' },
          projects: { status: '❌ Failed', message: 'Network error' },
          projectDetails: { status: '❌ Failed', message: 'Network error' },
          projectContents: { status: '❌ Failed', message: 'Network error' }
        },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const runOAuthTest = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      console.log("🔍 ACC OAuth Test: Running OAuth test...");
      const response = await fetch('/api/acc/test-oauth');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("🔍 ACC OAuth Test: OAuth results:", data);
      
      const testResult: TestResult = {
        success: data.success,
        timestamp: new Date().toISOString(),
        tests: {
          token: { 
            status: data.results.oauthStatus === 'success' ? "✅ 3-Legged OAuth" : 
                   data.results.oauthStatus === 'fallback' ? "⚠️ 2-Legged Fallback" : "❌ Failed", 
            message: `OAuth Status: ${data.results.oauthStatus}, Token Type: ${data.results.tokenType}` 
          },
          projects: { 
            status: data.results.projectsAccess ? "✅ Success" : "❌ Failed", 
            message: data.results.projectsAccess ? "Projects accessible" : "Projects not accessible" 
          },
          projectDetails: { 
            status: "⚠️ OAuth Test", 
            message: `Token Type: ${data.results.tokenType}` 
          },
          projectContents: { 
            status: data.results.contentsAccess ? "✅ Success" : "❌ Failed", 
            message: data.results.contentsAccess ? "Contents accessible" : "Contents require 3-legged OAuth" 
          }
        },
        data: {
          projects: [],
          projectContents: undefined
        },
        recommendations: data.recommendations,
        error: data.error
      };
      setTestResult(testResult);
      if (data.success) {
        toast.success('ACC OAuth Test erfolgreich!');
        console.log('🔍 ACC OAuth Test: Success:', data);
      } else {
        toast.error('ACC OAuth Test fehlgeschlagen!');
        console.error('🔍 ACC OAuth Test: Failed:', data.error);
      }
    } catch (error) {
      console.error("🔍 ACC OAuth Test: Error running OAuth test:", error);
      toast.error('ACC OAuth Test fehlgeschlagen!');
      setTestResult({
        success: false,
        timestamp: new Date().toISOString(),
        tests: {
          token: { status: '❌ Failed', message: 'Network error' },
          projects: { status: '❌ Failed', message: 'Network error' },
          projectDetails: { status: '❌ Failed', message: 'Network error' },
          projectContents: { status: '❌ Failed', message: 'Network error' }
        },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🏗️ ACC Construction Cloud Test</h1>
        <p className="text-gray-600 mb-4">
          Test der Autodesk Construction Cloud Integration. Diese Seite testet die Authentifizierung 
          und den Zugriff auf deine ACC-Projekte.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 mb-2">ℹ️ Wichtige Informationen:</h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Authentifizierung:</strong> Verwendet die gleichen Credentials wie APS</li>
            <li>• <strong>Token:</strong> OAuth2 Client Credentials Flow</li>
            <li>• <strong>Region:</strong> EMEA (wie bei APS)</li>
            <li>• <strong>API:</strong> ACC v1 API Endpoints</li>
            <li>• <strong>Kosten:</strong> Alle Dateien sind bereits übersetzt (kostenlos)</li>
          </ul>
        </div>
      </div>

             <div className="mb-6 space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
           <Button 
             onClick={runACCTest} 
             disabled={loading}
             className="bg-blue-600 hover:bg-blue-700 text-white"
           >
             {loading ? '🔄 Test läuft...' : '🧪 Vollständiger ACC Test'}
           </Button>
           
           <Button 
             onClick={runSimpleACCTest} 
             disabled={loading}
             className="bg-green-600 hover:bg-green-700 text-white"
           >
             {loading ? '🔄 Test läuft...' : '🔍 Einfacher ACC Test'}
           </Button>
           
           <Button 
             onClick={runCorrectACCTest} 
             disabled={loading}
             className="bg-green-600 hover:bg-green-700 text-white"
           >
             {loading ? '🔄 Test läuft...' : '✅ Korrekter ACC Test'}
           </Button>
           
           <Button 
             onClick={runContentsACCTest} 
             disabled={loading}
             className="bg-purple-600 hover:bg-purple-700 text-white"
           >
             {loading ? '🔄 Test läuft...' : '📁 ACC Inhalte Test'}
           </Button>
           
           <Button 
             onClick={runDebugProject} 
             disabled={loading}
             className="bg-red-600 hover:bg-red-700 text-white"
           >
             {loading ? '🔄 Test läuft...' : '🐛 ACC Debug'}
           </Button>

           <Button 
             onClick={runOAuthTest} 
             disabled={loading}
             className="bg-orange-600 hover:bg-orange-700 text-white"
           >
             {loading ? '🔄 Test läuft...' : '🔑 ACC OAuth Test'}
           </Button>
         </div>
         
         <div className="text-sm text-gray-600 space-y-2">
           <p><strong>Vollständiger Test:</strong> Prüft alle ACC-Funktionen (kann fehlschlagen wenn ACC nicht verfügbar)</p>
           <p><strong>Einfacher Test:</strong> Prüft nur Authentifizierung und verfügbare Services (empfohlen für erste Diagnose)</p>
           <p><strong>Korrekter Test:</strong> Verwendet die neuen API-Endpoints mit Account ID (empfohlen nach Custom Integration)</p>
           <p><strong>Inhalte Test:</strong> Testet Projekt-Inhalte (Dateien/Ordner) - wichtig für Datei-Browser</p>
           <p><strong>Debug:</strong> Testet verschiedene Projekt-ID-Formate und API-Endpoints</p>
         </div>
       </div>

      {testResult && (
        <div className="space-y-6">
          {/* Test-Ergebnisse */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {testResult.success ? '✅ Test erfolgreich' : '❌ Test fehlgeschlagen'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{testResult.tests.token.status}</span>
                  <span className="text-sm text-gray-600">Token</span>
                </div>
                <p className="text-sm text-gray-600">{testResult.tests.token.message}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{testResult.tests.projects.status}</span>
                  <span className="text-sm text-gray-600">Projekte</span>
                </div>
                <p className="text-sm text-gray-600">{testResult.tests.projects.message}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{testResult.tests.projectDetails.status}</span>
                  <span className="text-sm text-gray-600">Projekt-Details</span>
                </div>
                <p className="text-sm text-gray-600">{testResult.tests.projectDetails.message}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{testResult.tests.projectContents.status}</span>
                  <span className="text-sm text-gray-600">Projekt-Inhalte</span>
                </div>
                <p className="text-sm text-gray-600">{testResult.tests.projectContents.message}</p>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Test ausgeführt: {new Date(testResult.timestamp).toLocaleString('de-DE')}
            </div>
          </div>

          {/* Projekte */}
          {testResult.data?.projects && testResult.data.projects.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                📁 ACC-Projekte ({testResult.data.projects.length})
              </h3>
              
              <div className="space-y-3">
                {testResult.data.projects.map((project) => (
                  <div key={project.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-gray-600">ID: {project.id}</p>
                        <p className="text-sm text-gray-600">Status: {project.status}</p>
                        {project.projectType && (
                          <p className="text-sm text-gray-600">Typ: {project.projectType}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Erste Projekt-Details */}
          {testResult.data?.firstProject && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                📋 Projekt-Details: {testResult.data.firstProject.name}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID</p>
                  <p className="font-mono text-sm">{testResult.data.firstProject.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-sm">{testResult.data.firstProject.status}</p>
                </div>
                {testResult.data.firstProject.projectType && (
                  <div>
                    <p className="text-sm text-gray-600">Projekt-Typ</p>
                    <p className="text-sm">{testResult.data.firstProject.projectType}</p>
                  </div>
                )}
                {testResult.data.firstProject.value && (
                  <div>
                    <p className="text-sm text-gray-600">Wert</p>
                    <p className="text-sm">
                      {testResult.data.firstProject.value.toLocaleString()} 
                      {testResult.data.firstProject.currency && ` ${testResult.data.firstProject.currency}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projekt-Inhalte */}
          {testResult.data?.projectContents && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                📁 Projekt-Inhalte
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Dateien: {testResult.data.projectContents.files} | 
                  Ordner: {testResult.data.projectContents.folders}
                </p>
              </div>
              
              {testResult.data.projectContents.sampleFiles.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Beispiel-Dateien:</h4>
                  <div className="space-y-2">
                    {testResult.data.projectContents.sampleFiles.map((file) => (
                      <div key={file.id} className="border rounded p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-gray-600">
                              {file.type && `Typ: ${file.type} • `}
                              Größe: {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg">{file.status.icon}</div>
                            <p className="text-xs text-gray-600">{file.status.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

                     {/* Empfehlungen */}
           {testResult.recommendations && testResult.recommendations.length > 0 && (
             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
               <h3 className="text-lg font-semibold text-yellow-800 mb-4">💡 Empfehlungen</h3>
               <ul className="space-y-2">
                 {testResult.recommendations.map((rec: string, index: number) => (
                   <li key={index} className="text-yellow-700 text-sm">• {rec}</li>
                 ))}
               </ul>
             </div>
           )}

           {/* Fehler-Details */}
           {testResult.error && (
             <div className="bg-red-50 border border-red-200 rounded-lg p-6">
               <h3 className="text-lg font-semibold text-red-800 mb-4">❌ Fehler-Details</h3>
               <p className="text-red-700 mb-2">{testResult.error.message}</p>
               {testResult.error.stack && (
                 <details className="text-sm">
                   <summary className="cursor-pointer text-red-600">Stack Trace anzeigen</summary>
                   <pre className="mt-2 text-red-600 whitespace-pre-wrap">{testResult.error.stack}</pre>
                 </details>
               )}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
