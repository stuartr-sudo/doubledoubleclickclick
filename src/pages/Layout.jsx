

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, FileText, Edit3, Database, Calendar as CalendarIcon, User as UserIcon, ListChecks, Settings, ShoppingBag,
  Share2, Mail, Package, Palette, BookOpen, Video, Clapperboard, Film, Link as LinkIcon, ShoppingCart, Home as HomeIcon,
  LogOut, ChevronUp, ChevronDown, Layers3, Menu, X, Shield, Sparkles, Loader2, Coins, Quote
} from "lucide-react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";
import TokenTopUpBanner from "@/components/common/TokenTopUpBanner";

const navStructure = [
  // Core link
  { name: "Dashboard", href: "Dashboard", icon: LayoutDashboard },

  // Content Category
  {
    name: "Content",
    icon: FileText,
    items: [
      { name: "Content Feed", href: "Content", icon: FileText },
      { name: "Editor", href: "Editor", icon: Edit3 },
      { name: "Pages", href: "Pages", icon: FileText, superadminOnly: true },
      { name: "Pages Setup", href: "PagesSetup", icon: Settings, superadminOnly: true },
      { name: "Topics", href: "Topics", icon: Database },
      { name: "Schedule", href: "SchedulingDashboard", icon: CalendarIcon },
    ]
  },

  // Assets Category
  {
    name: "Assets",
    icon: Layers3,
    items: [
      { name: "Brand Guidelines", href: "BrandGuidelinesManager", icon: Settings },
      // Removed: CTAs (original: { name: "CTAs", href: "CtaManager", icon: Share2 })
      // Removed: Email Forms (original: { name: "Email Forms", href: "EmailFormManager", icon: Mail })
      { name: "Products", href: "ProductManager", icon: ShoppingBag },
      { name: "Testimonials", href: "TestimonialLibrary", icon: Quote },
      // Removed: Product Styles (original: { name: "Product Styles", href: "ProductStyleTemplateManager", icon: Palette })
      { name: "Services", href: "ServiceCatalog", icon: Package, superadminOnly: true },
      { name: "Templates", href: "CustomTemplateManager", icon: FileText } // NEW: Custom Template Manager
    ]
  },

  // Media Category
  {
    name: "Media & AI",
    icon: Sparkles,
    items: [
      { name: "YouTube AI", href: "YoutubeAIGenerator", icon: Video },
      { name: "TikTok AI", href: "TiktokAIGenerator", icon: Video },
    ]
  },

  // E-commerce & SEO Category
  {
    name: "Growth",
    icon: ShoppingCart,
    items: [
      { name: "Landing Page", href: "LandingPageManager", icon: HomeIcon, adminOnly: true },
      { name: "Sales Pages", href: "SalesPageManager", icon: BookOpen, adminOnly: true },
      { name: "Sitemaps", href: "SitemapManager", icon: LinkIcon },
      { 'name': 'Amazon Import', 'href': 'AmazonImport', 'icon': ShoppingCart },
      { name: "Amazon Testimonials", href: "AmazonTestimonials", icon: ShoppingBag },
      { name: "Pricing", href: "Pricing", icon: Coins }
    ]
  },

  // Admin Category (now superadmin-only)
  {
    name: "Admin",
    icon: Shield,
    superadminOnly: true, // EDITED: was adminOnly
    items: [
      { name: "Users", href: "UserManagement", icon: UserIcon, superadminOnly: true },
      { name: "Waitlist", href: "WaitlistManager", icon: ListChecks, superadminOnly: true },
      { name: "Onboarding Builder", href: "OnboardingWizardBuilder", icon: ListChecks, superadminOnly: true },
      { name: "Feature Flags", href: "FeatureManagement", icon: Settings, superadminOnly: true },
      { name: "Editor Workflows", href: "EditorWorkflowManager", icon: Settings, superadminOnly: true },
      { name: "App Products", href: "AppProductManager", icon: ShoppingBag, superadminOnly: true },
      { name: "API Docs", href: "MidjourneyApiDocs", icon: BookOpen, superadminOnly: true },
      { name: "LLM Settings", href: "AdminLLM", icon: Sparkles, superadminOnly: true },
      { name: "SEO Setup", href: "AdminSEO", icon: Settings, superadminOnly: true },
      { name: "Endpoints", href: "FaqEndpointAdmin", icon: Settings, superadminOnly: true } // renamed label
    ]
  }
];


const NavLink = ({ href, active, children, isMobile = false }) => (
  <Link
    to={href}
    className={`
      ${isMobile ? 'block px-3 py-2 rounded-md text-base font-medium' : 'px-3 py-2 rounded-md text-sm font-medium'}
      flex items-center transition-colors duration-200
      ${active ?
        'bg-cyan-50 text-cyan-700' :
        'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
      }
    `}
  >
    {children}
  </Link>
);


