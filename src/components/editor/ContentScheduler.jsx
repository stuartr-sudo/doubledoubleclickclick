import React, { useMemo, useState, useEffect } from "react";
import { BlogPost } from "@/api/entities";
import { ScheduledPost } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, Repeat, Globe, Send } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { addDays, addWeeks, addMonths, format } from "date-fns";
import { toast } from "sonner";
import { SendEmail } from "@/api/integrations";

function getSupportedTimezones() {
  try {
    // Modern browsers
    // eslint-disable-next-line no-undef
    const list = Intl.supportedValuesOf?.("timeZone") || [];
    if (list.length) return list;
  } catch {}
  // Fallback minimal set
  return [
    "UTC",
    "America/New_York",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney"
  ];
}

// Convert a local wall time for a given IANA timezone to a UTC Date
function toUTCFromTimeZone(localDate, timeZone) {
  const parts = new Date(localDate);
  // Build a date in that timezone, then derive UTC by offset trick
  const localeStr = parts.toLocaleString("en-US", { timeZone });
  const zoned = new Date(localeStr);
  const diff = parts.getTime() - zoned.getTime();
  return new Date(parts.getTime() - diff);
}

export default function ContentScheduler({ post, open, onClose }) {
  const [scheduledDate, setScheduledDate] = useState(null);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch { return "UTC"; }
  });
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [pattern, setPattern] = useState("weekly");
  const [interval, setInterval] = useState(1);
  const [endDate, setEndDate] = useState(null);
  const [publishChannels, setPublishChannels] = useState(["website"]);
  const tzList = useMemo(getSupportedTimezones, []);

  useEffect(() => {
    if (open) {
      setScheduledDate(null);
      setScheduledTime("09:00");
      setRecurrenceEnabled(false);
      setPattern("weekly");
      setInterval(1);
      setEndDate(null);
      setPublishChannels(["website"]);
    }
  }, [open]);

  const toggleChannel = (c, checked) => {
    setPublishChannels(prev => checked ? Array.from(new Set([...prev, c])) : prev.filter(x => x !== c));
  };

  const schedulePost = async () => {
    if (!post?.id || !scheduledDate) {
      toast.error("Please choose a publish date.");
      return;
    }
    const [hh, mm] = (scheduledTime || "09:00").split(":").map(n => parseInt(n, 10));
    const local = new Date(scheduledDate);
    local.setHours(hh, mm || 0, 0, 0);
    const utcDate = toUTCFromTimeZone(local, timezone);

    const recurrence = recurrenceEnabled ? {
      enabled: true,
      pattern,
      interval: Number(interval) || 1,
      end_date: endDate ? new Date(endDate).toISOString() : undefined
    } : { enabled: false };

    await BlogPost.update(post.id, {
      publish_status: "scheduled",
      scheduled_publish_date: utcDate.toISOString(),
      timezone,
      recurrence,
      publish_channels: publishChannels,
      notify_on_publish: true
    });

    // Optional: pre-create future scheduled rows (for a year max)
    if (recurrenceEnabled) {
      const schedules = [];
      let current = new Date(utcDate);
      const last = endDate ? new Date(endDate) : addMonths(utcDate, 12);
      while (current <= last) {
        schedules.push({
          post_id: post.id,
          scheduled_date: new Date(current).toISOString(),
          timezone
        });
        if (pattern === "daily") current = addDays(current, interval);
        else if (pattern === "weekly") current = addWeeks(current, interval);
        else current = addMonths(current, interval);
      }
      if (schedules.length) {
        await ScheduledPost.bulkCreate(schedules);
      }
    }

    // Send confirmation email to creator (non-blocking UX)
    try {
      if (post.created_by) {
        await SendEmail({
          to: post.created_by,
          subject: `Scheduled: ${post.title || "Untitled Post"}`,
          body: `Your post "${post.title || "Untitled Post"}" has been scheduled for ${format(local, "PPP p")} (${timezone}).`
        });
      }
    } catch {}

    toast.success(`Post scheduled for ${format(local, "PPP p")} (${timezone})`);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-2 block">Publish Date</Label>
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={setScheduledDate}
                disabled={(date) => date < new Date(new Date().toDateString())}
                className="rounded-md border"
              />
            </div>
            <div className="space-y-4">
              <div>
                <Label>Time</Label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-40" />
                </div>
              </div>
              <div>
                <Label>Timezone</Label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="min-w-[240px]">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {tzList.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><Repeat className="w-4 h-4" /> Recurring</Label>
                  <Switch checked={recurrenceEnabled} onCheckedChange={setRecurrenceEnabled} />
                </div>
                {recurrenceEnabled && (
                  <div className="pl-3 border-l">
                    <div className="flex items-center gap-3 mb-3">
                      <Select value={pattern} onValueChange={setPattern}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" min="1" className="w-24" value={interval} onChange={(e) => setInterval(e.target.value)} />
                      <span className="text-sm text-gray-500">
                        {pattern === "daily" ? "day(s)" : pattern === "weekly" ? "week(s)" : "month(s)"}
                      </span>
                    </div>
                    <div>
                      <Label>End Date (optional)</Label>
                      <Input type="date" value={endDate ? format(new Date(endDate), "yyyy-MM-dd") : ""} onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)} className="w-48" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Publish To</Label>
                <div className="flex gap-6 mt-2">
                  {["website", "social", "email"].map((c) => (
                    <label key={c} className="flex items-center gap-2">
                      <Checkbox checked={publishChannels.includes(c)} onCheckedChange={(ch) => toggleChannel(c, !!ch)} />
                      <span className="capitalize">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={schedulePost} disabled={!scheduledDate}>
            <CalendarIcon className="w-4 h-4 mr-2" />
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}