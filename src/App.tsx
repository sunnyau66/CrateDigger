import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, Disc, Music, Github, AlertTriangle, Layers } from 'lucide-react';
import { VinylRecord, BudgetState, ChatMessage } from './types';

import Turntable from './components/Turntable';
import BudgetTracker from './components/BudgetTracker';
import RecordCrate from './components/RecordCrate';
import RecordForm from './components/RecordForm';
import AIChatDrawer from './components/AIChatDrawer';

// Starting seed mock records matching classic real-world record collection!
const INITIAL_RECORDS: VinylRecord[] = [
  {
    id: '1',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    label: 'Columbia',
    releaseYear: 1959,
    genre: 'Jazz',
    mediaGrade: 'VG+',
    sleeveGrade: 'G',
    purchasePrice: 25.00,
    purchaseDate: '2026-06-15',
    estimatedValue: 30.00,
    notes: 'Sleeve has significant split seams and ring wear, but the wax itself is incredibly clean and silent.',
    isWishlist: false
  },
  {
    id: '2',
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    label: 'Harvest',
    releaseYear: 1973,
    genre: 'Rock',
    mediaGrade: 'VG+',
    sleeveGrade: 'VG+',
    purchasePrice: 40.00,
    purchaseDate: '2026-06-20',
    estimatedValue: 45.00,
    notes: 'Came complete with original posters and blue-line stickers. An absolute dream player copy.',
    isWishlist: false
  },
  {
    id: '3',
    title: 'Abbey Road',
    artist: 'The Beatles',
    label: 'Apple Records',
    releaseYear: 1969,
    genre: 'Rock',
    mediaGrade: 'VG',
    sleeveGrade: 'VG',
    purchasePrice: 28.00,
    purchaseDate: '2026-07-01',
    estimatedValue: 30.00,
    notes: 'Classic aligned Apple logo on back. Occasional minor pop on "Here Comes the Sun" intro.',
    isWishlist: false
  },
  {
    id: '4',
    title: 'A Love Supreme',
    artist: 'John Coltrane',
    label: 'Impulse!',
    releaseYear: 1965,
    genre: 'Jazz',
    mediaGrade: 'NM',
    sleeveGrade: 'NM',
    estimatedValue: 38.00,
    notes: 'Highly sought-after spiritual jazz masterpiece. Looking for a clean stereo reissue.',
    isWishlist: true
  },
  {
    id: '5',
    title: 'Rumours',
    artist: 'Fleetwood Mac',
    label: 'Warner Bros.',
    releaseYear: 1977,
    genre: 'Pop',
    mediaGrade: 'VG+',
    sleeveGrade: 'VG+',
    estimatedValue: 25.00,
    notes: 'Want an early textured sleeve version with the fold-out lyric insert.',
    isWishlist: true
  }
];

