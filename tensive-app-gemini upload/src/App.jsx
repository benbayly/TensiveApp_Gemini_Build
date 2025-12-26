import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Calculator, 
  Camera, 
  ChevronRight, 
  PlayCircle, 
  FileText, 
  Menu, 
  X, 
  ArrowRight,
  CheckCircle,
  HardHat,
  Info,
  Mail,
  Send,
  Image as ImageIcon,
  Activity,
  Wind,
  MapPin,
  ShieldCheck,
  Bot,
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink
} from 'lucide-react';
import { createPortal } from 'react-dom';

// --- STYLES & CONFIG ---
const BRAND = {
  yellow: "bg-[#edb400]", 
  yellowText: "text-[#edb400]",
  black: "bg-[#222222]", 
  offWhite: "bg-[#d4d1cb]", 
};

import { BotLogic } from './lib/bot_logic';

// Initialize the brain
const botBrain = new BotLogic();

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isAssistantMaximized, setIsAssistantMaximized] = useState(false);
  
  // Chat/AI State
  const [chatHistory, setChatHistory] = useState([
    { 
      type: 'bot', 
      text: "I can help you get started on your repair. What are you working on?" 
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  // Scroll helper
  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
    setIsMenuOpen(false);
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, isTyping]);

  // Handle AI Response
  const handleSendMessage = async (text, type = 'text', imageUrl = null) => {
    if (!text && !imageUrl && type === 'text') return;
    
    // Add User Message
    if (text) {
      setChatHistory(prev => [...prev, { type: 'user', text }]);
    }
    if (imageUrl) {
        setChatHistory(prev => [...prev, { type: 'user', text: "Uploaded an image", image: imageUrl }]);
    }

    setInputValue("");
    
    // AI "Thinking"
    setIsTyping(true);
    
    try {
      // Ask the brain
      const response = await botBrain.processMessage(text || "Analyze this image", imageUrl);
      
      setIsTyping(false);
      
      // Handle different response types
      if (response.type === 'calculation_result') {
        setChatHistory(prev => [...prev, { 
          type: 'bot', 
          text: response.text 
        }, {
          type: 'calculator_result',
          data: response.data
        }]);
      } else if (response.type === 'knowledge') {
        setChatHistory(prev => [...prev, { 
          type: 'bot', 
          text: response.text 
        }, {
          type: 'knowledge_card',
          data: response.data
        }]);
      } else if (response.type === 'question') {
         // For multi-step flows (like calculator questions)
         setChatHistory(prev => [...prev, { 
          type: 'bot', 
          text: response.text,
          options: response.ui?.options
        }]);
      } else {
        setChatHistory(prev => [...prev, { 
          type: 'bot', 
          text: response.text,
          options: response.ui?.options,
          assets: response.assets
        }]);
      }
      
    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setChatHistory(prev => [...prev, { 
        type: 'bot', 
        text: "I'm having trouble connecting to the server. Please try again." 
      }]);
    }
  };

  // Reset Chat
  const resetChat = () => {
    botBrain.clearHistory();
    setChatHistory([
      { 
        type: 'bot', 
        text: "I can help you get started on your repair. What are you working on?" 
      }
    ]);
    setInputValue("");
  };

  // Lock body scroll when maximized
  useEffect(() => {
    if (isAssistantMaximized) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isAssistantMaximized]);

  return (
    <div className={`min-h-screen ${BRAND.offWhite} font-sans text-[#222222] pb-24 md:pb-0 selection:bg-[#edb400] selection:text-white overflow-x-hidden`}>
      {/* Inject Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Archivo Black', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#d4d1cb]/80 backdrop-blur-md border-b border-[#222222]/5 shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between px-4 h-18 max-w-6xl mx-auto py-3">
          {/* Logo Area */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo('home')}>
             {/* Logo Image */}
             <img 
               src="/Tensive Logo transparent.png" 
               alt="Tensive" 
               className="h-12 md:h-16 w-auto object-contain" 
             />
             
             {/* Divider & Subtitle */}
             <div className="hidden sm:flex border-l-2 border-[#edb400] pl-2 h-12 items-center">
               <img 
                 src="/lampak-logo.png" 
                 alt="Lampak" 
                 className="h-10 w-auto object-contain opacity-90" 
               />
             </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 font-bold text-sm uppercase tracking-wide text-[#222222]">
            <button onClick={() => scrollTo('guide')} className="hover:text-[#edb400] transition">Repair Assistant</button>
            <button onClick={() => scrollTo('calc')} className="hover:text-[#edb400] transition">Calculator</button>
            <button onClick={() => scrollTo('resources')} className="hover:text-[#edb400] transition">Training</button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setShowEmailCapture(true)}
               className="hidden md:flex bg-gradient-to-br from-[#222222] to-[#111111] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:from-[#edb400] hover:to-[#d9a300] hover:text-[#222222] transition shadow-lg rounded-xl"
             >
               My Projects
             </button>
             <button 
               onClick={() => setIsMenuOpen(!isMenuOpen)}
               className="md:hidden p-2 text-[#222222] hover:bg-black/5 rounded-lg"
             >
               {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
             </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#d4d1cb] border-b border-[#222222]/10 shadow-xl p-4 flex flex-col gap-2 md:hidden animate-in slide-in-from-top-2">
            <MenuButton icon={<HardHat size={18} />} label="Repair Assistant" onClick={() => scrollTo('guide')} />
            <MenuButton icon={<Calculator size={18} />} label="Material Calculator" onClick={() => scrollTo('calc')} />
            <MenuButton icon={<PlayCircle size={18} />} label="Training Videos" onClick={() => scrollTo('resources')} />
            <div className="h-px bg-[#222222]/10 my-2"></div>
            <button className="flex items-center justify-center w-full py-4 bg-[#222222] text-[#edb400] font-bold uppercase tracking-widest text-sm rounded-xl">
              Log In
            </button>
          </div>
        )}
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-24 w-full space-y-20 md:space-y-32">
        
        {/* HERO SECTION - SPOTLIGHT STYLE */}
        <section id="home" className="pt-8 md:pt-16 relative">
          
          {/* THE SPOTLIGHT BACKGROUND - STRETCHED 2X */}
          {/* h-[200%] creates the 2x stretch effect downwards */}
          <div className="absolute top-0 left-0 right-0 h-[200%] z-0 pointer-events-none overflow-hidden">
             {/* Main Beam: Radial Gradient from Right */}
             <div 
               className="absolute top-[-10%] right-[-15%] w-[70%] h-full opacity-30 blur-[80px]"
               style={{
                 background: 'radial-gradient(circle at 70% 30%, #edb400 0%, #b48a00 25%, transparent 60%)'
               }}
             ></div>
             
             {/* Secondary glow for depth */}
             <div className="absolute top-[20%] right-0 w-[40%] h-[40%] bg-[#edb400] blur-[150px] opacity-10"></div>

             {/* Bottom Fade Mask - Smoothed out transition */}
             <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#d4d1cb] to-transparent z-10"></div>
          </div>

          <div className="w-full max-w-[1600px] mx-auto px-4 md:px-12 grid md:grid-cols-2 gap-12 items-center relative z-10">
            
            {/* Left Content */}
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-700 max-w-xl ml-auto">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#222222] text-[#edb400] text-xs font-bold uppercase tracking-widest rounded-full shadow-lg border border-[#edb400]/20">
                  <CheckCircle size={14} />
                  <span className="flex items-center gap-2">
                    Compatible with 
                    <div className="relative h-4 w-14">
                      <img src="/sika-logo.png" alt="Sika" className="absolute bottom-0 left-1/2 -translate-x-1/2 h-20 max-w-none object-contain translate-y-4 z-10" />
                    </div>
                    LAM
                  </span>
                </div>
                
                <h2 className="text-5xl md:text-7xl font-display text-[#222222] uppercase leading-[0.9] tracking-tight drop-shadow-sm">
                  Roof repair <br />
                  <span className="inline-block bg-[#edb400] px-3 py-1 text-[#222222] rounded-xl box-decoration-clone shadow-sm">
                    Simplified.
                  </span>
                </h2>
                
                <p className="text-lg md:text-xl text-[#222222]/80 max-w-lg leading-relaxed font-medium">
                  Identify damage, calculate materials, and get step-by-step guidance right from the roof.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button 
                  onClick={() => scrollTo('guide')}
                  className="flex items-center justify-center gap-2 bg-gradient-to-br from-[#222222] to-[#000000] text-white px-8 py-4 font-bold uppercase tracking-wider hover:scale-[1.02] transition shadow-xl rounded-xl ring-1 ring-white/10"
                >
                  Start Diagnosis <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => scrollTo('calc')}
                  className="flex items-center justify-center gap-2 bg-white/40 backdrop-blur-sm border-2 border-[#222222] text-[#222222] px-8 py-4 font-bold uppercase tracking-wider hover:bg-[#edb400] hover:border-[#edb400] transition rounded-xl"
                >
                  Estimator
                </button>
              </div>
            </div>

            {/* Right Content - The Pop Out Box in the Spotlight */}
            <div className="relative hidden md:block h-[450px] perspective-[2000px] flex items-center justify-center">
               
               {/* FLOATING POP-OUT AI ASSISTANT BOX - WITH ADDED DROP SHADOW */}
               <div 
                  onClick={() => scrollTo('guide')}
                  className="relative w-80 bg-[#222222] text-white p-6 rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6),0_20px_50px_-12px_rgba(237,180,0,0.5)] cursor-pointer border border-[#edb400]/50 z-20 hover:scale-[1.02] hover:-rotate-1 transition-all duration-300 group translate-y-12 translate-x-[20%]"
               >
                  {/* Top Shine */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#edb400] to-transparent opacity-80"></div>
                  
                  {/* Bottom Shine */}
                  <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#edb400] to-transparent opacity-30"></div>

                  <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                     <span className="text-[#edb400] font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                       <Sparkles size={14} className="animate-sparkle" /> AI Assistant
                     </span>
                     <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#edb400] animate-pulse"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#edb400]/50"></span>
                     </div>
                  </div>
                  
                  {/* Chat Preview Effect */}
                  <div className="space-y-4 mb-6">
                     <div className="flex justify-end transform translate-x-2">
                       <div className="bg-white/10 backdrop-blur-md text-xs font-medium text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm border border-white/5">
                         Is this crack actionable?
                       </div>
                     </div>
                     <div className="flex justify-start transform -translate-x-1">
                        <div className="bg-[#edb400] text-[#222222] text-xs font-bold px-4 py-3 rounded-2xl rounded-tl-sm shadow-md flex items-center gap-2">
                           <Activity size={14} className="animate-spin-slow" />
                           Analyzing structure...
                        </div>
                     </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 mt-2 group-hover:bg-white/10 transition-all">
                    <p className="text-[10px] uppercase tracking-widest text-[#edb400] font-bold mb-1">Live Diagnosis</p>
                    <p className="text-xs text-white/70 leading-relaxed font-medium">
                      Tap to launch the repair assistant and identify roof issues instantly.
                    </p>
                  </div>
                  
                  {/* Floating Action Icon */}
                  <div className="absolute -bottom-5 -right-5 bg-[#edb400] text-[#222222] p-3 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform ring-4 ring-[#222222]">
                     <ArrowRight size={20} />
                  </div>
               </div>

            </div>

            {/* Mobile Mini AI Assistant */}
            <div className="md:hidden mt-8">
               <div 
                  onClick={() => setIsAssistantMaximized(true)}
                  className="relative w-full bg-[#222222] text-white p-5 rounded-2xl shadow-xl cursor-pointer border border-[#edb400]/30"
               >
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                     <span className="text-[#edb400] font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                       <Sparkles size={14} className="animate-sparkle" /> AI Assistant
                     </span>
                     <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#edb400] animate-pulse"></span>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <div className="bg-[#edb400] text-[#222222] p-2 rounded-lg">
                        <Activity size={16} className="animate-spin-slow" />
                     </div>
                     <div>
                        <p className="text-xs font-bold text-white">Ready to diagnose.</p>
                        <p className="text-[10px] text-white/60">Tap to start analysis.</p>
                     </div>
                     <ArrowRight size={16} className="ml-auto text-[#edb400]" />
                  </div>
               </div>
            </div>

          </div>
        </section>

        {/* REPAIR PLAN ROADMAP */}
        <section className="border-t border-[#222222]/10 pt-12 relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-12 gap-8 relative z-10">
          <div className="md:col-span-4 relative flex flex-col justify-center min-h-[300px]">
            {/* Large Background Icon */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-[#edb400] opacity-[0.08] pointer-events-none select-none z-0">
               <MapPin size={400} strokeWidth={0.5} />
            </div>

            <div className="relative z-10">
              <h3 className="font-display text-4xl uppercase leading-[0.9] mb-6 text-[#222222]">
                Your Roadmap<br/>to <span className="text-[#edb400] bg-[#222222] px-2 py-1 inline-block transform -rotate-1 mt-1">Repair.</span>
              </h3>
              <p className="text-[#222222]/70 text-base mb-8 font-medium max-w-xs">
                Follow these three steps to generate a comprehensive, engineer-approved repair strategy for your facility.
              </p>
              <button 
                onClick={() => scrollTo('guide')}
                className="flex items-center gap-2 bg-[#222222] text-white px-6 py-3 font-bold uppercase tracking-wider hover:bg-[#edb400] hover:text-[#222222] transition shadow-lg rounded-xl"
              >
                Start New Report <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div className="md:col-span-8 grid gap-4">
             <NumberedStep 
               number="01" 
               title="Identify The Damage" 
               desc="Utilize the AI assistant to guide your inspection and instantly classify critical defects like cracks, blisters, or punctures."
               icon={Bot}
             />
             <div className="h-px bg-[#222222]/10 mx-4"></div>
             <NumberedStep 
               number="02" 
               title="Upload Your Photos" 
               desc="Capture site photos and let the assistant handle the heavy lifting of technical verification and repair confirmation."
               icon={Camera}
             />
             <div className="h-px bg-[#222222]/10 mx-4"></div>
             <NumberedStep 
               number="03" 
               title="Generate Field Report" 
               desc="Create a professional, portable record of your field session. The system generates a comprehensive PDF with AI diagnosis, material manifest, and method statements."
               icon={FileText}
             />
          </div>
          </div>
        </section>

        {/* SECTION 1: THE HYBRID BOT */}
        <section id="guide" className="scroll-mt-28 max-w-6xl mx-auto px-4">
          <div className="flex items-end gap-4 mb-8 border-b-4 border-[#edb400] pb-4 inline-block pr-12 rounded-br-2xl">
             <h3 className="text-4xl font-display uppercase text-[#222222] leading-none">Repair<br/>Assistant</h3>
          </div>
          
          <MaximizableView isMaximized={isAssistantMaximized}>
          <div 
            onClick={() => {
              if (!isAssistantMaximized && window.innerWidth < 768) {
                setIsAssistantMaximized(true);
              }
            }}
            className={`bg-[#222222] border border-[#edb400]/20 overflow-hidden flex flex-col relative transition-all duration-300 ${
            isAssistantMaximized 
              ? 'w-full h-full rounded-xl' 
              : 'rounded-xl h-[600px] max-w-6xl mx-auto shadow-xl'
          }`}>
             
             {/* Header */}
             <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#222222] z-20">
                <span className="text-[#edb400] font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                  <Sparkles size={14} className="animate-sparkle" /> AI Assistant
                </span>
                
                {/* Maximize Toggle */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAssistantMaximized(!isAssistantMaximized);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10 flex items-center justify-center shadow-sm"
                  title={isAssistantMaximized ? "Minimize" : "Maximize"}
                >
                  {isAssistantMaximized ? <X size={20} /> : <Maximize2 size={20} />}
                </button>
             </div>

             {/* Chat Area */}
             <div ref={chatContainerRef} className="flex-1 p-4 md:p-8 space-y-6 bg-[#1a1a1a] overflow-y-auto relative scroll-smooth">
                
                {/* Sticky Header */}
                {chatHistory.length > 1 && (
                   <div className="sticky top-0 z-20 -mx-4 -mt-4 md:-mx-8 md:-mt-8 px-4 py-3 md:px-8 bg-[#1a1a1a]/95 backdrop-blur border-b border-white/5 flex items-center justify-between mb-6 shadow-sm">
                      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                         <button onClick={() => handleSendMessage("I have a crack.")} className="whitespace-nowrap px-3 py-1.5 bg-[#333333] border border-white/10 rounded-full text-xs font-bold text-white hover:bg-[#edb400] hover:text-[#222222] transition shadow-sm">
                           Crack
                         </button>
                         <button onClick={() => handleSendMessage("I have a puncture.")} className="whitespace-nowrap px-3 py-1.5 bg-[#333333] border border-white/10 rounded-full text-xs font-bold text-white hover:bg-[#edb400] hover:text-[#222222] transition shadow-sm">
                           Puncture
                         </button>
                         <button onClick={() => handleSendMessage("I need to calculate materials.", "calc")} className="whitespace-nowrap px-3 py-1.5 bg-[#333333] border border-white/10 rounded-full text-xs font-bold text-white hover:bg-[#edb400] hover:text-[#222222] transition shadow-sm">
                           <Calculator size={12} className="inline mr-1"/> Calc
                         </button>
                         <button onClick={() => setShowEmailCapture(true)} className="whitespace-nowrap px-3 py-1.5 bg-[#333333] border border-white/10 rounded-full text-xs font-bold text-white hover:bg-[#edb400] hover:text-[#222222] transition shadow-sm">
                           <FileText size={12} className="inline mr-1"/> Report
                         </button>
                      </div>
                      <button onClick={resetChat} className="flex items-center gap-1 text-xs font-bold text-white/40 hover:text-white uppercase tracking-wider ml-4 bg-white/5 px-2 py-1 rounded-lg hover:bg-white/10 transition">
                         <RotateCcw size={12} /> Restart
                      </button>
                   </div>
                )}

                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.type === 'bot' && (
                      <div className="flex flex-col gap-2 max-w-full">
                        <BotBubble text={msg.text} />
                        
                        {/* Render Assets Inline */}
                        {msg.assets && msg.assets.pdf && (
                            <div className="ml-14 mt-6 relative group max-w-sm animate-in slide-in-from-left-4">
                                {/* Floating Action Button - Top Right Overlap */}
                                <a 
                                    href={msg.assets.pdf} 
                                    target="_blank" 
                                    className="absolute -top-3 -right-3 z-20 bg-[#edb400] hover:bg-[#222222] hover:text-[#edb400] text-[#222222] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-xl transition-all flex items-center gap-1 border-2 border-white"
                                >
                                    Open PDF <ExternalLink size={12} />
                                </a>

                                {/* Glowing Image Container */}
                                <div className="relative rounded-xl overflow-hidden border-2 border-[#edb400] shadow-[0_0_25px_rgba(237,180,0,0.25)] bg-white h-64 w-full transition-transform hover:scale-[1.01] duration-300">
                                    {/* PDF Preview acting as Image */}
                                    {/* Aggressive cropping to hide browser PDF toolbars */}
                                    <iframe 
                                        src={`${msg.assets.pdf}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                                        className="w-[105%] h-[200%] -mt-[56px] -ml-[2.5%] pointer-events-none select-none" 
                                        title="PDF Preview"
                                        scrolling="no"
                                        tabIndex="-1"
                                    />
                                    {/* Overlay to prevent interaction and add gloss */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none mix-blend-multiply" />
                                </div>
                            </div>
                        )}

                        {msg.options && (
                          <div className="ml-14 flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-4">
                            {msg.options.map((opt, idx) => (
                              <button 
                                key={idx}
                                onClick={() => handleSendMessage(opt.label)}
                                className="bg-[#222222] border border-[#edb400]/30 text-[#edb400] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#edb400] hover:text-[#222222] transition shadow-sm"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {msg.type === 'user' && (
                      <div className="bg-white/10 backdrop-blur-md text-white border border-white/5 px-6 py-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-md">
                        {msg.image && (
                            <img src={msg.image} alt="User upload" className="max-w-full h-auto rounded-lg mb-2 border border-white/10" />
                        )}
                        {msg.text}
                      </div>
                    )}
                    {msg.type === 'calculator' && <CalculatorWidget />}
                    {msg.type === 'calculator_result' && (
                      <div className="bg-[#222222] border border-[#edb400]/20 p-4 rounded-2xl max-w-md animate-in slide-in-from-left-2">
                        <h4 className="text-[#edb400] font-bold uppercase text-xs tracking-widest mb-3">Material Manifest</h4>
                        <div className="space-y-2">
                          {msg.data.materials.map((mat, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                              <span className="text-white text-sm font-medium">{mat.name}</span>
                              <span className="text-[#edb400] font-bold">{mat.quantity} {mat.unit}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10 text-right">
                          <span className="text-white/40 text-xs uppercase font-bold">Total Area: {msg.data.totalArea} sq ft</span>
                        </div>
                      </div>
                    )}
                    {msg.type === 'knowledge_card' && (
                      <div className="bg-[#222222] border border-[#edb400]/20 p-4 rounded-2xl max-w-md animate-in slide-in-from-left-2">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText size={16} className="text-[#edb400]" />
                          <span className="text-[#edb400] font-bold uppercase text-xs tracking-widest">Vetted Procedure</span>
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2">{msg.data.title}</h4>
                        <p className="text-white/70 text-sm mb-4">{msg.data.content}</p>
                        {msg.data.steps && (
                          <div className="space-y-2 mb-4">
                            {msg.data.steps.map((step, idx) => (
                              <div key={idx} className="flex gap-3 text-sm text-white/80">
                                <span className="text-[#edb400] font-bold">{idx + 1}.</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.data.assets && (
                          <div className="flex gap-2">
                            {msg.data.assets.pdf && (
                              <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase rounded-lg transition">
                                View PDF
                              </button>
                            )}
                            {msg.data.assets.video && (
                              <button className="flex-1 py-2 bg-[#edb400] hover:bg-[#d9a300] text-[#222222] text-xs font-bold uppercase rounded-lg transition">
                                Watch Video
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {msg.type === 'training' && <TrainingWidget />}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#222222] border border-white/10 px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center justify-center">
                       <div className="w-6 h-6 border-2 border-[#edb400]/30 border-t-[#edb400] rounded-full animate-spin"></div>
                    </div>
                  </div>
                )}
                
                {/* Only show options if it's the start or bot asks */}
                {!isTyping && chatHistory.length < 3 && (
                  <div className="pl-0 md:pl-12 animate-in slide-in-from-bottom-4 duration-500 space-y-8 mt-6">
                     
                     {/* Identify Issue Section */}
                     <div>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Identify Issue</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <ChoiceButton label="Crack / Split" sub="Concrete or Membrane" onClick={() => handleSendMessage("I have a crack or split.")} />
                           <ChoiceButton label="Puncture / Hole" sub="Mechanical damage" onClick={() => handleSendMessage("There is a puncture hole.")} />
                           <ChoiceButton label="Flashing / Joint" sub="Wall or vent transition" onClick={() => handleSendMessage("Issue with flashing or joint.")} />
                        </div>
                     </div>
                     
                     {/* Tools & Actions Section */}
                     <div>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Tools & Actions</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <ChoiceButton label="Get Repair Instructions" icon={<FileText size={18}/>} iconBg="bg-[#fff9e6] text-[#edb400]" onClick={() => handleSendMessage("I need step-by-step instructions.")} />
                           <ChoiceButton label="Calculate Materials" icon={<Calculator size={18}/>} iconBg="bg-[#fff9e6] text-[#edb400]" onClick={() => handleSendMessage("I need to calculate materials.", "calc")} />
                           <ChoiceButton label="Training Videos" icon={<PlayCircle size={18}/>} iconBg="bg-[#fff9e6] text-[#edb400]" onClick={() => handleSendMessage("Show me training videos.", "training")} />
                           <ChoiceButton label="Upload Photo" icon={<ImageIcon size={18}/>} iconBg="bg-[#fff9e6] text-[#edb400]" onClick={() => handleSendMessage("I want to upload a photo.")} />
                           <ChoiceButton label="Get Field Report" icon={<Mail size={18}/>} iconBg="bg-[#fff9e6] text-[#edb400]" onClick={() => setShowEmailCapture(true)} />
                        </div>
                     </div>
                  </div>
                )}
             </div>

             {/* Hybrid Input Area */}
             <div className="p-2 bg-[#222222] border-t border-white/5 z-10">
                <div className="flex gap-2 items-center bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[#edb400] transition">
                   <button 
                     className="p-2 text-white/50 hover:text-white transition relative"
                     onClick={() => document.getElementById('file-upload').click()}
                   >
                     <Camera size={24} />
                     <input 
                        type="file" 
                        id="file-upload" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    handleSendMessage("Analyze this image for repair needs.", "text", reader.result);
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                     />
                   </button>
                   <input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                    placeholder="Ask anything (e.g., 'Can I apply over wet concrete?')"
                    className="flex-1 bg-transparent px-2 text-base focus:outline-none font-medium placeholder:text-white/30 text-white"
                   />
                   <button 
                     onClick={() => handleSendMessage(inputValue)}
                     className="bg-[#edb400] text-[#222222] p-3 hover:bg-[#d9a300] transition rounded-xl shadow-sm"
                   >
                     <Send size={20} className="ml-0.5" />
                   </button>
                </div>
             </div>
          </div>
          </MaximizableView>
        </section>

        {/* SECTION 2: CALCULATOR */}
        <section id="calc" className="scroll-mt-28 max-w-6xl mx-auto px-4">
          <div className="flex items-end gap-4 mb-8 border-b-4 border-[#222222] pb-4 inline-block pr-12 rounded-br-2xl">
             <h3 className="text-3xl font-display uppercase text-[#222222] leading-none">Material<br/>Estimator</h3>
          </div>

          <div className="bg-white rounded-3xl border border-[#222222]/5 p-6 md:p-10 shadow-xl">
             <div className="grid md:grid-cols-2 gap-12">
               
               {/* Inputs */}
               <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-3">Repair Context</label>
                    <div className="flex p-1 bg-[#f4f4f4] rounded-xl">
                      <button className="flex-1 py-3 bg-white shadow-sm text-sm font-bold text-[#222222] border border-[#222222]/10 rounded-lg">Spot Repair</button>
                      <button className="flex-1 py-3 text-sm font-bold text-[#222222]/50 hover:text-[#222222] rounded-lg">Full Roof</button>
                    </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-[#222222] uppercase tracking-wider mb-3">
                       Dimensions (Feet)
                     </label>
                     <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <input type="number" className="w-full p-4 bg-[#f4f4f4] border border-transparent focus:border-[#edb400] focus:bg-white focus:outline-none font-bold text-lg rounded-xl transition-all" />
                          <span className="absolute right-4 top-4 text-[#222222]/40 text-xs font-bold">LEN</span>
                        </div>
                        <div className="flex-1 relative">
                           <input type="number" className="w-full p-4 bg-[#f4f4f4] border border-transparent focus:border-[#edb400] focus:bg-white focus:outline-none font-bold text-lg rounded-xl transition-all" />
                           <span className="absolute right-4 top-4 text-[#222222]/40 text-xs font-bold">WID</span>
                        </div>
                     </div>
                  </div>

                  <button className="w-full py-5 bg-[#222222] text-[#edb400] font-bold uppercase tracking-widest hover:bg-black transition mt-4 rounded-xl shadow-lg">
                    Calculate Kits
                  </button>
               </div>

               {/* Results Placeholder */}
               <div className="bg-[#f4f4f4] border-2 border-dashed border-[#222222]/10 p-8 flex flex-col items-center justify-center text-center rounded-2xl">
                  <div className="h-16 w-16 bg-[#edb400] flex items-center justify-center text-[#222222] mb-4 rounded-2xl rotate-3">
                    <Info size={32} />
                  </div>
                  <h4 className="font-display uppercase text-xl text-[#222222]">Awaiting Data</h4>
                  <p className="text-[#222222]/60 mt-2 max-w-xs">Enter your dimensions to identify the correct Tensive® kit size.</p>
               </div>

             </div>
          </div>
        </section>

        {/* SECTION 3: RESOURCES */}
        <section id="resources" className="scroll-mt-28 pb-32 max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-display uppercase text-[#222222]">Field<br/>Training</h3>
            <button className="text-xs font-bold bg-[#222222] text-white px-4 py-2 uppercase tracking-wider hover:bg-[#edb400] hover:text-[#222222] transition rounded-lg">View All</button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
             <ResourceCard 
               title="Surface Preparation" 
               time="5:20" 
               thumbnail="bg-slate-200" 
               category="Basics"
               image="/Surface prep.png"
             />
             <ResourceCard 
               title="Detailing Corners" 
               time="12:45" 
               thumbnail="bg-slate-400" 
               category="Advanced"
               image="/Detail Application.png"
             />
             <ResourceCard 
               title="Wet Application" 
               time="8:10" 
               thumbnail="bg-slate-300" 
               category="Technique"
               image="/Wet application.png"
             />
          </div>
        </section>

      </main>

      {/* --- FLOATING MOBILE CTA --- */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-[#222222]/10 z-40 md:hidden">
         <button 
           onClick={() => setShowEmailCapture(true)}
           className="w-full flex items-center justify-center gap-2 bg-[#222222] text-[#edb400] py-4 font-bold uppercase tracking-widest shadow-lg rounded-xl"
         >
           <FileText size={18} />
           Get Field Report
         </button>
      </div>

      {/* --- MODALS --- */}
      {showEmailCapture && (
        <div className="fixed inset-0 z-[60] bg-[#222222]/80 backdrop-blur-sm flex items-center justify-center p-4">
           {/* Dark Gradient Modal Style Request */}
           <div className="bg-[#222222] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 rounded-3xl border border-[#edb400]/20">
              <div className="p-8 text-center space-y-4">
                 <div className="mx-auto bg-[#edb400] w-16 h-16 flex items-center justify-center text-[#222222] mb-2 rounded-2xl">
                    <FileText size={32} />
                 </div>
                 <h3 className="text-2xl font-display uppercase text-white">Get Custom<br/><span className="text-[#edb400]">Field Report</span></h3>
                 <p className="text-white/60 text-sm leading-relaxed">
                   Receive a comprehensive PDF containing your AI Diagnosis, Material Manifest, Method Statement, and Project Documentation.
                 </p>
                 
                 <div className="space-y-3 pt-4 text-left">
                    <label className="text-xs font-bold uppercase text-[#edb400] tracking-widest">Email Address</label>
                    <input type="email" placeholder="you@company.com" className="w-full p-4 bg-[#333333] text-white border border-transparent focus:border-[#edb400] focus:outline-none rounded-xl" />
                 </div>

                 <div className="pt-4 space-y-3">
                   <button className="w-full py-4 bg-[#edb400] text-[#222222] font-bold uppercase tracking-widest hover:bg-[#d9a300] transition rounded-xl">
                     Send Me The Plan
                   </button>
                   <button 
                     onClick={() => setShowEmailCapture(false)}
                     className="w-full py-2 text-white/40 font-bold text-xs uppercase tracking-widest hover:text-white"
                   >
                     Close
                   </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

// --- SUB-COMPONENTS ---

function NumberedStep({ number, title, desc, icon: Icon }) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center py-8 gap-8 group hover:bg-white/50 transition px-6 md:px-8 rounded-3xl border border-transparent hover:border-[#edb400]/10">
      <div className="flex items-center gap-6 min-w-[200px]">
        <span className="text-6xl font-display text-[#edb400] opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-sm">
          {number}
        </span>
        {/* Rounded line */}
        <div className="h-16 w-[4px] bg-[#222222]/10 group-hover:bg-[#222222] transition-colors rounded-full"></div>
      </div>
      
      {/* Icon Circle */}
      {Icon && (
        <div className="hidden md:flex h-20 w-20 bg-[#edb400] text-[#222222] items-center justify-center rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ring-4 ring-white">
           <Icon size={36} strokeWidth={1.5} />
        </div>
      )}

      <div>
        <h4 className="font-display uppercase text-2xl text-[#222222] mb-2">{title}</h4>
        <p className="text-[#222222]/70 text-base max-w-md leading-relaxed">{desc}</p>
      </div>
      <div className="hidden md:block ml-auto opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
         <ArrowRight className="text-[#edb400]" size={28} />
      </div>
    </div>
  )
}

function MenuButton({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 p-4 w-full hover:bg-white/50 rounded-xl text-left transition group">
      <div className="text-[#222222]/40 group-hover:text-[#edb400] transition-colors">{icon}</div>
      <span className="font-bold text-[#222222] uppercase tracking-wide text-sm">{label}</span>
    </button>
  )
}

function BotBubble({ text }) {
  // Simple Markdown Parser
  const parseMarkdown = (text) => {
    if (!text) return "";
    let html = text
      // Safety Disclaimer (Custom Tag)
      .replace(/\[\[SAFETY:([\s\S]*?)\]\]/g, '<div class="text-[10px] italic opacity-60 text-right mt-3 pt-2 border-t border-black/10 leading-tight">$1</div>')
      // Images
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-lg my-2 max-w-full border border-white/10" />')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="underline font-bold hover:text-white transition">$1</a>')
      // Newlines
      .replace(/\n/g, '<br/>');
    return html;
  };

  return (
    <div className="flex gap-4 animate-in slide-in-from-left-2 duration-300">
      <div className="h-10 w-10 bg-[#222222] flex-shrink-0 flex items-center justify-center text-[#edb400] mt-1 shadow-md rounded-full border border-[#edb400]/20">
        <Bot size={20} />
      </div>
      <div className="bg-[#edb400] text-[#222222] p-5 shadow-sm text-sm font-medium leading-relaxed max-w-[85%] relative rounded-2xl rounded-tl-sm">
        <div className="relative z-10" dangerouslySetInnerHTML={{ __html: parseMarkdown(text) }}></div>
      </div>
    </div>
  )
}

function ChoiceButton({ label, sub, icon, iconBg, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="text-left p-5 bg-[#222222] border border-white/5 hover:border-[#edb400]/50 shadow-sm hover:shadow-md transition-all group flex items-center gap-4 rounded-2xl w-full"
    >
       {icon && (
         <div className={`h-10 w-10 flex items-center justify-center rounded-xl ${iconBg ? 'bg-white/10 text-[#edb400]' : 'bg-white/10 text-[#edb400]'} transition-colors`}>
           {icon}
         </div>
       )}
       <div className="flex-1">
         <span className="block font-bold text-white text-sm md:text-base">{label}</span>
         {sub && <span className="block text-[10px] md:text-xs text-white/40 font-bold uppercase tracking-wider mt-0.5">{sub}</span>}
       </div>
    </button>
  )
}

function ResourceCard({ title, time, category, thumbnail, image }) {
  return (
    <div className="group cursor-pointer">
      {/* Thumbnail Container */}
      <div className={`aspect-video ${thumbnail || 'bg-slate-200'} rounded-2xl mb-4 relative overflow-hidden`}>
        {image && (
          <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
        )}
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
        
        {/* Play Button (Animated) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500">
           <div className="bg-[#edb400] p-3 rounded-full text-[#222222] shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
             <PlayCircle size={24} fill="currentColor" className="text-[#222222]" />
           </div>
        </div>
        
        {/* Time Badge */}
        {time && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">
            {time}
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="flex items-start justify-between">
        <div>
           <span className="text-[10px] font-bold uppercase text-[#edb400] tracking-widest block mb-1">
             {category || 'Resource'}
           </span>
           <h4 className="font-bold text-[#222222] text-lg group-hover:text-[#edb400] transition-colors">
             {title}
           </h4>
        </div>
      </div>
    </div>
  )
}

function PromptButton({ label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="px-4 py-2 bg-white border border-[#222222]/10 rounded-full text-sm font-bold text-[#222222] hover:bg-[#edb400] hover:border-[#edb400] transition-colors shadow-sm"
    >
      {label}
    </button>
  )
}

function CalculatorWidget() {
  return (
    <div className="bg-[#222222] rounded-2xl border border-white/10 p-4 shadow-sm max-w-md animate-in slide-in-from-left-2">
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
        <Calculator size={16} className="text-[#edb400]" />
        <span className="text-xs font-bold uppercase tracking-wider text-white">Material Estimator</span>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">Repair Type</label>
          <div className="flex p-1 bg-white/5 rounded-lg">
            <button className="flex-1 py-2 bg-[#333333] shadow-sm text-xs font-bold text-white border border-white/10 rounded">Spot Repair</button>
            <button className="flex-1 py-2 text-xs font-bold text-white/50 hover:text-white rounded">Full Roof</button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">Length (ft)</label>
            <input type="number" className="w-full p-2 bg-white/5 rounded-lg text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#edb400]" placeholder="0" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">Width (ft)</label>
            <input type="number" className="w-full p-2 bg-white/5 rounded-lg text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#edb400]" placeholder="0" />
          </div>
        </div>
        <button className="w-full py-3 bg-white/10 text-[#edb400] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-white/20 transition">
          Calculate
        </button>
      </div>
    </div>
  )
}

function TrainingWidget() {
  return (
    <div className="bg-[#222222] rounded-2xl border border-white/10 p-4 shadow-sm max-w-md animate-in slide-in-from-left-2">
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
        <PlayCircle size={16} className="text-[#edb400]" />
        <span className="text-xs font-bold uppercase tracking-wider text-white">Recommended Training</span>
      </div>
      <div className="space-y-3">
        <div className="flex gap-3 items-center p-2 hover:bg-white/5 rounded-lg cursor-pointer transition">
          <div className="h-12 w-20 bg-slate-300 rounded-md relative flex-shrink-0 overflow-hidden">
             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
               <PlayCircle size={16} className="text-white" />
             </div>
          </div>
          <div>
            <p className="text-xs font-bold text-white">Surface Prep 101</p>
            <p className="text-[10px] text-white/60">5:20 • Basics</p>
          </div>
        </div>
        <div className="flex gap-3 items-center p-2 hover:bg-white/5 rounded-lg cursor-pointer transition">
          <div className="h-12 w-20 bg-slate-400 rounded-md relative flex-shrink-0 overflow-hidden">
             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
               <PlayCircle size={16} className="text-white" />
             </div>
          </div>
          <div>
            <p className="text-xs font-bold text-white">Detailing Corners</p>
            <p className="text-[10px] text-white/60">12:45 • Advanced</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MaximizableView({ children, isMaximized }) {
  if (isMaximized) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-[95vw] h-[90vh] relative shadow-2xl">
          {children}
        </div>
      </div>,
      document.body
    );
  }
  return children;
}