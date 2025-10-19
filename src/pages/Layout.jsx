

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, FileText, Edit3, Database, Calendar as CalendarIcon, User as UserIcon, ListChecks, Settings, ShoppingBag,
  Share2, Mail, Package, Palette, BookOpen, Video, Clapperboard, Film, Link as LinkIcon, ShoppingCart, Home as HomeIcon,
  LogOut, ChevronUp, ChevronDown, Layers3, Menu, X, Shield, Sparkles, Loader2, Coins, Quote, ImageIcon, Users, Bot
} from
"lucide-react";
import { User } from "@/api/entities";
import { AppSettings } from "@/api/entities";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from
"@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { FeatureFlagProvider, useFeatureFlagData } from "@/components/providers/FeatureFlagProvider";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import TokenTopUpBanner from "@/components/common/TokenTopUpBanner";
import VideoModal from "@/components/common/VideoModal";
import { WorkspaceProvider, WorkspaceContext } from "@/components/providers/WorkspaceProvider";
import { useWorkspace } from "@/components/hooks/useWorkspace";
import usePageTutorial from '@/components/hooks/usePageTutorial';
import { base44 } from "@/api/base44Client";
import { Username } from "@/api/entities";
import { Sitemap } from "@/api/entities";
import { TemplateProvider } from '@/components/providers/TemplateProvider'; // Added TemplateProvider
import { CredentialsProvider } from '@/components/providers/CredentialsProvider'; // Added CredentialsProvider

const navStructure = [
// Core link
{ name: "Dashboard", href: "Dashboard", icon: LayoutDashboard, featureFlag: "show_dashboard_link" },

// Content Category
{
  name: "Content",
  icon: FileText,
  items: [
  { name: "Content Feed", href: "Content", icon: FileText, featureFlag: "show_content_feed_link" },
  { name: "Editor", href: "Editor", icon: Edit3, featureFlag: "show_editor_link" },
  { name: "Pages", href: "Pages", icon: FileText, featureFlag: "show_pages_link" },
  { name: "Pages Setup", href: "PagesSetup", icon: Settings, featureFlag: "show_pages_setup_link" },
  { name: "Topics", href: "Topics", icon: Database },
  { name: "Topic Products", href: "ProductLibrary", icon: ShoppingBag },
  { name: "DoubleClick Tutorials", href: "DoubleClickTutorials", icon: BookOpen }]
},

// Assets Category (Brand Guidelines and Sitemap moved from here)
{
  name: "Assets",
  icon: Layers3,
  featureFlag: "assets-menu", // ADDED: Feature flag for Assets menu item
  items: [
  { name: "Services", href: "ServiceCatalog", icon: Package, featureFlag: "show_service_catalog_link" },
  { name: "Templates", href: "CustomTemplateManager", icon: FileText, featureFlag: "show_custom_template_manager_link", requireSuperAdmin: true }]
},

// Media Category (now AI Hub)
{
  name: "AI Hub",
  icon: ImageIcon,
  items: [
  { name: "Media", href: "Media", icon: ImageIcon }, // Changed: Removed featureFlag to make it always visible
  { name: "Testimonials", href: "TestimonialLibrary", icon: Quote, featureFlag: "show_testimonials_link" },
  // Moved from Assets:
  { name: "Brand Guidelines", href: "BrandGuidelinesManager", icon: Settings, featureFlag: "show_brand_guidelines_link" },
  { name: "Sitemap", href: "SitemapManager", icon: LinkIcon, featureFlag: "show_sitemaps_link" },
  { type: "separator" },
  { name: "Products", href: "ProductManager", icon: ShoppingBag, featureFlag: "show_products_link" },
  { type: "separator" },
  // Flash Workflows - NOW ADMIN-ONLY
  { name: "Flash Workflows", href: "EditorWorkflowManager", icon: Bot, featureFlag: "show_flash_workflows_link", requireSuperAdmin: true }]
  // Removed "Amazon Import" as it's now integrated into ProductManager
  // Removed "Amazon Testimonials" as it's now integrated into TestimonialLibrary
},

// Growth Category
{
  name: "Growth",
  icon: ShoppingCart,
  requireSuperAdmin: true,
  items: [
  { name: "Landing Page", href: "LandingPageManager", icon: HomeIcon, featureFlag: "show_landing_page_manager_link", requireSuperAdmin: true },
  { name: "Sales Pages", href: "SalesPageManager", icon: BookOpen, featureFlag: "show_sales_page_manager_link", requireSuperAdmin: true },
  { name: "Pricing", href: "Pricing", icon: Coins, featureFlag: "show_pricing_link", requireSuperAdmin: true },
  { name: "Dashboard Banners", href: "DashboardBannerManager", icon: Sparkles, requireSuperAdmin: true }]
},

// Admin Category
{
  name: "Admin",
  icon: Shield,
  requireSuperAdmin: true,
  items: [
  { name: "Users", href: "UserManagement", icon: UserIcon, featureFlag: "show_user_management_link" },
  { name: "Affiliate Manager", href: "AffiliateManager", icon: Users, requireSuperAdmin: true },
  { name: "Waitlist", href: "WaitlistManager", icon: ListChecks, featureFlag: "show_waitlist_link" },
  { name: "Onboarding Builder", href: "OnboardingWizardBuilder", icon: ListChecks, featureFlag: "show_onboarding_builder_link" },
  { name: "Onboarding Steps", href: "OnboardingStepManager", icon: Settings },
  { name: "Feature Flags", href: "FeatureManagement", icon: Settings, featureFlag: "show_feature_management_link" },
  { name: "Editor Workflows", href: "EditorWorkflowManager", icon: Settings, featureFlag: "show_editor_workflows_link" },
  { name: "App Products", href: "AppProductManager", icon: ShoppingBag, featureFlag: "show_app_product_manager_link" },
  { name: "API Docs", href: "MidjourneyApiDocs", icon: BookOpen, featureFlag: "show_api_docs_link" },
  { name: "LLM Settings", href: "AdminLLM", icon: Sparkles, featureFlag: "show_llm_settings_link" },
  { name: "SEO Setup", href: "AdminSEO", icon: Settings, featureFlag: "show_admin_seo_link" },
  { name: "Endpoints", href: "FaqEndpointAdmin", icon: Settings, featureFlag: "show_endpoints_link" },
  { name: "Educational Videos", href: "Educational", icon: Video, requireSuperAdmin: true },
  { name: "WordPress Logs", href: "WordPressPublishLogs", icon: FileText, requireSuperAdmin: true },
  // NEW: Visual Type Examples Admin
  { name: "Infographic Examples", href: "InfographicExamplesAdmin", icon: ImageIcon, requireSuperAdmin: true }
  ]
}];



