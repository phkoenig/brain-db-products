"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function TestSupabase() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDirectQuery = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Testing direct Supabase query...");
      
      // Test 1: Einfache Abfrage
      const { data, error, status } = await supabase
        .from('material_categories')
        .select('*')
        .limit(5);
      
      console.log("Direct query result:", { data, error, status });
      
      setResult({
        data,
        error: error?.message,
        status,
        count: data?.length || 0
      });
      
    } catch (err) {
      console.error("Test failed:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Direct Supabase Test</h1>
      
      <button 
        onClick={testDirectQuery}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Direct Supabase Query'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 