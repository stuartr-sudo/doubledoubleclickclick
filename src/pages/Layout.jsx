

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, FileText, Edit3, Database, Calendar as CalendarIcon, User as UserIcon, ListChecks, Settings, ShoppingBag,
  Share2, Mail, Package, Palette, BookOpen, Video, Clapperboard, Film, Link as LinkIcon, ShoppingCart, Home as HomeIcon,
  LogOut, ChevronUp, ChevronDown, Layers3, Menu, X, Shield, Sparkles, Loader2, Coins, Quote, ImageIcon, Youtube, Users } from
"lucide-react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator } from
"@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { FeatureFlagProvider, useFeatureFlagData } from "@/components/providers/FeatureFlagProvider";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import TokenTopUpBanner from "@/components/common/TokenTopUpBanner";
import { WorkspaceProvider, WorkspaceContext } from "@/components/providers/WorkspaceProvider";
import { useWorkspace } from "@/components/hooks/useWorkspace";

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
  { name: "Topics", href: "Topics", icon: Database, featureFlag: "show_topics_link" },
  { name: "Schedule", href: "SchedulingDashboard", icon: CalendarIcon, featureFlag: "show_schedule_link" },
  { name: "DoubleClick Tutorials", href: "DoubleClickTutorials", icon: BookOpen }]

},

// Assets Category - UPDATED: Added Amazon items and Sitemaps here
{
  name: "Assets",
  icon: Layers3,
  items: [
  { name: "Brand Guidelines", href: "BrandGuidelinesManager", icon: Settings, featureFlag: "show_brand_guidelines_link" },
  { name: "Products", href: "ProductManager", icon: ShoppingBag, featureFlag: "show_products_link" },
  { name: "Amazon Import", href: "AmazonImport", icon: ShoppingCart, featureFlag: "show_amazon_import_link" },
  { name: "Amazon Testimonials", href: "AmazonTestimonials", icon: ShoppingBag, featureFlag: "show_amazon_testimonials_link" },
  { name: "Sitemaps", href: "SitemapManager", icon: LinkIcon, featureFlag: "show_sitemaps_link" },
  { name: "Services", href: "ServiceCatalog", icon: Package, featureFlag: "show_service_catalog_link" },
  { name: "Templates", href: "CustomTemplateManager", icon: FileText, featureFlag: "show_custom_template_manager_link", requireSuperAdmin: true }]

},

// Media Category - UPDATED: Changed name from "Media & AI" to "AI Hub"
{
  name: "AI Hub",
  icon: ImageIcon,
  items: [
  { name: "Image Library", href: "ImageLibrary", icon: ImageIcon },
  { name: "Testimonials", href: "TestimonialLibrary", icon: Quote, featureFlag: "show_testimonials_link" },
  { type: "separator" },
  { name: "YouTube AI", href: "YouTubeManager", icon: Youtube, featureFlag: "show_youtube_ai_link" },
  { name: "TikTok AI", href: "TiktokAIGenerator", icon: Video, featureFlag: "show_tiktok_ai_link" }]

},

// Growth Category - UPDATED: Now admin-only, removed Amazon items and Sitemaps
{
  name: "Growth",
  icon: ShoppingCart,
  requireSuperAdmin: true,
  items: [
  { name: "Landing Page", href: "LandingPageManager", icon: HomeIcon, featureFlag: "show_landing_page_manager_link", requireSuperAdmin: true },
  { name: "Sales Pages", href: "SalesPageManager", icon: BookOpen, featureFlag: "show_sales_page_manager_link", requireSuperAdmin: true },
  { name: "Pricing", href: "Pricing", icon: Coins, featureFlag: "show_pricing_link", requireSuperAdmin: true }]

},

// Admin Category (converted to feature flags)
{
  name: "Admin",
  icon: Shield,
  requireSuperAdmin: true,
  items: [
  { name: "Users", href: "UserManagement", icon: UserIcon, featureFlag: "show_user_management_link" },
  { name: "Affiliate Manager", href: "AffiliateManager", icon: Users, requireSuperAdmin: true },
  { name: "Waitlist", href: "WaitlistManager", icon: ListChecks, featureFlag: "show_waitlist_link" },
  { name: "Onboarding Builder", href: "OnboardingWizardBuilder", icon: ListChecks, featureFlag: "show_onboarding_builder_link" },
  { name: "Onboarding Steps", href: "OnboardingStepManager", icon: Settings }, // NEW: Onboarding Steps link
  { name: "Feature Flags", href: "FeatureManagement", icon: Settings, featureFlag: "show_feature_management_link" },
  { name: "Editor Workflows", href: "EditorWorkflowManager", icon: Settings, featureFlag: "show_editor_workflows_link" },
  { name: "App Products", href: "AppProductManager", icon: ShoppingBag, featureFlag: "show_app_product_manager_link" },
  { name: "API Docs", href: "MidjourneyApiDocs", icon: BookOpen, featureFlag: "show_api_docs_link" },
  { name: "LLM Settings", href: "AdminLLM", icon: Sparkles, featureFlag: "show_llm_settings_link" },
  { name: "SEO Setup", href: "AdminSEO", icon: Settings, featureFlag: "show_admin_seo_link" },
  { name: "Endpoints", href: "FaqEndpointAdmin", icon: Settings, featureFlag: "show_endpoints_link" }]

}];



