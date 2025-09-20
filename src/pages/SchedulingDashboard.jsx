import React, { useEffect, useMemo, useState } from "react";
import { BlogPost } from "@/api/entities";
import { User } from "@/api/entities";
import { Username } from "@/api/entities";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar as CalendarIcon, SlidersHorizontal } from "lucide-react";

import UsernameFilter from "@/components/scheduling/UsernameFilter";
import FullCalendarView from "@/components/scheduling/FullCalendarView";
import SchedulingSidebar from "@/components/scheduling/SchedulingSidebar";

export default function SchedulingDashboard() {
  const [posts, setPosts] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarDate, setSidebarDate] = useState(new Date());
  
  // Scheduling form state
  const [time, setTime] = useState("09:00");
  const [timezone, setTimezone] = useState(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
  });
  
  // User and username filtering state
  const [currentUser, setCurrentUser] = useState(null);
  const [allowedUsernames, setAllowedUsernames] = useState([]);
  const [selectedUsernames, setSelectedUsernames] = useState([]);
  const [postUserMap, setPostUserMap] = useState({});

  const tzList = useMemo(() => {
    try { return Intl.supportedValuesOf?.("timeZone") || ["UTC"]; } catch { return ["UTC"]; }
  }, []);

  const loadData = async () => {
    const [me, allUsernamesList, allBlogPosts] = await Promise.all([
      User.me().catch(() => null),
      Username.list("-created_date").catch(() => []),
      BlogPost.list("-updated_date").catch(() => [])
    ]);

    if(me) setCurrentUser(me);

    const isSuper = me?.role === "admin" || me?.access_level === "full";
    let names = [];
    if (isSuper) {
      names = (allUsernamesList || []).filter(u => u.is_active !== false).map(u => u.user_name);
    } else {
      names = Array.isArray(me?.assigned_usernames) ? me.assigned_usernames : [];
    }
    names = Array.from(new Set(names)).sort();
    setAllowedUsernames(names);
    setSelectedUsernames([]); // Start with all selected

    setPosts(allBlogPosts);
    const map = {};
    (allBlogPosts || []).forEach(p => { if (p?.id) map[p.id] = p.user_name || ""; });
    setPostUserMap(map);
  };

  useEffect(() => {
    loadData();
  }, []);

  const allowedSet = useMemo(() => new Set(allowedUsernames), [allowedUsernames]);
  const selectedSet = useMemo(() => new Set(selectedUsernames), [selectedUsernames]);
  
  const filteredPosts = useMemo(() => {
    return (posts || []).filter(it => {
      const uname = postUserMap[it.id] || "";
      if (!allowedSet.has(uname)) return false;
      if (selectedSet.size === 0) return true;
      return selectedSet.has(uname);
    });
  }, [posts, postUserMap, allowedSet, selectedSet]);

  const scheduledPosts = useMemo(() => {
      return filteredPosts.filter(p => p.publish_status === 'scheduled' && p.scheduled_publish_date);
  }, [filteredPosts]);

  const drafts = useMemo(() => {
      return filteredPosts.filter(p => (p.publish_status || 'draft') === 'draft' || p.status === 'draft');
  }, [filteredPosts]);

  const handleDayClick = (day) => {
    setSidebarDate(day);
    setIsSidebarOpen(true);
  };
  
  const bulkSchedule = async (draftIdsToSchedule, dateForScheduling) => {
    if (!draftIdsToSchedule.length) {
      toast.info("Select some drafts first");
      return;
    }
    const [hh, mm] = time.split(":").map((n) => parseInt(n, 10));
    const local = new Date(dateForScheduling);
    local.setHours(hh, mm || 0, 0, 0);

    const utc = new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate(), hh, mm));

    await Promise.all(draftIdsToSchedule.map((id) =>
      BlogPost.update(id, {
        publish_status: "scheduled",
        scheduled_publish_date: utc.toISOString(),
        timezone,
      })
    ));
    toast.success(`Scheduled ${draftIdsToSchedule.length} draft(s) for ${format(local, "PPP p")} (${timezone})`);
    
    // Refresh data to show new scheduled posts
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
          <CalendarIcon className="w-5 h-5" /> Content Calendar
        </h1>
        <div className="w-full max-w-xs">
           <UsernameFilter
              allowedUsernames={allowedUsernames}
              value={selectedUsernames}
              onChange={setSelectedUsernames}
            />
        </div>
      </div>

      <div className="flex-1 relative">
        <FullCalendarView
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          scheduledPosts={scheduledPosts}
          onDayClick={handleDayClick}
          filteredUsernames={selectedUsernames}
        />
        
        <SchedulingSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedDate={sidebarDate}
          drafts={drafts}
          onBulkSchedule={bulkSchedule}
          time={time}
          setTime={setTime}
          timezone={timezone}
          setTimezone={setTimezone}
          tzList={tzList}
        />
      </div>
    </div>
  );
}