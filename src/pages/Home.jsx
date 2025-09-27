
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { User } from "@/api/entities";
import { LandingPageContent } from "@/api/entities";
import { WaitlistEntry } from "@/api/entities";
import { Layers, Mail, Check, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import TrendCrossGraphic from "@/components/marketing/TrendCrossGraphic";
import GoogleCredentialsModal from "../components/usernames/GoogleCredentialsModal";

const WaitlistModal = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email) {
            toast.error("Please enter your name and email.");
            return;
        }
        setIsSubmitting(true);
        try {
            const normalizedEmail = String(email).trim().toLowerCase();
            const existing = await WaitlistEntry.filter({ email: normalizedEmail });
            if (existing && existing.length > 0) {
                // Prevent duplicates; treat as success for the user
                setIsSubmitted(true);
                setIsSubmitting(false);
                toast.success("You're already on the list!");
                return;
            }
            await WaitlistEntry.create({ name: name.trim(), email: normalizedEmail });
            setIsSubmitted(true);
        } catch (error) {
            console.error("Waitlist submission error:", error);
            toast.error("An error occurred. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset state after a short delay to allow closing animation
        setTimeout(() => {
            setName('');
            setEmail('');
            setIsSubmitting(false);
            setIsSubmitted(false);
        }, 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Join the Waitlist</DialogTitle>
                    <DialogDescription>Get early access to the future of search optimization.</DialogDescription>
                </DialogHeader>
                {isSubmitted ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold">You're on the list!</h3>
                        <p className="text-slate-400 mt-2">We'll be in touch soon. Thank you for your interest.</p>
                        <Button onClick={handleClose} className="mt-6 w-full bg-slate-700 hover:bg-slate-600">Close</Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} className="bg-slate-800 border-slate-600" />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-slate-800 border-slate-600" />
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full bg-violet-600 hover:bg-violet-700">
                            {isSubmitting ? "Submitting..." : "Join the Waitlist"}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

// Add safe default landing content so Home always renders
const DEFAULT_CONTENT = {
  headline: "Get Found Everywhere with SEWO",
  subheadline: "Turn your ideas into discoverable content across Google, LLMs, and social — without the busywork.",
  section1_title: "Why SEWO now",
  section1_content: "SEWO helps you build content that ranks, answers, and converts — fast. We combine an opinionated editor, AI assets, and simple publishing so you can ship more with higher quality.",
  section2_title: "What you get",
  section2_col1_title: "Benefits",
  section2_col1_points: ["Faster publishing", "SEO-ready structure", "AI media generation"],
  section2_col2_title: "Features",
  section2_col2_points: ["Live HTML editor", "Assets & variants", "One‑click publishing"],
  final_cta_title: "Request Early Access"
};

export default function HomePage() {
    const [content, setContent] = useState(DEFAULT_CONTENT);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [showGoogleCreds, setShowGoogleCreds] = React.useState(false);


    useEffect(() => {
        const fetchContent = async () => {
            try {
                // Try preferred identifiers, then fallback to most recent record
                let contents = await LandingPageContent.filter({ identifier: "main_sewo_v1" });
                if (!contents || contents.length === 0) {
                  contents = await LandingPageContent.filter({ identifier: "main_v1" });
                }
                if (!contents || contents.length === 0) {
                  contents = await LandingPageContent.list("-updated_date", 1);
                }
                if (contents && contents.length > 0) {
                    // Merge with defaults to ensure all fields exist
                    setContent({ ...DEFAULT_CONTENT, ...contents[0] });
                } else {
                    setContent(DEFAULT_CONTENT);
                }
            } catch (error) {
                console.error("Failed to load landing page content", error);
                setContent(DEFAULT_CONTENT);
            }
        };
        fetchContent();
    }, []);

    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      
      if (ref) {
        // Store in localStorage - survives everything including OAuth
        localStorage.setItem('affiliate_ref', ref);
        localStorage.setItem('affiliate_ref_date', new Date().toISOString());
        console.log('Affiliate code stored:', ref);
        
        // Clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }, []);

    // This effect handles the login redirect flow.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const urlParams = new URLSearchParams(window.location.search);
        const shouldLogin = urlParams.get('login') === '1';
        const to = urlParams.get('to') || 'Dashboard';
        if (shouldLogin) {
            const callbackUrl = `${window.location.origin}${createPageUrl(to)}`;
            
            // This tells other tabs that a login process has started.
            localStorage.setItem('b44_session_change', 'login');
            
            User.loginWithRedirect(callbackUrl);
        }
    }, []);

    // Effect to check current user on component mount and handle session synchronization
    useEffect(() => {
        const checkCurrentUser = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user);
            } catch (error) {
                console.error("Failed to get current user:", error);
                setCurrentUser(null);
            } finally {
                setIsLoadingUser(false);
            }
        };

        checkCurrentUser();

        // Listen for storage events to sync session across tabs
        const handleStorageChange = (event) => {
            if (event.key === 'b44_session_change') {
                if (event.newValue === 'login' || event.newValue === 'logout') {
                    checkCurrentUser(); // Re-fetch user status
                    localStorage.removeItem('b44_session_change'); // Clear the flag
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);


    const handleLogin = () => {
        const to = 'Dashboard';
        const callbackUrl = `${window.location.origin}${createPageUrl(to)}`;
        const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

        if (currentUser) {
            // Already logged in, navigate to dashboard
            window.location.href = createPageUrl(to); // Use direct href for full page navigation
            return;
        }

        if (isInIframe) {
            // Open Home page in a new window/tab with login parameter to force top-level login
            const loginUrl = `${window.location.origin}${createPageUrl(`Home?login=1&to=${encodeURIComponent(to)}`)}`;
            window.open(loginUrl, '_blank', 'noopener,noreferrer');
        } else {
            // This tells other tabs that a login process has started.
            localStorage.setItem('b44_session_change', 'login');
            User.loginWithRedirect(callbackUrl);
        }
    };

    const handleLogout = async () => {
        setIsLoadingUser(true); // Indicate loading while logging out
        try {
            await User.logout();
            setCurrentUser(null);
            localStorage.setItem('b44_session_change', 'logout'); // Inform other tabs
            toast.success("You have been logged out.");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("An error occurred during logout.");
        } finally {
            setIsLoadingUser(false);
        }
    };

    return (
      <>
        <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <GoogleCredentialsModal
          isOpen={showGoogleCreds}
          onClose={() => setShowGoogleCreds(false)}
        />
        <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden font-sans">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-50 p-6">
                <div className="container mx-auto flex justify-between items-center">
                     <div className="flex items-center space-x-3">
                        <Link to={createPageUrl('Home')} className="flex items-center gap-3">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689715479cd170f6c2aa04f2/d056b0101_logo.png" alt="Logo" className="w-10 h-10 rounded-full" />
                            <h1 className="text-xl font-bold text-white">
                                SEWO
                            </h1>
                        </Link>
                    </div>
                    {isLoadingUser ? (
                        <Button variant="outline" className="bg-transparent text-white/80 border-white/20 opacity-50 cursor-not-allowed">
                            Loading...
                        </Button>
                    ) : currentUser ? (
                        <div className="flex items-center space-x-2">
                            <Button onClick={() => window.location.href = createPageUrl('Dashboard')} variant="outline" className="bg-transparent text-white/80 border-white/20 hover:bg-white/10 hover:text-white transition-colors">
                                Dashboard
                            </Button>
                            <Button onClick={handleLogout} variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                                Logout
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={handleLogin} variant="outline" className="bg-transparent text-white/80 border-white/20 hover:bg-white/10 hover:text-white transition-colors">
                            Login
                        </Button>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center text-center pt-20 pb-20 px-4">
                 <div className="absolute inset-0 bg-slate-900"></div>
                 <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-transparent to-slate-900"></div>
                 <div className="absolute -top-48 -left-48 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse"></div>
                 <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>

                <div className="container mx-auto relative z-10">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6" style={{textShadow: '0 2px 20px rgba(0,0,0,0.5)'}}>
                        {content.headline}
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10">
                        {content.subheadline}
                    </p>
                    <div className="flex justify-center items-center gap-4">
                        <Button size="lg" onClick={() => setIsModalOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg transition-transform duration-200 hover:scale-105 px-8 py-6 text-lg">
                           <Mail className="w-5 h-5 mr-3" /> Request Early Access
                        </Button>
                    </div>
                </div>
            </section>

            {/* Section 1 - two-column with graphic */}
            <section className="py-20 bg-slate-900">
              <div className="container mx-auto px-6 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  {/* Image first on mobile, second on desktop */}
                  <div className="order-1 md:order-2">
                    <TrendCrossGraphic className="max-w-[600px] mx-auto" />
                    <p className="text-center text-slate-400 text-sm mt-3">
                      LLMs are surging while traditional SEO declines—capitalize on the shift.
                    </p>
                  </div>

                  {/* Text second on mobile, first on desktop */}
                  <div className="order-2 md:order-1">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 md:mb-8">
                      {content.section1_title}
                    </h2>
                    <div className="text-lg text-slate-300 leading-relaxed md:text-xl">
                      {String(content.section1_content || "")
                        .split(/\n\s*\n/)
                        .map((para, idx) => (
                          <p key={idx} className="mb-6 md:mb-7">
                            {para}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

             {/* Section 2 */}
            <section className="py-20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                         <h2 className="text-3xl md:text-4xl font-bold text-white">{content.section2_title}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="bg-slate-800/70 p-8 rounded-2xl border border-slate-700">
                            <h3 className="text-2xl font-bold text-violet-400 mb-4">{content.section2_col1_title}</h3>
                            <ul className="space-y-3 text-slate-300">
                                {content.section2_col1_points.map((point, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 mt-1 text-violet-400 flex-shrink-0" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div className="bg-slate-800/70 p-8 rounded-2xl border border-slate-700">
                            <h3 className="text-2xl font-bold text-blue-400 mb-4">{content.section2_col2_title}</h3>
                             <ul className="space-y-3 text-slate-300">
                                {content.section2_col2_points.map((point, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 mt-1 text-blue-400 flex-shrink-0" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-slate-900">
                 <div className="container mx-auto text-center px-6">
                     <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8">{content.final_cta_title}</h2>
                     <Button size="lg" onClick={() => setIsModalOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg transition-transform duration-200 hover:scale-105 px-8 py-6 text-lg">
                        Request Early Access
                    </Button>
                 </div>
            </section>

            {/* Footer with links */}
            <footer className="py-8 border-t border-slate-800 bg-slate-900">
              <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400">
                <div className="text-center md:text-left">
                  &copy; {new Date().getFullYear()} SEWO. All rights reserved.
                </div>
                <nav className="flex items-center gap-6 text-sm">
                  <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-white">Privacy Policy</Link>
                  <Link to={createPageUrl('TermsOfService')} className="hover:text-white">Terms of Service</Link>
                  <Link to={createPageUrl('Contact')} className="hover:text-white">Contact</Link>
                </nav>
              </div>
            </footer>
        </div>
      </>
    );
}
