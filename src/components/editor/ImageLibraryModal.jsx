
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ImageLibraryItem } from "@/api/entities";
import { Username } from "@/api/entities";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Plus, Image, Copy, Edit, Check, Trash2, Info, Loader2, Library, PlusCircle, CheckSquare, X, User } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

function UsernameSelect({ selectedUsername, onUsernameChange, allUsernames, className, collapsed = false }) {
  return (
    <Select value={selectedUsername} onValueChange={onUsernameChange}>
      {/* Trigger */}
      <SelectTrigger
        className={[
          collapsed
            ? "w-10 px-0 justify-center"
            : "w-full px-3",
          "h-10 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm",
          "focus:ring-2 focus:ring-blue-300 focus:outline-none [&>svg]:text-slate-600 [&>svg]:opacity-80",
          className || ""
        ].join(" ")}
        aria-label="Filter by username"
        title={collapsed ? "Filter by username" : undefined}
      >
        {collapsed ? (
          <div className="flex items-center justify-center w-full">
            <User className="w-4 h-4 text-slate-600" />
            {/* No text when collapsed */}
          </div>
        ) : (
          <SelectValue placeholder="All Usernames" />
        )}
      </SelectTrigger>

      {/* Dropdown content */}
      <SelectContent className="z-[1000] bg-white text-slate-900 border border-slate-200 shadow-2xl rounded-md">
        {allUsernames.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="hover:bg-blue-50 focus:bg-blue-50 text-slate-900 cursor-pointer"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function ImageLibraryModal({
  isOpen,
  onClose,
  onInsert,
}) {
  // Force single view: library only
  const [currentView, setCurrentView] = React.useState("library");
  const [loading, setLoading] = useState(false);
  const [allImages, setAllImages] = useState([]);
  const [allUsernames, setAllUsernames] = useState([{ value: "all", label: "All Usernames" }]);

  // Filtering and Selection State
  const [query, setQuery] = useState("");
  const [usernameFilter, setUsernameFilter] = useState("all");
  const [selectedImage, setSelectedImage] = useState(null);
  // multiSelectMode and selectedIds are removed as per requirements

  // Details Panel State
  const [editAltText, setEditAltText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Dialog State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  // NEW: hard-disable any multi-select control in the UI
  const modalRootRef = React.useRef(null);
  React.useEffect(() => {
    const root = modalRootRef.current;
    if (!root) return;
    // Hide any button that contains "Select Multiple" (defensive: unknown structure)
    const btns = root.querySelectorAll('button, [role="button"]');
    btns.forEach((el) => {
      const t = (el.textContent || '').trim().toLowerCase();
      if (t.includes('select multiple')) {
        el.style.display = 'none';
      }
    });
  }, [isOpen]);

  // Expanding search state and ref
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = React.useRef(null);

  // Focus when search expands
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [searchOpen]);

  // Data Loading Effect
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [images, usernames] = await Promise.all([
      ImageLibraryItem.list("-created_date", 500),
      Username.list()]
      );
      setAllImages(Array.isArray(images) ? images : []);
      const options = [{ value: "all", label: "All Usernames" }, ...(usernames || []).map((r) => ({ value: r.user_name, label: r.user_name }))];
      setAllUsernames(options);
    } catch (error) {
      toast.error("Could not load image library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) { // Simplified condition as currentView is always 'library'
      loadData();
    }
    if (!isOpen) {
      // Reset state on close
      setSelectedImage(null);
      // Removed setMultiSelectMode(false) and setSelectedIds(new Set())
      setQuery("");
      setSearchOpen(false); // Reset search state on close
    }
  }, [isOpen, loadData]); // Removed currentView from dependencies

  // Memoized Filtering Logic
  const filtered = useMemo(() => {
    let list = allImages;
    if (usernameFilter !== "all") {
      list = list.filter((i) => i.user_name === usernameFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((i) => (i.alt_text || "").toLowerCase().includes(q));
    }
    return list;
  }, [allImages, query, usernameFilter]);

  // Handlers
  const handleSelectImage = (img) => {
    // Simplified to always single-select behavior
    setSelectedImage(img);
    setEditAltText(img.alt_text || "");
  };

  const handleUpdateAltText = async () => {
    if (!selectedImage) return;
    setIsUpdating(true);
    try {
      await ImageLibraryItem.update(selectedImage.id, { alt_text: editAltText });
      setAllImages((imgs) => imgs.map((i) => i.id === selectedImage.id ? { ...i, alt_text: editAltText } : i));
      setSelectedImage((prev) => prev ? { ...prev, alt_text: editAltText } : null);
      toast.success("Alt text updated.");
    } catch (e) {
      toast.error("Failed to update alt text.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInsert = (imgToInsert) => {
    const altText = imgToInsert && selectedImage && imgToInsert.id === selectedImage.id ? editAltText : imgToInsert?.alt_text || "";
    // Added specific inline styles to prevent text wrap on image alignment when inserted
    const html = `<img src="${imgToInsert.url}" alt="${altText}" style="max-width:100%;height:auto;border-radius:8px;margin:1rem 0;display: block;clear: both;" />`;
    onInsert(html);
    // Always close after inserting a single image
    onClose();
  };

  // handleInsertMultiple function removed as multi-select is disabled

  const handleDeleteClick = (img) => {
    setImageToDelete(img);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    try {
      await ImageLibraryItem.delete(imageToDelete.id);
      setAllImages((imgs) => imgs.filter((i) => i.id !== imageToDelete.id));
      if (selectedImage?.id === imageToDelete.id) setSelectedImage(null);
      toast.success("Image deleted.");
    } catch (e) {
      toast.error("Failed to delete image.");
    } finally {
      setShowDeleteConfirm(false);
      setImageToDelete(null);
    }
  };

  return (
    <Dialog open={!!isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={modalRootRef}
        className="max-w-[1200px] w-[96vw] h-[86vh] overflow-hidden p-0 rounded-2xl border border-slate-800 bg-[#0b1630] text-slate-100 shadow-2xl">

        <div className="grid grid-cols-12 h-full">
          {/* LEFT PANE: Library only (dark) */}
          <div className="col-span-7 lg:col-span-7 xl:col-span-7 min-w-0 min-h-0 flex flex-col">
            {/* Header - remove tabs, show simple label */}
            <div className="bg-slate-50 pt-5 px-5">
              <div className="inline-flex items-center rounded-full bg-white text-slate-900 px-4 py-2 border border-white/10 text-sm font-medium shadow-sm">
                Library
              </div>
            </div>

            {/* Sticky filter bar */}
            <div className="bg-slate-50 p-5 pt-3 sticky top-0 z-10 border-b border-white/10">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  {/* Expanding Search */}
                  <div className={["transition-all duration-300", "flex-1"].join(" ")}>
                    <div
                      className={[
                        "flex items-center rounded-full border transition-all duration-300 overflow-hidden",
                        searchOpen
                          ? "bg-white text-slate-900 border-slate-300 pl-3 pr-2 w-full"
                          : "bg-white/90 text-slate-900 border-slate-300 pl-2 pr-2 w-10"
                      ].join(" ")}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setSearchOpen(false);
                        }
                      }}
                    >
                      <button
                        type="button"
                        aria-label="Search images"
                        className="h-8 w-8 flex items-center justify-center text-slate-600 hover:text-slate-800"
                        onClick={() => setSearchOpen(true)}
                        tabIndex={0}
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search images..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={[
                          "bg-transparent outline-none text-sm",
                          "transition-all duration-300",
                          searchOpen ? "w-full ml-2 opacity-100" : "w-0 ml-0 opacity-0 pointer-events-none"
                        ].join(" ")}
                      />
                      {searchOpen && (
                        <button
                          type="button"
                          aria-label="Clear search"
                          className="h-8 w-8 ml-1 flex items-center justify-center text-slate-500 hover:text-slate-700"
                          onClick={() => {
                            setQuery("");
                            setSearchOpen(false);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Username filter shrinks to icon when search is open */}
                  <UsernameSelect
                    selectedUsername={usernameFilter}
                    onUsernameChange={setUsernameFilter}
                    allUsernames={allUsernames}
                    collapsed={searchOpen}
                    className={searchOpen ? "w-10 flex-none" : "min-w-[180px]"}
                  />
                </div>
              </div>

            {/* Library grid */}
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="bg-slate-50 pr-4 p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {loading ?
                  Array.from({ length: 12 }).map((_, i) =>
                  <div key={i} className="aspect-[4/3] rounded-xl bg-slate-200 animate-pulse" />
                  ) :
                  filtered.length > 0 ?
                  filtered.map((img) => {
                    const isSelected = selectedImage?.id === img.id;
                    return (
                      <div
                        key={img.id}
                        onClick={() => handleSelectImage(img)}
                        className={[
                        "group relative rounded-xl overflow-hidden cursor-pointer aspect-[4/3] transition-all",
                        "ring-1 ring-slate-200 hover:ring-blue-300/50 hover:shadow-xl",
                        isSelected ? "outline outline-2 outline-blue-300 shadow-lg" : ""].
                        join(" ")}>

                            <img
                          src={img.url}
                          alt={img.alt_text || "Image"}
                          loading="lazy"
                          className="block w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />

                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/10 to-transparent">
                              <div className="text-white/90 text-xs font-medium line-clamp-2">
                                {img.alt_text || "No alt text"}
                              </div>
                            </div>
                            <Button
                          size="sm"
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-900 hover:bg-white shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInsert(img);
                          }}>

                              <Plus className="w-4 h-4 mr-1" /> Insert
                            </Button>
                          </div>);

                  }) :

                  <div className="col-span-full text-center text-slate-500 py-12">
                        No images found for this filter.
                      </div>
                  }
                  </div>
                </ScrollArea>
              </div>

          </div>

          {/* RIGHT PANE: Details (light) */}
          <div className="col-span-5 lg:col-span-5 xl:col-span-5 bg-white text-slate-900 border-l border-slate-200 flex flex-col">
            {selectedImage ?
            <>
                <div className="p-5 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">Image Details</h3>
                  <p className="text-sm text-slate-500">Preview, edit alt text, or insert into your post.</p>
                </div>

                <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <img src={selectedImage.url} alt="Selected" className="w-full object-contain" />
                  </div>
                  <div>
                    <Label htmlFor="alt-text" className="text-slate-700">Alt Text (for SEO)</Label>
                    <Textarea
                    id="alt-text"
                    value={editAltText}
                    onChange={(e) => setEditAltText(e.target.value)}
                    className="bg-white border-slate-300 min-h-[90px]"
                    placeholder="Describe the image briefly for accessibility and SEO" />

                  </div>
                </div>

                <div className="p-5 border-t border-slate-200 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                    onClick={handleUpdateAltText}
                    disabled={isUpdating}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">

                      {isUpdating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving</> : "Save Alt Text"}
                    </Button>
                    <Button
                    onClick={() => handleInsert(selectedImage)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700">

                      <PlusCircle className="w-4 h-4 mr-2" /> Insert into Post
                    </Button>
                  </div>
                  <Button
                  variant="outline"
                  size="sm"
                  className="justify-center border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => handleDeleteClick(selectedImage)}>

                    <Trash2 className="w-4 h-4 mr-2 text-red-500" /> Delete from Library
                  </Button>
                </div>
              </> :

            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Image className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="font-semibold text-slate-800">Select an image</h4>
                <p className="text-sm text-slate-500">Choose an image from the library to see details, edit, or insert it.</p>
              </div>
            }
          </div>
        </div>

        {/* Delete confirm dialog (unchanged) */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this image?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the image from your library. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>);

}
