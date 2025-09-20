import React from 'react';

export default function StatCard({ title, value, icon: Icon, description, color = "blue" }) {
  const colorClasses = {
    blue: "from-blue-100 to-cyan-100 text-blue-600",
    emerald: "from-emerald-100 to-green-100 text-emerald-600",
    orange: "from-orange-100 to-amber-100 text-orange-600",
    violet: "from-violet-100 to-purple-100 text-violet-600",
    green: "from-green-100 to-teal-100 text-green-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${colorClasses[color] || colorClasses['blue']} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
      {description && <p className="text-xs text-slate-500 mt-3">{description}</p>}
    </div>
  );
}