// TestEmailCheck.tsx - Test page for email existence check
import React, { useState } from 'react';
import { testDmacEmail, testEmailWithTimeout, testSupabaseConnection, testDirectApiCall } from '../lib/test-email-check';

export default function TestEmailCheck() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runEmailTest = async () => {
    console.log('🧪 Starting email existence test...');
    setIsLoading(true);
    setResult(null);
    
    try {
      // First test Supabase connection
      await testSupabaseConnection();
      
      // Then test the specific email with timeout
      const testResult = await testEmailWithTimeout('dmacproject123@gmail.com', 15000); // 15 second timeout
      
      setResult(testResult);
      console.log('🎯 Test completed:', testResult);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      setResult({
        exists: false,
        error: `Test exception: ${error}`,
        timing: 0,
        data: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickTest = async () => {
    console.log('⚡ Running quick email test...');
    setIsLoading(true);
    setResult(null);
    
    try {
      const testResult = await testDmacEmail();
      setResult(testResult);
    } catch (error) {
      console.error('❌ Quick test failed:', error);
      setResult({
        exists: false,
        error: `Quick test exception: ${error}`,
        timing: 0,
        data: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runDirectApiTest = async () => {
    console.log('🌐 Running direct API test...');
    setIsLoading(true);
    setResult(null);
    
    try {
      const testResult = await testDirectApiCall('dmacproject123@gmail.com');
      setResult(testResult);
    } catch (error) {
      console.error('❌ Direct API test failed:', error);
      setResult({
        exists: false,
        error: `Direct API test exception: ${error}`,
        timing: 0,
        data: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Existence Check Test</h1>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-600">
            This page tests the email existence check that's hanging in the registration flow.
          </p>
          <p className="text-sm text-gray-500">
            Testing email: <code>dmacproject123@gmail.com</code>
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <button
            onClick={runEmailTest}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Run Email Test (with timeout)'}
          </button>
          
          <button
            onClick={runQuickTest}
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Run Quick Test (no timeout)'}
          </button>
          
          <button
            onClick={runDirectApiTest}
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Run Direct API Test (bypass Supabase client)'}
          </button>
        </div>

        {isLoading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3"></div>
              <p className="text-yellow-800">Running email existence check... Check console for logs.</p>
            </div>
          </div>
        )}

        {result && (
          <div className={`border rounded-lg p-4 ${
            result.error 
              ? 'bg-red-50 border-red-200' 
              : result.exists 
                ? 'bg-orange-50 border-orange-200'
                : 'bg-green-50 border-green-200'
          }`}>
            <h3 className="font-semibold mb-2">Test Result:</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Email Exists:</strong> {result.exists ? 'Yes' : 'No'}</p>
              <p><strong>Timing:</strong> {result.timing}ms</p>
              {result.error && (
                <p><strong>Error:</strong> <code className="text-red-600">{result.error}</code></p>
              )}
              {result.data && (
                <p><strong>Data:</strong> <code>{JSON.stringify(result.data, null, 2)}</code></p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Open browser dev tools Console tab</li>
            <li>Click "Run Email Test" button</li>
            <li>Watch console logs for detailed timing and error information</li>
            <li>If it hangs, the issue is confirmed at the database level</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
