import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { createTestBlogPosts } from '@/api/create-test-blog-posts';

export default function CreateTestData() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCreateTestData = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const createdPosts = await createTestBlogPosts();
      setResult({
        success: true,
        count: createdPosts.length,
        posts: createdPosts
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Create Test Data
          </CardTitle>
          <CardDescription>
            Generate test blog posts for editor testing and development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully created {result.count} test blog posts!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This will create 5 sample blog posts with different content types:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>AI in Content Creation (Technology)</li>
              <li>SEO Strategies for 2024 (Marketing)</li>
              <li>Content Marketing Strategy (Marketing)</li>
              <li>Color Psychology in Web Design (Design)</li>
              <li>Getting Started with React (Development)</li>
            </ul>
          </div>

          <Button 
            onClick={handleCreateTestData}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Test Data...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Create Test Blog Posts
              </>
            )}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Created Posts:</h4>
              <div className="space-y-1">
                {result.posts.map((post, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{post.title}</span>
                    <span className="text-muted-foreground ml-2">
                      ({post.status} • {post.category})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
