import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { User } from '@/api/entities';
import { checkAndConsumeTokens } from '@/api/functions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function TokenTest() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  React.useEffect(() => {
    User.me().then(setUser).catch(console.error);
  }, []);

  const testTokenConsumption = async (featureName, tokenCost) => {
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const result = await checkAndConsumeTokens({
        userId: user.id,
        featureName
      });

      setTestResult({
        success: true,
        ...result
      });

      toast.success(`Success! Consumed ${result.tokensConsumed} tokens. Balance: ${result.remainingBalance}`);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });

      toast.error(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Token Consumption Test</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Name:</strong> {user.full_name}</p>
            <p><strong>Token Balance:</strong> {user.token_balance}</p>
            <p><strong>Is Superadmin:</strong> {user.is_superadmin ? 'Yes' : 'No'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Token Consumption</CardTitle>
          <CardDescription>Click a button to test consuming tokens for different features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => testTokenConsumption('ai_rewriter', 2)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              AI Rewriter (2 tokens)
            </Button>

            <Button 
              onClick={() => testTokenConsumption('ai_seo', 3)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              AI SEO (3 tokens)
            </Button>

            <Button 
              onClick={() => testTokenConsumption('ai_tldr', 1)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              AI TLDR (1 token)
            </Button>

            <Button 
              onClick={() => testTokenConsumption('generate_image', 4)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Generate Image (4 tokens)
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResult && (
        <Card className={testResult.success ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle>{testResult.success ? 'Success' : 'Error'}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

