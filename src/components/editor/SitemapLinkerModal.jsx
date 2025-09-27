import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Link, Globe } from "lucide-react";
import { Sitemap } from "@/api/entities";
import { Username } from "@/api/entities";
import { User } from "@/api/entities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';
import { useWorkspace } from "@/components/hooks/useWorkspace";
import useFeatureFlag from "@/components/hooks/useFeatureFlag";

export default function SitemapLinkerModal({ isOpen, onClose, onLinkInsert, usernameFilter }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sitemaps, setSitemaps] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const [localSelectedUsername, setLocalSelectedUsername] = useState(usernameFilter || "all");
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const { consumeTokensForFeature } = useTokenConsumption();
  const { selectedUsername: globalUsername } = useWorkspace();
  const { enabled: useWorkspaceScoping } = useFeatureFlag('use_workspace_scoping');

  // Determine active username filter
  const selectedUsername = useWorkspaceScoping ? (globalUsername || "all") : (usernameFilter || localSelectedUsername);
  
  // Decide whether to show the dropdown
  const showUsernameDropdown = !useWorkspaceScoping && !usernameFilter;

  const loadSitemapsAndUsernames = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      let usernameData = [];
      if (user.role === 'admin') {
        usernameData = await Username.list("user_name", 500).catch(() => []);
      } else {
        const assignedNames = user.assigned_usernames || [];
        if (assignedNames.length > 0) {
            const allUsernames = await Username.list("user_name", 500).catch(() => []);
            usernameData = allUsernames.filter(u => assignedNames.includes(u.user_name));
        }
      }

      const sitemapData = await Sitemap.list("-updated_date", 200).catch(() => []);
      
      setSitemaps(sitemapData || []);
      const activeUsernames = (usernameData || []).filter(u => u.is_active !== false);
      setUsernames(activeUsernames);
    } catch (error) {
      console.error("Error loading sitemaps or usernames:", error);
      toast.error("Failed to load link data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // If a filter is passed, make sure the local state is in sync
      if (usernameFilter) {
        setLocalSelectedUsername(usernameFilter);
      }
      loadSitemapsAndUsernames();
    }
  }, [isOpen, loadSitemapsAndUsernames, usernameFilter]);

  const filteredPages = useMemo(() => {
    const s = searchTerm.toLowerCase();
    const allPages = sitemaps.flatMap((sitemap) =>
      sitemap.pages?.map((page) => ({ ...page, sitemapDomain: sitemap.domain, sitemapUsername: sitemap.user_name })) || []
    );

    return allPages.filter(
      (page) =>
        (!searchTerm ||
          page.title?.toLowerCase().includes(s) ||
          page.url?.toLowerCase().includes(s) ||
          page.sitemapDomain?.toLowerCase().includes(s)) &&
        (selectedUsername === "all" || page.sitemapUsername === selectedUsername)
    );
  }, [sitemaps, searchTerm, selectedUsername]);

  const handleLinkInsertClick = async (page) => {
    const result = await consumeTokensForFeature('ai_sitemap_link');
    if (!result.success) {
      return;
    }

    onLinkInsert(page.url);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white text-slate-900 border border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Link className="w-5 h-5 text-blue-600" />
            Add Internal Link
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Search for a page from your sitemaps to insert a link.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search pages by title, URL, or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white text-slate-900 border border-slate-300 placeholder:text-slate-500"
            />
          </div>
          {showUsernameDropdown && (
            <Select value={localSelectedUsername} onValueChange={setLocalSelectedUsername}>
              <SelectTrigger className="w-[180px] bg-white text-slate-900 border border-slate-300">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="all">All Brands</SelectItem>
                {usernames.map((u) => (
                  <SelectItem key={u.id} value={u.user_name}>
                    {u.display_name || u.user_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="h-96 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50/50">
          {isLoading ? (
            <div className="flex justify-center items-center h-full text-slate-500">
              Loading sitemaps...
            </div>
          ) : filteredPages.length > 0 ? (
            <ul className="divide-y divide-slate-200">
              {filteredPages.map((page, index) => (
                <li
                  key={`${page.url}-${index}`}
                  className="p-3 hover:bg-slate-100 flex justify-between items-center gap-4"
                >
                  <div className="flex-grow overflow-hidden">
                    <p className="font-medium truncate text-slate-800">{page.title}</p>
                    <p className="text-sm text-slate-500 truncate">{page.url}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleLinkInsertClick(page)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                  >
                    Insert Link
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-center text-slate-500 p-4">
              <Globe className="w-12 h-12 mb-4 text-slate-300" />
              <p className="font-medium text-slate-700">No pages found.</p>
              <p className="text-sm">Try changing brand or search.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 bg-white border-slate-300"
                onClick={() => navigate(createPageUrl('SitemapManager'))}
              >
                Go to Sitemap Manager
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}