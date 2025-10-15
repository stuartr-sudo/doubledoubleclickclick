import React, { useState } from 'react';
import { useEditorContent } from '@/components/hooks/editor/useEditorContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Save, RefreshCw, FileText } from 'lucide-react';

export default function HookTest() {
  // Test input states
  const [testPostId, setTestPostId] = useState('');
  const [testWebhookId, setTestWebhookId] = useState('');
  const [activePostId, setActivePostId] = useState(null);
  const [activeWebhookId, setActiveWebhookId] = useState(null);
  const [testTitle, setTestTitle] = useState('');
  const [testContent, setTestContent] = useState('');

  // Initialize the hook with current IDs
  const hook = useEditorContent(activePostId, activeWebhookId);

  // Sync test inputs with hook state
  React.useEffect(() => {
    setTestTitle(hook.title);
    setTestContent(hook.content);
  }, [hook.title, hook.content]);

  // Test handlers
  const handleLoadPost = () => {
    if (testPostId) {
      setActivePostId(testPostId);
      setActiveWebhookId(null);
    } else if (testWebhookId) {
      setActivePostId(null);
      setActiveWebhookId(testWebhookId);
    }
  };

  const handleSaveContent = async () => {
    await hook.saveContent(testContent, testTitle);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTestTitle(newTitle);
    hook.handleTitleChange(newTitle);
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setTestContent(newContent);
    hook.handleContentChange(newContent);
  };

  const handleReset = () => {
    setActivePostId(null);
    setActiveWebhookId(null);
    setTestPostId('');
    setTestWebhookId('');
    setTestTitle('');
    setTestContent('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">useEditorContent Hook Test</h1>
            <p className="text-slate-600 mt-1">Test the extracted editor content hook in isolation</p>
          </div>
          <Button onClick={handleReset} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Test
          </Button>
        </div>

        {/* Hook Status Overview */}
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Hook Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-slate-600">Loading</div>
                <div className="flex items-center gap-2 mt-1">
                  {hook.isLoading ? (
                    <Badge variant="default" className="bg-blue-500">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Loading
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Ready
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-600">Saving</div>
                <div className="flex items-center gap-2 mt-1">
                  {hook.isSaving ? (
                    <Badge variant="default" className="bg-orange-500">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Saving
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-600">
                      Idle
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-600">Unsaved Changes</div>
                <div className="flex items-center gap-2 mt-1">
                  {hook.hasUnsavedChanges ? (
                    <Badge variant="default" className="bg-yellow-500">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Unsaved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-600">Last Saved</div>
                <div className="text-sm font-medium text-slate-900 mt-1">
                  {hook.lastSaved ? new Date(hook.lastSaved).toLocaleTimeString() : 'Never'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Test Controls */}
          <div className="space-y-6">
            {/* Load Post Card */}
            <Card>
              <CardHeader>
                <CardTitle>Load Content</CardTitle>
                <CardDescription>Test loading a post or webhook by ID</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Post ID (from BlogPost)
                  </label>
                  <Input
                    placeholder="Enter post ID..."
                    value={testPostId}
                    onChange={(e) => {
                      setTestPostId(e.target.value);
                      setTestWebhookId('');
                    }}
                    disabled={hook.isLoading}
                  />
                </div>

                <div className="text-center text-sm text-slate-500">OR</div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Webhook ID (from WebhookReceived)
                  </label>
                  <Input
                    placeholder="Enter webhook ID..."
                    value={testWebhookId}
                    onChange={(e) => {
                      setTestWebhookId(e.target.value);
                      setTestPostId('');
                    }}
                    disabled={hook.isLoading}
                  />
                </div>

                <Button 
                  onClick={handleLoadPost}
                  disabled={hook.isLoading || (!testPostId && !testWebhookId)}
                  className="w-full"
                >
                  {hook.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Load Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Edit Content Card */}
            <Card>
              <CardHeader>
                <CardTitle>Edit Content</CardTitle>
                <CardDescription>Modify title and content to test change detection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Title
                  </label>
                  <Input
                    placeholder="Enter title..."
                    value={testTitle}
                    onChange={handleTitleChange}
                    disabled={hook.isLoading}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Content
                  </label>
                  <Textarea
                    placeholder="Enter content..."
                    value={testContent}
                    onChange={handleContentChange}
                    rows={8}
                    disabled={hook.isLoading}
                    className="font-mono text-sm"
                  />
                </div>

                <Button 
                  onClick={handleSaveContent}
                  disabled={hook.isSaving || !hook.hasUnsavedChanges || (!activePostId && !activeWebhookId)}
                  className="w-full"
                >
                  {hook.isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Hook State Display */}
          <div className="space-y-6">
            {/* Post Object Card */}
            <Card>
              <CardHeader>
                <CardTitle>Post Object</CardTitle>
                <CardDescription>Current post data from the hook</CardDescription>
              </CardHeader>
              <CardContent>
                {hook.post ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">ID</div>
                      <div className="text-sm font-mono text-slate-900 mt-1">{hook.post.id}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">Title</div>
                      <div className="text-sm text-slate-900 mt-1">{hook.post.title || '(empty)'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">User Name</div>
                      <div className="text-sm text-slate-900 mt-1">{hook.post.user_name || '(none)'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">Status</div>
                      <Badge variant="outline">
                        {hook.post.status || hook.post.publish_status || 'draft'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">Created</div>
                      <div className="text-sm text-slate-900 mt-1">
                        {hook.post.created_date ? new Date(hook.post.created_date).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No post loaded
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hook State Card */}
            <Card>
              <CardHeader>
                <CardTitle>Hook State Values</CardTitle>
                <CardDescription>Real-time hook internal state</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">isLoading:</span>
                    <Badge variant={hook.isLoading ? "default" : "outline"}>
                      {hook.isLoading.toString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">isSaving:</span>
                    <Badge variant={hook.isSaving ? "default" : "outline"}>
                      {hook.isSaving.toString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">hasUnsavedChanges:</span>
                    <Badge variant={hook.hasUnsavedChanges ? "default" : "outline"}>
                      {hook.hasUnsavedChanges.toString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">title.length:</span>
                    <Badge variant="outline">{hook.title.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">content.length:</span>
                    <Badge variant="outline">{hook.content.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">post:</span>
                    <Badge variant="outline">{hook.post ? 'loaded' : 'null'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Instructions Card */}
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-green-900">Testing Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-green-800 space-y-2">
                <div>1. Enter a valid Post ID or Webhook ID</div>
                <div>2. Click "Load Content" to test loading</div>
                <div>3. Modify the title or content</div>
                <div>4. Watch "Unsaved Changes" badge turn yellow</div>
                <div>5. Click "Save Content" to test saving</div>
                <div>6. Verify the hook state updates correctly</div>
                <div className="pt-2 mt-2 border-t border-green-200">
                  <strong>Note:</strong> This page is completely isolated from the main Editor.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}