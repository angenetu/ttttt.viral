import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Scissors, Type, Music, Image as ImageIcon, Settings, Download, ChevronRight, Layers, Upload, Copy, Mic, Volume2, Wand2, Eraser, UploadCloud, AlertTriangle, CheckCircle2, X, Trash2, Edit2, Check, Globe, Video as VideoIcon, FileAudio } from 'lucide-react';
import { ScriptResult } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { generateImage, editImageWithAI, generateVideo, generateSpeechAI, transcribeAudio } from '../services/geminiService';

interface EditorProps {
    initialScript?: ScriptResult | null;
}

const VOICES = [
    { id: 'Puck', name: 'Puck', style: 'Energetic', color: 'bg-blue-500' },
    { id: 'Charon', name: 'Charon', style: 'Deep', color: 'bg-pink-500' },
    { id: 'Kore', name: 'Kore', style: 'Balanced', color: 'bg-orange-500' },
    { id: 'Fenrir', name: 'Fenrir', style: 'Intense', color: 'bg-purple-500' },
    { id: 'Zephyr', name: 'Zephyr', style: 'Soft', color: 'bg-emerald-500' },
];

const Editor: React.FC<EditorProps> = ({ initialScript }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeTab, setActiveTab] = useState<'media' | 'text' | 'audio' | 'ai' | 'voice'>('ai');
    
    // Voiceover state
    const [voiceText, setVoiceText] = useState('');
    const [selectedVoice, setSelectedVoice] = useState('Puck');
    const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
    
    // Voice Controls
    const [voiceSpeed, setVoiceSpeed] = useState(1.0);
    const [voicePitch, setVoicePitch] = useState(0);

    // Voice Cloning State
    const [voiceMode, setVoiceMode] = useState<'standard' | 'cloning'>('standard');
    const [clonedVoices, setClonedVoices] = useState<any[]>([]);
    const [cloneName, setCloneName] = useState('');
    const [cloneFile, setCloneFile] = useState<File | null>(null);
    const [isCloning, setIsCloning] = useState(false);
    const [editingVoiceId, setEditingVoiceId] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState('');

    // AI Image State
    const [aiMode, setAiMode] = useState<'generate' | 'edit' | 'video'>('generate');
    const [imgPrompt, setImgPrompt] = useState('');
    const [imgStyle, setImgStyle] = useState('Cinematic');
    const [isGeneratingImg, setIsGeneratingImg] = useState(false);
    const [generatedImg, setGeneratedImg] = useState<string | null>(null);
    
    // AI Edit State
    const [editPrompt, setEditPrompt] = useState('');
    const [sourceImage, setSourceImage] = useState<string | null>(null); 
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isEditingImg, setIsEditingImg] = useState(false);

    // AI Video State (Veo)
    const [videoPrompt, setVideoPrompt] = useState('');
    const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

    // Mock layers
    const [layers, setLayers] = useState([
        { id: 1, type: 'video', name: 'Main_Footage_01.mp4', start: 0, duration: 40, color: 'bg-blue-600' },
        { id: 2, type: 'audio', name: 'LoFi_Chill_Beat.mp3', start: 0, duration: 60, color: 'bg-emerald-600' },
        { id: 3, type: 'text', name: 'Captions (Auto)', start: 2, duration: 38, color: 'bg-purple-600' },
    ]);

    useEffect(() => {
        if (initialScript && !voiceText) {
            setVoiceText(initialScript.body);
        }
    }, [initialScript]);

    useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress(p => (p >= 100 ? 0 : p + 0.5));
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const formatTime = (percent: number) => {
        const totalSeconds = 60;
        const current = Math.floor((percent / 100) * totalSeconds);
        return `00:${current < 10 ? '0' + current : current}`;
    };

    const allVoices = [...VOICES, ...clonedVoices];

    const handleGenerateVoice = async () => {
        if (!voiceText) return;
        setIsGeneratingVoice(true);
        
        try {
            // For real API call
            const pcmBase64 = await generateSpeechAI(voiceText, selectedVoice);
            
            if (pcmBase64) {
                const newLayer = {
                    id: Date.now(),
                    type: 'audio',
                    name: `AI Voice (${selectedVoice}): ${voiceText.substring(0, 15)}...`,
                    start: progress, 
                    duration: 10, // Estimate duration
                    color: 'bg-amber-600'
                };
                setLayers(prev => [...prev, newLayer]);
                
                // Playback mock for PCM - real implementation would decode AudioContext
                // Here we just simulate success visually
            }
        } catch(e) {
            console.error(e);
        }
        setIsGeneratingVoice(false);
    };

    const handleGenerateVideo = async () => {
        if (!videoPrompt) return;
        setIsGeneratingVideo(true);
        try {
            const uri = await generateVideo(videoPrompt, videoAspectRatio);
            if (uri) setGeneratedVideo(uri);
        } catch(e) {
            console.error(e);
        }
        setIsGeneratingVideo(false);
    };

    const handleTranscription = async (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = e.target?.result as string;
            const text = await transcribeAudio(result);
            // Add transcription as text layer
            const newLayer = {
                id: Date.now(),
                type: 'text',
                name: `Subtitles: ${text.substring(0,10)}...`,
                start: progress,
                duration: 10,
                color: 'bg-indigo-500'
            };
            setLayers(prev => [...prev, newLayer]);
        };
        reader.readAsDataURL(file);
    };

    const handleCloneVoice = () => {
        if (!cloneName || !cloneFile) return;
        setIsCloning(true);
        setTimeout(() => {
            const newVoice = {
                id: `cloned_${Date.now()}`,
                name: cloneName,
                style: 'Custom Clone',
                color: 'bg-indigo-600',
                isCustom: true
            };
            setClonedVoices(prev => [...prev, newVoice]);
            setSelectedVoice(newVoice.id);
            setVoiceMode('standard');
            setCloneName('');
            setCloneFile(null);
            setIsCloning(false);
        }, 2000);
    };

    const deleteVoice = (id: string) => {
        setClonedVoices(prev => prev.filter(v => v.id !== id));
        if (selectedVoice === id) setSelectedVoice(VOICES[0].id);
    };

    const startEditing = (voice: any) => {
        setEditingVoiceId(voice.id);
        setEditNameValue(voice.name);
    };

    const saveEdit = () => {
        if (editingVoiceId && editNameValue.trim()) {
            setClonedVoices(prev => prev.map(v => v.id === editingVoiceId ? { ...v, name: editNameValue.trim() } : v));
        }
        setEditingVoiceId(null);
    };

    const cancelEdit = () => { setEditingVoiceId(null); setEditNameValue(''); };
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) setCloneFile(e.target.files[0]); };
    const handleSourceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; const reader = new FileReader(); reader.onload = (ev) => { if(ev.target?.result) setSourceImage(ev.target.result as string); }; reader.readAsDataURL(file); } };
    const handleGenerateImage = async () => { if (!imgPrompt) return; setIsGeneratingImg(true); try { const result = await generateImage(`${imgStyle} style: ${imgPrompt}`); if(result) setGeneratedImg(result); } catch (e) { console.error(e); } setIsGeneratingImg(false); };
    const handleEditImage = async () => { if (!editPrompt || !sourceImage) return; setIsEditingImg(true); try { const result = await editImageWithAI(sourceImage, editPrompt); if(result) setEditedImage(result); } catch (e) { console.error(e); } setIsEditingImg(false); };
    const addLayer = (name: string, type: string) => { setLayers(prev => [...prev, { id: Date.now(), type, name, start: progress, duration: 5, color: 'bg-pink-600' }]); };

    return (
        <div className="flex flex-col h-full bg-[#09090b] overflow-hidden">
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-surface z-20">
                <div className="flex items-center gap-4">
                     <div className="flex items-center text-gray-400 text-sm hover:text-white cursor-pointer"><ChevronRight className="rotate-180" size={16} />Back</div>
                     <div className="h-6 w-[1px] bg-white/10"></div>
                     <h1 className="font-medium text-sm text-gray-200">{initialScript ? initialScript.title : 'Untitled Project'}</h1>
                     <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-gray-400 border border-white/5">Draft</span>
                </div>
                <div className="flex items-center gap-3">
                     <button className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium flex items-center gap-2"><Settings size={14} /> Settings</button>
                     <button className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primaryHover text-white text-xs font-bold shadow-lg flex items-center gap-2"><Download size={14} /> Export</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-16 border-r border-white/10 bg-surface flex flex-col items-center py-4 gap-6 z-10">
                    {[
                        { id: 'media', icon: Layers, label: 'Media' },
                        { id: 'text', icon: Type, label: 'Text' },
                        { id: 'audio', icon: Music, label: 'Audio' },
                        { id: 'voice', icon: Mic, label: 'Voice' },
                        { id: 'ai', icon: Wand2, label: 'AI Gen' },
                    ].map(tool => (
                        <button key={tool.id} onClick={() => setActiveTab(tool.id as any)} className={`flex flex-col items-center gap-1 group ${activeTab === tool.id ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}>
                            <div className={`p-2.5 rounded-xl transition-all ${activeTab === tool.id ? 'bg-primary/10' : 'group-hover:bg-white/5'}`}><tool.icon size={20} /></div>
                            <span className="text-[10px] font-medium">{tool.label}</span>
                        </button>
                    ))}
                </div>

                <div className="w-80 border-r border-white/10 bg-[#121214] flex flex-col">
                    <div className="p-4 border-b border-white/5">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-1">
                            {activeTab === 'ai' ? 'AI Studio' : activeTab === 'voice' ? 'AI Voiceover' : activeTab === 'media' ? 'Media Library' : 'Tools'}
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {activeTab === 'ai' ? (
                            <div className="space-y-6">
                                <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
                                    {['generate', 'edit', 'video'].map(m => (
                                        <button key={m} onClick={() => setAiMode(m as any)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${aiMode === m ? 'bg-surface text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                                            {m === 'video' ? 'Video' : m === 'edit' ? 'Edit Img' : 'Gen Img'}
                                        </button>
                                    ))}
                                </div>

                                {aiMode === 'generate' && (
                                    <div className="space-y-4">
                                        <select value={imgStyle} onChange={(e) => setImgStyle(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white">
                                            <option>Cinematic</option><option>Anime</option><option>Photorealistic</option>
                                        </select>
                                        <textarea value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white h-28 resize-none" placeholder="Describe image..." />
                                        <button onClick={handleGenerateImage} disabled={isGeneratingImg || !imgPrompt} className="w-full bg-primary hover:bg-primaryHover text-white text-xs font-bold py-3 rounded-lg">
                                            {isGeneratingImg ? 'Generating...' : 'Generate'}
                                        </button>
                                        {generatedImg && (
                                            <div className="space-y-2">
                                                <div className="aspect-video rounded-lg overflow-hidden border border-white/10 relative group">
                                                    <img src={generatedImg} className="w-full h-full object-cover" alt="Generated" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button onClick={() => addLayer('AI Generated Image', 'video')} className="bg-white text-black px-3 py-1 rounded text-xs font-bold">Use</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {aiMode === 'edit' && (
                                    <div className="space-y-4">
                                        <div className="border border-dashed border-white/20 rounded-lg p-4 hover:bg-white/5 text-center">
                                             <input type="file" accept="image/*" onChange={handleSourceImageUpload} className="hidden" id="src-img-upload" />
                                             <label htmlFor="src-img-upload" className="text-xs text-gray-400 cursor-pointer block">{sourceImage ? 'Image Loaded' : 'Upload Source Image'}</label>
                                        </div>
                                        <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white h-20" placeholder="Edit instructions..." />
                                        <button onClick={handleEditImage} disabled={isEditingImg || !editPrompt || !sourceImage} className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-3 rounded-lg">Apply Edit</button>
                                        {editedImage && (
                                            <div className="aspect-video rounded-lg overflow-hidden border border-white/10"><img src={editedImage} className="w-full h-full object-cover" alt="Edited" /></div>
                                        )}
                                    </div>
                                )}

                                {aiMode === 'video' && (
                                    <div className="space-y-4">
                                        <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3 flex gap-2">
                                            <VideoIcon size={16} className="text-purple-400 shrink-0" />
                                            <p className="text-[10px] text-purple-200">Powered by Veo 3.1. Takes ~1-2 mins.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setVideoAspectRatio('16:9')} className={`flex-1 py-2 text-xs border rounded ${videoAspectRatio === '16:9' ? 'border-primary text-primary bg-primary/10' : 'border-white/10 text-gray-400'}`}>16:9</button>
                                            <button onClick={() => setVideoAspectRatio('9:16')} className={`flex-1 py-2 text-xs border rounded ${videoAspectRatio === '9:16' ? 'border-primary text-primary bg-primary/10' : 'border-white/10 text-gray-400'}`}>9:16</button>
                                        </div>
                                        <textarea value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white h-28" placeholder="Describe the video..." />
                                        <button onClick={handleGenerateVideo} disabled={isGeneratingVideo || !videoPrompt} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold py-3 rounded-lg">
                                            {isGeneratingVideo ? 'Dreaming Video...' : 'Generate Video'}
                                        </button>
                                        {generatedVideo && (
                                            <div className="space-y-2">
                                                <video src={generatedVideo} controls className="w-full rounded-lg border border-white/10" />
                                                <button onClick={() => addLayer('AI Generated Video', 'video')} className="w-full bg-white/10 hover:bg-white/20 py-2 rounded text-xs">Add to Timeline</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'voice' ? (
                            <div className="space-y-6">
                                <div className="flex bg-white/5 rounded-lg p-1">
                                    <button onClick={() => setVoiceMode('standard')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${voiceMode === 'standard' ? 'bg-primary text-white' : 'text-gray-400'}`}>Standard</button>
                                    <button onClick={() => setVoiceMode('cloning')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${voiceMode === 'cloning' ? 'bg-primary text-white' : 'text-gray-400'}`}>Clone</button>
                                </div>
                                {voiceMode === 'standard' ? (
                                    <>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                            {allVoices.map(voice => (
                                                <div key={voice.id} onClick={() => setSelectedVoice(voice.id)} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer ${selectedVoice === voice.id ? 'bg-white/10 border-primary' : 'bg-white/5 border-white/5'}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${voice.color}`}><Volume2 size={14} /></div>
                                                    <div className="flex-1 overflow-hidden"><div className="text-sm font-medium text-white truncate">{voice.name}</div><div className="text-[10px] text-gray-400">{voice.style}</div></div>
                                                </div>
                                            ))}
                                        </div>
                                        <textarea value={voiceText} onChange={(e) => setVoiceText(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white h-24" placeholder="Text to speech..." />
                                        <button onClick={handleGenerateVoice} disabled={isGeneratingVoice || !voiceText} className="w-full bg-primary hover:bg-primaryHover text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                                            {isGeneratingVoice ? 'Generating...' : <><Mic size={16} /> Generate Voiceover</>}
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 text-[10px] text-amber-200">Upload audio to clone a voice model.</div>
                                        <input type="text" value={cloneName} onChange={(e) => setCloneName(e.target.value)} placeholder="Voice Name" className="w-full bg-black/30 border border-white/10 rounded p-2 text-xs text-white" />
                                        <input type="file" accept="audio/*" onChange={handleFileUpload} className="text-xs text-gray-400" />
                                        <button onClick={handleCloneVoice} disabled={isCloning || !cloneName || !cloneFile} className="w-full bg-indigo-600 text-white text-sm font-bold py-3 rounded-xl">{isCloning ? 'Cloning...' : 'Clone Voice'}</button>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'media' || activeTab === 'audio' ? (
                             <div className="space-y-3">
                                <button className="w-full border border-dashed border-white/20 rounded-lg p-4 flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300">
                                    <Upload size={20} />
                                    <span className="text-xs">Upload Files</span>
                                </button>
                                <div className="pt-4 border-t border-white/10">
                                    <h3 className="text-xs text-gray-400 font-bold mb-2 uppercase">Audio Tools</h3>
                                    <label className="w-full bg-white/5 hover:bg-white/10 rounded-lg p-3 flex items-center gap-3 cursor-pointer">
                                        <FileAudio size={18} className="text-indigo-400" />
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-white">Transcribe Audio</div>
                                            <div className="text-[10px] text-gray-500">Convert audio file to captions</div>
                                        </div>
                                        <input type="file" accept="audio/*" className="hidden" onChange={(e) => { if(e.target.files?.[0]) handleTranscription(e.target.files[0]); }} />
                                    </label>
                                </div>
                             </div>
                        ) : <div className="text-center text-gray-500 text-xs mt-10">Mockup</div>}
                    </div>
                </div>

                <div className="flex-1 bg-black relative flex flex-col">
                    <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
                        <div className="aspect-[9/16] h-full max-h-[600px] bg-black border border-white/10 shadow-2xl relative overflow-hidden group">
                             <img src={generatedImg || editedImage || "https://picsum.photos/720/1280?random=99"} className="w-full h-full object-cover" alt="Preview" />
                             {generatedVideo && <video src={generatedVideo} className="absolute inset-0 w-full h-full object-cover z-10" controls />}
                             <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:scale-110 transition-transform">
                                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                                </button>
                             </div>
                        </div>
                    </div>
                    <div className="h-64 bg-[#121214] border-t border-white/10 flex flex-col">
                        <div className="h-10 border-b border-white/5 flex items-center px-4 gap-4 justify-between">
                             <div className="flex gap-2"><button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"><Scissors size={14} /></button></div>
                             <div className="text-xs font-mono text-gray-500">{formatTime(progress)} / 00:60</div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative">
                            <div className="absolute top-0 bottom-0 w-[2px] bg-primary z-10 pointer-events-none" style={{ left: `${progress}%` }}></div>
                            {layers.map((layer) => (
                                <div key={layer.id} className="relative h-10 bg-white/5 rounded-lg overflow-hidden group">
                                    <div className={`absolute top-1 bottom-1 rounded-md ${layer.color} opacity-80 px-2 flex items-center text-[10px] font-medium text-white`} style={{ left: `${layer.start}%`, width: `${layer.duration}%` }}>{layer.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Editor;