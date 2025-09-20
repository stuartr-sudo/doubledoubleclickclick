
import React from "react";
import { User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";

export default function TokenTopUpBanner() {
  const [show, setShow] = React.useState(false);
  const [balance, setBalance] = React.useState(null);

  // NEW: Only show this banner if the token system is active (feature flag)
  const { enabled: tokensActive } = useFeatureFlag("token_system_active", { defaultEnabled: false });
  const { enabled: showTokenBalance } = useFeatureFlag("show_token_balance", { defaultEnabled: false });

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await User.me();
        const b = typeof u?.token_balance === "number" ? u.token_balance : 0;
        if (!mounted) return;
        setBalance(b);
        // Only show when token feature is ON and user has no tokens
        setShow((tokensActive || showTokenBalance) && b <= 0);
      } catch {
        // Not logged in or public page – don't show banner
        if (mounted) setShow(false);
      }
    })();
    return () => { mounted = false; };
  }, [tokensActive, showTokenBalance]);

  if (!show) return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Alert className="border-0 bg-transparent p-0">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <AlertTitle className="text-amber-900">You’re out of tokens</AlertTitle>
              <AlertDescription className="text-amber-800">
                Your current balance is {balance ?? 0}. Top up to continue using AI features without interruptions.
              </AlertDescription>
            </div>
          </div>
        </Alert>
        <div className="sm:ml-auto">
          <Link to={createPageUrl("TokenPacketsTopUp")}>
            <Button className="bg-amber-600 hover:bg-amber-700">Top up tokens</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
