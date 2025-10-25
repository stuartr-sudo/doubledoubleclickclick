import React from "react";
import { Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/components/hooks/useWorkspace";

export default function WorkspaceSelector() {
  const { selectedUsername, assignedUsernames, setSelectedUsername, isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-md animate-pulse">
        <Users className="w-4 h-4 text-slate-400" />
        <div className="w-24 h-4 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (!assignedUsernames || assignedUsernames.length === 0) {
    return null; // Don't show if no usernames assigned
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-white border border-slate-200 rounded-md">
      <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <Select
        value={selectedUsername || ""}
        onValueChange={setSelectedUsername}
        disabled={isLoading}>
        <SelectTrigger className="h-7 w-[140px] border-0 shadow-none focus:ring-0 text-sm">
          <SelectValue placeholder="Select workspace" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-slate-200">
          {assignedUsernames.map((username) => (
            <SelectItem
              key={username}
              value={username}
              className="text-slate-900 hover:bg-slate-100 cursor-pointer">
              {username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