const NavLink = ({ href, active, children, isMobile = false }) =>
<Link
  to={href} className="bg-slate-50 text-slate-800 px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors duration-200">
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

// NEW: Workspace Selector Component
const WorkspaceSelector = () => {
  const { assignedUsernames, selectedUsername, setSelectedUsername, isLoading } = useWorkspace();

  if (isLoading || !assignedUsernames || assignedUsernames.length === 0) {
    return null; // Don't render if loading or no usernames
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="bg-indigo-950 text-slate-50 px-4 py-2 text-sm font-medium justify-center whitespace-nowrap rounded-md ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hidden lg:flex items-center gap-2 hover:bg-indigo-900 hover:text-blue-100 hover:shadow-[0_0_15px_rgba(30,58,138,0.5),0_0_30px_rgba(30,58,138,0.3)] border border-indigo-800/50 hover:border-indigo-600/50">
          <Users className="w-4 h-4 text-slate-500" />
          <span className="truncate max-w-[150px]">{selectedUsername || "Select Workspace"}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border border-slate-200 text-slate-900 w-56">
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


function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined); // undefined: not checked, null: logged out
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [navReady, setNavReady] = useState(false); // NEW: Track when navigation is ready to render

  const { enabled: useWorkspaceScoping } = useFeatureFlag("use_workspace_scoping", {
    currentUser: user,
    defaultEnabled: false
  });

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
        const fetchedUser = await User.me();
        setUser(fetchedUser);
        setIsSuperadmin(!!fetchedUser?.is_superadmin);

        // --- NEW ONBOARDING REDIRECTION LOGIC ---
        const hasCompletedWelcome = fetchedUser.completed_tutorial_ids?.includes("welcome_onboarding");
        const hasPlan = !!fetchedUser.plan_price_id;

        // Define pages that are exceptions to the redirection rules
        const redirectExceptions = ['post-payment', 'AccountSettings', 'Home'];

        if (!redirectExceptions.includes(currentPageName)) {
          // Scenario 1: New user, no plan. Force to Pricing page.
          if (!hasPlan && currentPageName !== 'Pricing') {
            setIsRedirecting(true); // Set redirecting state
            navigate(createPageUrl('Pricing'));
            return;
          }

          // Scenario 2: User has a plan, but hasn't done welcome onboarding. Force to Welcome page.
          if (hasPlan && !hasCompletedWelcome && currentPageName !== 'Welcome') {
            setIsRedirecting(true); // Set redirecting state
            navigate(createPageUrl('Welcome'));
            return;
          }
        }
        // Scenario 3: Onboarded user tries to access Welcome page. Redirect to Dashboard.
        if (hasCompletedWelcome && currentPageName === 'Welcome') {
          setIsRedirecting(true); // Set redirecting state
          navigate(createPageUrl('Dashboard'));
          return;
        }

        // If we reach here, no redirect is needed, so navigation can be shown
        setNavReady(true);

      } catch {
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
  }, [location.pathname, navigate, currentPageName]); // Re-run on every path change to ensure logic is always applied

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
    setUser(null);
    window.location.href = createPageUrl('Home');
  };

  // Filter navigation based on feature flags (no more role-based filtering)
  const visibleNav = navStructure;

  // Hide layout for pages that should be standalone
  if (currentPageName === 'Home' || currentPageName === 'Welcome') {
    return <>{children}</>;
  }

  // NEW: Hide layout for new users on the Pricing page
  // This check should happen AFTER user is loaded, but BEFORE the main layout renders.
  // If `isUserLoading` is true, it's handled by the global loading screen below.
  if (!isUserLoading && currentPageName === 'Pricing' && user && !user.plan_price_id) {
    return <>{children}</>;
  }

  // Show loading screen during user authentication or redirects
  if (isUserLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-medium">Loading your workspace...</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-white backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <AnimatePresence>
          {isUserLoading && // This progress bar is for ongoing background loading, not initial app load
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
                    if (item.requireSuperAdmin && !(user?.is_superadmin || user?.role === 'admin')) {
                      return null;
                    }
                    return item.href ?
                    <GatedNavItem
                      key={item.name}
                      item={item}
                      currentPageName={currentPageName}
                      user={user} /> :

                    <DropdownMenu key={item.name}>
                        <DropdownMenuTrigger asChild>
                          <Button
                          variant="ghost" className="bg-slate-50 text-slate-800 px-3 py-2 text-sm font-medium justify-center whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 rounded-md flex items-center transition-colors duration-200 gap-2">

                            <item.icon className="w-4 h-4" />
                            {item.name}
                            <ChevronDown className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white border border-slate-200 text-slate-900 w-56">
                          {(item.items || []).map((subItem, index) => {
                          if (subItem.type === 'separator') {
                            return <DropdownMenuSeparator key={`separator-${item.name}-${index}`} />;
                          }
                          return (
                            <GatedDropdownMenuItem key={subItem.name} item={subItem} user={user} isSuperadmin={isSuperadmin} />);

                        })}
                        </DropdownMenuContent>
                      </DropdownMenu>;

                  })}
                </nav>
              )}
            </div>

            {/* User menu and Mobile menu button */}
            <div className="flex items-center gap-4">
              {/* NEW: Token balance pill - positioned right before user dropdown */}
              {user && showTokenBalance && navReady &&
              <div
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800"
                title="AI tokens available">
                  <Coins className="w-4 h-4 text-green-500" />
                  <span>{Number(user.token_balance ?? 0)}</span>
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
                            Tokens: {Number(user?.token_balance ?? 0)}
                          </span>
                        </DropdownMenuItem>
                    }
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('AccountSettings')} className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span>Account Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-slate-500" />
                        <span>Log Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu> :

                <NavLink href="#" onClick={() => User.loginWithRedirect(createPageUrl(currentPageName || 'Dashboard'))}>
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
        {mobileMenuOpen && navReady &&
        <div className="lg:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-slate-200">
            {visibleNav.map((item) => {
            if (item.requireSuperAdmin && !(user?.is_superadmin || user?.role === 'admin')) {
              return null;
            }
            return item.href ?
            <GatedMobileNavItem
              key={item.name}
              item={item}
              currentPageName={currentPageName}
              user={user} /> :


            <div key={item.name} className="pt-2">
                  <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{item.name}</h3>
                  {(item.items || []).map((subItem) => {
                if (subItem.type === 'separator') {
                  return null;
                }
                return (
                  <GatedMobileNavLink key={subItem.name} item={subItem} currentPageName={currentPageName} user={user} isSuperadmin={isSuperadmin} />);

              })}
                </div>;

          })}
          </div>
        }
      </header>

      {/* Token top-up banner (auto-hides if user has tokens) */}
      <TokenTopUpBanner />

      <main className="relative z-10 flex-1">
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

      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        /* Dark theme variables so shadcn outline/ghost hover states have contrast */
        :root {
          --background: 222 47% 11%;
          --foreground: 210 40% 98%;

          --card: 222 47% 11%;
          --card-foreground: 210 40% 98%;

          --popover: 222 47% 11%;
          --popover-foreground: 210 40% 98%;

          --primary: 245 58% 51%;
          --primary-foreground: 210 40% 98%;

          --secondary: 217 33% 17%;
          --secondary-foreground: 210 40% 98%;

          --muted: 215 16% 22%;
          --muted-foreground: 215 20% 65%;

          /* Used by outline/ghost hover:bg-accent */
          --accent: 217 33% 17%;
          --accent-foreground: 210 40% 98%;

          --destructive: 0 72% 51%;
          --destructive-foreground: 210 40% 98%;

          --border: 217 33% 17%;
          --input: 217 33% 17%;
          --ring: 217 33% 17%;
        }

        /* Safety: ensure hover text stays visible if any component uses accent foreground */
        /* EDITED: Make selector more specific to avoid over-applying */
        .dark-theme-provider button:hover,
        .dark-theme-provider a.button:hover {
          color: hsl(var(--accent-foreground));
        }

        /* GLOBAL: Force light popover surfaces and readable text inside any Radix portal */
        [data-radix-popper-content-wrapper] > * {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
        }

        /* Override shadcn accent colors inside poppers so data-[highlighted] is light bg + dark text */
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

        /* Neutralize any dark utility classes that might slip into poppers */
        [data-radix-popper-content-wrapper] .text-white,
        [data-radix-popper-content-wrapper] .text-white\\/80,
        [data-radix-popper-content-wrapper] .text-white\\/70 {
          color: #0f172a !important;
        }
        [data-radix-popper-content-wrapper] .bg-slate-800,
        [data-radix-popper-content-wrapper] .bg-slate-800\\/95,
        [data-radix-popper-content-wrapper] .bg-black\\/50,
        [data-radix-popper-content-wrapper] .bg-white\\/10 {
          background-color: #ffffff !important;
        }

        /* Force black-on-white dropdowns everywhere (Radix poppers, Command, Select) */
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
        /* Ensure popovers sit above sticky headers in Topics */
        [data-radix-popper-content-wrapper] {
          z-index: 100 !important;
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
        <LayoutContent {...props} />
      </WorkspaceProvider>
    </FeatureFlagProvider>);

}

