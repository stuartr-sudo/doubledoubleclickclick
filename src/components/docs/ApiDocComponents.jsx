import React, { useState } from 'react';
import {
  Wand2,
  Image,
  Video,
  ZoomIn,
  Palette,
  ListChecks,
  Webhook,
  Coins,
  Search,
  Turtle,
  Rabbit,
  Rocket,
  BookOpen,
  ChevronRight,
  AlertTriangle,
  Info as InfoLucide,
  File,
} from 'lucide-react';

const icons = {
  Wand2,
  Image,
  Video,
  ZoomIn,
  Palette,
  ListChecks,
  Webhook,
  Coins,
  Search,
  Turtle,
  Rabbit,
  Rocket,
  BookOpen,
  Info: InfoLucide,
  default: File,
};

const DynamicIcon = ({ name, ...props }) => {
  const IconComponent = icons[name] || icons.default;
  return <IconComponent {...props} />;
};

export const Card = ({ title, icon, href, children }) => (
  <a href={href} className="not-prose block bg-slate-800/50 border border-slate-700 rounded-xl p-6 transition-all duration-300 hover:bg-slate-800 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/10">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-700/80 rounded-lg flex items-center justify-center border border-slate-600">
        <DynamicIcon name={icon} className="w-6 h-6 text-cyan-400" />
      </div>
      <div>
        <h3 className="!m-0 text-lg font-semibold text-white">{title}</h3>
      </div>
    </div>
    <div className="mt-3 text-slate-400 text-sm">
      {children}
    </div>
  </a>
);

export const CardGroup = ({ cols = 2, children }) => (
  <div className={`not-prose grid grid-cols-1 md:grid-cols-${cols} gap-4 my-8`}>
    {children}
  </div>
);

export const Warning = ({ children }) => (
  <div className="not-prose my-6 flex items-start gap-4 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200">
    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-400" />
    <div className="flex-1 [&_p]:!my-0">{children}</div>
  </div>
);

export const Info = ({ children }) => (
  <div className="not-prose my-6 flex items-start gap-4 p-4 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-200">
    <InfoLucide className="w-5 h-5 mt-0.5 flex-shrink-0 text-sky-400" />
    <div className="flex-1 [&_ul]:!my-2 [&_p]:!my-0">{children}</div>
  </div>
);

export const CodeGroup = ({ children }) => {
  const langs = Object.keys(children);
  const [activeLang, setActiveLang] = useState(langs[0]);

  return (
    <div className="not-prose my-6 rounded-xl border border-slate-700 bg-slate-800/70 overflow-hidden">
      <div className="flex bg-slate-900/50 border-b border-slate-700">
        {langs.map(lang => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              activeLang === lang
                ? 'text-white bg-slate-700/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
      <pre className="!m-0 !p-0 !bg-transparent !border-0"><code className="language-javascript !p-4 !bg-transparent block overflow-x-auto">
        {children[activeLang]}
      </code></pre>
    </div>
  );
};

export const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <div className="not-prose my-6">
      <div className="flex border-b border-slate-700">
        {React.Children.map(children, (child, i) => (
          <button
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 -mb-px border-b-2 ${
              activeTab === i
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            {child.props.title}
          </button>
        ))}
      </div>
      <div className="py-4">
        {React.Children.toArray(children)[activeTab]}
      </div>
    </div>
  );
};

export const Tab = ({ children }) => <div>{children}</div>;

export const ParamField = ({ path, type, required, children }) => (
  <div className="not-prose my-6 py-4 border-t border-slate-800">
    <div className="flex items-center gap-3">
      <code className="!text-base !font-semibold">{path}</code>
      <span className="text-sm text-slate-400">{type}</span>
      {required && <span className="text-xs font-bold text-red-400 uppercase border border-red-400/50 bg-red-500/10 px-2 py-0.5 rounded-full">Required</span>}
    </div>
    <div className="prose prose-sm prose-invert text-slate-400 mt-2 [&_p]:!my-1 [&_ul]:!my-2">
      {children}
    </div>
  </div>
);

export const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 text-left font-medium text-slate-200 hover:text-white"
      >
        <span>{title}</span>
        <ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <div className="pb-4 prose prose-sm prose-invert text-slate-400 [&_ul]:!my-0">
          {children}
        </div>
      )}
    </div>
  );
};

export const AccordionGroup = ({ children }) => (
  <div className="not-prose my-6 border-t border-slate-800">
    {children}
  </div>
);

export const ResponseField = ({ name, type, children }) => {
  const statusColors = {
    '200': 'text-green-400 bg-green-500/10',
    '400': 'text-amber-400 bg-amber-500/10',
    '401': 'text-amber-400 bg-amber-500/10',
    '402': 'text-orange-400 bg-orange-500/10',
    '429': 'text-yellow-400 bg-yellow-500/10',
    '500': 'text-red-400 bg-red-500/10',
  };
  const colorClass = statusColors[name] || 'text-slate-400 bg-slate-500/10';
  return(
    <div className="not-prose my-2 flex items-center gap-4">
      <code className={`!px-2 !py-0.5 !rounded-md !font-bold ${colorClass}`}>{name}</code>
      <div className="flex-1">
        <strong className="text-slate-200">{type}</strong>
        <p className="!m-0 text-sm text-slate-400">{children}</p>
      </div>
    </div>
  );
};