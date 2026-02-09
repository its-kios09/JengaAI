import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Database, Activity, Zap,
  LayoutTemplate, Server, ChevronLeft, ChevronRight, Shield,
  Workflow, Sparkles,
} from 'lucide-react';
import { useThemeStore } from '@/store/theme-store.ts';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipeline/new', icon: Workflow, label: 'Pipeline Editor' },
  { to: '/teachable', icon: Sparkles, label: 'Teachable Machine' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/datasets', icon: Database, label: 'Datasets' },
  { to: '/training', icon: Activity, label: 'Training' },
  { to: '/inference', icon: Zap, label: 'Inference' },
  { to: '/templates', icon: LayoutTemplate, label: 'Templates' },
  { to: '/compute', icon: Server, label: 'Compute' },
];

export function Sidebar() {
  const collapsed = useThemeStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useThemeStore((s) => s.toggleSidebar);

  return (
    <aside
      className={`flex flex-col h-screen sticky top-0 border-r border-surface-200 dark:border-surface-700
        bg-white dark:bg-surface-900 transition-all duration-200
        ${collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-200 dark:border-surface-700">
        <Shield size={24} className="text-primary-500 shrink-0" />
        {!collapsed && <span className="text-lg font-bold text-surface-900 dark:text-surface-50">Jenga-AI</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
              }`
            }
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-12 border-t border-surface-200 dark:border-surface-700
          text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
