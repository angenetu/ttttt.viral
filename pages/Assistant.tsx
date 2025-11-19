import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI, getAIClient } from '../services/geminiService';
import { Send, Search, Mic, Globe, Radio, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
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
        { id: '1', role: 'model', text: 'Hello! I am your AI Assistant. You can ask me questions, or use Live Mode for a voice conversation.' }
    ]);
    const [input, setInput] = useState('');
    const [useSearch, setUseSearch] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Live API State
    const [isLiveConnected, setIsLiveConnected] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Chat Handler
    const handleSendMessage = async () => {
        if (!input.trim()) return;
        
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        const response = await chatWithAI(userMsg.text, useSearch);
        
        const botMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            role: 'model', 
            text: response.text,
            sources: response.sources 
        };
        setMessages(prev => [...prev, botMsg]);
        setIsLoading(false);
    };

    // --- LIVE API LOGIC ---
    const audioContextRef = useRef<AudioContext | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // Helpers for Audio
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
                        console.log('Live Session Connected');
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            // Simple visualization hack
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
                    onclose: () => {
                        console.log('Live Session Closed');
                        setIsLiveConnected(false);
                    },
                    onerror: (err) => {
                        console.error('Live Session Error', err);
                        setIsLiveConnected(false);
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
                    }
                }
            });
            sessionPromiseRef.current = sessionPromise;
        } catch (err) {
            console.error(err);
            setIsLiveConnected(false);
        }
    };

    const stopLiveSession = async () => {
        // Close logic depends on SDK, usually we just stop stream and contexts
        // For this demo, we reload or simple cleanup
        if(sessionPromiseRef.current) {
            // There isn't a direct disconnect on the promise wrapper easily without saving the session object resolved
            // This is a simplified cleanup
            window.location.reload(); // Hard reset for audio contexts in this demo scope
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#09090b] p-6">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                        <Globe className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
                        <p className="text-gray-400 text-sm">Powered by Gemini 3 Pro & Live API</p>
                    </div>
                </div>
                <div className="bg-surface p-1 rounded-lg border border-white/10 flex">
                    <button 
                        onClick={() => setMode('chat')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'chat' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <MessageSquare size={16} className="inline mr-2" />
                        Chat
                    </button>
                    <button 
                        onClick={() => setMode('live')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'live' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Radio size={16} className="inline mr-2" />
                        Live Voice
                    </button>
                </div>
            </div>

            {/* CHAT MODE */}
            {mode === 'chat' && (
                <div className="flex-1 flex flex-col bg-surface border border-white/5 rounded-2xl overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white/10 text-gray-100 rounded-tl-none'}`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <p className="text-xs text-gray-400 font-bold mb-1">Sources:</p>
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
                                    <span className="text-gray-400 text-sm">Thinking...</span>
                                </div>
                             </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-4 border-t border-white/10 bg-background/50 backdrop-blur-sm">
                         <div className="max-w-4xl mx-auto flex flex-col gap-2">
                             <div className="flex items-center gap-2 mb-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${useSearch ? 'bg-accent' : 'bg-white/10 group-hover:bg-white/20'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${useSearch ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={useSearch} onChange={e => setUseSearch(e.target.checked)} />
                                    <span className={`text-xs font-medium ${useSearch ? 'text-accent' : 'text-gray-500'}`}>
                                        <Search size={12} className="inline mr-1" /> Use Google Search
                                    </span>
                                </label>
                             </div>
                             <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={input} 
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                    placeholder={useSearch ? "Ask me anything about current events..." : "Chat with Gemini 3 Pro..."}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!input.trim() || isLoading}
                                    className="bg-primary hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all"
                                >
                                    <Send size={20} />
                                </button>
                             </div>
                         </div>
                    </div>
                </div>
            )}

            {/* LIVE MODE */}
            {mode === 'live' && (
                <div className="flex-1 flex flex-col items-center justify-center bg-surface border border-white/5 rounded-2xl relative overflow-hidden">
                    {/* Background visual effect */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                         <div className={`w-64 h-64 rounded-full bg-primary blur-[100px] transition-all duration-200`} style={{ transform: `scale(${1 + audioLevel * 0.1})` }}></div>
                         <div className="w-96 h-96 rounded-full bg-accent blur-[120px] absolute -top-20 -right-20 opacity-50"></div>
                    </div>

                    <div className="z-10 text-center space-y-8">
                        <div>
                            <h3 className="text-3xl font-bold text-white mb-2">Conversational Mode</h3>
                            <p className="text-gray-400">Speak naturally with Gemini 2.5 (Native Audio)</p>
                        </div>

                        <div className="relative inline-block">
                            {isLiveConnected && (
                                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
                            )}
                            <button 
                                onClick={isLiveConnected ? stopLiveSession : startLiveSession}
                                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                                    isLiveConnected 
                                    ? 'bg-red-500 hover:bg-red-600 scale-110 ring-4 ring-red-500/30' 
                                    : 'bg-white/10 hover:bg-white/20 hover:scale-105 ring-4 ring-white/5'
                                }`}
                            >
                                <Mic size={48} className="text-white" fill={isLiveConnected ? "currentColor" : "none"} />
                            </button>
                        </div>

                        <div className="h-8 flex items-center justify-center gap-1">
                            {isLiveConnected ? (
                                <>
                                    <span className="flex h-3 w-3 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    <span className="text-green-400 text-sm font-medium ml-2">Live Connection Active</span>
                                </>
                            ) : (
                                <span className="text-gray-500 text-sm">Tap microphone to start</span>
                            )}
                        </div>
                    </div>
                    
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                         <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-full text-xs text-gray-400 flex items-center gap-2">
                            <AlertCircle size={12} />
                            <span>Uses 'gemini-2.5-flash-native-audio-preview-09-2025'</span>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assistant;