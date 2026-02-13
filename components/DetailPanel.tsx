import React from 'react';
import { X, Activity, ShieldAlert, BookOpen, Fingerprint } from 'lucide-react';
import { GraphNode } from '../types';

interface DetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ node, onClose }) => {
  // Generate deterministic "fake" stats based on node ID string length for demo consistency
  const getStat = (str: string, seed: number) => ((str.length * seed) % 100);

  if (!node) return null;

  const influence = getStat(node.id, 17) + 20;
  const risk = getStat(node.id, 13);

  return (
    <div className={`
      fixed top-0 right-0 h-full w-full md:w-[480px] z-30
      bg-slate-900/80 backdrop-blur-xl border-l border-cyan-500/30
      transform transition-transform duration-500 ease-out shadow-2xl shadow-cyan-900/20
      flex flex-col
      ${node ? 'translate-x-0' : 'translate-x-full'}
    `}>
      {/* Header */}
      <div className="flex justify-between items-center p-8 border-b border-white/10">
        <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/50 border border-cyan-400/40 rounded-full">
            <Fingerprint className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase font-['Orbitron']">
              Node Analysis
            </span>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <h2 className="text-4xl font-black text-white mb-2 leading-tight font-['Rajdhani'] tracking-wide">
          {node.name}
        </h2>
        <div className="text-xs font-mono text-cyan-500/70 mb-8 uppercase tracking-widest">
          ID: {btoa(node.id).substring(0, 12)}...
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="space-y-2 bg-slate-800/40 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
              <span className="flex items-center gap-1"><Activity size={12}/> Impact</span>
              <span>{influence}%</span>
            </div>
            <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)] transition-all duration-1000" 
                style={{ width: `${influence}%` }}
              />
            </div>
          </div>
          <div className="space-y-2 bg-slate-800/40 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
              <span className="flex items-center gap-1"><ShieldAlert size={12}/> Volatility</span>
              <span>{risk}%</span>
            </div>
            <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] transition-all duration-1000" 
                style={{ width: `${risk}%` }}
              />
            </div>
          </div>
        </div>

        {/* Text Sections */}
        <div className="space-y-8 font-['Rajdhani']">
          <section className="group">
            <h4 className="flex items-center gap-2 text-cyan-300 text-sm font-bold mb-3 uppercase tracking-widest border-b border-cyan-500/20 pb-2 w-max">
              <Activity size={14} /> Intelligence / Insight
            </h4>
            <p className="text-slate-300 leading-relaxed text-lg font-light">
              {node.analysis || node.desc || "No detailed analysis provided for this data point."}
            </p>
          </section>

          {(node.evidence || node.desc) && (
            <section className="group">
              <h4 className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-3 uppercase tracking-widest border-b border-emerald-500/20 pb-2 w-max">
                <BookOpen size={14} /> Core Evidence
              </h4>
              <p className="text-slate-400 text-base leading-relaxed border-l-2 border-emerald-500/30 pl-4 italic">
                {node.evidence || node.desc}
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="p-4 border-t border-white/5 text-[10px] text-slate-600 font-mono text-center uppercase tracking-[0.2em]">
        System Status: Stable // Orbit: Locked
      </div>
    </div>
  );
};

export default DetailPanel;