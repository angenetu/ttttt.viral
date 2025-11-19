import React, { useState } from 'react';
import { generateScript } from '../services/geminiService';
import { ScriptResult, LoadingState, View } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { Sparkles, Copy, Check, ArrowRight, Wand2, AlertCircle, Globe } from 'lucide-react';

interface ScriptGenProps {
    onUseScript: (script: ScriptResult) => void;
}

const ScriptGen: React.FC<ScriptGenProps> = ({ onUseScript }) => {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('TikTok');
  const [tone, setTone] = useState('Energetic');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(LoadingState.LOADING);
    try {
      const data = await generateScript(topic, platform, tone, language);
      setResult(data);
      setLoading(LoadingState.SUCCESS);
    } catch (error) {
      setLoading(LoadingState.ERROR);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(`${result.title}\n\n${result.hook}\n\n${result.body}\n\n${result.cta}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Wand2 className="text-accent" />
            AI Script Generator
        </h2>
        <p className="text-gray-400 mt-2">Generate high-retention, viral scripts in seconds using Gemini AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        
        {/* Input Section */}
        <div className="space-y-6 bg-surface border border-white/5 p-6 rounded-2xl h-fit">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Video Topic</label>
            <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., How to learn coding in 2024, 5 Travel hacks for Japan..."
                className="w-full bg-background border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none h-32 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                <select 
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube Shorts">YouTube Shorts</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="YouTube Long">YouTube Long Form</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tone</label>
                <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="Energetic">Energetic</option>
                    <option value="Professional">Professional</option>
                    <option value="Controversial">Controversial</option>
                    <option value="Educational">Educational</option>
                    <option value="Storytelling">Storytelling</option>
                </select>
            </div>
          </div>
          
          <div>
             <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Globe size={14} className="text-gray-400" /> Language
             </label>
             <select 
                 value={language}
                 onChange={(e) => setLanguage(e.target.value)}
                 className="w-full bg-background border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-primary"
             >
                 {SUPPORTED_LANGUAGES.map(lang => (
                     <option key={lang} value={lang}>{lang}</option>
                 ))}
             </select>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading === LoadingState.LOADING || !topic}
            className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primaryHover hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading === LoadingState.LOADING ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Thinking...
                </>
            ) : (
                <>
                    <Sparkles size={20} />
                    Generate Script
                </>
            )}
          </button>
          
          {loading === LoadingState.ERROR && (
             <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle size={16} />
                Failed to generate script. Please try again or check your API key.
             </div>
          )}
        </div>

        {/* Output Section */}
        <div className="bg-surface border border-white/5 rounded-2xl p-1 flex flex-col h-full overflow-hidden relative min-h-[500px] lg:min-h-0">
            {result ? (
                <div className="flex flex-col h-full">
                     <div className="bg-background/50 p-4 border-b border-white/5 flex justify-between items-center backdrop-blur-sm absolute top-1 left-1 right-1 rounded-t-xl z-10">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${result.estimatedViralScore > 80 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500'}`}></div>
                            <span className="text-sm font-medium text-gray-300">Viral Score: <span className="text-white">{result.estimatedViralScore}/100</span></span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Copy">
                                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                            </button>
                             <button onClick={() => onUseScript(result)} className="px-3 py-1.5 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                                Use in Editor <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 pt-16 space-y-6 custom-scrollbar bg-[#121214]">
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Headline</h3>
                            <div className="text-xl font-bold text-white">{result.title}</div>
                        </div>
                        
                        <div className="p-4 bg-indigo-500/5 border-l-2 border-indigo-500 rounded-r-lg">
                            <h3 className="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-2">Viral Hook (0-3s)</h3>
                            <p className="text-gray-200 font-medium leading-relaxed">{result.hook}</p>
                        </div>

                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Main Body</h3>
                            <p className="text-gray-300 whitespace-pre-line leading-relaxed">{result.body}</p>
                        </div>

                         <div className="p-4 bg-green-500/5 border-l-2 border-green-500 rounded-r-lg">
                            <h3 className="text-xs uppercase tracking-wider text-green-400 font-bold mb-2">Call to Action</h3>
                            <p className="text-gray-200 font-medium">{result.cta}</p>
                        </div>

                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Recommended Hashtags</h3>
                            <div className="flex flex-wrap gap-2">
                                {result.hashtags.map((tag, i) => (
                                    <span key={i} className="text-accent bg-accent/10 px-2 py-1 rounded text-sm">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Wand2 size={32} className="opacity-50" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-300 mb-1">AI Output Preview</h3>
                    <p className="max-w-xs text-sm">Enter a topic and click generate to see the magic happen.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ScriptGen;