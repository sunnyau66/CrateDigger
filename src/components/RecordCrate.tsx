import React, { useState } from 'react';
import { Search, Filter, Disc, Star, Trash2, ArrowUpRight, Play, Eye, FolderHeart, Info } from 'lucide-react';
import { VinylRecord, RecordGrade } from '../types';

interface RecordCrateProps {
  records: VinylRecord[];
  onSelectRecord: (record: VinylRecord) => void;
  onRemoveRecord: (id: string) => void;
  onMoveToCollection: (record: VinylRecord, purchasePrice: number) => void;
}

const GENRES = ['All', 'Jazz', 'Rock', 'Pop', 'Soul', 'Funk', 'Electronic', 'Other'];

export default function RecordCrate({ records, onSelectRecord, onRemoveRecord, onMoveToCollection }: RecordCrateProps) {
  const [activeTab, setActiveTab] = useState<'collection' | 'wishlist'>('collection');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [hoveredCrateIndex, setHoveredCrateIndex] = useState<number | null>(null);
  const [showDetailRecord, setShowDetailRecord] = useState<VinylRecord | null>(null);
  
  // Dialog state for moving wishlist to collection
  const [buyDialogRecord, setBuyDialogRecord] = useState<VinylRecord | null>(null);
  const [buyPrice, setBuyPrice] = useState('');

  const filteredRecords = records.filter(record => {
    const matchesTab = activeTab === 'collection' ? !record.isWishlist : record.isWishlist;
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          record.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || 
                         (record.genre && record.genre.toLowerCase().includes(selectedGenre.toLowerCase()));
    return matchesTab && matchesSearch && matchesGenre;
  });

  const getGradeBadgeColor = (grade: RecordGrade) => {
    switch (grade) {
      case 'M':
      case 'NM':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'VG+':
      case 'VG':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'G+':
      case 'G':
        return 'bg-amber-600/10 text-amber-600 border-amber-600/20';
      case 'P':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getGenreGradient = (genre?: string) => {
    const g = String(genre || '').toLowerCase();
    if (g.includes('jazz')) return 'from-amber-600 to-yellow-800';
    if (g.includes('rock')) return 'from-red-700 to-zinc-900';
    if (g.includes('pop')) return 'from-pink-500 to-indigo-700';
    if (g.includes('soul') || g.includes('funk')) return 'from-orange-600 to-purple-900';
    return 'from-slate-700 to-slate-900';
  };

  const handleBuySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (buyDialogRecord) {
      const price = parseFloat(buyPrice);
      if (!isNaN(price) && price >= 0) {
        onMoveToCollection(buyDialogRecord, price);
        setBuyDialogRecord(null);
        setBuyPrice('');
      }
    }
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Tab Navigation and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('collection')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'collection' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            My Crate ({records.filter(r => !r.isWishlist).length})
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'wishlist' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            Dig List ({records.filter(r => r.isWishlist).length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'collection' ? 'crate' : 'dig list'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Interactive Crate Flipping Bin Section */}
      {filteredRecords.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
            💿 Interactive Record Bin (Hover to flip cardboard)
          </span>
          <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 h-48 flex items-center justify-center overflow-x-auto gap-1 relative shadow-inner">
            {filteredRecords.slice(0, 8).map((record, index) => {
              const isHovered = hoveredCrateIndex === index;
              return (
                <div
                  key={record.id}
                  onMouseEnter={() => setHoveredCrateIndex(index)}
                  onMouseLeave={() => setHoveredCrateIndex(null)}
                  onClick={() => onSelectRecord(record)}
                  className="relative h-full shrink-0 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-end"
                  style={{
                    width: isHovered ? '130px' : '45px',
                    zIndex: isHovered ? 20 : 10 - index
                  }}
                >
                  {/* Cardboard Sleeve Cover */}
                  <div 
                    className={`absolute bottom-6 left-0 w-28 h-28 rounded-md bg-gradient-to-br ${getGenreGradient(record.genre)} border border-zinc-700/60 shadow-lg flex flex-col justify-between p-2.5 overflow-hidden transition-all duration-300 ${isHovered ? 'translate-y-[-16px] rotate-[-2deg] scale-110' : 'translate-y-0 rotate-0 hover:translate-y-[-4px]'}`}
                  >
                    {/* Retro lines layout */}
                    <div className="w-full h-0.5 bg-zinc-100/10" />
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <h4 className="text-[8px] font-black leading-tight text-white line-clamp-2 uppercase tracking-tight">
                        {record.title}
                      </h4>
                      <p className="text-[7px] text-zinc-300/80 line-clamp-1 mt-0.5 truncate font-semibold font-mono">
                        {record.artist}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[6px] font-mono text-zinc-400">
                      <span>{record.releaseYear || 'RE'}</span>
                      <span className="bg-black/30 px-1 rounded">{record.mediaGrade}</span>
                    </div>
                  </div>

                  {/* Bin Label Holder inside bottom gap */}
                  <div className={`text-[8px] font-mono text-center truncate w-full transition-opacity duration-300 pb-1 ${isHovered ? 'opacity-100 text-amber-500' : 'opacity-0'}`}>
                    Flip Platter &rarr;
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Genre Filters */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {GENRES.map(genre => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-wider border transition-all cursor-pointer ${selectedGenre === genre ? 'bg-amber-500/10 text-amber-500 border-amber-500/40 font-semibold' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'}`}
          >
            {genre.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Records Catalog Grid */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
          <Disc className="w-10 h-10 stroke-1 text-zinc-700 mx-auto animate-spin-slow" />
          <h4 className="text-xs font-bold text-zinc-400 mt-3 uppercase tracking-wider">No Records Logged</h4>
          <p className="text-[10px] text-zinc-500 max-w-xs mx-auto mt-1 leading-relaxed">
            There are no vinyls logged under {selectedGenre === 'All' ? 'this section' : `the "${selectedGenre}" genre`}. Tell CrateDigger AI in chat to log some!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map(record => (
            <div 
              key={record.id}
              className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 relative group flex flex-col justify-between hover:border-zinc-700 transition-all shadow-md overflow-hidden"
            >
              {/* Spine Accent Decorator */}
              <div className={`absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b ${getGenreGradient(record.genre)}`} />

              <div>
                <div className="flex justify-between items-start pl-1">
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                      {record.genre || 'OTHER'}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors mt-0.5">
                      {record.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 truncate leading-snug">
                      by {record.artist}
                    </p>
                  </div>
                  
                  {/* Play Action over item */}
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => onSelectRecord(record)}
                      className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-amber-500 hover:text-zinc-950 transition-all cursor-pointer"
                      title="Select on Platter"
                    >
                      <Play className="w-3 h-3 fill-current stroke-none" />
                    </button>
                    <button
                      onClick={() => setShowDetailRecord(record)}
                      className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                      title="Inspect Details"
                    >
                      <Eye className="w-3 h-3 text-zinc-400" />
                    </button>
                  </div>
                </div>

                {/* Grid stats details */}
                <div className="mt-4 grid grid-cols-3 gap-1 pl-1 text-[10px] font-mono text-center">
                  <div className="bg-zinc-900/50 p-1.5 rounded border border-zinc-850">
                    <span className="block text-[8px] text-zinc-500 uppercase">Media</span>
                    <span className={`px-1 mt-0.5 inline-block text-[9px] font-bold rounded border uppercase ${getGradeBadgeColor(record.mediaGrade)}`}>
                      {record.mediaGrade}
                    </span>
                  </div>
                  <div className="bg-zinc-900/50 p-1.5 rounded border border-zinc-850">
                    <span className="block text-[8px] text-zinc-500 uppercase">Sleeve</span>
                    <span className={`px-1 mt-0.5 inline-block text-[9px] font-bold rounded border uppercase ${getGradeBadgeColor(record.sleeveGrade)}`}>
                      {record.sleeveGrade}
                    </span>
                  </div>
                  <div className="bg-zinc-900/50 p-1.5 rounded border border-zinc-850">
                    <span className="block text-[8px] text-zinc-500 uppercase">Est. Value</span>
                    <span className="block text-zinc-300 font-bold mt-0.5 text-[9px]">
                      ${record.estimatedValue ? Math.round(record.estimatedValue) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center pl-1 text-[10px]">
                <div>
                  {record.isWishlist ? (
                    <span className="text-[9px] text-amber-500 font-mono font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 stroke-none" /> WISHLIST
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase">
                      Paid: <span className="text-white">${record.purchasePrice?.toFixed(2) || '—'}</span>
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {record.isWishlist && (
                    <button
                      onClick={() => {
                        setBuyDialogRecord(record);
                        setBuyPrice(record.estimatedValue?.toString() || '');
                      }}
                      className="px-2 py-1 bg-amber-500 text-zinc-950 rounded font-semibold hover:bg-amber-400 transition-all text-[9px] cursor-pointer flex items-center gap-1"
                    >
                      <ArrowUpRight className="w-2.5 h-2.5" /> Buy / Log
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveRecord(record.id)}
                    className="p-1 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                    title="Delete record from collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Move Wishlist to Collection Buy Dialog Overlay */}
      {buyDialogRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-scale-up">
            <div className="border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <FolderHeart className="text-amber-500 w-4 h-4" /> Log Purchase from Wishlist
              </h3>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                You are moving <strong>"{buyDialogRecord.title}"</strong> by <strong>{buyDialogRecord.artist}</strong> into your physical collection crate.
              </p>
            </div>

            <form onSubmit={handleBuySubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs text-zinc-400 font-mono uppercase tracking-wider">
                  Purchase Price ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-zinc-500">$</span>
                  <input
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-1.5 pl-7 pr-4 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 35.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setBuyDialogRecord(null)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold shadow-md shadow-amber-950/20"
                >
                  Complete & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Detail Record Dialog Overlay */}
      {showDetailRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden animate-scale-up">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getGenreGradient(showDetailRecord.genre)}`} />
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                    {showDetailRecord.genre || 'OTHER'}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                    {showDetailRecord.title}
                  </h3>
                  <p className="text-xs text-zinc-400">by {showDetailRecord.artist}</p>
                </div>
                <button 
                  onClick={() => setShowDetailRecord(null)}
                  className="text-xs text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900/50 p-1 rounded-md"
                >
                  Close
                </button>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3 grid grid-cols-2 gap-3 text-[10px] font-mono">
                <div>
                  <span className="block text-zinc-500 uppercase text-[8px]">LABEL / PRESSING</span>
                  <span className="block text-zinc-300 font-semibold truncate">{showDetailRecord.label || 'Unknown'}</span>
                </div>
                <div>
                  <span className="block text-zinc-500 uppercase text-[8px]">RELEASE YEAR</span>
                  <span className="block text-zinc-300 font-semibold">{showDetailRecord.releaseYear || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-zinc-500 uppercase text-[8px]">MEDIA CONDITION</span>
                  <span className={`px-1 rounded border inline-block text-[9px] font-bold ${getGradeBadgeColor(showDetailRecord.mediaGrade)}`}>
                    {showDetailRecord.mediaGrade}
                  </span>
                </div>
                <div>
                  <span className="block text-zinc-500 uppercase text-[8px]">SLEEVE CONDITION</span>
                  <span className={`px-1 rounded border inline-block text-[9px] font-bold ${getGradeBadgeColor(showDetailRecord.sleeveGrade)}`}>
                    {showDetailRecord.sleeveGrade}
                  </span>
                </div>
              </div>

              {showDetailRecord.notes && (
                <div className="bg-zinc-900/30 border border-zinc-850/50 rounded-xl p-3 text-[11px] text-zinc-400 space-y-1">
                  <span className="text-zinc-500 font-mono text-[8px] uppercase tracking-wider block">COLLECTOR'S DIG NOTES:</span>
                  <p className="leading-relaxed italic">"{showDetailRecord.notes}"</p>
                </div>
              )}

              <div className="flex justify-between items-center text-xs border-t border-zinc-850 pt-3">
                <span className="text-zinc-500 font-mono uppercase text-[9px]">LOG DATE: {showDetailRecord.purchaseDate || 'N/A'}</span>
                <span className="font-bold text-amber-500">
                  {showDetailRecord.isWishlist ? 'WISHLIST TARGET' : `Paid: $${showDetailRecord.purchasePrice?.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
