import React from 'react';
import { MOCK_TEMPLATES } from '../constants';
import { Play, Filter } from 'lucide-react';

const Templates: React.FC = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Templates</h2>
                    <p className="text-gray-400 mt-1">Start with a viral-tested structure.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 rounded-lg text-white text-sm font-medium hover:bg-white/10 flex items-center gap-2">
                        <Filter size={16} /> Filter
                    </button>
                    <div className="bg-white/5 rounded-lg p-1 flex">
                        <button className="px-4 py-1.5 bg-primary rounded text-xs font-bold text-white shadow-lg">All</button>
                        <button className="px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-white">TikTok</button>
                        <button className="px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-white">Shorts</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {MOCK_TEMPLATES.map((template) => (
                    <div key={template.id} className="group relative aspect-[9/16] bg-gray-800 rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-primary/50 transition-all">
                        <img src={template.previewUrl} alt={template.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                             <div className="w-12 h-12 bg-primary/90 backdrop-blur rounded-full flex items-center justify-center shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform">
                                <Play size={20} fill="white" className="text-white ml-1" />
                             </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="text-xs font-bold text-accent mb-1 uppercase tracking-wider">{template.category}</div>
                            <h3 className="text-white font-bold text-lg leading-tight mb-2">{template.name}</h3>
                            <div className="flex flex-wrap gap-1">
                                {template.tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Templates;