const NavLink = ({ href, active, children, isMobile = false }) =>
<Link
  to={href} className={`bg-slate-50 text-slate-800 px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors duration-200 ${active ? 'bg-slate-100' : ''}`}>
    {children}
  </Link>;



// The Gated components now must be defined outside the main component that uses them
// because they rely on the useFeatureFlag hook from the provider context.
const GatedDropdownMenuItem = ({ item, user, isSuperadmin }) => {
  // This component wraps a dropdown menu item and checks its feature flag
  const { enabled } = useFeatureFlag(item.featureFlag, {
    currentUser: user,
    defaultEnabled: false
  });

  // Check for superAdmin requirement after calling the hook
  if (item.requireSuperAdmin && !(user?.is_superadmin || user?.role === 'admin')) {
    return null;
  }

  // Only render if featureFlag is not defined or is enabled
  if (!item.featureFlag || enabled) {
    return (
      <DropdownMenuItem asChild>
        <Link to={createPageUrl(item.href)} className="flex items-center gap-2">
          <item.icon className="w-4 h-4 text-slate-500" />
          <span>{item.name}</span>
        </Link>
      </DropdownMenuItem>);

  }
  return null;
};

const GatedMobileNavLink = ({ item, currentPageName, user, isSuperadmin }) => {
  // This component wraps a mobile nav link and checks its feature flag
  const { enabled } = useFeatureFlag(item.featureFlag, {
    currentUser: user,
    defaultEnabled: false
  });

  // Check for superAdmin requirement after calling the hook
  if (item.requireSuperAdmin && !(user?.is_superadmin || user?.role === 'admin')) {
    return null;
  }

  // Only render if featureFlag is not defined or is enabled
  if (!item.featureFlag || enabled) {
    return (
      <NavLink href={createPageUrl(item.href)} active={currentPageName === item.href} isMobile>
        <item.icon className="w-4 h-4 mr-2 text-slate-600" />
        <span>{item.name}</span>
      </NavLink>);

  }
  return null;
};

// Component to handle top-level nav item with feature flag
const GatedNavItem = ({ item, currentPageName, user }) => {
  const { enabled } = useFeatureFlag(item.featureFlag, {
    currentUser: user,
    defaultEnabled: false
  });

  // Check for superAdmin requirement after calling the hook
  if (item.requireSuperAdmin && !(user?.is_superadmin || user?.role === 'admin')) {
    return null;
  }

  // Only render if featureFlag is not defined or is enabled
  if (!item.featureFlag || enabled) {
    return (
      <NavLink key={item.name} href={createPageUrl(item.href)} active={currentPageName === item.href}>
        <item.icon className="w-4 h-4 mr-2 text-slate-600" />
        {item.name}
      </NavLink>);

  }
  return null;
};

// Component to handle mobile nav item with feature flag  
const GatedMobileNavItem = ({ item, currentPageName, user }) => {
  const { enabled } = useFeatureFlag(item.featureFlag, {
    currentUser: user,
    defaultEnabled: false
  });

  // Check for superAdmin requirement after calling the hook
  if (item.requireSuperAdmin && !(user?.is_superadmin || user?.role === 'admin')) {
    return null;
  }

  // Only render if featureFlag is not defined or is enabled
  if (!item.featureFlag || enabled) {
    return (
      <NavLink key={item.name} href={createPageUrl(item.href)} active={currentPageName === item.href} isMobile>
        <item.icon className="w-4 h-4 mr-2 text-slate-600" />
        {item.name}
      </NavLink>);

  }
  return null;
};

