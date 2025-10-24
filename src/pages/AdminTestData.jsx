import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateTestData from '@/components/admin/CreateTestData';

export default function AdminTestData() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Test Data Management</h1>
          <p className="text-gray-600 mt-2">
            Create test blog posts for editor testing and development
          </p>
        </div>

        {/* Test Data Creation */}
        <CreateTestData />

        {/* Instructions */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 mb-2">How to Use Test Data</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>After creating test blog posts, you can:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Navigate to the Content page to see your test posts</li>
                <li>Open posts in the editor to test AI functions</li>
                <li>Try different content generation features</li>
                <li>Test publishing workflows</li>
                <li>Experiment with SEO optimization tools</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
