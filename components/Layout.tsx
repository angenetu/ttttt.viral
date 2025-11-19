import React, { ReactNode } from 'react';
import { View } from '../types';
import { LayoutDashboard, Video, PenTool, TrendingUp, Settings, Layers, LogOut, Bot } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentView: View;
  onChangeView: (view: View) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  
  const navItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.EDITOR, label: 'Studio Editor', icon: Video },
    { id: View.SCRIPT_AI, label: 'Script AI', icon: PenTool },
    { id: View.ASSISTANT, label: 'AI Assistant', icon: Bot },
    { id: View.TEMPLATES, label: 'Templates', icon: Layers },
    { id: View.GROWTH, label: 'Growth Engine', icon: TrendingUp },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-gray-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-white/10 bg-surface hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
             <span className="font-bold text-white text-lg">V</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">ViralForge</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary shadow-inner border border-primary/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-primary' : 'text-gray-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
            <button 
                onClick={() => onChangeView(View.SETTINGS)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-100 transition-colors mb-2 ${currentView === View.SETTINGS ? 'bg-white/5 text-white' : ''}`}
            >
                <Settings size={20} />
                Settings
            </button>
             <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut size={20} />
                Sign Out
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-surface/50 backdrop-blur-md md:hidden">
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-primary rounded-md"></div>
             <span className="font-bold">ViralForge</span>
           </div>
           {/* Mobile menu toggle would go here */}
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;