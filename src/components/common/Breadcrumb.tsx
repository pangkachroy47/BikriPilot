import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  pageName: string;
  parentName?: string;
  onNavigateHome?: () => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  pageName,
  parentName = 'ড্যাশবোর্ড',
  onNavigateHome,
}) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
        {pageName}
      </h2>

      <nav>
        <ol className="flex items-center gap-2 text-xs font-semibold">
          <li>
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1 text-slate-500 hover:text-emerald-600 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{parentName}</span>
            </button>
          </li>
          <li className="text-slate-400">
            <ChevronRight className="w-3.5 h-3.5" />
          </li>
          <li className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
            {pageName}
          </li>
        </ol>
      </nav>
    </div>
  );
};
