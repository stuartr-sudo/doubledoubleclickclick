import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const FullCalendarView = ({ currentDate, setCurrentDate, scheduledPosts, onDayClick, filteredUsernames }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfMonth = getDay(monthStart);

  // Group scheduled posts by day for quick lookup
  const postsByDay = useMemo(() => {
    const map = new Map();
    (scheduledPosts || []).forEach((post) => {
      const dayStr = format(new Date(post.scheduled_publish_date), 'yyyy-MM-dd');
      if (!map.has(dayStr)) {
        map.set(dayStr, []);
      }
      map.get(dayStr).push(post);
    });
    return map;
  }, [scheduledPosts]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 mr-4">
            Filtered by: {filteredUsernames.length > 0 ? filteredUsernames.length > 2 ? `${filteredUsernames.length} usernames` : filteredUsernames.join(', ') : 'All assigned'}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="bg-background text-slate-50 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-10">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())} className="bg-background text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="bg-background text-slate-50 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-10">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1">
        {/* Weekday Headers */}
        {weekdays.map((day) =>
        <div key={day} className="text-center text-xs font-medium text-slate-500 py-2 border-b border-r border-slate-200">
            {day}
          </div>
        )}

        {/* Empty cells for padding */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) =>
        <div key={`empty-${i}`} className="border-r border-b border-slate-200 bg-slate-50/50" />
        )}

        {/* Calendar Days */}
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayPosts = postsByDay.get(dayStr) || [];
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toString()}
              className="relative p-2 border-r border-b border-slate-200 flex flex-col min-h-[120px] cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => onDayClick(day)}>

              <time
                dateTime={dayStr}
                className={cn('font-semibold text-sm', isToday ? 'bg-indigo-600 text-white rounded-full h-7 w-7 flex items-center justify-center' : 'text-slate-700')}>

                {format(day, 'd')}
              </time>
              {dayPosts.length > 0 &&
              <div className="mt-2 space-y-1 overflow-hidden">
                  {dayPosts.slice(0, 3).map((post) =>
                <div key={post.id} className="flex items-start gap-1.5 text-xs text-slate-600 truncate">
                      <Pin className="w-3 h-3 mt-0.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{post.title || "Untitled"}</span>
                    </div>
                )}
                  {dayPosts.length > 3 &&
                <Badge variant="secondary" className="text-xs">+ {dayPosts.length - 3} more</Badge>
                }
                </div>
              }
               <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 opacity-0 hover:opacity-100 group-hover:opacity-100" onClick={(e) => {e.stopPropagation();onDayClick(day);}}>
                 <PlusCircle className="w-4 h-4 text-slate-400" />
               </Button>
            </div>);

        })}
      </div>
    </div>);

};

export default FullCalendarView;