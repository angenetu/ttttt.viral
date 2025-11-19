import React, { useState } from 'react';
import { analyzeTrend } from '../services/geminiService';
import { MOCK_TRENDS } from '../constants';
import { Search, TrendingUp, ArrowUpRight, Info, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Growth: React.FC = () => {
    const [keyword, setKeyword] = useState('');
    const [analysis, setAnalysis] = useState<{prediction: string, score: number} | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if(!keyword) return;
        setLoading(true);
        const result = await analyzeTrend(keyword);
        setAnalysis(result);
        setLoading(false);
    };

    const chartData = [
        { name: 'Mon', views: 4000 },
        { name: 'Tue', views: 3000 },
        { name: 'Wed', views: 2000 },
        { name: 'Thu', views: 2780 },
        { name: 'Fri', views: 1890 },
        { name: 'Sat', views: 2390 },
        { name: 'Sun', views: 3490 },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
             <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <TrendingUp className="text-green-400" />
                    Viral Growth Engine
                </h2>
                <p className="text-gray-400">Analyze trends and predict video performance before you post.</p>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend Analyzer */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface border border-white/5 rounded-2xl p-6">
                        <h3 className="font-semibold text-white mb-4">Analyze Keyword</h3>
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="e.g. 'AI Agents'"
                                className="flex-1 bg-background border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-primary outline-none"
                            />
                            <button 
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="bg-primary hover:bg-primaryHover text-white px-4 rounded-lg disabled:opacity-50"
                            >
                                {loading ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Search size={18} />}
                            </button>
                        </div>

                        {analysis && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400 text-xs uppercase font-bold">Viral Potential</span>
                                    <span className={`font-bold ${analysis.score > 75 ? 'text-green-400' : 'text-yellow-400'}`}>{analysis.score}/100</span>
                                </div>
                                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden mb-3">
                                    <div className={`h-full rounded-full ${analysis.score > 75 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${analysis.score}%`}}></div>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed">{analysis.prediction}</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-surface border border-white/5 rounded-2xl p-6">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <ArrowUpRight className="text-accent" size={20} />
                            Trending Now
                        </h3>
                        <div className="space-y-4">
                            {MOCK_TRENDS.map((trend, idx) => (
                                <div key={idx} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                                    <div>
                                        <div className="text-white font-medium text-sm">{trend.keyword}</div>
                                        <div className="text-xs text-gray-500">{trend.volume.toLocaleString()} searches</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 text-xs font-bold">+{trend.growth}%</div>
                                        <div className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                            trend.difficulty === 'High' ? 'text-red-400 border-red-400/20 bg-red-400/10' : 
                                            trend.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10' : 
                                            'text-green-400 border-green-400/20 bg-green-400/10'
                                        }`}>
                                            {trend.difficulty}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface border border-white/5 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                             <h3 className="font-semibold text-white flex items-center gap-2">
                                <BarChart3 size={20} className="text-purple-400" />
                                Channel Performance Prediction
                             </h3>
                             <select className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 outline-none">
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                             </select>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="views" stroke="#7c3aed" strokeWidth={3} dot={{fill: '#7c3aed', strokeWidth: 2}} activeDot={{r: 6, fill: '#fff'}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-surface border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-medium text-gray-400 mb-2">Audience Retention Estimate</h3>
                            <div className="text-3xl font-bold text-white mb-4">58.4% <span className="text-sm text-green-400 font-normal">+4.2%</span></div>
                            <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        {sec: '0s', ret: 100}, {sec: '10s', ret: 85}, {sec: '20s', ret: 72}, 
                                        {sec: '30s', ret: 65}, {sec: '40s', ret: 60}, {sec: '50s', ret: 58}, {sec: '60s', ret: 55}
                                    ]}>
                                        <Bar dataKey="ret" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                         </div>

                         <div className="bg-surface border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <Info className="text-accent" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-lg mb-1">Best Time to Post</h3>
                                    <p className="text-gray-400 text-sm mb-3">Based on your niche audience activity.</p>
                                    <div className="text-2xl font-bold text-white">Tomorrow, 4:30 PM</div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
             </div>
        </div>
    );
};

export default Growth;