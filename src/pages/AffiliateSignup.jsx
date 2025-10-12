
import React, { useState } from "react";
import { Affiliate } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Users, Loader2, AlertCircle, Clock } from "lucide-react"; // Added Clock
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AffiliateSignup() {
  const [form, setForm] = useState({ name: "", email: "", commission_rate: 50 });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const emailLower = form.email.trim().toLowerCase();

      // Check if affiliate with this email already exists
      const existingAffiliates = await Affiliate.filter({ email: emailLower });
      
      if (existingAffiliates && existingAffiliates.length > 0) {
        setError("An affiliate account with this email already exists. Please log in instead.");
        toast.error("This email is already registered as an affiliate.");
        setSubmitting(false);
        return;
      }

      // Generate unique code from email
      const uniqueCode = emailLower.split('@')[0].replace(/[^a-z0-9]/g, '') + Date.now().toString().slice(-4);

      // Create affiliate record - INACTIVE by default (requires manual approval)
      await Affiliate.create({
        name: form.name.trim(),
        email: emailLower,
        unique_code: uniqueCode,
        commission_rate: form.commission_rate || 50,
        is_active: false  // ⚠️ CHANGED: Requires manual approval from admin
      });

      // Send email notification to admin
      await SendEmail({
        to: "stuartr@doubleclick.work",
        subject: "🆕 New Affiliate Application - Pending Approval",
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
              🆕 New Affiliate Application
            </h2>
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ ACTION REQUIRED: This affiliate is pending approval</p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Name:</strong> ${form.name}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${emailLower}</p>
              <p style="margin: 10px 0;"><strong>Unique Code:</strong> ${uniqueCode}</p>
              <p style="margin: 10px 0;"><strong>Commission Rate:</strong> ${form.commission_rate}%</p>
              <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #d97706; font-weight: bold;">PENDING APPROVAL</span></p>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              Go to <strong>Affiliate Manager</strong> to review and activate this affiliate.
            </p>
          </div>
        `
      });

      setSuccess(true);
      toast.success("Application submitted successfully!");
      
      // Removed redirect as account is not active yet.
    } catch (error) {
      console.error("Error creating affiliate:", error);
      setError("Failed to register. Please try again or contact support.");
      toast.error("Failed to register. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white border border-slate-200">
          <CardContent className="pt-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
            <p className="text-slate-600 mb-4">
              Your affiliate application has been received and is pending approval.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                You'll receive an email notification once your account is approved and activated.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Become an Affiliate</h1>
          <p className="text-lg text-slate-600">
            Join our affiliate program and start earning 50% commission by referring customers to DoubleClick.
          </p>
        </div>

        <Card className="bg-white border border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900">Sign Up Form</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                  {error.includes("already exists") && (
                    <div className="mt-2">
                      <Button
                        variant="link"
                        className="text-red-600 hover:text-red-700 p-0 h-auto"
                        onClick={() => navigate(createPageUrl('AffiliateLogin'))}
                      >
                        Click here to log in instead
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-slate-700 font-medium mb-2 block">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="bg-white border-slate-300 text-slate-900"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="bg-white border-slate-300 text-slate-900"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Commission:</strong> You'll earn 50% commission on all successful referrals for 12 months.
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Join Affiliate Program"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Button
                variant="link"
                className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                onClick={() => navigate(createPageUrl('AffiliateLogin'))}
              >
                Log in here
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