// NEW: Component to handle dropdown category with feature flag
const GatedDropdownCategory = ({ item, user, children }) => {
  const { enabled: categoryEnabled } = useFeatureFlag(item.featureFlag, {
    currentUser: user,
    defaultEnabled: true
  });

  // Check for superAdmin requirement
  if (item.requireSuperAdmin && !(user?.is_superadmin || user?.role === 'admin')) {
    return null;
  }

  if (!categoryEnabled) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="bg-slate-50 text-slate-800 px-3 py-2 text-sm font-medium justify-center whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-slate-100 hover:text-slate-900 h-10 rounded-md flex items-center transition-colors duration-200 gap-2">
          <item.icon className="w-4 h-4" />
          {item.name}
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border border-slate-200 text-slate-900 w-56">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// NEW: Component to handle mobile dropdown category with feature flag
const GatedMobileDropdownCategory = ({ item, user, currentPageName, isSuperadmin }) => {
  const { enabled: categoryEnabled } = useFeatureFlag(item.featureFlag, {
    currentUser: user,
    defaultEnabled: true
  });

  // Check for superAdmin requirement
  if (item.requireSuperAdmin && !(user?.is_superadmin || user?.role === 'admin')) {
    return null;
  }

  if (!categoryEnabled) {
    return null;
  }

  return (
    <div key={item.name} className="pt-2">
      <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{item.name}</h3>
      {(item.items || []).map((subItem) => {
        if (subItem.type === 'separator') {
          return null;
        }
        return (
          <GatedMobileNavLink
            key={subItem.name}
            item={subItem}
            currentPageName={currentPageName}
            user={user}
            isSuperadmin={isSuperadmin}
          />
        );
      })}
    </div>
  );
};

// NEW: Workspace Selector Component - Updated to remove dark theme
const WorkspaceSelector = () => {
  const { assignedUsernames, selectedUsername, setSelectedUsername, isLoading } = useWorkspace();

  if (isLoading || !assignedUsernames || assignedUsernames.length === 0) {
    return null; // Don't render if loading or no usernames
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="bg-slate-100 text-slate-800 px-4 py-2 text-sm font-medium justify-center whitespace-nowrap rounded-md ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hidden lg:flex items-center gap-2 hover:bg-slate-200 border border-slate-300/50 hover:border-slate-400/50">
          <Users className="w-4 h-4 text-slate-500" />
          <span className="truncate max-w-[150px]">{selectedUsername || "Select Workspace"}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border border-slate-200 text-slate-900 w-56 max-h-[400px] overflow-y-auto">
        <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Workspaces</div>
        {assignedUsernames.map((username) =>
        <DropdownMenuItem
          key={username}
          onSelect={() => setSelectedUsername(username)}
          className={selectedUsername === username ? "bg-slate-100" : ""}>

            {username}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>);

};

// NEW: Retry helper function for handling transient network errors
const retry = async (fn, retries = 3, delay = 500) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) {
        console.error(`Failed to execute function after ${retries} attempts:`, err);
        throw err;
      }
      // Wait with exponential backoff before trying again
      await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
    }
  }
};

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined); // undefined: not checked, null: logged out
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [navReady, setNavReady] = useState(false); // NEW: Track when navigation is ready to render
  const [showTokenHelpVideo, setShowTokenHelpVideo] = useState(false);
  const [tokenHelpVideoUrl, setTokenHelpVideoUrl] = useState("");

  // NEW: Page tutorial system
  const { showVideo: showPageTutorial, videoUrl: pageTutorialUrl, videoTitle: pageTutorialTitle, closeVideo: closePageTutorial } = usePageTutorial(currentPageName);

  const { enabled: useWorkspaceScoping } = useFeatureFlag("use_workspace_scoping", {
    currentUser: user,
    defaultEnabled: false
  });

  // Helper: normalize token balance for display (default 20 for brand new users)
  const getDisplayTokenBalance = (u) => {
    if (!u) return 0;
    const v = u.token_balance;
    if (v === undefined || v === null) {
      // Brand-new accounts start with 20 tokens (schema default)
      return 20;
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // NEW: helper to ensure a username exists for current user
  const ensureUsernameAssigned = async (currentUser) => {
    if (!currentUser) return currentUser;
    if (Array.isArray(currentUser.assigned_usernames) && currentUser.assigned_usernames.length > 0) {
      return currentUser;
    }

    // CHANGED: Build candidate from full_name (not random). Fallback to email local part.
    const baseFromFullName = (currentUser.full_name || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 24);

    const emailLocal = ((currentUser.email || "user").split("@")[0] || "user")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 24);

    const candidate = baseFromFullName || emailLocal || "user";

    // CHANGED: Always call backend function to guarantee uniqueness + RLS-safe creation
    try {
      const res = await base44.functions.invoke("autoAssignUsername", {
        preferred_user_name: candidate,
        display_name: currentUser.full_name || candidate
      });
      const uniqueName = res?.data?.username || candidate;
      const updated = await base44.auth.updateMe({ assigned_usernames: [uniqueName] });
      return updated;
    } catch (_e) {
      // If the backend function fails for any reason, return the original user
      // We don't want to block the user from logging in just because username assignment failed.
      console.error("Failed to auto-assign username:", _e);
      return currentUser;
    }
  };

  // NEW: helper to ensure token_balance is persisted (20 on first login) – idempotent
  const ensureWelcomeTokens = async (currentUser) => {
    if (!currentUser) return currentUser;
    const marker = "welcome_seeded_20";
    const processed = Array.isArray(currentUser.processed_stripe_payments)
      ? currentUser.processed_stripe_payments
      : [];
    const alreadySeeded = processed.includes(marker);

    const numericBalance =
      currentUser.token_balance === undefined || currentUser.token_balance === null
        ? NaN
        : Number(currentUser.token_balance);

    // seed only if not yet seeded and balance is not positive
    if (!alreadySeeded && (!Number.isFinite(numericBalance) || numericBalance <= 0)) {
      const updated = await base44.auth.updateMe({
        token_balance: 20,
        processed_stripe_payments: [...processed, marker],
      });
      return updated;
    }
    return currentUser;
  };

  // Prevent Editor remounts while publishing (blocks pushState/replaceState to Editor)
  useEffect(() => {
    if (currentPageName !== 'Editor') return;

    // NEW: safe logger for environments without console.debug
    const safeDebug = (...args) => {
      try {
        if (typeof console !== 'undefined') {
          if (typeof console.debug === 'function') return console.debug(...args);
          if (typeof console.log === 'function') return console.log(...args);
        }
      } catch (_) {}
    };

    const originalPush = history.pushState;
    const originalReplace = history.replaceState;

    const guard = (fn) => function (state, title, url) {
      try {
        const prevent = sessionStorage.getItem('dcPublishing') === '1';
        const nextUrl = typeof url === 'string' ? url : (url ? String(url) : '');
        // Block any Editor navigation during publishing
        if (prevent && nextUrl && /Editor/i.test(nextUrl)) {
          safeDebug('Blocked Editor navigation during publish to avoid full reload.');
          return;
        }
        // NEW: Block redundant Editor navigations that cause an unnecessary remount
        if (nextUrl && /Editor/i.test(nextUrl)) {
          const cur = new URL(window.location.href);
          const nxt = new URL(nextUrl, window.location.origin);
          const samePath = cur.pathname === nxt.pathname;
          
          if (samePath) { // Only proceed if paths are identical
            const curPost = new URLSearchParams(cur.search).get('post');
            const nxtPost = new URLSearchParams(nxt.search).get('post');
            const curWebhook = new URLSearchParams(cur.search).get('webhook');
            const nxtWebhook = new URLSearchParams(nxt.search).get('webhook');

            // If we're already on the Editor for the same content, skip navigation
            if (curPost && nxtPost && curPost === nxtPost) {
              safeDebug('Blocked duplicate Editor navigation (same post id).');
              return;
            }
            if (curWebhook && nxtWebhook && curWebhook === nxtWebhook) {
              safeDebug('Blocked duplicate Editor navigation (same webhook id).');
              return;
            }
          }
        }
      } catch (e) {
        console.error("Error in history guard:", e);
      }
      return fn.apply(this, arguments);
    };

    history.pushState = guard(originalPush);
    history.replaceState = guard(originalReplace);

    // Removed problematic window.location override code that was causing crashes

    return () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
    };
  }, [currentPageName]);

  // GLOBAL AFFILIATE REFERRAL TRACKING
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const ref = urlParams.get('ref');

      if (ref) {
        console.log('🎯 LAYOUT: Affiliate code detected in URL:', ref);
        // Store in localStorage to persist across session
        localStorage.setItem('affiliate_ref', ref);
        localStorage.setItem('affiliate_ref_date', new Date().toISOString());

        // Clean the URL to avoid re-tracking
        const newParams = new URLSearchParams(location.search);
        newParams.delete('ref');
        navigate({ search: newParams.toString() }, { replace: true });
      }
    } catch (e) {
      console.error("Failed to process affiliate referral code:", e);
    }
  }, [location.search, navigate]);

  // Fetch user only once when the layout mounts for the first time.
  // User session persists across page navigations.
  useEffect(() => {
    const fetchUserAndRedirect = async () => {
      setIsUserLoading(true);
      setIsRedirecting(false);
      setNavReady(false); // Reset nav ready state
      try {
        // MODIFIED: Use the new retry helper to make the user fetch more robust
        const fetchedUser = await retry(() => User.me());
        setUser(fetchedUser);
        setIsSuperadmin(!!fetchedUser?.is_superadmin);

        // --- UPDATED ONBOARDING REDIRECTION LOGIC ---
        const hasCompletedWelcome = fetchedUser.completed_tutorial_ids?.includes("welcome_onboarding");
        const hasCompletedGettingStarted = fetchedUser.completed_tutorial_ids?.includes("getting_started_scrape");

        // Define pages that are exceptions to the redirection rules
        const redirectExceptions = ['post-payment', 'AccountSettings', 'Contact', 'Affiliate'];

        if (!redirectExceptions.includes(currentPageName)) {
          // NEW SCENARIO: User hasn't completed welcome → Welcome page
          if (!hasCompletedWelcome && currentPageName !== 'Welcome') {
            setIsRedirecting(true);
            navigate(createPageUrl('Welcome'));
            return;
          }
          
          // NEW SCENARIO: User completed welcome but not getting started → GettingStarted page
          if (hasCompletedWelcome && !hasCompletedGettingStarted && currentPageName !== 'GettingStarted') {
            setIsRedirecting(true);
            navigate(createPageUrl('GettingStarted'));
            return;
          }
        }
        
        // Scenario: Fully onboarded user tries to access Welcome or GettingStarted → redirect to Dashboard
        if (hasCompletedWelcome && hasCompletedGettingStarted) {
          if (currentPageName === 'Welcome' || currentPageName === 'GettingStarted') {
            setIsRedirecting(true);
            navigate(createPageUrl('Dashboard'));
            return;
          }
        }

        // If we reach here, no redirect is needed, so navigation can be shown
        setNavReady(true);

      } catch (err) { // This will now catch the error only after all retries have failed
        console.error("Failed to fetch user information after multiple attempts:", err);
        setUser(null);
        setIsSuperadmin(false);
        setNavReady(true); // Show navigation even for logged-out state
      } finally {
        setIsUserLoading(false);
        // Do NOT set setIsRedirecting(false) here, as it might happen before the navigate fully takes effect.
        // The new page component will handle its own loading state.
      }
    };
    fetchUserAndRedirect();
  }, [location.pathname, navigate, currentPageName]);

  // NEW: Self-heal effect right after user is fetched – fixes race where username/tokens not set yet
  React.useEffect(() => {
    let cancelled = false;
    const runFixes = async () => {
      if (!user) return;

      // 1) Ensure a brand username exists
      let u = await ensureUsernameAssigned(user);
      // 2) Ensure real token balance is persisted (20) for first-time accounts
      u = await ensureWelcomeTokens(u);

      if (!cancelled && u && u.id === user.id) {
        // Update in-memory user so header/Token Top Up reflect the true balance immediately
        setUser(u);
        // Notify listeners that rely on token balance/usernames
        try {
          window.dispatchEvent(new CustomEvent("userUpdated", { detail: { user: u } }));
          if (typeof u.token_balance === "number") {
            window.dispatchEvent(new CustomEvent("tokenBalanceUpdated", { detail: { newBalance: u.token_balance } }));
          }
        } catch (_) {}
      }
    };
    runFixes();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Removed: Firecrawl webhook notifier effect (was causing duplicate sends)
  // Webhook is now called ONLY from TopicsOnboardingModal.handleComplete

  // Load token help video URL
  useEffect(() => {
    const loadTokenHelpVideo = async () => {
      try {
        const settings = await AppSettings.list();
        const videoSetting = settings.find(s => s.key === "token_help_video");
        if (videoSetting?.value) {
          setTokenHelpVideoUrl(videoSetting.value);
        }
      } catch (error) {
        console.error("Failed to load token help video:", error);
      }
    };
    loadTokenHelpVideo();
  }, []);

  // Listen for token balance updates
  useEffect(() => {
    const handleTokenBalanceUpdate = (event) => {
      if (event.detail && typeof event.detail.newBalance === 'number') {
        setUser((prevUser) => {
          if (prevUser) {
            return {
              ...prevUser,
              token_balance: event.detail.newBalance
            };
          }
          return prevUser;
        });
      }
    };

    window.addEventListener('tokenBalanceUpdated', handleTokenBalanceUpdate);
    return () => {
      window.removeEventListener('tokenBalanceUpdated', handleTokenBalanceUpdate);
    };
  }, []);

  // NEW: feature flag for showing token balance
  const { enabled: showTokenBalance } = useFeatureFlag("show_token_balance", {
    currentUser: user,
    defaultEnabled: false
  });

  const handleLogout = async () => {
    await User.logout();
    window.location.href = '/';
  };

  // Filter navigation based on feature flags (no more role-based filtering)
  const visibleNav = navStructure;

  // Hide layout for pages that should be standalone
  if (currentPageName === 'Welcome' || currentPageName === 'GettingStarted') {
    return <>{children}</>;
  }

  // Show loading screen during user authentication or redirects
  if (isUserLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-medium">Loading your workspace...</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-white backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <AnimatePresence>
          {isUserLoading && 
          <motion.div
            className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }} />

          }
        </AnimatePresence>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to={createPageUrl('Dashboard')} className="flex items-center">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689715479cd170f6c2aa04f2/d056b0101_logo.png" alt="Logo" className="w-10 h-10 rounded-full" />
              </Link>
            </div>

            {/* Nav (now scrollable horizontally) - with loading state */}
            <div className="hidden lg:block flex-1 min-w-0 px-2">
              {!navReady ? (
                // Skeleton navigation while loading
                <div className="bg-slate-50 flex items-center space-x-1">
                  <div className="h-10 w-24 bg-slate-200 rounded-md animate-pulse"></div>
                  <div className="h-10 w-32 bg-slate-200 rounded-md animate-pulse"></div>
                  <div className="h-10 w-28 bg-slate-200 rounded-md animate-pulse"></div>
                  <div className="h-10 w-36 bg-slate-200 rounded-md animate-pulse"></div>
                </div>
              ) : (
                <nav className="bg-slate-50 flex items-center space-x-1 overflow-x-auto flex-nowrap hide-scrollbar">
                  {/* NEW: Conditional Workspace Selector */}
                  {useWorkspaceScoping && <WorkspaceSelector />}

                  {visibleNav.map((item) => {
                    // Direct link items
                    if (item.href) {
                      return (
                        <GatedNavItem
                          key={item.name}
                          item={item}
                          currentPageName={currentPageName}
                          user={user}
                        />
                      );
                    }

                    // Dropdown categories - now using GatedDropdownCategory component
                    return (
                      <GatedDropdownCategory key={item.name} item={item} user={user}>
                        {(item.items || []).map((subItem, index) => {
                          if (subItem.type === 'separator') {
                            return <DropdownMenuSeparator key={`separator-${item.name}-${index}`} />;
                          }
                          return (
                            <GatedDropdownMenuItem
                              key={subItem.name}
                              item={subItem}
                              user={user}
                              isSuperadmin={isSuperadmin}
                            />
                          );
                        })}
                      </GatedDropdownCategory>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* User menu and Mobile menu button */}
            <div className="flex items-center gap-4">
              {/* Token balance pill with help icon */}
              {user && showTokenBalance && navReady &&
              <div className="flex items-center gap-2">
                <Link to={createPageUrl('TokenPacketsTopUp')}>
                  <div
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                    title="Click to top up AI tokens">
                      <Coins className="w-4 h-4 text-green-500" />
                      <span>{getDisplayTokenBalance(user)}</span>
                    </div>
                  </Link>
                  {tokenHelpVideoUrl && (
                    <button
                      onClick={() => setShowTokenHelpVideo(true)}
                      className="p-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                      title="Watch token help video"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  )}
                </div>
              }

              {navReady ? (
                user ?
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 text-sm">
                        <span>{user.full_name || user.email}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white border border-slate-200 text-slate-900 w-56">
                      {/* NEW: Token balance inside menu for small screens */}
                      {showTokenBalance &&
                    <DropdownMenuItem disabled className="flex items-center gap-2 opacity-100 md:hidden">
                          <Coins className="w-4 h-4 text-green-500" />
                          <span className="text-slate-700">
                            Tokens: {getDisplayTokenBalance(user)}
                          </span>
                        </DropdownMenuItem>
                    }
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('AccountSettings')} className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span>Account Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      {/* Affiliate Program */}
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Affiliate')} className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-500" />
                          <span>Affiliate Program</span>
                        </Link>
                      </DropdownMenuItem>
                      {/* Contact */}
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Contact')} className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span>Contact</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-slate-500" />
                        <span>Log Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu> :

                <NavLink href="#" onClick={() => User.loginWithRedirect(window.location.href)}>
                    Log In
                  </NavLink>
              ) : (
                // Show skeleton for user menu while loading
                <div className="h-10 w-24 bg-slate-200 rounded-md animate-pulse"></div>
              )}

              <div className="lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-900">

                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? <X className="block h-6 w-6" aria-hidden="true" /> : <Menu className="block h-6 w-6" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu - only show when nav is ready */}
        {mobileMenuOpen && navReady && (
          <div className="lg:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-slate-200">
            {visibleNav.map((item) => {
              // Direct link items
              if (item.href) {
                return (
                  <GatedMobileNavItem
                    key={item.name}
                    item={item}
                    currentPageName={currentPageName}
                    user={user}
                  />
                );
              }

              // Dropdown categories - now using GatedMobileDropdownCategory component
              return (
                <GatedMobileDropdownCategory
                  key={item.name}
                  item={item}
                  user={user}
                  currentPageName={currentPageName}
                  isSuperadmin={isSuperadmin}
                />
              );
            })}
          </div>
        )}
      </header>

      {/* Token top-up banner (auto-hides if user has tokens) */}
      <TokenTopUpBanner />

      {/* FIXED: Removed `relative z-10` to break the stacking context trapping the AI menu */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {!user && !isUserLoading ?
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center p-8">

              <h2 className="text-xl font-semibold text-slate-800">Please Log In</h2>
              <p className="text-slate-600 mt-2 mb-4">You need to be authenticated to access this page.</p>
              <Button onClick={() => User.loginWithRedirect(window.location.href)}>
                Log In
              </Button>
            </motion.div> :

          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={currentPageName === 'Topics' ? 'topics-tables-scope' : undefined}>

              {children}
            </motion.div>
          }
        </AnimatePresence>
      </main>

      {/* Token Help Video Modal */}
      <VideoModal
        isOpen={showTokenHelpVideo}
        onClose={() => setShowTokenHelpVideo(false)}
        videoUrl={tokenHelpVideoUrl}
        title="How to Use AI Tokens"
      />

      {/* NEW: Page Tutorial Video Modal */}
      <VideoModal
        isOpen={showPageTutorial}
        onClose={closePageTutorial}
        videoUrl={pageTutorialUrl}
        title={pageTutorialTitle}
      />

      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        /* Light theme only - all dark theme styles removed */
        
        /* GLOBAL: Force light popover surfaces and readable text inside any Radix portal */
        [data-radix-popper-content-wrapper] > * {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
        }

        /* Light theme accent colors for highlighted items */
        [data-radix-popper-content-wrapper] {
          --accent: 210 40% 96% !important;
          --accent-foreground: 222 47% 11% !important;
        }

        /* Make items readable by default and on highlight/focus/active */
        [data-radix-popper-content-wrapper] [role="option"],
        [data-radix-popper-content-wrapper] [role="menuitem"],
        [data-radix-popper-content-wrapper] [cmdk-item] {
          color: #0f172a !important;
        }
        [data-radix-popper-content-wrapper] [data-highlighted],
        [data-radix-popper-content-wrapper] [role="option"][data-highlighted],
        [data-radix-popper-content-wrapper] [role="menuitem"][data-highlighted],
        [data-radix-popper-content-wrapper] [cmdk-item][data-highlighted],
        [data-radix-popper-content-wrapper] [role="option"]:focus,
        [data-radix-popper-content-wrapper] [role="menuitem"]:focus,
        [data-radix-popper-content-wrapper] [cmdk-item]:focus {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }

        /* Explicit hover fix: ensure the very first item (auto-hovered) stays readable */
        [data-radix-popper-content-wrapper] [role="option"]:hover,
        [data-radix-popper-content-wrapper] [role="menuitem"]:hover,
        [data-radix-popper-content-wrapper] [cmdk-item]:hover,
        [data-radix-popper-content-wrapper] [role="option"][data-state="checked"],
        [data-radix-popper-content-wrapper] [role="menuitem"][data-state="checked"] {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
        /* Make all descendants readable while hovered/highlighted/checked */
        [data-radix-popper-content-wrapper] [role="option"]:hover *,
        [data-radix-popper-content-wrapper] [role="menuitem"]:hover *,
        [data-radix-popper-content-wrapper] [cmdk-item]:hover *,
        [data-radix-popper-content-wrapper] [role="option"][data-state="checked"] *,
        [data-radix-popper-content-wrapper] [role="menuitem"][data-state="checked"] *,
        [data-radix-popper-content-wrapper] [data-highlighted] * {
          color: #0f172a !important;
        }

        /* Ensure icons stay visible too */
        [data-radix-popper-content-wrapper] [data-highlighted] svg,
        [data-radix-popper-content-wrapper] [role="option"] svg,
        [data-radix-popper-content-wrapper] [role="menuitem"] svg,
        [data-radix-popper-content-wrapper] [cmdk-item] svg {
          color: #0f172a !important;
        }

        /* Force light theme dropdowns everywhere (Radix poppers, Command, Select) */
        [data-radix-popper-content-wrapper] .cmdk-root,
        [data-radix-popper-content-wrapper] .cmdk-list,
        [data-radix-popper-content-wrapper] .cmdk-input,
        [data-radix-popper-content-wrapper] [cmdk-input],
        [data-radix-popper-content-wrapper] [cmdk-item],
        [data-radix-popper-content-wrapper] [role="option"],
        [data-radix-popper-content-wrapper] [role="menuitem"] {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        [data-radix-popper-content-wrapper] [cmdk-item][data-highlighted],
        [data-radix-popper-content-wrapper] [cmdk-item][data-selected],
        [data-radix-popper-content-wrapper] [role="option"][data-highlighted],
        [data-radix-popper-content-wrapper] [role="menuitem"][data-highlighted] {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
        [data-radix-popper-content-wrapper] [cmdk-item] *,
        [data-radix-popper-content-wrapper] [role="option"] * {
          color: inherit !important;
        }
        /* Ensure popovers sit above sticky headers AND modals */
        [data-radix-popper-content-wrapper] {
          z-index: 250 !important;
        }

        /* === Z-INDEX HIERARCHY === */
        /* Base modals (like ShopifyPublishModal) */
        .b44-modal {
          z-index: 200 !important;
        }
        
        /* Nested modals (like ImageLibraryModal opened from ShopifyPublishModal) */
        .b44-modal[style*="z-index: 300"] {
          z-index: 300 !important;
        }
        
        /* Alert dialogs above nested modals */
        [role="alertdialog"][style*="z-index: 350"] {
          z-index: 350 !important;
        }

        /* FIX: Remove unwanted borders and outlines from navigation elements */
        header button,
        header .dropdown-trigger,
        header [data-radix-dropdown-trigger],
        nav button,
        nav .dropdown-trigger,
        nav [data-radix-dropdown-trigger] {
          border: none !important;
          outline: none !important;
        }
        
        header button:focus,
        header button:focus-visible,
        header .dropdown-trigger:focus,
        header .dropdown-trigger:focus-visible,
        header [data-radix-dropdown-trigger]:focus,
        header [data-radix-dropdown-trigger]:focus-visible,
        nav button:focus,
        nav button:focus-visible,
        nav .dropdown-trigger:focus,
        nav .dropdown-trigger:focus-visible,
        nav [data-radix-dropdown-trigger]:focus,
        nav [data-radix-dropdown-trigger]:focus-visible {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none;    /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
        .topics-tables-scope table {
          display: block;
          overflow-x: auto;
          max-width: 100%;
          -webkit-overflow-scrolling: touch;
          border-collapse: collapse;
        }
        .topics-tables-scope thead,
        .topics-tables-scope tbody {
          width: max-content;
        }
        .topics-tables-scope th,
        .topics-tables-scope td {
          white-space: nowrap;
        }

        /* === PREVENT TEXT WRAPPING AROUND ALL MEDIA === */
        /* Ensure ALL media elements remain block and never allow text wrapping beside them */
        .ql-editor img,
        .ql-editor .youtube-video-container,
        .ql-editor .tiktok-embed,
        .ql-editor .b44-promoted-product,
        .ql-editor .b44-audio-inline,
        .ql-editor audio,
        img,
        .youtube-video-container,
        .tiktok-embed,
        .b44-promoted-product,
        .b44-audio-inline,
        audio {
          display: block !important;
          float: none !important;
          clear: both !important;
          max-width: 100%;
          margin-left: auto;
          margin-right: auto;
        }

        /* Respect alignment choices without introducing wrapping: use margins instead of float */
        .ql-editor .ql-align-left img,
        .ql-editor .ql-align-left .youtube-video-container,
        .ql-editor .ql-align-left .tiktok-embed,
        .ql-editor .ql-align-left .b44-promoted-product,
        .ql-editor .ql-align-left .b44-audio-inline,
        .ql-editor img.ql-align-left,
        .ql-editor .youtube-video-container.ql-align-left,
        .ql-editor .tiktok-embed.ql-align-left,
        .ql-editor .b44-promoted-product.ql-align-left,
        .ql-editor .b44-audio-inline.ql-align-left {
          margin-left: 0 !important;
          margin-right: auto !important;
        }
        .ql-editor .ql-align-right img,
        .ql-editor .ql-align-right .youtube-video-container,
        .ql-editor .ql-align-right .tiktok-embed,
        .ql-editor .ql-align-right .b44-promoted-product,
        .ql-editor .ql-align-right .b44-audio-inline,
        .ql-editor img.ql-align-right,
        .ql-editor .youtube-video-container.ql-align-right,
        .ql-editor .tiktok-embed.ql-align-right,
        .ql-editor .b44-promoted-product.ql-align-right,
        .ql-editor .b44-audio-inline.ql-align-right {
          margin-left: auto !important;
          margin-right: 0 !important;
        }
        .ql-editor .ql-align-center img,
        .ql-editor .ql-align-center .youtube-video-container,
        .ql-editor .ql-align-center .tiktok-embed,
        .ql-editor .ql-align-center .b44-promoted-product,
        .ql-editor .ql-align-center .b44-audio-inline,
        .ql-editor img.ql-align-center,
        .ql-editor .youtube-video-container.ql-align-center,
        .ql-editor .tiktok-embed.ql-align-center,
        .ql-editor .b44-promoted-product.ql-align-center,
        .ql-editor .b44-audio-inline.ql-align-center {
          margin-left: auto !important;
          margin-right: auto !important;
        }

        /* Keep iframes fully contained inside responsive wrapper */
        .youtube-video-container iframe,
        .ql-editor .youtube-video-container iframe {
          display: block;
          width: 100% !important;
          height: 100% !important;
        }

        /* Make TikTok oEmbed block span full width in editor */
        .ql-editor .tiktok-embed {
          width: 100% !important;
        }

        /* Add a clear after embeds so next paragraph never sits beside them */
        .ql-editor .youtube-video-container + *,
        .ql-editor .tiktok-embed + *,
        .ql-editor img + *,
        .ql-editor .b44-promoted-product + *,
        .ql-editor .b44-audio-inline + *,
        .ql-editor audio + * {
          clear: both !important;
        }
      `}</style>
    </div>);

}

export default function Layout(props) {
  return (
    <FeatureFlagProvider>
      <WorkspaceProvider>
        <TemplateProvider>
          <CredentialsProvider>
            <LayoutContent {...props} />
          </CredentialsProvider>
        </TemplateProvider>
      </WorkspaceProvider>
    </FeatureFlagProvider>
  );
}

