import React, { useState } from 'react';
import { DollarSign, ShieldAlert, Sparkles, Sliders, CheckCircle, HelpCircle } from 'lucide-react';
import { BudgetState } from '../types';

interface BudgetTrackerProps {
  budget: BudgetState;
  spent: number;
  remaining: number;
  onUpdateBudget: (updates: Partial<BudgetState>) => void;
}

export default function BudgetTracker({ budget, spent, remaining, onUpdateBudget }: BudgetTrackerProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.monthlyBudget.toString());

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(tempBudget);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateBudget({ monthlyBudget: parsed });
      setShowSettings(false);
    }
  };

  const percentSpent = Math.min(100, Math.max(0, (spent / budget.monthlyBudget) * 100));
  const isOverbudget = spent > budget.monthlyBudget;
  const isApproaching = !isOverbudget && spent >= budget.monthlyBudget * 0.8;

  // Visual status indicators
  let statusColor = "bg-emerald-500";
  let statusText = "Good to Dig";
  let statusBadge = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

  if (isOverbudget) {
    statusColor = "bg-rose-500";
    statusText = budget.overdraftAllowed ? "Overdraft Enabled" : "Budget Locked";
    statusBadge = budget.overdraftAllowed 
      ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse" 
      : "bg-rose-500/10 text-rose-500 border-rose-500/20";
  } else if (isApproaching) {
    statusColor = "bg-amber-500";
    statusText = "Approaching Limit";
    statusBadge = "bg-amber-500/10 text-amber-500 border-amber-500/20";
  }

  return (
    <div className="bg-zinc-900 text-zinc-100 rounded-2xl p-6 border border-zinc-800 shadow-xl relative overflow-hidden flex flex-col justify-between h-[320px] md:h-[350px]">
      {/* Settings Panel Overlay */}
      {showSettings && (
        <div className="absolute inset-0 bg-zinc-950/95 z-40 p-6 flex flex-col justify-between animate-fade-in">
          <form onSubmit={handleBudgetSubmit} className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold font-sans text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                Budget Configuration
              </h3>
              <button 
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs text-zinc-400 uppercase tracking-widest font-mono">
                Monthly Digging Budget ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="number"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  min="0"
                  step="10"
                  placeholder="e.g. 200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="flex-1 pr-4">
                <span className="block text-xs font-semibold text-white">Allow Overdraft</span>
                <span className="block text-[10px] text-zinc-400 leading-snug">
                  Let CrateDigger AI override the limit for rare finds.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={budget.overdraftAllowed}
                  onChange={(e) => onUpdateBudget({ overdraftAllowed: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </form>

          <button
            type="submit"
            onClick={handleBudgetSubmit}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold py-2 rounded-lg text-sm transition-all"
          >
            Save Configuration
          </button>
        </div>
      )}

      {/* Primary Display */}
      <div>
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">
              MONTHLY BUDGET ENGINE
            </span>
            <h3 className="text-lg font-bold text-white flex items-center gap-1 mt-0.5">
              ${budget.monthlyBudget.toFixed(2)}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono border uppercase tracking-wider ${statusBadge}`}>
              {statusText}
            </span>
            <button
              onClick={() => {
                setTempBudget(budget.monthlyBudget.toString());
                setShowSettings(true);
              }}
              className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer"
              title="Configure Budget"
            >
              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Visual Progress bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400 uppercase tracking-widest text-[9px]">
              DIGGING PROGRESS ({Math.round(percentSpent)}%)
            </span>
            <span className="text-zinc-200">
              ${spent.toFixed(2)} / ${budget.monthlyBudget.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-3 bg-zinc-950 rounded-full border border-zinc-800 p-0.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${statusColor}`}
              style={{ width: `${percentSpent}%` }}
            />
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/50">
            <span className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
              TOTAL SPENT
            </span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              ${spent.toFixed(2)}
            </span>
          </div>
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/50">
            <span className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
              REMAINING
            </span>
            <span className={`text-sm font-bold font-mono mt-0.5 block ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${remaining >= 0 ? remaining.toFixed(2) : `-$${Math.abs(remaining).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Tool Layer Budget Enforcement Info */}
      <div className="mt-4 pt-4 border-t border-zinc-800/60">
        {isOverbudget ? (
          budget.overdraftAllowed ? (
            <div className="flex gap-2.5 items-start bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Overdraft Override Active</span>
                <p className="text-zinc-400 leading-snug mt-0.5">
                  CrateDigger AI is authorized to bypass constraints for high-quality pressings.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2.5 items-start bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 text-[11px] text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Automated Logging Locked</span>
                <p className="text-zinc-400 leading-snug mt-0.5">
                   शॉर्टफॉल (Shortfall) of **${Math.abs(remaining).toFixed(2)}**. AI agent will reject purchases until unlocked.
                </p>
                <button
                  onClick={() => onUpdateBudget({ overdraftAllowed: true })}
                  className="mt-2 text-[10px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                >
                  Authorize Agent Override &rarr;
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="flex gap-2.5 items-start bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Budget Enforced in Tool Layer</span>
              <p className="text-zinc-400 leading-snug mt-0.5">
                CrateDigger AI prevents accidental over-budget purchases directly in the function calls.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
