
import React from "react";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Quote,
  AlertCircle,
  Minus,
  Code,
  List,
  ListOrdered,
  Table,
  CheckCircle,
  AlertTriangle,
  Undo2,
  Redo2,
  Palette,
  Sparkles,
  Shield,
  Search,
  Link,
  ShoppingCart,
  Store,
  Bot,
  // NEW: Imports for Save/Publish functionality from outline
  Loader2,
  Send,
  ChevronDown,
  Download,
  FileText,
  Globe,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";

export default function EditorToolbar({
  onUndo,
  onRedo,
  onInsertContent,
  setShowAIDetection,
  setShowEmailCaptureSelector,
  // Existing props for additional features
  setShowAISuggestions,
  setShowSeoAssistant,
  setShowSitemapLinking,
  setShowAmazonImport,
  setShowProductPreview,
  // Existing: Optional workflow runner trigger from parent editor
  setShowWorkflowRunner,
  // NEW PROPS from the outline for Save/Publish functionality
  onSave,
  onPublish, // Not directly used in the outline's dropdown, but part of signature
  onDownloadTxt,
  onDownloadHtml, // Not used in the outline's dropdown, but part of signature
  onPublishToGoogleDocs,
  onPublishToShopify,
  // Other props from the outline's signature (included for completeness, even if not used in the provided snippets)
  onOpenImageLibrary,
  onOpenYouTubeSelector,
  onOpenTikTokSelector,
  onOpenPromotedProductSelector,
  onOpenAIRewriter,
  onOpenCleanup,
  onOpenCta,
  onOpenEmailForm,
  onOpenTldrGenerator,
  onOpenMediaLibrary,
  onOpenAudioModal,
  isSaving,
  isPublishing,
  status,
  priority,
  onPriorityChange,
  currentUsername,
  onOpenSEOSettings,
  onOpenScheduler,
  showPublishOptions = false,
  onOpenPublishModal,
  isFreeTrial = false,
}) {
  const insertBlock = (html) => onInsertContent(html);

  // State for 'Insert' dropdown
  const [openInsert, setOpenInsert] = React.useState(false);
  // State for 'AI & Tools' dropdown
  const [openTools, setOpenTools] = React.useState(false);

  // Listen for global close event dispatched by Editor
  React.useEffect(() => {
    const handler = () => {
      setOpenInsert(false);
      setOpenTools(false); // Close new dropdown too
    };
    window.addEventListener('b44-close-dropdowns', handler);
    return () => window.removeEventListener('b44-close-dropdowns', handler);
  }, []);

  const { enabled: aiAgentEnabled } = useFeatureFlag("ai_agent_workflow_button", { defaultEnabled: true });

  const blocks = {
    callout: `
<blockquote class="b44-callout">
  <h4>Important Note</h4>
  <p>Enter your callout text here. This is perfect for highlighting key information.</p>
</blockquote>`,
    quote: `
<blockquote class="b44-quote">
  <p>"Your inspiring quote goes here. Make it meaningful and impactful."</p>
  <div class="quote-cite">Author Name, Title</div>
</blockquote>`,
    divider: `<hr class="b44-divider" />`,
    code: `
<pre class="b44-code"><code>// Your code goes here
function exampleFunction() {
  console.log("Hello, World!");
}</code></pre>`,
    orderedList: `
<ol class="b44-list">
  <li>First ordered item</li>
  <li>Second ordered item</li>
</ol>`,
    unorderedList: `
<ul class="b44-list">
  <li>First bullet point</li>
  <li>Second bullet point</li>
</ul>`,
    successBox: `
<blockquote class="b44-alert b44-alert-success">
  <p>Your success message or positive note here.</p>
</blockquote>`,
    warningBox: `
<blockquote class="b44-alert b44-alert-warning">
  <p>Warning: Add important cautionary information here.</p>
</blockquote>`,
    table: `
<table class="b44-table">
  <thead>
    <tr><th>Header 1</th><th>Header 2</th></tr>
  </thead>
  <tbody>
    <tr><td>Row 1, Cell 1</td><td>Row 1, Cell 2</td></tr>
  </tbody>
</table>`,
  };

  return (
    // NEW: Outer wrapper div from the outline, replacing the original one.
    <div className="border-b border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      {/* Group for existing left-aligned toolbar items */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Undo / Redo */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onUndo} className="bg-white/10 border-white/20 text-white hover:bg-white/20" title="Undo (Ctrl/Cmd+Z)">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onRedo} className="bg-white/10 border-white/20 text-white hover:bg-white/20" title="Redo (Shift+Ctrl/Cmd+Z)">
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Condensed Insert menu */}
        <DropdownMenu open={openInsert} onOpenChange={setOpenInsert}>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              // CHANGED: light, high-contrast trigger
              className="bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 gap-2"
            >
              <PlusCircle className="w-4 h-4 text-slate-700" />
              Insert
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white border border-slate-200 text-slate-900 shadow-xl w-[320px]"> {/* UPDATED: light menu */}
            {/* Content Blocks only - now direct items */}
            <DropdownMenuItem onClick={() => insertBlock(blocks.quote)} className="gap-2">
              <Quote className="w-4 h-4" /> Quote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertBlock(blocks.callout)} className="gap-2">
              <AlertCircle className="w-4 h-4" /> Callout
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertBlock(blocks.divider)} className="gap-2">
              <Minus className="w-4 h-4" /> Divider
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertBlock(blocks.code)} className="gap-2">
              <Code className="w-4 h-4" /> Code Block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertBlock(blocks.orderedList)} className="gap-2">
              <ListOrdered className="w-4 h-4" /> Ordered List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertBlock(blocks.unorderedList)} className="gap-2">
              <List className="w-4 h-4" /> Unordered List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertBlock(blocks.table)} className="gap-2">
              <Table className="w-4 h-4" /> Table
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertBlock(blocks.successBox)} className="gap-2">
              <CheckCircle className="w-4 h-4" /> Success Box
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertBlock(blocks.warningBox)} className="gap-2">
              <AlertTriangle className="w-4 h-4" /> Warning Box
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* AI Detection moved here as per outline */}
            <DropdownMenuItem onClick={setShowAIDetection ? () => setShowAIDetection(true) : undefined} className="gap-2">
              <Shield className="w-4 h-4" /> AI Detection
            </DropdownMenuItem>

            {/* Email capture stays here, icon changed to Palette as per outline */}
            <DropdownMenuItem onClick={setShowEmailCaptureSelector ? () => setShowEmailCaptureSelector(true) : undefined} className="gap-2">
              <Palette className="w-4 h-4" /> Email Capture Form
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* New 'AI & Tools' menu for grouped AI, SEO, and other tools */}
        <DropdownMenu open={openTools} onOpenChange={setOpenTools}>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              // CHANGED: light, high-contrast trigger
              className="bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-700" />
              AI & Tools
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white border border-slate-200 text-slate-900 shadow-xl w-[320px]"> {/* UPDATED: light menu */}
            <DropdownMenuItem onClick={setShowAISuggestions ? () => setShowAISuggestions(true) : undefined} className="gap-2">
              <Sparkles className="w-4 h-4" /> AI Suggestions
            </DropdownMenuItem>
            <DropdownMenuItem onClick={setShowSeoAssistant ? () => setShowSeoAssistant(true) : undefined} className="gap-2">
              <Search className="w-4 h-4" /> SEO Assistant
            </DropdownMenuItem>
            <DropdownMenuItem onClick={setShowSitemapLinking ? () => setShowSitemapLinking(true) : undefined} className="gap-2">
              <Link className="w-4 h-4" /> Sitemap Linking
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={setShowAmazonImport ? () => setShowAmazonImport(true) : undefined} className="gap-2">
              <ShoppingCart className="w-4 h-4" /> Amazon Import
            </DropdownMenuItem>
            <DropdownMenuItem onClick={setShowProductPreview ? () => setShowProductPreview(true) : undefined} className="gap-2">
              <Store className="w-4 h-4" /> Product Preview
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* AI Agent button */}
        {aiAgentEnabled && setShowWorkflowRunner && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowWorkflowRunner(true)}
            className="bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 gap-2"
          >
            <Bot className="w-4 h-4 text-slate-700" />
            AI Agent
          </Button>
        )}
      </div>

      {/* NEW: Right-aligned Save Draft and Publish buttons from outline */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Save Draft button (inferred from outline placeholder) */}
        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
          disabled={isSaving}
          className="bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Draft"
          )}
        </Button>

        {/* Publish Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isPublishing} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publish
                  <ChevronDown className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onDownloadTxt}>
              <Download className="w-4 h-4 mr-2" />
              Download as TXT
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPublishToGoogleDocs}>
              <FileText className="w-4 h-4 mr-2" />
              Publish to Google Docs
            </DropdownMenuItem>

            {!isFreeTrial && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onPublishToShopify}>
                  <Globe className="w-4 h-4 mr-2" />
                  Publish to Shopify
                </DropdownMenuItem>
                {showPublishOptions && (
                  <DropdownMenuItem onClick={onOpenPublishModal}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Publishing
                  </DropdownMenuItem>
                )}
              </>
            )}

            {isFreeTrial && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-slate-500">
                  <span className="font-medium">Upgrade to unlock:</span>
                  <br />• Shopify publishing
                  <br />• WordPress, Notion, Webflow
                  <br />• Custom webhooks
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
