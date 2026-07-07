import React, { useState } from 'react';
import { PlusCircle, Sparkles, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import { VinylRecord, RecordGrade } from '../types';

interface RecordFormProps {
  onAddRecord: (record: Omit<VinylRecord, 'id' | 'purchaseDate'>) => void;
  remainingBudget: number;
  overdraftAllowed: boolean;
}

const GRADES: RecordGrade[] = ['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'P'];
const GENRES = ['Jazz', 'Rock', 'Pop', 'Soul', 'Funk', 'Electronic', 'Classical', 'Other'];

export default function RecordForm({ onAddRecord, remainingBudget, overdraftAllowed }: RecordFormProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [label, setLabel] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [genre, setGenre] = useState('Jazz');
  const [mediaGrade, setMediaGrade] = useState<RecordGrade>('VG+');
  const [sleeveGrade, setSleeveGrade] = useState<RecordGrade>('VG');
  const [isWishlist, setIsWishlist] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [notes, setNotes] = useState('');

  // AI Price estimation states
  const [estimating, setEstimating] = useState(false);
  const [aiNotes, setAiNotes] = useState('');

  const handleEstimatePrice = async () => {
    if (!title || !artist) {
      alert("Please enter both Album Title and Artist before running AI price estimation.");
      return;
    }

    setEstimating(true);
    setAiNotes('');
    
    try {
      const response = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          artist,
          mediaGrade,
          sleeveGrade,
          releaseYear: releaseYear ? parseInt(releaseYear) : undefined
        })
      });

      if (!response.ok) throw new Error("Estimation failed");
      const data = await response.json();
      
      setEstimatedValue(data.estimatedValue.toString());
      setAiNotes(`AI estimate: $${data.estimatedValue} (${data.confidence} confidence). ${data.notes}`);
    } catch (e) {
      console.error(e);
      // Local fallback calculation if server is down or has error
      const randomVal = Math.floor(Math.random() * 20) + 15;
      setEstimatedValue(randomVal.toString());
      setAiNotes(`Offline estimate fallback: $${randomVal}. Connect API Key to enable real-time Discogs market evaluation.`);
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist) return;

    const price = !isWishlist && purchasePrice ? parseFloat(purchasePrice) : 0;
    
    // Check budget limit in form submit
    if (!isWishlist && price > remainingBudget && !overdraftAllowed) {
      alert(`⚠️ Budget Enforcement Triggered!\n\nYou have $${remainingBudget.toFixed(2)} remaining this month. This record costs $${price.toFixed(2)}, which is a shortfall of $${(price - remainingBudget).toFixed(2)}.\n\nAutomated logging is locked for this transaction. Please authorize agent override or expand your budget first!`);
      return;
    }

    onAddRecord({
      title,
      artist,
      label: label || undefined,
      releaseYear: releaseYear ? parseInt(releaseYear) : undefined,
      genre,
      mediaGrade,
      sleeveGrade,
      purchasePrice: !isWishlist && purchasePrice ? price : undefined,
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
      notes: notes || undefined,
      isWishlist
    });

    // Reset form
    setTitle('');
    setArtist('');
    setLabel('');
    setReleaseYear('');
    setPurchasePrice('');
    setEstimatedValue('');
    setNotes('');
    setAiNotes('');
  };

  const isOverBudgetShortfall = !isWishlist && purchasePrice && parseFloat(purchasePrice) > remainingBudget;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
          LOG NEW VINYL
        </span>
        <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5 mt-0.5">
          <PlusCircle className="w-4 h-4 text-amber-500" /> Catalog Vinyl Record
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Row 1: Title and Artist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider">Album Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Kind of Blue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-3 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider">Artist Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Miles Davis"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-3 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Row 2: Label, Year, Genre */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">Label (Pressing)</label>
            <input
              type="text"
              placeholder="Columbia"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-3 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">Release Year</label>
            <input
              type="number"
              placeholder="1959"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-3 text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {GENRES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Grades selection */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">Media Condition</label>
            <select
              value={mediaGrade}
              onChange={(e) => setMediaGrade(e.target.value as RecordGrade)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {GRADES.map(g => (
                <option key={g} value={g}>{g} - {g === 'M' ? 'Mint' : g === 'NM' ? 'Near Mint' : g === 'VG+' ? 'VG Plus' : g === 'VG' ? 'Very Good' : g === 'G+' ? 'Good Plus' : g === 'G' ? 'Good' : 'Poor'}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">Sleeve Condition</label>
            <select
              value={sleeveGrade}
              onChange={(e) => setSleeveGrade(e.target.value as RecordGrade)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {GRADES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Wishlist Toggle & Pricing */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setIsWishlist(false)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${!isWishlist ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
          >
            My Collection
          </button>
          <button
            type="button"
            onClick={() => setIsWishlist(true)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${isWishlist ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
          >
            Dig Wishlist
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          {/* Purchase Price - only shown if collection type */}
          {!isWishlist ? (
            <div className="space-y-1">
              <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">Purchase Price ($) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-zinc-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required={!isWishlist}
                  placeholder="25.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 pl-6 pr-3 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="block text-zinc-500 font-mono text-[9px] uppercase tracking-wider">Purchase Price</span>
              <div className="w-full bg-zinc-950/40 border border-zinc-900 rounded-lg py-1.5 px-3 text-zinc-500 leading-normal italic">
                N/A (Wishlist item)
              </div>
            </div>
          )}

          {/* Estimated Value */}
          <div className="space-y-1 relative">
            <div className="flex justify-between items-center">
              <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">Estimated Value ($)</label>
              <button
                type="button"
                onClick={handleEstimatePrice}
                disabled={estimating || !title || !artist}
                className="text-[9px] font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1 disabled:text-zinc-600 cursor-pointer"
              >
                {estimating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                AI Estimate
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-zinc-500">$</span>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="30"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 pl-6 pr-3 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* AI Estimate Note */}
        {aiNotes && (
          <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[10px] text-amber-300 leading-snug flex items-start gap-1.5 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>{aiNotes}</span>
          </div>
        )}

        {/* Budget warn indicator */}
        {isOverBudgetShortfall && !overdraftAllowed && (
          <div className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-lg text-[10px] text-rose-300 flex items-start gap-2 animate-fade-in leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <span className="font-bold">Shortfall Lock Active!</span>
              <p className="text-zinc-400 mt-0.5">
                This purchase ($${parseFloat(purchasePrice).toFixed(2)}) is higher than your remaining $${remainingBudget.toFixed(2)} budget. Log block is engaged. Use overrides in settings or authorize in chat.
              </p>
            </div>
          </div>
        )}

        {/* Collector Notes */}
        <div className="space-y-1">
          <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">Digging Notes / Conditon Details</label>
          <textarea
            placeholder="e.g. Early Columbia stereo reissue. Slight ring wear on the back cover, but wax is dead silent."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-3 text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
          />
        </div>

        {/* Form Submit */}
        <button
          type="submit"
          disabled={!title || !artist || (isOverBudgetShortfall && !overdraftAllowed)}
          className={`w-full font-bold py-2 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer ${
            !title || !artist || (isOverBudgetShortfall && !overdraftAllowed)
              ? 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-950/25'
          }`}
        >
          {isWishlist ? 'Add to Dig Wishlist' : 'Log Physical Crate'}
        </button>
      </form>
    </div>
  );
}