const NavCategoryDropdown = ({ category, currentPageName, user, isSuperadmin }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Filter items by role/superadmin
  const visibleItems = (category.items || []).filter((item) => {
    if (item?.superadminOnly) return !!isSuperadmin;
    if (item?.adminOnly) return !!(user && user.role === 'admin');
    return true;
  });
  const isActive = visibleItems.some(item => currentPageName === item.href);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200 gap-2 ${
            isActive ? 'bg-cyan-50 text-cyan-700' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <category.icon className="w-4 h-4" />
          {category.name}
          {isOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border border-slate-200 text-slate-900 w-56">
        {visibleItems.map(item => (
          <DropdownMenuItem key={item.name} asChild>
            <Link to={createPageUrl(item.href)} className="flex items-center gap-2">
              <item.icon className="w-4 h-4 text-slate-500" />
              <span>{item.name}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(undefined); // undefined: not checked, null: logged out
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  // Fetch user only once when the layout mounts for the first time.
  // User session persists across page navigations.
  useEffect(() => {
    const fetchUser = async () => {
      setIsUserLoading(true);
      try {
        const fetchedUser = await User.me();
        setUser(fetchedUser);
        setIsSuperadmin(!!fetchedUser?.is_superadmin);
      } catch {
        setUser(null);
        setIsSuperadmin(false);
      } finally {
        setIsUserLoading(false);
      }
    };
    fetchUser();
  }, []); // Empty dependency array ensures this runs only once

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

  // EDITED: Respect superadminOnly at top-level nav
  const visibleNav = navStructure.filter(item => {
    if (item.superadminOnly) return !!isSuperadmin;
    if (item.adminOnly) return !!(user && user.role === 'admin');
    return true;
  });

  if (currentPageName === 'Home') return <>{children}</>;

  // This replaces the old full-screen loader. The layout is now always rendered.
  // Content inside <main> will be conditionally rendered based on loading state.

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-white backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <AnimatePresence>
          {isUserLoading && (
            <motion.div
              className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to={createPageUrl('Home')} className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg">
                  <Layers3 className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">SEWO</h1>
                  <p className="text-xs text-slate-500">Get Found Everywhere.</p>
                </div>
              </Link>
            </div>

            {/* Nav (now scrollable horizontally) */}
            <div className="hidden lg:block flex-1 min-w-0 px-2">
              <nav className="flex items-center space-x-1 overflow-x-auto flex-nowrap hide-scrollbar">
                {visibleNav.map(item => (
                  item.href ? (
                    <NavLink key={item.name} href={createPageUrl(item.href)} active={currentPageName === item.href}>
                      <item.icon className="w-4 h-4 mr-2 text-slate-600" />
                      {item.name}
                    </NavLink>
                  ) : (
                    <NavCategoryDropdown
                      key={item.name}
                      category={item}
                      currentPageName={currentPageName}
                      user={user}
                      isSuperadmin={isSuperadmin}
                    />
                  )
                ))}
              </nav>
            </div>

            {/* User menu and Mobile menu button */}
            <div className="flex items-center gap-4">
              {/* NEW: Token balance pill (feature-flag controlled) */}
              {user && showTokenBalance && (
                <div
                  className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-800"
                  title="AI tokens available"
                >
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>{Number(user.token_balance ?? 0)}</span>
                </div>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 text-sm">
                      <span>{user.full_name || user.email}</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border border-slate-200 text-slate-900 w-56">
                    {/* NEW: Token balance inside menu for small screens */}
                    {showTokenBalance && (
                      <DropdownMenuItem disabled className="flex items-center gap-2 opacity-100">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span className="text-slate-700">
                          Tokens: {Number(user?.token_balance ?? 0)}
                        </span>
                      </DropdownMenuItem>
                    )}
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
                </DropdownMenu>
              ) : (
                <NavLink href="#" onClick={() => User.loginWithRedirect(createPageUrl(currentPageName || 'Dashboard'))}>
                  Log In
                </NavLink>
              )}

              <div className="lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-900"
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? <X className="block h-6 w-6" aria-hidden="true" /> : <Menu className="block h-6 w-6" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-slate-200">
            {visibleNav.map(item => (
              item.href ? (
                <NavLink key={item.name} href={createPageUrl(item.href)} active={currentPageName === item.href} isMobile>
                  <item.icon className="w-4 h-4 mr-2 text-slate-600" />
                  {item.name}
                </NavLink>
              ) : (
                <div key={item.name} className="pt-2">
                  <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{item.name}</h3>
                  {(item.items || [])
                    .filter((sub) => {
                      if (sub?.superadminOnly) return !!isSuperadmin;
                      if (sub?.adminOnly) return !!(user && user.role === 'admin');
                      return true;
                    })
                    .map(subItem => (
                      <NavLink key={subItem.name} href={createPageUrl(subItem.href)} active={currentPageName === subItem.href} isMobile>
                        <subItem.icon className="w-4 h-4 mr-2 text-slate-600" />
                        <span>{subItem.name}</span>
                      </NavLink>
                    ))
                  }
                </div>
              )
            ))}
          </div>
        )}
      </header>

      {/* Token top-up banner (auto-hides if user has tokens) */}
      <TokenTopUpBanner />

      <main className="relative z-10 flex-1">
        <AnimatePresence mode="wait">
          {!user && !isUserLoading ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center p-8"
            >
              <h2 className="text-xl font-semibold text-slate-800">Please Log In</h2>
              <p className="text-slate-600 mt-2 mb-4">You need to be authenticated to access this page.</p>
              <Button onClick={() => User.loginWithRedirect(window.location.href)}>
                Log In
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={currentPageName === 'Topics' ? 'topics-tables-scope' : undefined}
            >
              {children}
            </motion.div>
          )}
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
          background-color: #ffffff !important;        /* white surface */
          color: #0f172a !important;                   /* slate-900 text */
          border-color: #e2e8f0 !important;            /* slate-200 border */
        }

        /* Override shadcn accent colors inside poppers so data-[highlighted] is light bg + dark text */
        [data-radix-popper-content-wrapper] {
          --accent: 210 40% 96% !important;            /* slate-100 */
          --accent-foreground: 222 47% 11% !important; /* slate-900 */
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
          background-color: #f1f5f9 !important;        /* slate-100 */
          color: #0f172a !important;                   /* slate-900 */
        }

        /* Explicit hover fix: ensure the very first item (auto-hovered) stays readable */
        [data-radix-popper-content-wrapper] [role="option"]:hover,
        [data-radix-popper-content-wrapper] [role="menuitem"]:hover,
        [data-radix-popper-content-wrapper] [cmdk-item]:hover,
        [data-radix-popper-content-wrapper] [role="option"][data-state="checked"],
        [data-radix-popper-content-wrapper] [role="menuitem"][data-state="checked"] {
          background-color: #f1f5f9 !important;  /* slate-100 */
          color: #0f172a !important;              /* slate-900 */
        }
        /* Make all descendants readable while hovered/highlighted/checked */
        [data-radix-popper-content-wrapper] [role="option"]:hover *,
        [data-radix-popper-content-wrapper] [role="menuitem"]:hover *,
        [data-radix-popper-content-wrapper] [cmdk-item]:hover *,
        [data-radix-popper-content-wrapper] [role="option"][data-state="checked"] *,
        [data-radix-popper-content-wrapper] [role="menuitem"][data-state="checked"] *,
        [data-radix-popper-content-wrapper] [data-highlighted] * {
          color: #0f172a !important;              /* slate-900 */
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
          background-color: #f1f5f9 !important; /* slate-100 */
          color: #0f172a !important;            /* slate-900 */
        }
        [data-radix-popper-content-wrapper] [cmdk-item] *,
        [data-radix-popper-content-wrapper] [role="option"] * {
          color: inherit !important;
        }
        /* Ensure popovers sit above sticky headers in Topics */
        [data-radix-popper-content-wrapper] {
          z-index: 100 !important;
        }

        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none;    /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;            /* Chrome, Safari, Opera */
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

        /* === Editor media: prevent text wrapping around embedded videos === */
        /* Ensure YouTube and TikTok embeds remain block elements and never allow text to wrap beside them,
           even when resized or realigned. */
        .ql-editor .youtube-video-container,
        .ql-editor .tiktok-embed,
        .youtube-video-container,
        .tiktok-embed {
          display: block !important;
          float: none !important;      /* neutralize float-based alignments that cause wrapping */
          clear: both !important;      /* force following text to start below */
          max-width: 100%;
          margin-left: auto;
          margin-right: auto;
        }

        /* Respect alignment choices without introducing wrapping: use margins instead of float */
        .ql-editor .ql-align-left.youtube-video-container,
        .ql-editor .youtube-video-container.ql-align-left,
        .ql-editor .ql-align-left .youtube-video-container,
        .ql-editor .ql-align-left .tiktok-embed {
          margin-left: 0;
          margin-right: auto;
        }
        .ql-editor .ql-align-right.youtube-video-container,
        .ql-editor .youtube-video-container.ql-align-right,
        .ql-editor .ql-align-right .youtube-video-container,
        .ql-editor .ql-align-right .tiktok-embed {
          margin-left: auto;
          margin-right: 0;
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
        .ql-editor .tiktok-embed + * {
          clear: both;
        }
      `}</style>
    </div>
  );
}

