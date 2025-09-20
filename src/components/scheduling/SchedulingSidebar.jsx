import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, List, Clock } from 'lucide-react';
import { toast } from 'sonner';

const SchedulingSidebar = ({
  isOpen,
  onClose,
  selectedDate,
  drafts = [],
  onBulkSchedule,
  time,
  setTime,
  timezone,
  setTimezone,
  tzList = []
}) => {
  const [selectedDraftIds, setSelectedDraftIds] = React.useState([]);

  const toggleDraft = (id) => {
    setSelectedDraftIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleScheduleClick = async () => {
    if (selectedDraftIds.length === 0) {
      toast.info('Select some drafts to schedule.');
      return;
    }
    await onBulkSchedule(selectedDraftIds, selectedDate);
    setSelectedDraftIds([]); // Clear selection after scheduling
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-white border-l border-slate-200 shadow-xl flex flex-col z-20">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h3 className="font-semibold text-slate-800">Schedule for</h3>
          <p className="text-slate-600">{format(selectedDate, 'PPP')}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-700">
          <List className="w-4 h-4" /> Bulk Schedule Drafts
        </h4>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
             <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)} className="bg-background text-slate-50 pl-8 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />


          </div>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="bg-background text-slate-50 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tzList.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-slate-500 mb-2">Select drafts to schedule at the time above.</p>
        <ScrollArea className="h-72 border border-slate-200 rounded-md">
          <div className="p-3 space-y-2">
            {drafts.length === 0 ?
            <div className="text-center py-10 text-sm text-slate-500">No available drafts for the selected usernames.</div> :
            drafts.map((d) =>
            <label
              key={d.id}
              className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer p-2 rounded-md hover:bg-slate-100 transition-colors">

                <input
                type="checkbox"
                checked={selectedDraftIds.includes(d.id)}
                onChange={() => toggleDraft(d.id)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />

                <span className="truncate flex-1">{d.title || 'Untitled'}</span>
              </label>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="mt-auto p-4 border-t border-slate-200">
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleScheduleClick} disabled={selectedDraftIds.length === 0}>
          Schedule {selectedDraftIds.length > 0 ? selectedDraftIds.length : ''} item(s)
        </Button>
      </div>
    </div>);

};

export default SchedulingSidebar;