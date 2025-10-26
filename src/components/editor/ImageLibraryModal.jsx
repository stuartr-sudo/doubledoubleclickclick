
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ImageLibraryItem } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities"; // Added import
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Loader2, X, Trash2, Copy, Check, Edit, CheckSquare, Sparkles, Download, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { saveImageFromString } from "@/api/functions";
import { useBalanceConsumption } from '@/components/hooks/useBalanceConsumption';
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";

export default function ImageLibraryModal({ isOpen, onClose, onInsert, usernameFilter: preselectedUsername }) {
  const [loading, setLoading] = useState(true);
  const [allImages, setAllImages] = useState([]);
  const [allUsernames, setAllUsernames] = useState([]); // This will now store Username objects
  const [query, setQuery] = useState("");
  const [localUsernameFilter, setLocalUsernameFilter] = useState("all"); // Renamed for local control
  const [selectedImage, setSelectedImage] = useState(null);
  const [editAltText, setEditAltText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showImportFromUrl, setShowImportFromUrl] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importAltText, setImportAltText] = useState("");
  const [importUsername, setImportUsername] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { consumeBalanceForFeature } = useBalanceConsumption();

  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Determine active username filter based on workspace scoping
  const usernameFilter = useWorkspaceScoping ? (globalUsername || "all") : localUsernameFilter;

  // --- DATA LOADING ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await User.me();

      let availableUsernames = [];
      if (user.role === 'admin') {
        availableUsernames = await Username.list();
      } else {
        const assignedNames = new Set(user.assigned_usernames || []);
        if (assignedNames.size > 0) {
          const all = await Username.list();
          availableUsernames = (all || []).filter((u) => assignedNames.has(u.user_name));
        }
      }
      setAllUsernames(availableUsernames);

      const allImagesResponse = await ImageLibraryItem.list("-created_date", 1000);
      let displayImages = [];
      if (user.role === 'admin') {
        displayImages = allImagesResponse;
      } else {
        const allowedUsernamesSet = new Set(availableUsernames.map((u) => u.user_name));
        displayImages = (allImagesResponse || []).filter((img) => img.user_name && allowedUsernamesSet.has(img.user_name));
      }
      setAllImages(Array.isArray(displayImages) ? displayImages : []);

      // Set default username for import
      if (availableUsernames && availableUsernames.length > 0) {
        setImportUsername(availableUsernames[0].user_name);
      }
    } catch (error) {
      toast.error("Failed to load image library.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (preselectedUsername) {
        setLocalUsernameFilter(preselectedUsername); // Use local filter for preselected
      }
    } else {
      setSelectedImage(null);
      setQuery("");
      setLocalUsernameFilter("all"); // Reset local filter
      setShowImportFromUrl(false);
      setImportUrl("");
      setImportAltText("");
    }
  }, [isOpen, loadData, preselectedUsername]);

  // --- FILTERING ---
  const filteredImages = useMemo(() => {
    let items = allImages;
    if (usernameFilter !== 'all') { // Use the dynamically determined usernameFilter
      items = items.filter((img) => img.user_name === usernameFilter);
    }
    if (query) {
      const lowerQuery = query.toLowerCase();
      items = items.filter((img) => (img.alt_text || '').toLowerCase().includes(lowerQuery));
    }
    return items;
  }, [allImages, query, usernameFilter]); // Dependency includes the derived usernameFilter

  // --- HANDLERS ---
  const handleSelectImage = (image) => {
    setSelectedImage(image);
    setEditAltText(image.alt_text || "");
  };

  const handleUpdateAltText = async () => {
    if (!selectedImage || editAltText === selectedImage.alt_text) return;
    setIsUpdating(true);
    try {
      await ImageLibraryItem.update(selectedImage.id, { alt_text: editAltText });
      toast.success("Alt text updated!");
      setSelectedImage((prev) => ({ ...prev, alt_text: editAltText }));
      setAllImages((prev) => prev.map((img) => img.id === selectedImage.id ? { ...img, alt_text: editAltText } : img));
    } catch (error) {
      toast.error("Failed to update alt text.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteImage = () => {
    if (!selectedImage) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedImage) return;
    setIsDeleting(true);
    try {
      await ImageLibraryItem.delete(selectedImage.id);
      toast.success("Image deleted.");
      setAllImages((prev) => prev.filter((img) => img.id !== selectedImage.id));
      setSelectedImage(null);
    } catch (error) {
      toast.error("Failed to delete image.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopyUrl = () => {
    if (!selectedImage) return;
    navigator.clipboard.writeText(selectedImage.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = async () => {
    if (!selectedImage) return;

    const result = await consumeBalanceForFeature('image_library_access');
    if (!result.success) {
      return; // Error toast is handled by the hook
    }
    
    // Pass the entire selected image object to the onInsert callback.
    onInsert(selectedImage);
    onClose();
  };

  const handleImportFromUrl = async () => {
    if (!importUrl.trim() || !importUsername.trim()) {
      toast.error("Please provide a URL and select a username.");
      return;
    }

    // Prevent multiple clicks by checking if already importing
    if (isImporting) return;

    const result = await consumeBalanceForFeature('image_library_access');
    if (!result.success) {
      return; // Stop if tokens are insufficient
    }

    setIsImporting(true);
    try {
      const { data } = await saveImageFromString({
        value: importUrl.trim(),
        user_name: importUsername,
        alt_text: importAltText.trim() || "Imported image",
        source: "upload"
      });

      if (data.success) {
        toast.success("Image imported successfully!");
        setImportUrl("");
        setImportAltText("");
        setShowImportFromUrl(false);
        await loadData(); // Refresh the image list
      } else {
        toast.error(data.error || "Failed to import image.");
      }
    } catch (error) {
      toast.error("Failed to import image.");
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  // --- RENDER ---
  return (
    <>
      <Dialog open={!!isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl w-[90vw] h-[85vh] p-0 flex flex-col bg-slate-50 text-slate-900 rounded-lg shadow-2xl" style={{ zIndex: 300 }}>
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Image Library</h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowImportFromUrl(!showImportFromUrl)}
                className="bg-blue-900 text-white px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Import from URL
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:bg-slate-200 hover:text-slate-800">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Import from URL Section */}
          {showImportFromUrl &&
          <div className="bg-slate-50 p-4 flex-shrink-0 border-b border-slate-200">
              <div className="space-y-3">
                <h3 className="font-medium text-slate-800">Import Image from URL</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                  placeholder="https://example.com/image.jpg"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="bg-white border-slate-300"
                  disabled={isImporting} />

                  <Input
                  placeholder="Alt text (optional)"
                  value={importAltText}
                  onChange={(e) => setImportAltText(e.target.value)}
                  className="bg-white border-slate-300"
                  disabled={isImporting} />

                  <Select value={importUsername} onValueChange={setImportUsername} disabled={isImporting}>
                    <SelectTrigger className="bg-white border-slate-300">
                      <SelectValue placeholder="Select username" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsernames.map((u) => // Modified: Removed filter and changed accessors
                    <SelectItem key={u.id} value={u.user_name}>
                          {u.display_name || u.user_name}
                        </SelectItem>
                    )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                  onClick={handleImportFromUrl}
                  disabled={isImporting || !importUrl.trim() || !importUsername.trim()}
                  className="bg-purple-900 text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-green-700">


                    {isImporting ?
                  <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </> :

                  <>
                        <Plus className="w-4 h-4 mr-2" />
                        Import Image
                      </>
                  }
                  </Button>
                  <Button
                  variant="outline"
                  onClick={() => setShowImportFromUrl(false)}
                  className="bg-white border-slate-300"
                  disabled={isImporting}>

                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          }

          {/* Main Content (Grid + Editor) */}
          <div className="flex-1 flex min-h-0">
            {/* Left: Scrollable Grid */}
            <div className="w-2/3 border-r border-slate-200 flex flex-col">
              {/* Toolbar - FIXED BACKGROUND COLOR */}
              <div className="flex-shrink-0 p-3 border-b border-slate-200 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search images by alt text..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />

                </div>
                {/* Conditionally render username filter based on feature flag */}
                {!useWorkspaceScoping && (
                  <Select value={localUsernameFilter} onValueChange={setLocalUsernameFilter} disabled={!!preselectedUsername}>
                    <SelectTrigger className="w-[180px] bg-white border-slate-300 text-slate-900">
                      <SelectValue placeholder="All Usernames" /> {/* Added placeholder */}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Usernames</SelectItem> {/* Manually added 'All' option */}
                      {allUsernames.map((u) => // Modified: Changed accessors
                      <SelectItem key={u.id} value={u.user_name}>
                          {u.display_name || u.user_name}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Scrollable Image Grid */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {loading ?
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                  </div> :

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredImages.map((image) =>
                  <button
                    key={image.id}
                    onClick={() => handleSelectImage(image)}
                    className={cn(
                      "aspect-w-16 aspect-h-10 rounded-lg overflow-hidden group relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                      selectedImage?.id === image.id && "ring-2 ring-offset-2 ring-blue-500"
                    )}>

                        <img src={image.url} alt={image.alt_text || ""} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-xs p-2 text-center truncate">{image.alt_text || "No alt text"}</p>
                        </div>
                        {selectedImage?.id === image.id &&
                    <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                            <CheckSquare className="h-8 w-8 text-white" />
                          </div>
                    }
                      </button>
                  )}
                  </div>
                }
              </div>
            </div>

            {/* Right: Editor Pane */}
            <div className="w-1/3 flex flex-col">
              {selectedImage ?
              <>
                  <div className="flex-1 p-6 flex flex-col gap-4 min-h-0">
                    <div className="aspect-w-16 aspect-h-10 rounded-md overflow-hidden ring-1 ring-slate-200">
                      <img src={selectedImage.url} alt="Selected" className="w-full h-full object-contain bg-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alt-text" className="font-semibold">Alt Text</Label>
                      <Textarea
                      id="alt-text"
                      value={editAltText}
                      onChange={(e) => setEditAltText(e.target.value)}
                      onBlur={handleUpdateAltText}
                      placeholder="Describe the image..."
                      className="h-28 bg-white border-slate-300" />

                    </div>
                  </div>
                  <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-slate-100/50 space-y-3">
                    <Button onClick={handleInsert} className="bg-blue-900 text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 w-full hover:bg-blue-700">
                      <Sparkles className="mr-2 h-4 w-4" /> Insert Image
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={handleCopyUrl} className="bg-white border-slate-300">
                        {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                        {copied ? 'Copied!' : 'Copy URL'}
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteImage} className="bg-purple-900 text-destructive-foreground px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 hover:bg-red-700">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                </> :

              <div className="flex items-center justify-center h-full text-slate-400">
                  <p>Select an image to edit</p>
                </div>
              }
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent style={{ zIndex: 350 }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the image from your library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
