
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { verifyStripePayment } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function PostPayment() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null); // 'success' | 'error' | 'mismatch'
    const [user, setUser] = useState(null);
    const [sessionDetails, setSessionDetails] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const verifyPaymentSession = useCallback(async (sessionId, currentUser) => {
        try {
            const { data } = await verifyStripePayment({ session_id: sessionId });
            
            if (data.success) {
                setVerificationStatus('success');
                setSessionDetails(data.session);
                toast.success("Payment verified and account updated!");
            } else if (data.error === 'EMAIL_MISMATCH') {
                setVerificationStatus('mismatch');
                setErrorMessage(`Payment email (${data.session?.customer_email}) doesn't match your account email (${currentUser.email}). Please contact support.`);
            } else {
                setVerificationStatus('error');
                setErrorMessage(data.error || 'Failed to verify payment. Please contact support.');
            }
        } catch (error) {
            console.error("Payment verification failed:", error);
            setVerificationStatus('error');
            setErrorMessage('Technical error during verification. Please contact support.');
        } finally {
            setIsLoading(false);
        }
    }, []); // All dependencies (state setters, imports) are stable

    const handlePostPaymentFlow = useCallback(async () => {
        setIsLoading(true);
        
        // 1. Get the session_id from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (!sessionId) {
            setVerificationStatus('error');
            setErrorMessage('No payment session found. Please try again or contact support.');
            setIsLoading(false);
            return;
        }

        try {
            // 2. Check if user is authenticated
            const currentUser = await User.me();
            setUser(currentUser);
            
            // 3. If authenticated, verify the payment
            await verifyPaymentSession(sessionId, currentUser);
            
        } catch (authError) {
            // User is not authenticated - redirect to login
            console.log("User not authenticated, redirecting to login...");
            setIsAuthenticating(true);
            
            // Preserve current URL with session_id for after login
            const callbackUrl = window.location.href;
            User.loginWithRedirect(callbackUrl);
        }
    }, [verifyPaymentSession, setIsLoading, setVerificationStatus, setErrorMessage, setUser, setIsAuthenticating]); // Added `verifyPaymentSession` as a dependency because it's called here, and state setters for completeness.

    useEffect(() => {
        handlePostPaymentFlow();
    }, [handlePostPaymentFlow]);

    const goToDashboard = () => {
        window.location.href = createPageUrl('Dashboard');
    };

    const goToPricing = () => {
        window.location.href = createPageUrl('Pricing');
    };

    const contactSupport = () => {
        window.location.href = createPageUrl('Contact');
    };

    if (isAuthenticating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Login</h2>
                    <p className="text-gray-600">Please create an account or log in to complete your purchase verification.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Your Payment</h2>
                    <p className="text-gray-600">Please wait while we confirm your purchase and set up your account.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
                {verificationStatus === 'success' && (
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                        
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                        <p className="text-gray-600 mb-6">
                            Welcome aboard! Your payment has been processed and your account has been activated.
                        </p>
                        
                        {sessionDetails && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium text-gray-900">Payment Details</span>
                                </div>
                                <div className="space-y-1 text-sm text-gray-600">
                                    {sessionDetails.customer_email && (
                                        <p>Email: {sessionDetails.customer_email}</p>
                                    )}
                                    <p>Amount: ${(sessionDetails.amount_total / 100).toFixed(2)}</p>
                                    <p>Mode: {sessionDetails.mode === 'subscription' ? 'Subscription' : 'One-time payment'}</p>
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <Button 
                                onClick={goToDashboard} 
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                Go to Dashboard
                            </Button>
                            <p className="text-sm text-gray-500">
                                You can now access all the features included in your plan!
                            </p>
                        </div>
                    </div>
                )}

                {verificationStatus === 'mismatch' && (
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-yellow-600" />
                            </div>
                        </div>
                        
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Mismatch</h1>
                        <p className="text-gray-600 mb-4">{errorMessage}</p>
                        
                        <div className="space-y-3">
                            <Button 
                                onClick={contactSupport} 
                                className="w-full bg-yellow-600 hover:bg-yellow-700"
                            >
                                Contact Support
                            </Button>
                            <Button 
                                onClick={goToPricing} 
                                variant="outline" 
                                className="w-full"
                            >
                                Back to Pricing
                            </Button>
                        </div>
                    </div>
                )}

                {verificationStatus === 'error' && (
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                        
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
                        <p className="text-gray-600 mb-6">{errorMessage}</p>
                        
                        <div className="space-y-3">
                            <Button 
                                onClick={contactSupport} 
                                className="w-full bg-red-600 hover:bg-red-700"
                            >
                                Contact Support
                            </Button>
                            <Button 
                                onClick={goToPricing} 
                                variant="outline" 
                                className="w-full"
                            >
                                Back to Pricing
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
