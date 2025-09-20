
import React, { useState, useEffect } from "react";
import { Sitemap } from "@/api/entities";
import { User } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link as LinkIcon, Search, Globe, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function SitemapLinkerModal({ isOpen, onClose, onLinkInsert }) {
  const [pages, setPages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterUsername, setFilterUsername] = useState("all");
  const [availableUsernames, setAvailableUsernames] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      let usernames = [];
      if (user.role === 'admin') {
        const allUsers = await User.list();
        const allUsernamesSet = new Set();
        allUsers.forEach(u => {
            if(Array.isArray(u.assigned_usernames)) {
                u.assigned_usernames.forEach(name => allUsernamesSet.add(name));
            }
        });
        usernames = Array.from(allUsernamesSet).sort();
      } else {
        usernames = user.assigned_usernames || [];
      }
      setAvailableUsernames(usernames);

      const allSitemaps = await Sitemap.list("-created_date");
      let sitemapsForUser = [];
      
      if (user.role === 'admin') {
        sitemapsForUser = allSitemaps;
      } else if (user.assigned_usernames) {
        sitemapsForUser = allSitemaps.filter(s => user.assigned_usernames.includes(s.user_name));
      }
      
      const allPages = sitemapsForUser.flatMap(sitemap => 
        sitemap.pages.map(page => ({ ...page, domain: sitemap.domain, user_name: sitemap.user_name }))
      );
      
      setPages(allPages);
      
    } catch (error) {
      console.error("Failed to load sitemap data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPages = pages.filter(page => {
    const usernameMatch = filterUsername === 'all' || page.user_name === filterUsername;
    const searchTermMatch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            page.url.toLowerCase().includes(searchTerm.toLowerCase());
    return usernameMatch && searchTermMatch;
  });

  const handleClose = () => {
    setSearchTerm("");
    setFilterUsername("all");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[min(92vw,920px)] max-w-none bg-white border border-slate-200 text-slate-900 rounded-lg shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Globe className="w-5 h-5 text-indigo-600" />
            Internal Link Finder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search pages by title or URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <div className="relative z-10">
              <Label htmlFor="username-filter-linker" className="sr-only">Filter by Username</Label>
              <Select value={filterUsername} onValueChange={setFilterUsername}>
                <SelectTrigger id="username-filter-linker" className="bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="all">All Usernames</SelectItem>
                  {availableUsernames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto pr-2 space-y-2 rounded-md border border-slate-200 p-2 bg-slate-50/50">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : filteredPages.length > 0 ? (
              filteredPages.map((page, index) => (
                <div
                  key={index}
                  className="group grid grid-cols-[1fr_auto] items-center gap-3 p-3 rounded-lg bg-white hover:bg-slate-50 transition-colors overflow-hidden border border-slate-200"
                >
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-800 truncate">
                      {page.title}
                    </h4>
                    <p className="text-sm text-slate-500 truncate">
                      {page.url}
                    </p>
                    <span className="text-xs inline-flex items-center gap-1 mt-1 text-indigo-600">
                      <Globe className="w-3 h-3" /> {page.domain}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Button
                      onClick={() => onLinkInsert(page.url)}
                      size="sm"
                      className="flex-shrink-0 bg-indigo-600 text-white hover:bg-indigo-700"
                      style={{ position: 'static' }}
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Link
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500">
                No pages found for this user or search term.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
