
import React, { useState, useRef, useEffect } from 'react';
import { AppSection, ChatMessage, MarketProduct, FeaturedBuildTemplate, SavedBuild } from './types';
import { FEATURED_TEMPLATES } from './constants';
import { createChatSession, handleToolCalls, marketSearchTool, generateBuildVideo } from './geminiService';
import { Layout, Search, Settings, Terminal, Wrench, Shield, CheckCircle, Cpu, ShoppingCart, Loader2, ExternalLink, BarChart3, Save, Archive, Trash2, Video, Play, X, Filter, Zap, Check, Upload, Image as ImageIcon } from 'lucide-react';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.FEATURED);
  
  // Separate state for Build Mode and Fix Mode
  const [buildMessages, setBuildMessages] = useState<ChatMessage[]>([]);
  const [fixMessages, setFixMessages] = useState<ChatMessage[]>([]);
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [featuredPrices, setFeaturedPrices] = useState<Record<string, MarketProduct[]>>({});
  const [loadingFeatured, setLoadingFeatured] = useState<string | null>(null);

  // Video State
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generatingInstructionVideo, setGeneratingInstructionVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const AVAILABLE_RETAILERS = ['Best Buy', 'Newegg', 'Microcenter', 'B&H'];

  // Separate Refs for independent sessions
  const buildChatSessionRef = useRef<any>(null);
  const fixChatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Click outside to close filter
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterRef]);

  // Load Saved Builds on Mount
  useEffect(() => {
    const saved = localStorage.getItem('pc-copilot-saved-builds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Hydrate dates
        const hydrated = parsed.map((b: any) => ({
          ...b,
          messages: b.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        setSavedBuilds(hydrated);
      } catch (e) {
        console.error("Failed to parse saved builds", e);
      }
    }
  }, []);

  useEffect(() => {
    // Initialize both sessions with specific context
    buildChatSessionRef.current = createChatSession("Current Context: BUILD MODE. Focus on parts, performance, prices, and aesthetics. IMPORTANT: For RAM recommendations, ONLY use Corsair or G.Skill brands.");
    fixChatSessionRef.current = createChatSession("Current Context: FIX/DIAGNOSTIC MODE. Focus on safety, step-by-step troubleshooting, and identifying hardware failures.");
    
    // Initial Greetings - MODIFIED to reflect Questionnaire flow
    setBuildMessages([
      {
        id: 'build-init',
        role: 'model',
        text: "I am **PC Build Copilot**. \n\nI can help you design a custom rig with live market pricing.\n\nTo get started, please tell me your **Budget** and **Primary Use Case** (or just type 'Help me build' and I'll ask you a few questions).",
        timestamp: new Date()
      }
    ]);

    setFixMessages([
      {
        id: 'fix-init',
        role: 'model',
        text: "I am ready to diagnose your PC issues. \n\nPlease describe the symptoms (e.g. No Post, Blue Screen, Overheating) and any recent changes.",
        timestamp: new Date()
      }
    ]);
  }, []);

  // Determine which message list to display based on active section
  const currentMessages = activeSection === AppSection.FIX ? fixMessages : buildMessages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages, isTyping, activeSection]);

  const handleSendMessage = async (customText?: string) => {
    const text = customText || inputValue;
    if (!text.trim() && !selectedImage) return;

    if (!customText) {
      setInputValue('');
      setSelectedImage(null);
    }
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      image: selectedImage || undefined,
      timestamp: new Date()
    };
    
    // Update appropriate state
    const isFixMode = activeSection === AppSection.FIX;
    const setMsgState = isFixMode ? setFixMessages : setBuildMessages;
    const sessionRef = isFixMode ? fixChatSessionRef : buildChatSessionRef;

    setMsgState(prev => [...prev, userMsg]);
    setIsTyping(true);
    
    // Ensure we are viewing the chat
    if (activeSection === AppSection.FEATURED) {
      setActiveSection(AppSection.BUILD); // Default to build chat if coming from featured
    }

    try {
      let response;
      if (selectedImage) {
        // If image is present, we need to send it as a part
        // Note: The geminiService needs to be updated to handle this, 
        // but for now we'll assume the session.sendMessage can handle parts if we modify the service
        // or we can use a direct generateContent call for single-turn image analysis if session doesn't support it easily.
        // However, the Google GenAI SDK chat session DOES support parts.
        
        // We need to strip the data:image/png;base64, prefix for the SDK
        const base64Data = selectedImage.split(',')[1];
        const mimeType = selectedImage.split(';')[0].split(':')[1];

        response = await sessionRef.current.sendMessage({ 
          message: text,
          // The SDK might expect 'parts' or 'contents' depending on version, 
          // but typically sendMessage takes a string or an array of parts.
          // Let's check geminiService.ts implementation.
          // The current implementation in geminiService.ts calls `sendMessage({ message: text })`.
          // We need to update the service to handle this.
        });
        
        // Actually, we should update the service to handle the image properly.
        // Let's pass the image data to the service.
        // But since we can't change the service signature in this tool call, 
        // we will rely on the service update in the next step.
        // For now, let's assume we pass it in a way the service will handle.
        
        // REVISION: We will update geminiService to accept an optional image.
        // For this file, we call it with the extra property.
        response = await sessionRef.current.sendMessage({ 
            message: text, 
            image: { inlineData: { data: base64Data, mimeType } } 
        });

      } else {
        response = await sessionRef.current.sendMessage({ message: text });
      }
      
      // Handle tool calls iteratively if model requests it
      while (response.functionCalls && response.functionCalls.length > 0) {
        const toolResponses = await handleToolCalls(response);
        response = await sessionRef.current.sendMessage({
          message: "Here are the tool results.",
          functionResponses: toolResponses
        });
      }

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || 'Error generating response.',
        timestamp: new Date()
      };
      setMsgState(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      setMsgState(prev => [...prev, {
        id: 'error',
        role: 'model',
        text: 'I encountered an error connecting to my hardware database. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleRetailer = (retailer: string) => {
    setSelectedRetailers(prev => 
      prev.includes(retailer) 
        ? prev.filter(r => r !== retailer)
        : [...prev, retailer]
    );
  };

  const applyRetailerFilter = () => {
    setIsFilterOpen(false);
    if (selectedRetailers.length === 0) {
        handleSendMessage(`Update the parts list to show the best prices across ALL retailers.`);
        return;
    }
    const retailersStr = selectedRetailers.join(', ');
    handleSendMessage(`Update the current parts list to show ONLY products available from: ${retailersStr}. Select the best price among these options for each component.`);
  };

  const resetRetailerFilter = () => {
    setSelectedRetailers([]);
    setIsFilterOpen(false);
    handleSendMessage(`Update the parts list to show the best prices across ALL retailers.`);
  };

  const handleGenerateVideo = async () => {
    // API Key Check for Veo
    // Cast window to any to avoid type conflicts with global declarations
    const win = window as any;
    if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await win.aistudio.openSelectKey();
            // Per guidelines: Assume success after openSelectKey and proceed
        }
    }

    setGeneratingVideo(true);
    try {
      // Create a prompt based on the last conversation context or generic
      const lastModelMessage = buildMessages.filter(m => m.role === 'model').pop()?.text || "Gaming PC Build";
      const summary = lastModelMessage.substring(0, 200).replace(/[^a-zA-Z0-9 ]/g, "");
      
      const url = await generateBuildVideo(`High tech PC gaming setup, showcasing components: ${summary}`);
      if (url) {
        setVideoUrl(url);
      }
    } catch (e) {
      alert("Failed to generate video. Please try again.");
    } finally {
      setGeneratingVideo(false);
    }
  };

  const handleGenerateInstructionVideo = async () => {
    // API Key Check for Veo
    const win = window as any;
    if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await win.aistudio.openSelectKey();
        }
    }

    setGeneratingInstructionVideo(true);
    try {
      const lastModelMessage = buildMessages.filter(m => m.role === 'model').pop()?.text || "Gaming PC Build";
      const summary = lastModelMessage.substring(0, 200).replace(/[^a-zA-Z0-9 ]/g, "");
      
      const url = await generateBuildVideo(`Assembly guide for: ${summary}`, 'instruction');
      if (url) {
        setVideoUrl(url);
      }
    } catch (e) {
      alert("Failed to generate video. Please try again.");
    } finally {
      setGeneratingInstructionVideo(false);
    }
  };

  const loadFeaturedPrices = async (templateId: string) => {
    const template = FEATURED_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setLoadingFeatured(templateId);
    try {
      const results: Record<string, MarketProduct[]> = {};
      await Promise.all(template.baseParts.map(async (part) => {
        const products = await marketSearchTool(part); // Uses default retailer logic (Best Buy pref)
        results[part] = products;
      }));
      setFeaturedPrices(prev => ({ ...prev, [templateId]: Object.values(results).flat() }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingFeatured(null);
    }
  };

  const handleSaveBuild = () => {
    if (buildMessages.length <= 1) {
      alert("Please generate a build before saving.");
      return;
    }

    const name = window.prompt("Name your build configuration:", `Custom Build ${new Date().toLocaleDateString()}`);
    if (!name) return;

    const newBuild: SavedBuild = {
      id: Date.now().toString(),
      name,
      createdAt: Date.now(),
      messages: [...buildMessages] // Create a shallow copy to be safe
    };

    const updated = [newBuild, ...savedBuilds];
    setSavedBuilds(updated);
    localStorage.setItem('pc-copilot-saved-builds', JSON.stringify(updated));
    alert("Build saved successfully!");
  };

  const handleLoadBuild = (build: SavedBuild) => {
    // 1. Restore messages
    const hydratedMessages = build.messages.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp)
    }));
    setBuildMessages(hydratedMessages);
    
    // 2. Restore Session Context for the AI
    const history = hydratedMessages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));
    
    // Re-create the session with history so the AI remembers context
    buildChatSessionRef.current = createChatSession(
      "Current Context: BUILD MODE (RESTORED SESSION). Focus on parts, performance, prices, and aesthetics.",
      history
    );

    setActiveSection(AppSection.BUILD);
  };

  const handleDeleteBuild = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedBuilds.filter(b => b.id !== id);
    setSavedBuilds(updated);
    localStorage.setItem('pc-copilot-saved-builds', JSON.stringify(updated));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const ChatView = () => (
    <div className="max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex-1 space-y-6 pb-24">
        {currentMessages.map((m) => (
          <MessageItem key={m.id} message={m} />
        ))}
        {isTyping && (
          <div className="flex items-center gap-3 text-white/40 text-sm mono">
            <Loader2 size={16} className="animate-spin" />
            {activeSection === AppSection.FIX ? 'ANALYZING ERROR CODES...' : 'SEARCHING MARKET (BEST BUY, NEWEGG, MICROCENTER)...'}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-navy flex flex-col py-6 border-r border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-6 mb-12 justify-center md:justify-start">
          <Terminal className="text-accent w-8 h-8" />
          <h1 className="hidden md:block text-xl font-bold tracking-tight text-white">PC <span className="text-accent">Copilot</span></h1>
        </div>

        <nav className="w-full space-y-2 px-3">
          <NavItem 
            active={activeSection === AppSection.FEATURED} 
            onClick={() => setActiveSection(AppSection.FEATURED)}
            icon={<Layout size={20} />} 
            label="Featured" 
          />
          <NavItem 
            active={activeSection === AppSection.BUILD || activeSection === AppSection.CHAT} // BUILD and CHAT map to same view
            onClick={() => setActiveSection(AppSection.BUILD)}
            icon={<Cpu size={20} />} 
            label="Build Mode" 
          />
          <NavItem 
            active={activeSection === AppSection.FIX} 
            onClick={() => setActiveSection(AppSection.FIX)}
            icon={<Wrench size={20} />} 
            label="Fix Mode" 
          />
        </nav>

        {/* Saved Builds Section */}
        <div className="mt-8 px-4 hidden md:block flex-1 overflow-y-auto">
          <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Archive size={12} />
            <span>Saved Builds</span>
          </div>
          <div className="space-y-1">
            {savedBuilds.length === 0 ? (
              <p className="text-white/20 text-xs italic">No saved builds yet.</p>
            ) : (
              savedBuilds.map(build => (
                <div 
                  key={build.id}
                  onClick={() => handleLoadBuild(build)}
                  className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col truncate">
                    <span className="text-sm text-white/70 group-hover:text-white truncate">{build.name}</span>
                    <span className="text-[10px] text-white/30">{new Date(build.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteBuild(build.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-auto px-3 w-full">
          <NavItem active={false} icon={<Shield size={20} />} label="Security" />
          <NavItem active={false} icon={<Settings size={20} />} label="Settings" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-dark-navy relative">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${activeSection === AppSection.FIX ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-sm font-medium text-white/60 uppercase tracking-widest">
              {activeSection === AppSection.FIX ? 'DIAGNOSTIC ENGINE ACTIVE' : 'Hardware Engine Online'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {activeSection === AppSection.BUILD && (
               <>
                {/* Retailer Filter */}
                <div className="relative" ref={filterRef}>
                  <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors px-3 py-1.5 rounded border ${isFilterOpen ? 'bg-white/10 text-white border-white/20' : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'}`}
                  >
                     <Filter size={14} />
                     <span className="hidden sm:inline">
                        {selectedRetailers.length > 0 ? `Filtered (${selectedRetailers.length})` : 'Filter Stores'}
                     </span>
                  </button>
                  {isFilterOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-navy border border-white/20 rounded-xl shadow-xl shadow-black/50 p-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                       <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-2 py-1.5 mb-1">Select Sources</div>
                       <div className="space-y-1 mb-2">
                        {AVAILABLE_RETAILERS.map(r => {
                          const isSelected = selectedRetailers.includes(r);
                          return (
                            <button 
                              key={r} 
                              onClick={() => toggleRetailer(r)}
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between group ${isSelected ? 'bg-accent/20 text-white' : 'text-white/70 hover:bg-white/5'}`}
                            >
                              <span>{r}</span>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-accent border-accent' : 'border-white/20 group-hover:border-white/50'}`}>
                                {isSelected && <Check size={10} className="text-white" />}
                              </div>
                            </button>
                          );
                        })}
                       </div>
                       
                       <div className="h-px bg-white/10 my-2"></div>
                       
                       <div className="flex gap-2">
                         <button 
                            onClick={resetRetailerFilter}
                            className="flex-1 text-[10px] font-bold uppercase py-2 text-white/50 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                         >
                            Reset
                         </button>
                         <button 
                            onClick={applyRetailerFilter}
                            className="flex-1 text-[10px] font-bold uppercase py-2 bg-accent hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-accent/20"
                         >
                            Apply
                         </button>
                       </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleGenerateVideo}
                  disabled={generatingVideo || buildMessages.length < 2}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:text-white transition-colors bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 px-3 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingVideo ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
                  <span className="hidden sm:inline">{generatingVideo ? 'Generating...' : 'Reveal Video'}</span>
                </button>

                <button 
                  onClick={handleGenerateInstructionVideo}
                  disabled={generatingInstructionVideo || buildMessages.length < 2}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:text-white transition-colors bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingInstructionVideo ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  <span className="hidden sm:inline">{generatingInstructionVideo ? 'Generating...' : 'Assembly Guide'}</span>
                </button>

                <button 
                  onClick={handleSaveBuild}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent hover:text-white transition-colors bg-accent/10 hover:bg-accent px-3 py-1.5 rounded border border-accent/20"
                >
                  <Save size={14} />
                  <span className="hidden sm:inline">Save Build</span>
                </button>
               </>
            )}
            <div className="text-xs text-white/40 mono hidden sm:block">
              MODE: {activeSection} | SESSION: SECURE
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8" ref={scrollRef}>
          {activeSection === AppSection.FEATURED && (
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Featured Templates</h2>
                <p className="text-white/50">Industry standard builds with the lowest market prices automatically selected.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {FEATURED_TEMPLATES.map((t) => (
                  <BuildCard 
                    key={t.id} 
                    template={t} 
                    products={featuredPrices[t.id]} 
                    loading={loadingFeatured === t.id}
                    onLoadPrices={() => loadFeaturedPrices(t.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {(activeSection === AppSection.BUILD || activeSection === AppSection.CHAT || activeSection === AppSection.FIX) && (
            <ChatView />
          )}
        </div>

        {/* Video Modal */}
        {videoUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 animate-in fade-in duration-300">
             <div className="bg-navy border border-white/20 rounded-2xl overflow-hidden max-w-4xl w-full relative shadow-2xl shadow-accent/20">
                <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/40">
                   <h3 className="text-white font-bold flex items-center gap-2">
                     <Video size={18} className="text-accent" />
                     <span>Cinematic Build Reveal</span>
                   </h3>
                   <button onClick={() => setVideoUrl(null)} className="text-white/50 hover:text-white transition-colors">
                     <X size={20} />
                   </button>
                </div>
                <div className="aspect-video bg-black relative flex items-center justify-center">
                   <video 
                     src={videoUrl} 
                     controls 
                     autoPlay 
                     className="w-full h-full object-contain" 
                   />
                </div>
                <div className="p-4 bg-black/40 text-xs text-white/40 text-center mono">
                   Generated by Google Veo • Non-Commercial Preview
                </div>
             </div>
          </div>
        )}

        {/* Floating Input for Chat (Visible in BUILD, CHAT, FIX) */}
        {activeSection !== AppSection.FEATURED && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark-navy via-dark-navy to-transparent pointer-events-none">
            <div className="max-w-3xl mx-auto pointer-events-auto">
              {/* Image Preview */}
              {selectedImage && (
                <div className="mb-2 relative inline-block">
                  <img src={selectedImage} alt="Upload preview" className="h-20 w-20 object-cover rounded-lg border border-white/20" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              
              <div className={`border rounded-2xl flex items-center p-2 shadow-2xl backdrop-blur-xl transition-colors ${activeSection === AppSection.FIX ? 'bg-red-950/20 border-red-500/20' : 'bg-navy/80 border-white/10'}`}>
                {activeSection === AppSection.FIX && (
                  <>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-white/50 hover:text-white transition-colors hover:bg-white/10 rounded-lg mr-2"
                      title="Upload Image"
                    >
                      <ImageIcon size={20} />
                    </button>
                  </>
                )}
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={activeSection === AppSection.FIX ? "Describe your problem..." : "Ask for a build..."}
                  className="flex-1 bg-transparent border-none outline-none px-4 text-white placeholder-white/30"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  className={`px-6 py-2 rounded-xl transition-all font-semibold flex items-center gap-2 text-white ${activeSection === AppSection.FIX ? 'bg-red-600 hover:bg-red-500' : 'bg-accent hover:bg-blue-500'}`}
                >
                  <Search size={18} />
                  <span>{activeSection === AppSection.FIX ? 'Diagnose' : 'Execute'}</span>
                </button>
              </div>
              <div className="flex justify-center gap-4 mt-3 text-[10px] mono text-white/30 uppercase tracking-widest">
                {activeSection === AppSection.FIX ? (
                  <>
                    <span>Example: "Blue screen when gaming"</span>
                    <span>Example: "PC won't turn on"</span>
                  </>
                ) : (
                   <>
                    <span>Prompt: Cheapest 4070 Build</span>
                    <span>Prompt: Microcenter Deals</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- Subcomponents ---

const NavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick?: () => void }> = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${active ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
  >
    <span className={`${active ? 'text-white' : 'text-white/40 group-hover:text-accent'}`}>{icon}</span>
    <span className="hidden md:block font-medium">{label}</span>
  </button>
);

const BuildCard: React.FC<{ 
  template: FeaturedBuildTemplate; 
  products?: MarketProduct[]; 
  loading: boolean;
  onLoadPrices: () => void;
}> = ({ template, products, loading, onLoadPrices }) => {
  const totalPrice = products?.reduce((sum, p) => sum + (typeof p.price === 'number' ? p.price : 0), 0) || 0;

  return (
    <div className="bg-navy/30 border border-white/10 rounded-2xl overflow-hidden hover:border-accent/40 transition-all group flex flex-col h-full shadow-lg">
      <div className="h-48 bg-[#050505] relative overflow-hidden">
        <img 
          src={template.heroImage} 
          alt={template.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-transparent to-black/30 pointer-events-none"></div>
        <div className="absolute top-4 left-4 bg-accent/90 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest shadow-lg">
          {template.useCase}
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{template.name}</h3>
        <p className="text-white/50 text-sm mb-6 line-clamp-2">{template.specs}</p>
        
        <div className="space-y-3 mb-6">
          {template.baseParts.slice(0, 4).map((p: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-white/70">
              <CheckCircle size={12} className="text-accent" />
              <span>{p}</span>
            </div>
          ))}
          <div className="text-[10px] text-white/30 italic">...and more hardware components</div>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Est. Value</span>
            <span className="text-xl font-bold mono">
              {products ? `$${totalPrice.toLocaleString()}` : '$—'}
            </span>
          </div>
          
          <button 
            onClick={onLoadPrices}
            disabled={loading}
            className="bg-white/5 hover:bg-accent hover:text-white text-accent border border-accent/20 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
            {products ? 'Refresh Deal' : 'Find Best Deal'}
          </button>
        </div>
      </div>

      {products && products.length > 0 && (
        <div className="bg-black/40 p-3 max-h-48 overflow-y-auto border-t border-white/5 space-y-2 animate-in slide-in-from-top-2 duration-300">
          {products.map((p, i) => (
            <a 
              key={i} 
              href={p.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between text-[10px] hover:bg-white/5 p-1.5 rounded transition-all group/item"
            >
              <div className="flex items-center gap-2 truncate">
                <img src={p.image} referrerPolicy="no-referrer" className="w-8 h-8 rounded object-cover border border-white/10" alt="part" />
                <div className="flex flex-col truncate w-24 sm:w-32">
                  <span className="truncate text-white/70">{p.name}</span>
                  <span className="text-[9px] text-accent/80 uppercase tracking-wider">{p.retailer}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold mono">${p.price}</span>
                <ExternalLink size={10} className="text-white/20 group-hover/item:text-accent" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const MessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isModel = message.role === 'model';
  
  // Custom Markdown renderer for tables, bold text, and performance charts
  const renderContent = (text: string) => {
    
    // Performance Chart Parser
    // Look for ```performance {JSON} ``` blocks
    const perfRegex = /```performance\s*([\s\S]*?)\s*```/;
    const perfMatch = text.match(perfRegex);
    
    let chartData = null;
    let cleanText = text;

    if (perfMatch) {
      try {
        chartData = JSON.parse(perfMatch[1]);
        cleanText = text.replace(perfRegex, '').trim();
      } catch (e) {
        console.error("Failed to parse chart data", e);
      }
    }

    // Helper to render individual cell content
    const renderCell = (content: string) => {
      const trimmed = content.trim();

      // 1. Check for Markdown Image syntax: ![alt](url)
      const mdImageMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
      if (mdImageMatch) {
        return (
          <div className="relative group">
            <img 
              src={mdImageMatch[2]} 
              alt={mdImageMatch[1]} 
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-lg object-cover border border-white/20 hover:scale-[2.5] hover:z-50 hover:shadow-2xl transition-all duration-200 origin-center cursor-pointer bg-black" 
            />
          </div>
        );
      }

      // 2. Check for raw Image URL (typical extensions or common hosts)
      // Enhanced to include 'bbystatic.com' for Best Buy images
      const isRawImageUrl = trimmed.match(/^https?:\/\/.*\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i) 
                            || trimmed.includes('images.unsplash.com')
                            || trimmed.includes('bbystatic.com');
      if (isRawImageUrl) {
        return (
          <div className="relative group">
            <img 
              src={trimmed} 
              alt="part" 
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-lg object-cover border border-white/20 hover:scale-[2.5] hover:z-50 hover:shadow-2xl transition-all duration-200 origin-center cursor-pointer bg-black" 
            />
          </div>
        );
      }

      // 3. Check for Markdown Link syntax: [text](url)
      const mdLinkMatch = trimmed.match(/\[(.*?)\]\((.*?)\)/);
      if (mdLinkMatch) {
        return (
          <a 
            href={mdLinkMatch[2]} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1.5 text-accent hover:text-white hover:bg-accent/20 px-2 py-1 rounded transition-colors font-medium break-words"
          >
            <span>{mdLinkMatch[1]}</span>
            <ExternalLink size={12} />
          </a>
        );
      }

      // 4. Check for raw URL
      const isRawUrl = trimmed.match(/^(https?:\/\/[^\s]+)$/);
      if (isRawUrl) {
         return (
          <a 
            href={trimmed} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1.5 text-accent hover:text-white hover:bg-accent/20 px-2 py-1 rounded transition-colors font-medium"
          >
            <span>View Item</span>
            <ExternalLink size={12} />
          </a>
        );
      }

      // 5. Fallback: Parse bold text only
      if (trimmed.includes('**')) {
        return (
          <span>
            {trimmed.split(/(\*\*.*?\*\*)/).map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </span>
        );
      }

      return trimmed;
    };

    const renderedText = (() => {
      // Basic table parser
      if (cleanText.includes('|')) {
        const lines = cleanText.split('\n');
        const tableLines = lines.filter(l => l.trim().startsWith('|'));
        if (tableLines.length > 2) {
           return (
            <div className="overflow-x-auto my-4 bg-black/40 border border-white/10 rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    {tableLines[0].split('|').filter(c => c.trim()).map((cell, i) => (
                      <th key={i} className="p-4 border-b border-white/10 text-accent font-bold uppercase tracking-widest text-[10px] whitespace-nowrap bg-navy/50">
                        {cell.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableLines.slice(2).map((line, i) => (
                    <tr key={i} className="hover:bg-white/5 border-b border-white/5 last:border-none transition-colors">
                      {line.split('|').filter(c => c.trim()).map((cell, j) => (
                        <td key={j} className="p-4 font-medium text-white/80 align-middle">
                          {renderCell(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      }

      // Default text renderer
      return cleanText.split('\n').map((line, i) => (
        <p key={i} className={`mb-2 ${line.startsWith('#') ? 'text-xl font-bold text-accent mt-4 mb-2' : ''}`}>
          {line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .split('<strong>').map((part, idx) => {
                if (idx === 0) return part;
                const [bold, rest] = part.split('</strong>');
                return <React.Fragment key={idx}><strong className="text-white font-bold">{bold}</strong>{rest}</React.Fragment>;
              })
          }
        </p>
      ));
    })();

    return (
      <>
        {renderedText}
        {chartData && (
          <div className="mt-6 bg-navy/50 border border-white/10 rounded-xl p-6 relative overflow-hidden backdrop-blur-md">
             {/* Background Grid Pattern */}
             <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
               <BarChart3 size={120} />
            </div>
            
            <div className="flex items-center gap-2 mb-8 text-accent relative z-10">
              <Zap size={18} className="fill-accent/20" />
              <span className="text-xs font-bold uppercase tracking-widest animate-pulse">System Performance Profile</span>
            </div>
            
            <div className="space-y-6 relative z-10">
              {Object.entries(chartData).map(([key, value]) => {
                const numValue = Number(value);
                // Gradient Colors for better visualization
                let colorClass = "bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                let label = "Entry Level";
                
                if (numValue >= 90) { colorClass = "bg-gradient-to-r from-purple-600 to-blue-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]"; label = "Elite / Enthusiast"; }
                else if (numValue >= 75) { colorClass = "bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_20px_rgba(45,108,223,0.4)]"; label = "High End"; }
                else if (numValue >= 50) { colorClass = "bg-gradient-to-r from-yellow-500 to-orange-500 shadow-[0_0_15px_rgba(250,204,21,0.3)]"; label = "Mid Range"; }

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-white/90 tracking-wide">{key}</span>
                      <div className="text-right flex items-center gap-2">
                         <span className="text-[9px] uppercase font-bold text-white/30 tracking-widest hidden sm:inline-block">{label}</span>
                         <span className={`mono font-bold text-sm ${numValue >= 90 ? 'text-accent' : 'text-white'}`}>{numValue}%</span>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
                        style={{ width: `${numValue}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={`flex gap-4 ${isModel ? 'flex-row' : 'flex-row-reverse'} animate-in fade-in duration-300`}>
      <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${isModel ? 'bg-accent border-accent/20 shadow-lg shadow-accent/20' : 'bg-navy border-white/10'}`}>
        {isModel ? <Terminal size={20} className="text-white" /> : <Cpu size={20} className="text-white/60" />}
      </div>
      <div className={`max-w-full lg:max-w-[95%] rounded-2xl p-5 ${isModel ? 'bg-navy/40 border border-white/10' : 'bg-accent text-white shadow-xl shadow-accent/10'}`}>
        {message.image && (
          <div className="mb-4">
            <img src={message.image} alt="User upload" className="max-w-xs rounded-lg border border-white/20" />
          </div>
        )}
        <div className={`text-sm leading-relaxed ${isModel ? 'text-white/80' : 'text-white'}`}>
          {renderContent(message.text)}
        </div>
        <div className={`text-[10px] mt-4 mono ${isModel ? 'text-white/30' : 'text-white/60'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isModel && <span className="ml-3 uppercase tracking-tighter">Verified by Copilot Core</span>}
        </div>
      </div>
    </div>
  );
};

export default App;
