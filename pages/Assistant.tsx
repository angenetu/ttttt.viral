import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI, getAIClient } from '../services/geminiService';
import { Send, Search, Mic, Globe, Radio, MessageSquare, AlertCircle, Loader2, MapPin, Brain, Paperclip, X, Video } from 'lucide-react';
import { Modality, LiveServerMessage } from '@google/genai';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    sources?: string[];
}

const Assistant: React.FC = () => {
    const [mode, setMode] = useState<'chat' | 'live'>('chat');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'model', text: 'Hello! I am your AI Assistant. Ask me anything, analyze a video, or find places on the map.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Capabilities
    const [useSearch, setUseSearch] = useState(false);
    const [useMaps, setUseMaps] = useState(false);
    const [useThinking, setUseThinking] = useState(false);
    
    // Attachment
    const [attachment, setAttachment] = useState<{data: string, mimeType: string, name: string} | null>(null);

    // Live API State
    const [isLiveConnected, setIsLiveConnected] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() && !attachment) return;
        
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input || (attachment ? `Analyzed ${attachment.name}` : '') };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        const currentAttachment = attachment;
        
        setInput('');
        setAttachment(null);
        setIsLoading(true);

        const response = await chatWithAI(currentInput || "Analyze this.", {
            useSearch,
            useMaps,
            useThinking,
            attachment: currentAttachment ? { data: currentAttachment.data, mimeType: currentAttachment.mimeType } : undefined
        });
        
        const botMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            role: 'model', 
            text: response.text,
            sources: response.sources 
        };
        setMessages(prev => [...prev, botMsg]);
        setIsLoading(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setAttachment({
                        data: ev.target.result as string,
                        mimeType: file.type,
                        name: file.name
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // --- LIVE API LOGIC (Same as before with minor tweaks) ---
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    function encode(bytes: Uint8Array) {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function decode(base64: string) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    }

    function createBlob(data: Float32Array): { data: string; mimeType: string } {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    }

    const startLiveSession = async () => {
        const ai = getAIClient();
        if(!ai) {
            alert("API Key missing");
            return;
        }
        setIsLiveConnected(true);
        try {
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = outputAudioContext;
            const outputNode = outputAudioContext.createGain();
            outputNode.connect(outputAudioContext.destination);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            let sum = 0;
                            for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
                            setAudioLevel(sum / inputData.length * 100);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                            source.onended = () => sourcesRef.current.delete(source);
                        }
                    },
                    onclose: () => setIsLiveConnected(false),
                    onerror: (err) => setIsLiveConnected(false)
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
                }
            });
        } catch (err) {
            console.error(err);
            setIsLiveConnected(false);
        }
    };

    const stopLiveSession = () => window.location.reload();

    return (
        <div className="flex flex-col h-full bg-[#09090b] p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                        <Globe className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
                        <p className="text-gray-400 text-sm">Gemini 3 Pro (Think), Maps, Video Analysis & Live API</p>
                    </div>
                </div>
                <div className="bg-surface p-1 rounded-lg border border-white/10 flex">
                    <button 
                        onClick={() => setMode('chat')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'chat' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <MessageSquare size={16} className="inline mr-2" /> Chat
                    </button>
                    <button 
                        onClick={() => setMode('live')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'live' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Radio size={16} className="inline mr-2" /> Live
                    </button>
                </div>
            </div>

            {mode === 'chat' && (
                <div className="flex-1 flex flex-col bg-surface border border-white/5 rounded-2xl overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white/10 text-gray-100 rounded-tl-none'}`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <p className="text-xs text-gray-400 font-bold mb-1">References:</p>
                                            <div className="flex flex-col gap-1">
                                                {msg.sources.map((source, idx) => (
                                                    <a key={idx} href={source} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate block">{source}</a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex justify-start">
                                <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none flex gap-2 items-center">
                                    <Loader2 size={16} className="animate-spin text-gray-400" />
                                    <span className="text-gray-400 text-sm">{useThinking ? 'Thinking deeply...' : 'Processing...'}</span>
                                </div>
                             </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-4 border-t border-white/10 bg-background/50 backdrop-blur-sm space-y-3">
                         {/* Tools & Attachments Bar */}
                         <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar">
                             <label className="flex items-center gap-2 cursor-pointer group bg-black/20 px-3 py-1.5 rounded-full border border-white/5 hover:border-white/20 transition-colors">
                                <input type="checkbox" className="hidden" checked={useThinking} onChange={e => { setUseThinking(e.target.checked); if(e.target.checked) { setUseMaps(false); setUseSearch(false); }}} />
                                <Brain size={14} className={useThinking ? 'text-purple-400' : 'text-gray-500'} />
                                <span className={`text-xs font-medium ${useThinking ? 'text-purple-400' : 'text-gray-400'}`}>Think Mode</span>
                             </label>

                             <label className={`flex items-center gap-2 cursor-pointer group bg-black/20 px-3 py-1.5 rounded-full border border-white/5 hover:border-white/20 transition-colors ${useThinking ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input type="checkbox" className="hidden" disabled={useThinking} checked={useMaps} onChange={e => { setUseMaps(e.target.checked); if(e.target.checked) setUseSearch(false); }} />
                                <MapPin size={14} className={useMaps ? 'text-green-400' : 'text-gray-500'} />
                                <span className={`text-xs font-medium ${useMaps ? 'text-green-400' : 'text-gray-400'}`}>Maps</span>
                             </label>

                             <label className={`flex items-center gap-2 cursor-pointer group bg-black/20 px-3 py-1.5 rounded-full border border-white/5 hover:border-white/20 transition-colors ${useThinking ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input type="checkbox" className="hidden" disabled={useThinking} checked={useSearch} onChange={e => { setUseSearch(e.target.checked); if(e.target.checked) setUseMaps(false); }} />
                                <Search size={14} className={useSearch ? 'text-accent' : 'text-gray-500'} />
                                <span className={`text-xs font-medium ${useSearch ? 'text-accent' : 'text-gray-400'}`}>Search</span>
                             </label>
                         </div>

                         {attachment && (
                            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg w-fit">
                                {attachment.mimeType.startsWith('image') ? <div className="w-4 h-4 bg-blue-500 rounded-sm" /> : <Video size={16} className="text-blue-400" />}
                                <span className="text-xs text-white truncate max-w-[200px]">{attachment.name}</span>
                                <button onClick={() => setAttachment(null)} className="ml-2 text-gray-400 hover:text-white"><X size={14} /></button>
                            </div>
                         )}

                         <div className="flex gap-2">
                            <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-colors">
                                <Paperclip size={20} />
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,video/*" />
                            
                            <input 
                                type="text" 
                                value={input} 
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder={useThinking ? "Ask a complex question..." : "Ask Gemini..."}
                                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={(!input.trim() && !attachment) || isLoading}
                                className="bg-primary hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all"
                            >
                                <Send size={20} />
                            </button>
                         </div>
                    </div>
                </div>
            )}

            {mode === 'live' && (
                <div className="flex-1 flex flex-col items-center justify-center bg-surface border border-white/5 rounded-2xl relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                         <div className={`w-64 h-64 rounded-full bg-primary blur-[100px] transition-all duration-200`} style={{ transform: `scale(${1 + audioLevel * 0.1})` }}></div>
                    </div>
                    <div className="z-10 text-center space-y-8">
                        <div>
                            <h3 className="text-3xl font-bold text-white mb-2">Conversational Mode</h3>
                            <p className="text-gray-400">Speak naturally with Gemini 2.5</p>
                        </div>
                        <div className="relative inline-block">
                            {isLiveConnected && <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>}
                            <button 
                                onClick={isLiveConnected ? stopLiveSession : startLiveSession}
                                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                                    isLiveConnected ? 'bg-red-500 hover:bg-red-600 scale-110' : 'bg-white/10 hover:bg-white/20 hover:scale-105'
                                }`}
                            >
                                <Mic size={48} className="text-white" fill={isLiveConnected ? "currentColor" : "none"} />
                            </button>
                        </div>
                        <div className="h-8">
                            {isLiveConnected ? (
                                <div className="flex items-center justify-center gap-2">
                                    <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
                                    <span className="text-green-400 text-sm font-medium">Live</span>
                                </div>
                            ) : <span className="text-gray-500 text-sm">Tap to start</span>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assistant;