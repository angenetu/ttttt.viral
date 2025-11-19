import React from 'react';
import { VideoProject, View } from '../types';
import { MOCK_PROJECTS } from '../constants';
import { Plus, Clock, TrendingUp, Play, MoreVertical, Eye } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 mt-1">Welcome back, Creator. You have 3 drafts pending.</p>
        </div>
        <button 
            onClick={() => onNavigate(View.EDITOR)}
            className="bg-primary hover:bg-primaryHover text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-95"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-white/5 p-6 rounded-2xl">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-green-500/10 rounded-xl">
                <TrendingUp className="text-green-400" size={24} />
             </div>
             <span className="text-xs font-medium px-2 py-1 bg-green-500/20 text-green-400 rounded-full">+12%</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-white">24.5K</h3>
            <p className="text-gray-500 text-sm">Total Views (Last 7d)</p>
          </div>
        </div>

         <div className="bg-surface border border-white/5 p-6 rounded-2xl">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-blue-500/10 rounded-xl">
                <Clock className="text-blue-400" size={24} />
             </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-white">1h 42m</h3>
            <p className="text-gray-500 text-sm">Saved by AI Automation</p>
          </div>
        </div>

        <div className="bg-surface border border-white/5 p-6 rounded-2xl">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-purple-500/10 rounded-xl">
                <Eye className="text-purple-400" size={24} />
             </div>
             <span className="text-xs font-medium px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">High</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-white">89/100</h3>
            <p className="text-gray-500 text-sm">Avg. Viral Score</p>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Recent Projects</h3>
            <button className="text-sm text-primary hover:text-primaryHover">View All</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_PROJECTS.map((project) => (
                <div key={project.id} className="group bg-surface border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer" onClick={() => onNavigate(View.EDITOR)}>
                    <div className="relative aspect-video bg-black">
                        <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
                                <Play size={20} fill="currentColor" />
                             </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 text-xs font-mono px-2 py-1 rounded text-white">
                            {project.duration}
                        </div>
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded text-white border border-white/10">
                            {project.platform.replace('_', ' ')}
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">{project.title}</h4>
                                <p className="text-sm text-gray-500 mt-1">Edited {project.lastModified}</p>
                            </div>
                            <button className="text-gray-500 hover:text-white p-1">
                                <MoreVertical size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
             
             {/* New Project Card */}
            <button onClick={() => onNavigate(View.EDITOR)} className="border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-primary hover:border-primary/50 hover:bg-white/[0.02] transition-all aspect-video md:aspect-auto md:min-h-[240px]">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <Plus size={24} />
                </div>
                <span className="font-medium">Create New Project</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;