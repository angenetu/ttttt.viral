import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Scissors, Type, Music, Image as ImageIcon, Settings, Download, ChevronRight, Layers, Upload, Copy, Mic, Volume2, Wand2, Eraser, UploadCloud, AlertTriangle, CheckCircle2, X, Trash2, Edit2, Check, RefreshCcw, Globe } from 'lucide-react';
import { ScriptResult } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { generateImage, editImageWithAI } from '../services/geminiService';

interface EditorProps {
    initialScript?: ScriptResult | null;
}

const VOICES = [
    { id: 'v1', name: 'Adam', style: 'Deep & Authoritative', color: 'bg-blue-500' },
    { id: 'v2', name: 'Bella', style: 'Energetic & Viral', color: 'bg-pink-500' },
    { id: 'v3', name: 'Charlie', style: 'Casual & Friendly', color: 'bg-orange-500' },
    { id: 'v4', name: 'Diana', style: 'Soft & Storytelling', color: 'bg-purple-500' },
];

const Editor: React.FC<EditorProps> = ({ initialScript }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeTab, setActiveTab] = useState<'media' | 'text' | 'audio' | 'ai' | 'voice'>('ai');
    
    // Voiceover state
    const [voiceText, setVoiceText] = useState('');
    const [selectedVoice, setSelectedVoice] = useState(VOICES[1].id);
    const [voiceLanguage, setVoiceLanguage] = useState('English');
    const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
    
    // Voice Controls
    const [voiceSpeed, setVoiceSpeed] = useState(1.0);
    const [voicePitch, setVoicePitch] = useState(0);

    // Voice Cloning State
    const [voiceMode, setVoiceMode] = useState<'standard' | 'cloning'>('standard');
    const [clonedVoices, setClonedVoices] = useState<{id: string, name: string, style: string, color: string, isCustom?: boolean}[]>([]);
    const [cloneName, setCloneName] = useState('');
    const [cloneFile, setCloneFile] = useState<File | null>(null);
    const [isCloning, setIsCloning] = useState(false);

    // Voice Management State
    const [editingVoiceId, setEditingVoiceId] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState('');

    // AI Image State
    const [aiMode, setAiMode] = useState<'generate' | 'edit'>('generate');
    const [imgPrompt, setImgPrompt] = useState('');
    const [imgStyle, setImgStyle] = useState('Cinematic');
    const [isGeneratingImg, setIsGeneratingImg] = useState(false);
    const [generatedImg, setGeneratedImg] = useState<string | null>(null);
    
    // AI Edit State
    const [editPrompt, setEditPrompt] = useState('');
    const [sourceImage, setSourceImage] = useState<string | null>(null); 
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isEditingImg, setIsEditingImg] = useState(false);

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

    const handleGenerateVoice = () => {
        if (!voiceText) return;
        setIsGeneratingVoice(true);
        
        // Mock API call simulation
        setTimeout(() => {
            const voiceName = allVoices.find(v => v.id === selectedVoice)?.name || 'Voice';
            const speedLabel = voiceSpeed !== 1.0 ? `(${voiceSpeed}x)` : '';
            const pitchLabel = voicePitch !== 0 ? `(P:${voicePitch > 0 ? '+' : ''}${voicePitch})` : '';
            const langLabel = voiceLanguage !== 'English' ? `[${voiceLanguage.substring(0,2).toUpperCase()}]` : '';

            const newLayer = {
                id: Date.now(),
                type: 'audio',
                name: `VO ${langLabel}: ${voiceName} ${speedLabel}${pitchLabel} - ${voiceText.substring(0, 10)}...`,
                start: progress, 
                duration: 15, 
                color: 'bg-amber-600'
            };
            setLayers(prev => [...prev, newLayer]);
            setIsGeneratingVoice(false);
        }, 1500);
    };

    const handleCloneVoice = () => {
        if (!cloneName || !cloneFile) return;
        setIsCloning(true);
        
        // Simulate processing
        setTimeout(() => {
            const newVoice = {
                id: `cloned_${Date.now()}`,
                name: cloneName,
                style: 'Custom Voice Clone',
                color: 'bg-indigo-600',
                isCustom: true
            };
            setClonedVoices(prev => [...prev, newVoice]);
            setSelectedVoice(newVoice.id);
            setVoiceMode('standard');
            setCloneName('');
            setCloneFile(null);
            setIsCloning(false);
        }, 3000);
    };

    const deleteVoice = (id: string) => {
        setClonedVoices(prev => prev.filter(v => v.id !== id));
        if (selectedVoice === id) setSelectedVoice(VOICES[0].id);
    };

    const startEditing = (voice: typeof clonedVoices[0]) => {
        setEditingVoiceId(voice.id);
        setEditNameValue(voice.name);
    };

    const saveEdit = () => {
        if (editingVoiceId && editNameValue.trim()) {
            setClonedVoices(prev => prev.map(v => 
                v.id === editingVoiceId ? { ...v, name: editNameValue.trim() } : v
            ));
        }
        setEditingVoiceId(null);
    };

    const cancelEdit = () => {
        setEditingVoiceId(null);
        setEditNameValue('');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCloneFile(e.target.files[0]);
        }
    };
    
    const handleSourceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSourceFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => {
                if(ev.target?.result) setSourceImage(ev.target.result as string);
            }
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateImage = async () => {
        if (!imgPrompt) return;
        setIsGeneratingImg(true);
        try {
            const finalPrompt = `${imgStyle} style: ${imgPrompt}`;
            const result = await generateImage(finalPrompt);
            if(result) setGeneratedImg(result);
        } catch (e) {
            console.error(e);
        }
        setIsGeneratingImg(false);
    };

    const handleEditImage = async () => {
        if (!editPrompt || !sourceImage) return;
        setIsEditingImg(true);
        try {
            const result = await editImageWithAI(sourceImage, editPrompt);
            if(result) setEditedImage(result);
        } catch (e) {
            console.error(e);
        }
        setIsEditingImg(false);
    };

    const addImageLayer = (imageSrc: string, name: string) => {
        const newLayer = {
            id: Date.now(),
            type: 'video',
            name: name,
            start: progress,
            duration: 5,
            color: 'bg-pink-600'
        };
        setLayers(prev => [...prev, newLayer]);
    };

    return (
        <div className="flex flex-col h-full bg-[#09090b] overflow-hidden">
            
            {/* Top Bar */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-surface z-20">
                <div className="flex items-center gap-4">
                     <div className="flex items-center text-gray-400 text-sm hover:text-white cursor-pointer">
                        <ChevronRight className="rotate-180" size={16} />
                        Back
                     </div>
                     <div className="h-6 w-[1px] bg-white/10"></div>
                     <h1 className="font-medium text-sm text-gray-200">{initialScript ? initialScript.title : 'Untitled Project'}</h1>
                     <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-gray-400 border border-white/5">Draft</span>
                </div>
                
                <div className="flex items-center gap-3">
                     <button className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors flex items-center gap-2">
                        <Settings size={14} /> Settings
                     </button>
                     <button className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primaryHover text-white text-xs font-bold shadow-lg shadow-primary/20 transition-colors flex items-center gap-2">
                        <Download size={14} /> Export 1080p
                     </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Sidebar Tools */}
                <div className="w-16 border-r border-white/10 bg-surface flex flex-col items-center py-4 gap-6 z-10">
                    {[
                        { id: 'media', icon: Layers, label: 'Media' },
                        { id: 'text', icon: Type, label: 'Text' },
                        { id: 'audio', icon: Music, label: 'Audio' },
                        { id: 'voice', icon: Mic, label: 'Voice' },
                        { id: 'ai', icon: ImageIcon, label: 'AI Gen' },
                    ].map(tool => (
                        <button 
                            key={tool.id}
                            onClick={() => setActiveTab(tool.id as any)}
                            className={`flex flex-col items-center gap-1 group ${activeTab === tool.id ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <div className={`p-2.5 rounded-xl transition-all ${activeTab === tool.id ? 'bg-primary/10' : 'group-hover:bg-white/5'}`}>
                                <tool.icon size={20} />
                            </div>
                            <span className="text-[10px] font-medium">{tool.label}</span>
                        </button>
                    ))}
                </div>

                {/* Asset Panel */}
                <div className="w-80 border-r border-white/10 bg-[#121214] flex flex-col">
                    <div className="p-4 border-b border-white/5">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-1">
                            {activeTab === 'ai' ? 'AI Studio' : 
                             activeTab === 'voice' ? 'AI Voiceover' :
                             activeTab === 'media' ? 'Media Library' : 
                             activeTab === 'text' ? 'Text & Captions' : 'Audio Stock'}
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {activeTab === 'ai' ? (
                            <div className="space-y-6">
                                {/* Mode Switcher / Segmented Control */}
                                <div className="grid grid-cols-2 bg-black/20 p-1 rounded-xl border border-white/10 relative">
                                    <button 
                                        onClick={() => setAiMode('generate')} 
                                        className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 relative z-10 ${aiMode === 'generate' ? 'bg-surface text-white shadow-sm border border-white/10' : 'text-gray-400 hover:text-gray-200'}`}
                                    >
                                        <Wand2 size={14} /> Generate
                                    </button>
                                    <button 
                                        onClick={() => setAiMode('edit')} 
                                        className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 relative z-10 ${aiMode === 'edit' ? 'bg-surface text-white shadow-sm border border-white/10' : 'text-gray-400 hover:text-gray-200'}`}
                                    >
                                        <Eraser size={14} /> Edit
                                    </button>
                                </div>

                                {aiMode === 'generate' ? (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                        {/* GENERATE INPUT */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 font-medium uppercase">Style</label>
                                                <select 
                                                    value={imgStyle} 
                                                    onChange={(e) => setImgStyle(e.target.value)}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-primary"
                                                >
                                                    <option value="Cinematic">Cinematic</option>
                                                    <option value="Photorealistic">Photorealistic</option>
                                                    <option value="Anime">Anime</option>
                                                    <option value="3D Render">3D Render</option>
                                                    <option value="Oil Painting">Oil Painting</option>
                                                    <option value="Cyberpunk">Cyberpunk</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 font-medium uppercase">Prompt</label>
                                                <textarea 
                                                    value={imgPrompt}
                                                    onChange={(e) => setImgPrompt(e.target.value)}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white h-28 resize-none focus:border-primary outline-none leading-relaxed placeholder-gray-600" 
                                                    placeholder="Describe the image you want to generate..." 
                                                />
                                            </div>

                                            <button 
                                                onClick={handleGenerateImage}
                                                disabled={isGeneratingImg || !imgPrompt}
                                                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primaryHover hover:to-purple-700 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                            >
                                                {isGeneratingImg ? 'Dreaming...' : 'Generate Image'}
                                            </button>
                                        </div>

                                        {/* GENERATE OUTPUT */}
                                        {generatedImg && (
                                            <div className="space-y-2 pt-4 border-t border-white/10">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs text-gray-400 font-medium uppercase">Result</label>
                                                    <button 
                                                        onClick={() => setGeneratedImg(null)} 
                                                        className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded"
                                                    >
                                                        <Trash2 size={12} /> Clear
                                                    </button>
                                                </div>
                                                <div className="aspect-video rounded-lg overflow-hidden border border-white/10 relative group">
                                                    <img src={generatedImg} alt="Generated" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button 
                                                            onClick={() => addImageLayer(generatedImg, 'AI Generated Image')}
                                                            className="bg-white text-black px-3 py-1.5 rounded-md text-xs font-bold transform scale-90 group-hover:scale-100 transition-transform flex items-center gap-1 shadow-lg"
                                                        >
                                                            <Layers size={12} /> Add to Timeline
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        {/* EDIT INPUTS */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 font-medium uppercase">Source Image</label>
                                                <div className="border border-dashed border-white/20 rounded-lg p-4 hover:bg-white/5 transition-colors relative group">
                                                    {sourceImage ? (
                                                        <div className="aspect-video rounded overflow-hidden relative">
                                                            <img src={sourceImage} className="w-full h-full object-cover" alt="Source" />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <span className="text-xs text-white font-medium">Click to change</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center gap-2 py-4">
                                                            <UploadCloud size={24} className="text-gray-500" />
                                                            <span className="text-[10px] text-gray-400 text-center">Upload image to edit</span>
                                                        </div>
                                                    )}
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={handleSourceImageUpload}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 font-medium uppercase">Instruction</label>
                                                <textarea 
                                                    value={editPrompt}
                                                    onChange={(e) => setEditPrompt(e.target.value)}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white h-20 resize-none focus:border-primary outline-none" 
                                                    placeholder="e.g., Make it look like a 90s photo, remove the background..." 
                                                />
                                            </div>

                                            <button 
                                                onClick={handleEditImage}
                                                disabled={isEditingImg || !editPrompt || !sourceImage}
                                                className="w-full bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                {isEditingImg ? 'Applying Magic...' : 'Apply Edit'}
                                            </button>
                                        </div>
                                        
                                        {/* EDIT OUTPUT */}
                                        {editedImage && (
                                            <div className="space-y-2 pt-4 border-t border-white/10">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs text-gray-400 font-medium uppercase">Edited Result</label>
                                                    <button 
                                                        onClick={() => setEditedImage(null)} 
                                                        className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded"
                                                    >
                                                        <Trash2 size={12} /> Clear
                                                    </button>
                                                </div>
                                                <div className="aspect-video rounded-lg overflow-hidden border border-white/10 relative group">
                                                    <img src={editedImage} alt="Edited" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button 
                                                            onClick={() => addImageLayer(editedImage, 'AI Edited Image')}
                                                            className="bg-white text-black px-3 py-1.5 rounded-md text-xs font-bold transform scale-90 group-hover:scale-100 transition-transform flex items-center gap-1 shadow-lg"
                                                        >
                                                            <Layers size={12} /> Add to Timeline
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'voice' ? (
                            <div className="space-y-6">
                                {/* Voice Mode Switcher */}
                                <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                                    <button 
                                        onClick={() => setVoiceMode('standard')} 
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${voiceMode === 'standard' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Select Voice
                                    </button>
                                    <button 
                                        onClick={() => setVoiceMode('cloning')} 
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${voiceMode === 'cloning' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Clone Voice
                                    </button>
                                </div>

                                {voiceMode === 'standard' ? (
                                    <>
                                        <div className="space-y-3">
                                            <label className="text-xs text-gray-400 font-medium uppercase">Select AI Voice</label>
                                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                                {allVoices.map(voice => (
                                                    <div key={voice.id} 
                                                        className={`relative flex items-center gap-2 p-2 rounded-xl border transition-all ${selectedVoice === voice.id ? 'bg-white/10 border-primary' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                                    >
                                                        {/* If editing this voice */}
                                                        {voice.isCustom && editingVoiceId === voice.id ? (
                                                            <div className="flex-1 flex items-center gap-2">
                                                                <input 
                                                                    className="flex-1 bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white focus:border-primary outline-none"
                                                                    value={editNameValue}
                                                                    onChange={e => setEditNameValue(e.target.value)}
                                                                    autoFocus
                                                                />
                                                                <button onClick={saveEdit} className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"><Check size={12} /></button>
                                                                <button onClick={cancelEdit} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"><X size={12} /></button>
                                                            </div>
                                                        ) : (
                                                            /* Normal View */
                                                            <div className="flex-1 flex items-center gap-3 cursor-pointer overflow-hidden" onClick={() => setSelectedVoice(voice.id)}>
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${voice.color}`}>
                                                                    <Volume2 size={14} className="text-white" />
                                                                </div>
                                                                <div className="text-left min-w-0 flex-1">
                                                                    <div className="text-sm font-medium text-white truncate flex items-center gap-1">
                                                                        {voice.name}
                                                                        {voice.isCustom && <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-1 rounded border border-indigo-500/30">CLONED</span>}
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-400 truncate">{voice.style}</div>
                                                                </div>
                                                                {selectedVoice === voice.id && !voice.isCustom && <CheckCircle2 size={14} className="text-primary shrink-0" />}
                                                            </div>
                                                        )}

                                                        {/* Action Buttons for Custom Voices (not editing) */}
                                                        {voice.isCustom && editingVoiceId !== voice.id && (
                                                            <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                                                                <button onClick={(e) => { e.stopPropagation(); startEditing(voice as any); }} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded">
                                                                    <Edit2 size={12} />
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); deleteVoice(voice.id); }} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {selectedVoice === voice.id && voice.isCustom && editingVoiceId !== voice.id && <CheckCircle2 size={14} className="text-primary shrink-0 ml-1" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 font-medium uppercase">Voice Settings</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-white/5 rounded-lg p-2">
                                                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                                        <span>Speed</span>
                                                        <span>{voiceSpeed}x</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="0.5" 
                                                        max="2.0" 
                                                        step="0.1" 
                                                        value={voiceSpeed}
                                                        onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                                                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                                                    />
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-2">
                                                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                                        <span>Pitch</span>
                                                        <span>{voicePitch > 0 ? '+' : ''}{voicePitch}</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="-10" 
                                                        max="10" 
                                                        step="1" 
                                                        value={voicePitch}
                                                        onChange={(e) => setVoicePitch(parseInt(e.target.value))}
                                                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-1">
                                                <label className="text-[10px] text-gray-400 font-medium uppercase mb-1 block">Output Language</label>
                                                <div className="relative">
                                                    <select 
                                                        value={voiceLanguage}
                                                        onChange={(e) => setVoiceLanguage(e.target.value)}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg p-2 pl-8 text-xs text-white outline-none focus:border-primary appearance-none"
                                                    >
                                                        {SUPPORTED_LANGUAGES.map(lang => (
                                                            <option key={lang} value={lang}>{lang}</option>
                                                        ))}
                                                    </select>
                                                    <Globe size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 font-medium uppercase">Script to Speech</label>
                                            <textarea 
                                                value={voiceText}
                                                onChange={(e) => setVoiceText(e.target.value)}
                                                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white h-24 resize-none focus:border-primary outline-none leading-relaxed" 
                                                placeholder="Enter text to generate speech..." 
                                            />
                                        </div>

                                        <button 
                                            onClick={handleGenerateVoice}
                                            disabled={isGeneratingVoice || !voiceText}
                                            className="w-full bg-primary hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                        >
                                            {isGeneratingVoice ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Mic size={16} />
                                                    Generate Voiceover
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2 items-start">
                                            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-amber-200 leading-relaxed">
                                                <strong>Important:</strong> By cloning a voice, you confirm you have the rights and consent to use this voice. Unauthorized cloning of celebrity or private voices is prohibited.
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs text-gray-400 font-medium">Voice Name</label>
                                            <input 
                                                type="text" 
                                                value={cloneName}
                                                onChange={(e) => setCloneName(e.target.value)}
                                                placeholder="e.g. My Podcast Voice"
                                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-primary outline-none"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs text-gray-400 font-medium">Audio Sample (10s - 30s)</label>
                                            <div className="border border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors relative">
                                                <UploadCloud size={24} className="text-gray-500" />
                                                <div className="text-xs text-gray-400 text-center">
                                                    {cloneFile ? (
                                                        <span className="text-primary font-medium">{cloneFile.name}</span>
                                                    ) : (
                                                        <>
                                                            <span className="text-white font-medium">Click to upload</span> or drag & drop
                                                            <br/>MP3, WAV, M4A
                                                        </>
                                                    )}
                                                </div>
                                                <input 
                                                    type="file" 
                                                    accept="audio/*"
                                                    onChange={handleFileUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                {cloneFile && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setCloneFile(null); }}
                                                        className="absolute top-2 right-2 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleCloneVoice}
                                            disabled={isCloning || !cloneName || !cloneFile}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2"
                                        >
                                            {isCloning ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Cloning Voice Model...
                                                </>
                                            ) : (
                                                <>
                                                    <Wand2 size={16} />
                                                    Start Cloning Process
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                                
                                <p className="text-[10px] text-gray-500 text-center">
                                    Generated audio will be added to the timeline at the playhead position.
                                </p>
                            </div>
                        ) : activeTab === 'media' ? (
                             <div className="space-y-3">
                                <button className="w-full border border-dashed border-white/20 hover:border-white/40 rounded-lg p-4 flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300 transition-all">
                                    <Upload size={20} />
                                    <span className="text-xs">Upload Files</span>
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    {[1,2,3,4,5,6].map(i => (
                                        <div key={i} className="aspect-video bg-gray-800 rounded overflow-hidden relative group cursor-pointer">
                                            <img src={`https://picsum.photos/200/150?random=${i+20}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                             </div>
                        ) : (
                            <div className="text-center text-gray-500 text-xs mt-10">Assets Mockup</div>
                        )}
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-black relative flex flex-col">
                    <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
                        {/* Grid Background */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                        
                        {/* Video Player Placeholder */}
                        <div className="aspect-[9/16] h-full max-h-[600px] bg-black border border-white/10 shadow-2xl relative overflow-hidden group">
                             <img src={generatedImg || editedImage || "https://picsum.photos/720/1280?random=99"} className="w-full h-full object-cover" />
                             
                             {/* Overlay Text Simulation */}
                             <div className="absolute top-1/4 left-0 right-0 text-center px-4">
                                <h2 className="text-4xl font-black text-white drop-shadow-lg font-sans uppercase italic tracking-tighter" 
                                    style={{ textShadow: '3px 3px 0 #000' }}>
                                    {initialScript ? initialScript.hook.substring(0, 20) + "..." : "VIRAL HOOK HERE"}
                                </h2>
                             </div>

                             {/* Controls Overlay */}
                             <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-6">
                                <button className="text-white hover:text-primary"><SkipBack size={24} /></button>
                                <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:scale-110 transition-transform">
                                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                                </button>
                                <button className="text-white hover:text-primary"><SkipForward size={24} /></button>
                             </div>
                        </div>
                    </div>

                    {/* Timeline Area */}
                    <div className="h-64 bg-[#121214] border-t border-white/10 flex flex-col">
                        {/* Timeline Tools */}
                        <div className="h-10 border-b border-white/5 flex items-center px-4 gap-4 justify-between">
                             <div className="flex gap-2">
                                <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"><Scissors size={14} /></button>
                                <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"><Copy size={14} /></button>
                             </div>
                             <div className="text-xs font-mono text-gray-500">{formatTime(progress)} / 00:60</div>
                             <div className="w-32">
                                 {/* Zoom slider mock */}
                                 <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                     <div className="h-full w-1/2 bg-gray-600"></div>
                                 </div>
                             </div>
                        </div>

                        {/* Timeline Tracks */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden relative p-4 space-y-2 custom-scrollbar">
                            {/* Playhead */}
                            <div className="absolute top-0 bottom-0 w-[2px] bg-primary z-10 pointer-events-none transition-all duration-75" style={{ left: `${progress}%` }}>
                                <div className="w-3 h-3 bg-primary rotate-45 -ml-[5px] -mt-1.5"></div>
                            </div>

                            {/* Time Ruler Mock */}
                            <div className="flex justify-between text-[10px] text-gray-600 font-mono mb-2 px-1 select-none">
                                <span>00:00</span><span>00:15</span><span>00:30</span><span>00:45</span><span>01:00</span>
                            </div>

                            {layers.map((layer) => (
                                <div key={layer.id} className="relative h-10 bg-white/5 rounded-lg overflow-hidden group">
                                    <div 
                                        className={`absolute top-1 bottom-1 rounded-md ${layer.color} opacity-80 hover:opacity-100 cursor-pointer flex items-center px-2`}
                                        style={{ left: `${layer.start}%`, width: `${layer.duration}%` }}
                                    >
                                        <span className="text-[10px] font-medium text-white truncate drop-shadow-md">{layer.name}</span>
                                        {/* Handles */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 hover:bg-white cursor-ew-resize"></div>
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 hover:bg-white cursor-ew-resize"></div>
                                    </div>
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