export default function App() {
  // Try to load state from localStorage for long-term durable local persistence
  const [records, setRecords] = useState<VinylRecord[]>(() => {
    const local = localStorage.getItem('cratedigger_records');
    return local ? JSON.parse(local) : INITIAL_RECORDS;
  });

  const [budget, setBudget] = useState<BudgetState>(() => {
    const local = localStorage.getItem('cratedigger_budget');
    return local ? JSON.parse(local) : { monthlyBudget: 200, overdraftAllowed: false };
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const local = localStorage.getItem('cratedigger_chat');
    return local ? JSON.parse(local) : [];
  });

  // Player controls
  const [selectedRecord, setSelectedRecord] = useState<VinylRecord | null>(() => {
    return records.find(r => !r.isWishlist) || records[0] || null;
  });
  const [isPlaying, setIsPlaying] = useState(false);

  // Chat Drawer states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Synchronize localStorage changes on edits
  useEffect(() => {
    localStorage.setItem('cratedigger_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('cratedigger_budget', JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem('cratedigger_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Dynamic budget calculations
  const spent = records
    .filter(r => r.purchasePrice && !r.isWishlist)
    .reduce((sum, r) => sum + (r.purchasePrice || 0), 0);

  const remaining = budget.monthlyBudget - spent;

  // Record actions
  const handleSelectRecord = (record: VinylRecord) => {
    setSelectedRecord(record);
    setIsPlaying(false); // Reset playback on change
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRemoveRecord = (id: string) => {
    setRecords(prev => {
      const updated = prev.filter(r => r.id !== id);
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord(updated.find(r => !r.isWishlist) || updated[0] || null);
        setIsPlaying(false);
      }
      return updated;
    });
  };

  const handleMoveToCollection = (record: VinylRecord, price: number) => {
    // Perform real state update
    setRecords(prev => prev.map(r => {
      if (r.id === record.id) {
        return {
          ...r,
          isWishlist: false,
          purchasePrice: price,
          purchaseDate: new Date().toISOString().split('T')[0],
          estimatedValue: r.estimatedValue || price * 1.1,
          notes: r.notes ? `${r.notes} Logged purchase on ${new Date().toLocaleDateString()}.` : `Logged purchase on ${new Date().toLocaleDateString()}.`
        };
      }
      return r;
    }));
  };

  const handleAddManualRecord = (newRecord: Omit<VinylRecord, 'id' | 'purchaseDate'>) => {
    const recordToAdd: VinylRecord = {
      ...newRecord,
      id: Math.random().toString(36).substring(2, 9),
      purchaseDate: !newRecord.isWishlist ? new Date().toISOString().split('T')[0] : undefined
    };

    setRecords(prev => [...prev, recordToAdd]);
    setSelectedRecord(recordToAdd);
    setIsPlaying(false);
  };

  const handleUpdateBudget = (updates: Partial<BudgetState>) => {
    setBudget(prev => ({ ...prev, ...updates }));
  };

  // AI Voice/Text Agent Handler
  const handleSendMessage = async (text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text,
      timestamp
    };

    setChatHistory(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      // Package details to send context to server
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          collection: records.filter(r => !r.isWishlist),
          wishlist: records.filter(r => r.isWishlist),
          budget: {
            monthlyBudget: budget.monthlyBudget,
            overdraftAllowed: budget.overdraftAllowed
          },
          userMessage: text
        })
      });

      if (!response.ok) throw new Error("Agent disconnected");
      const data = await response.json();

      let actionDetails = "";

      // Check if Gemini agent returned a structural database state-change to execute!
      if (data.action) {
        const { type, payload } = data.action;

        if (type === "ADD_RECORD") {
          const addedId = Math.random().toString(36).substring(2, 9);
          const record: VinylRecord = {
            id: addedId,
            title: payload.title,
            artist: payload.artist,
            label: payload.label,
            releaseYear: payload.releaseYear,
            genre: payload.genre || 'Jazz',
            mediaGrade: payload.mediaGrade,
            sleeveGrade: payload.sleeveGrade || 'VG+',
            purchasePrice: payload.purchasePrice,
            purchaseDate: !payload.isWishlist ? new Date().toISOString().split('T')[0] : undefined,
            estimatedValue: payload.estimatedValue,
            notes: payload.notes || `Logged by CrateDigger AI on ${new Date().toLocaleDateString()}.`,
            isWishlist: payload.isWishlist
          };
          setRecords(prev => [...prev, record]);
          setSelectedRecord(record);
          setIsPlaying(false);
          actionDetails = `Added "${payload.title}" to ${payload.isWishlist ? 'Wishlist' : 'Collection'}`;
        } 
        else if (type === "REMOVE_RECORD") {
          setRecords(prev => {
            const found = prev.find(r => r.title.toLowerCase() === payload.title.toLowerCase());
            if (found) {
              actionDetails = `Removed "${found.title}"`;
              return prev.filter(r => r.id !== found.id);
            }
            return prev;
          });
        }
        else if (type === "SET_OVERDRAFT") {
          setBudget(prev => ({ ...prev, overdraftAllowed: payload.allowed }));
          actionDetails = `Set overdraft override to ${payload.allowed}`;
        }
        else if (type === "UPDATE_BUDGET") {
          setBudget(prev => ({ ...prev, monthlyBudget: payload.monthlyBudget }));
          actionDetails = `Set monthly budget limit to $${payload.monthlyBudget}`;
        }
      }

      const agentMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: actionDetails ? {
          type: data.action.type,
          details: actionDetails
        } : undefined
      };

      setChatHistory(prev => [...prev, agentMsg]);

    } catch (e) {
      console.error(e);
      // Offline fallback bubble
      const agentMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        text: "### ⚠️ Connection Interrupted\n\nI was unable to synchronize with my central cloud cortex. Please make sure your development server is running and your Gemini API Key is configured in Settings.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, agentMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearSessionChat = () => {
    setChatHistory([]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      
      {/* Visual Navigation Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 shrink-0 sticky top-0 z-30">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-950/20 relative group">
              <Disc className="w-5 h-5 text-zinc-950 animate-spin-slow group-hover:rotate-180 transition-transform duration-1000" />
              <div className="absolute inset-2 border-2 border-zinc-950/20 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-widest uppercase font-mono text-white">CrateDigger</h1>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 rounded-full font-bold">V2</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono tracking-wide mt-0.5">
                PERSONAL ADK AI AGENT FOR VINYL COLLECTORS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Clear history tool */}
            {chatHistory.length > 0 && (
              <button 
                onClick={clearSessionChat}
                className="text-[10px] text-zinc-500 hover:text-rose-400 font-mono underline"
                title="Clear Chat History logs"
              >
                Reset Chat
              </button>
            )}

            {/* AI Floating Toggle */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer shadow-lg ${isChatOpen ? 'bg-amber-500 text-zinc-950 border-amber-500/10 shadow-amber-950/15' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Companion</span>
              {chatHistory.length > 0 && (
                <span className={`w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse`} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        
        {/* Core Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: Analog Widgets (Platter & Budget) */}
          <section className="lg:col-span-4 flex flex-col gap-6">
            <Turntable 
              selectedRecord={selectedRecord}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
            />
            
            <BudgetTracker 
              budget={budget}
              spent={spent}
              remaining={remaining}
              onUpdateBudget={handleUpdateBudget}
            />
          </section>

          {/* RIGHT PANEL: Digital Organizers (Catalog Form & Interactive Bin Crate) */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            <RecordForm 
              onAddRecord={handleAddManualRecord}
              remainingBudget={remaining}
              overdraftAllowed={budget.overdraftAllowed}
            />
            
            <RecordCrate 
              records={records}
              onSelectRecord={handleSelectRecord}
              onRemoveRecord={handleRemoveRecord}
              onMoveToCollection={handleMoveToCollection}
            />
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-6 mt-12 text-zinc-500 shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-zinc-700" />
            <span>Built with Gemini 2.0 & Google Agent Development Kit (ADK)</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} CrateDigger. For physical media enthusiasts.</span>
          </div>
        </div>
      </footer>

      {/* AI Collapsible side Drawer overlay */}
      <AIChatDrawer 
        chatHistory={chatHistory}
        onSendMessage={handleSendMessage}
        isLoading={isChatLoading}
        isOpen={isChatOpen}
        onToggleOpen={() => setIsChatOpen(!isChatOpen)}
      />

    </div>
  );
}
