import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, Disc, Music } from 'lucide-react';
import { VinylRecord } from '../types';

interface TurntableProps {
  selectedRecord: VinylRecord | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export default function Turntable({ selectedRecord, isPlaying, onTogglePlay }: TurntableProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Simple synthesized lo-fi warm crackle sound using Web Audio API!
  const startSynthCrackle = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // We generate procedural white noise and shape it into dusty crackles
      const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // Dust crackle: occasional spikes in random noise
        const randVal = Math.random() * 2 - 1;
        if (Math.random() > 0.9995) {
          // Sharp dust pop
          output[i] = randVal * 0.4;
        } else {
          // Low-volume rumble/hum
          output[i] = randVal * 0.003 + Math.sin(i * 0.005) * 0.001;
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter to make it sound warm (low-pass)
      const lpFilter = ctx.createBiquadFilter();
      lpFilter.type = 'lowpass';
      lpFilter.frequency.value = 800; // Muffled, warm lo-fi

      // Bandpass filter to isolate mid-range crackle
      const bpFilter = ctx.createBiquadFilter();
      bpFilter.type = 'bandpass';
      bpFilter.frequency.value = 1200;
      bpFilter.Q.value = 0.5;

      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.08; // Very soft background level

      whiteNoise.connect(lpFilter);
      lpFilter.connect(gainNode);
      gainNode.connect(ctx.destination);

      whiteNoise.start(0);
      bufferSourceRef.current = whiteNoise;
    } catch (e) {
      console.warn("Failed to generate synthesized record crackle:", e);
    }
  };

  const stopSynthCrackle = () => {
    if (bufferSourceRef.current) {
      try {
        bufferSourceRef.current.stop();
        bufferSourceRef.current.disconnect();
      } catch (e) {}
      bufferSourceRef.current = null;
    }
  };

  useEffect(() => {
    if (isPlaying && soundEnabled) {
      startSynthCrackle();
    } else {
      stopSynthCrackle();
    }
    return () => stopSynthCrackle();
  }, [isPlaying, soundEnabled]);

