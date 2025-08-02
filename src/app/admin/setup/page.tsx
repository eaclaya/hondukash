'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<unknown>(null);
  const [testResult, setTestResult] = useState<unknown>(null);

  const handleSetupDatabase = async () => {
    setIsLoading(true);
    setSetupResult(null);

    try {
      const response = await fetch('/api/admin/setup-db', {
        method: 'POST'
      });

      const data = await response.json();
      setSetupResult(data);
    } catch (error) {
      setSetupResult({ error: 'Network error during setup' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDatabase = async () => {
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/test-db');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: 'Network error during test' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Setup</h1>
        <p className="text-gray-600 mt-2">Initialize the HonduKash database schema</p>
      </div>

      <div className="bg-white p-6 border rounded-lg space-y-4">
        <h2 className="text-lg font-semibold">Database Connection Test</h2>
        <Button onClick={handleTestDatabase}>
          Test Database Connection
        </Button>

        {testResult && (
          <div className="mt-4">
            <h3 className="font-medium mb-2 text-gray-700">Test Result:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto text-gray-700">{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="bg-white p-6 border rounded-lg space-y-4">
        <h2 className="text-lg font-semibold">Database Schema Setup</h2>
        <p className="text-sm text-gray-600">This will create all necessary tables, functions, and initial data for the HonduKash system.</p>

        <Button
          onClick={handleSetupDatabase}
          disabled={isLoading}
          variant="default"
        >
          {isLoading ? 'Setting up...' : 'Setup Database Schema'}
        </Button>

        {setupResult && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Setup Result:</h3>
            <div className={`p-3 rounded ${setupResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              {setupResult.error ? (
                <div>
                  <p className="text-red-800 font-medium">Error:</p>
                  <p className="text-red-700">{setupResult.error}</p>
                  {setupResult.details && (
                    <pre className="text-xs mt-2 text-red-600 overflow-auto">{JSON.stringify(setupResult.details, null, 2)}</pre>
                  )}
                </div>
              ) : (
                <p className="text-green-800">{setupResult.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">Important Notes:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Make sure your Supabase project is properly configured</li>
          <li>• Ensure the service role key has the necessary permissions</li>
          <li>• The setup only needs to be run once per database</li>
          <li>• Test the connection first before running setup</li>
        </ul>
      </div>
    </div>
  );
}
