import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, Users, Calendar, Mail, Clock, PieChart as PieChartIcon } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

// Generate distinct colors for each day
const generateColors = (count) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count;
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }
  return colors;
};

// Brisbane timezone offset is +10:00 (AEST) or +11:00 (AEDT during daylight saving)
// For simplicity, we'll use +10:00 as the standard offset
const BRISBANE_OFFSET_HOURS = 10;

const toBrisbaneTime = (utcDate) => {
  const date = new Date(utcDate);
  // Add Brisbane offset to UTC time
  const brisbaneTime = new Date(date.getTime() + BRISBANE_OFFSET_HOURS * 60 * 60 * 1000);
  return brisbaneTime;
};

const formatBrisbaneDate = (utcDate, formatStr) => {
  const brisbaneDate = toBrisbaneTime(utcDate);
  return format(brisbaneDate, formatStr);
};

const getBrisbaneDateKey = (utcDate) => {
  const brisbaneDate = toBrisbaneTime(utcDate);
  return format(brisbaneDate, 'yyyy-MM-dd');
};

export default function DailySignupReport({ users }) {
  const [selectedDay, setSelectedDay] = useState(null);

  const signupData = useMemo(() => {
    if (!users || users.length === 0) return [];

    // Group users by date in Brisbane timezone
    const dateMap = {};
    users.forEach(user => {
      if (user.created_date) {
        const dateKey = getBrisbaneDateKey(user.created_date);
        
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = {
            date: dateKey,
            count: 0,
            users: []
          };
        }
        dateMap[dateKey].count++;
        dateMap[dateKey].users.push(user);
      }
    });

    // Convert to array and sort by date (newest first)
    return Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [users]);

  const stats = useMemo(() => {
    const nowBrisbane = new Date();
    const today = getBrisbaneDateKey(nowBrisbane);
    const yesterday = getBrisbaneDateKey(subDays(nowBrisbane, 1));
    const last7Days = getBrisbaneDateKey(subDays(nowBrisbane, 7));
    const last30Days = getBrisbaneDateKey(subDays(nowBrisbane, 30));

    const todayCount = signupData.find(d => d.date === today)?.count || 0;
    const yesterdayCount = signupData.find(d => d.date === yesterday)?.count || 0;
    const last7DaysCount = signupData.filter(d => d.date >= last7Days).reduce((sum, d) => sum + d.count, 0);
    const last30DaysCount = signupData.filter(d => d.date >= last30Days).reduce((sum, d) => sum + d.count, 0);

    return { todayCount, yesterdayCount, last7DaysCount, last30DaysCount };
  }, [signupData]);

  const maxCount = useMemo(() => {
    return Math.max(...signupData.map(d => d.count), 1);
  }, [signupData]);

  // Prepare data for pie chart (last 30 days)
  const pieChartData = useMemo(() => {
    const last30 = signupData.slice(0, 30);
    return last30.map(day => ({
      name: formatBrisbaneDate(day.date, 'MMM dd'),
      value: day.count,
      fullDate: formatBrisbaneDate(day.date, 'MMM dd, yyyy')
    }));
  }, [signupData]);

  const pieColors = useMemo(() => generateColors(pieChartData.length), [pieChartData.length]);

  return (
    <>
      <Card className="bg-white border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Daily Signup Report (Brisbane Time)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-xs text-blue-600 font-medium mb-1">Today</div>
              <div className="text-2xl font-bold text-blue-900">{stats.todayCount}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-600 font-medium mb-1">Yesterday</div>
              <div className="text-2xl font-bold text-slate-900">{stats.yesterdayCount}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-xs text-green-600 font-medium mb-1">Last 7 Days</div>
              <div className="text-2xl font-bold text-green-900">{stats.last7DaysCount}</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-xs text-purple-600 font-medium mb-1">Last 30 Days</div>
              <div className="text-2xl font-bold text-purple-900">{stats.last30DaysCount}</div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              Signup Distribution (Last 30 Days)
            </h4>
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={600}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={180}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                              <p className="text-sm font-semibold text-slate-900">{payload[0].payload.fullDate}</p>
                              <p className="text-sm text-slate-600">Signups: {payload[0].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <PieChartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No signup data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Daily Breakdown (Last 30 Days) - Click to see details
            </h4>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {signupData.slice(0, 30).map((day) => {
                const barWidth = (day.count / maxCount) * 100;
                const nowBrisbane = new Date();
                const today = getBrisbaneDateKey(nowBrisbane);
                const yesterday = getBrisbaneDateKey(subDays(nowBrisbane, 1));
                const isToday = day.date === today;
                const isYesterday = day.date === yesterday;

                return (
                  <div 
                    key={day.date} 
                    className="group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                    onClick={() => setSelectedDay(day)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-600 font-medium w-32 flex-shrink-0">
                        {formatBrisbaneDate(day.date, 'MMM dd, yyyy')}
                        {isToday && <span className="ml-2 text-xs text-blue-600">(Today)</span>}
                        {isYesterday && <span className="ml-2 text-xs text-slate-500">(Yesterday)</span>}
                      </div>
                      <div className="flex-1 relative">
                        <div className="bg-slate-100 rounded-full h-8 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isToday ? 'bg-blue-500' : 'bg-slate-400'
                            } group-hover:bg-blue-600`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-900 w-12 text-right">
                        {day.count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {signupData.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No signup data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Details Modal */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-2xl bg-white border-slate-200 text-slate-900 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Signups on {selectedDay && formatBrisbaneDate(selectedDay.date, 'MMMM dd, yyyy')} (Brisbane Time)
            </DialogTitle>
          </DialogHeader>

          {selectedDay && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 font-medium">Total Signups</div>
                    <div className="text-3xl font-bold text-blue-900">{selectedDay.count}</div>
                  </div>
                  <Users className="w-12 h-12 text-blue-300" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">All Users</h4>
                {[...selectedDay.users]
                  .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                  .map((user, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900">
                            {user.full_name || 'No name provided'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatBrisbaneDate(user.created_date, 'h:mm a')}</span>
                            <span className="px-2 py-0.5 bg-slate-200 rounded-full">
                              {user.role || 'user'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}