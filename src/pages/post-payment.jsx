
import React, { useEffect, useState } from "react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom"; // Assuming react-router-dom is used for navigation

// Placeholder for the API call function. In a real application, this would typically
// be an actual API utility function that makes a request to your backend.
// For example:
// import * as api from '@/api/payments';
// then use api.verifyStripePayment(...)
// Or define it here for demonstration:
const verifyStripePayment = async ({ sessionId }) => {
  // Simulate an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      if (sessionId === "test_success_session") {
        resolve({ data: { success: true, message: "Payment verified successfully!" } });
      } else if (sessionId === "test_fail_session") {
        resolve({ data: { success: false, message: "Payment verification failed." } });
      } else if (sessionId === "another_success_session") {
        resolve({ data: { success: true, message: "Payment verified, but with a different message." } });
      } else {
        // Default to success for generic sessions unless specific failure logic is needed
        resolve({ data: { success: true, message: "Payment verified." } });
      }
    }, 1500); // Simulate network delay
  });
};


export default function PostPayment() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Processing your payment...');
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (!sessionId) {
          setStatus('error');
          setMessage('No payment session found. Please try again or contact support.');
          return;
        }

        // Verify the payment with Stripe (or your payment processor)
        const { data } = await verifyStripePayment({ sessionId });

        if (data.success) {
          // Clear localStorage affiliate data since payment is complete
          try {
            localStorage.removeItem('affiliate_ref');
            localStorage.removeItem('affiliate_ref_date');
          } catch (e) {
            // Ignore localStorage errors if, for example, storage is full or disabled
            console.warn('Error clearing affiliate data from localStorage:', e);
          }

          setStatus('success');
          setMessage('Payment successful! Your account has been updated.');

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate(createPageUrl('Dashboard'));
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Payment verification failed. Please contact support.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage('There was an issue verifying your payment. Please contact support.');
      }
    };

    handlePaymentSuccess();
  }, [navigate]); // navigate is stable, but adding it to deps array is good practice

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Processing Payment</h1>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Payment Issue</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={() => navigate(createPageUrl('Pricing'))}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Return to Pricing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <p className="text-sm text-gray-500">Redirecting you to the dashboard...</p>
      </div>
    </div>
  );
}