  const handleSoundToggle = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState && isPlaying) {
      startSynthCrackle();
    } else {
      stopSynthCrackle();
    }
  };

  // Get a cover color based on genre
  const getGenreColor = (genre?: string) => {
    const g = String(genre || '').toLowerCase();
    if (g.includes('jazz')) return 'from-amber-600 to-yellow-800 border-amber-900';
    if (g.includes('rock')) return 'from-red-700 to-zinc-900 border-red-950';
    if (g.includes('pop')) return 'from-pink-500 to-indigo-700 border-pink-900';
    if (g.includes('soul') || g.includes('funk')) return 'from-orange-600 to-purple-900 border-orange-950';
    return 'from-slate-700 to-slate-900 border-slate-950';
  };

  return (
    <div className="bg-zinc-900 text-zinc-100 rounded-2xl p-6 border border-zinc-800 shadow-xl relative overflow-hidden flex flex-col items-center justify-between h-[320px] md:h-[350px]">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-700" />
      
      {/* Turntable Platters & Needle */}
      <div className="relative w-full flex-1 flex items-center justify-center">
        {/* Turntable body background */}
        <div className="absolute w-[220px] h-[220px] md:w-[240px] md:h-[240px] bg-zinc-950 rounded-full border border-zinc-800 flex items-center justify-center shadow-inner">
          {/* Slipmat pattern */}
          <div className="w-[95%] h-[95%] rounded-full border-2 border-dashed border-zinc-800/60 flex items-center justify-center" />
        </div>

        {/* Vinyl Disc */}
        {selectedRecord ? (
          <div 
            className={`absolute w-[210px] h-[210px] md:w-[230px] md:h-[230px] rounded-full bg-zinc-950 flex items-center justify-center shadow-2xl border-4 border-zinc-900/40 relative z-10 transition-all duration-1000 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}
            style={{
              backgroundImage: 'radial-gradient(circle, #1a1a1a 10%, #0d0d0d 11%, #050505 40%, #1a1a1a 41%, #050505 60%, #151515 61%, #020202 100%)'
            }}
          >
            {/* Grooves lines */}
            <div className="absolute inset-4 rounded-full border border-zinc-900/40" />
            <div className="absolute inset-10 rounded-full border border-zinc-900/30" />
            <div className="absolute inset-16 rounded-full border border-zinc-900/20" />

            {/* Record Label Center */}
            <div className={`w-[80px] h-[80px] md:w-[85px] md:h-[85px] rounded-full bg-gradient-to-br ${getGenreColor(selectedRecord.genre)} flex flex-col items-center justify-center p-2 text-center shadow-lg relative z-20 overflow-hidden border`}>
              {/* Center Spindle Hole */}
              <div className="absolute w-4 h-4 bg-zinc-900 rounded-full border border-zinc-600/50 shadow-inner z-30" />
              
              {/* Record Label Content */}
              <div className="text-[7px] md:text-[8px] font-bold text-zinc-100 line-clamp-1 w-full mt-4 leading-none">
                {selectedRecord.title}
              </div>
              <div className="text-[6px] md:text-[7px] text-zinc-300 font-medium line-clamp-1 w-full leading-none mt-0.5">
                {selectedRecord.artist}
              </div>
              <div className="text-[5px] text-zinc-400 mt-1 uppercase tracking-widest font-mono">
                {selectedRecord.mediaGrade} / {selectedRecord.sleeveGrade}
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute z-10 text-center text-zinc-500 flex flex-col items-center">
            <Disc className="w-12 h-12 stroke-1 animate-pulse text-zinc-700" />
            <span className="text-xs font-mono mt-2 tracking-wider">PLATTER EMPTY</span>
          </div>
        )}

        {/* Tonearm & Needle */}
        {selectedRecord && (
          <div 
            className="absolute top-2 right-[20%] w-6 h-[110px] origin-top z-30 transition-all duration-700 ease-in-out"
            style={{
              transform: isPlaying ? 'rotate(18deg)' : 'rotate(-10deg)'
            }}
          >
            {/* Tonearm base pivot */}
            <div className="w-10 h-10 bg-zinc-800 border-2 border-zinc-700 rounded-full -ml-2 -mt-2 shadow-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-zinc-600 rounded-full border border-zinc-500" />
            </div>
            {/* Pivot arm wire */}
            <div className="w-1.5 h-[90px] bg-gradient-to-b from-zinc-400 to-zinc-500 rounded-full ml-2 shadow-sm border-l border-r border-zinc-600" />
            {/* Cartridge and needle body */}
            <div className="w-4 h-6 bg-zinc-700 border border-zinc-600 ml-0.5 -mt-1 rounded-sm shadow-md relative">
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-yellow-500 rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Control Panel Footer */}
      <div className="w-full flex items-center justify-between mt-2 pt-3 border-t border-zinc-800 relative z-20">
        <div className="flex flex-col flex-1 min-w-0 pr-3">
          {selectedRecord ? (
            <>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500 font-semibold flex items-center gap-1">
                <Music className="w-3 h-3 animate-bounce" /> NOW SPINNING
              </span>
              <h4 className="text-xs font-bold text-white truncate leading-snug">
                {selectedRecord.title}
              </h4>
              <p className="text-[10px] text-zinc-400 truncate">
                {selectedRecord.artist}
              </p>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
                OFFLINE
              </span>
              <h4 className="text-xs font-semibold text-zinc-400 truncate leading-snug">
                No Record Selected
              </h4>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Lofi Audio Synth Trigger */}
          <button 
            onClick={handleSoundToggle}
            className={`p-1.5 rounded-lg border text-[9px] font-mono tracking-wider transition-all cursor-pointer ${soundEnabled ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'}`}
            title="Toggle Synthesized Lofi Crackle Sound"
          >
            {soundEnabled ? 'SOUND: ON' : 'SOUND: OFF'}
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            disabled={!selectedRecord}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${!selectedRecord ? 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed' : isPlaying ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/20' : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-amber-900/20'}`}
          >
            {isPlaying ? <Square className="w-4 h-4 fill-white stroke-none" /> : <Play className="w-4 h-4 fill-zinc-950 stroke-none ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
