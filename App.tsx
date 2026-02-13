import React, { useState, useMemo, useEffect } from 'react';
import { Upload, RefreshCw, Cpu, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import GalaxyGraph from './components/GalaxyGraph';
import DetailPanel from './components/DetailPanel';
import { GraphData, GraphNode, DEFAULT_GRAPH_DATA } from './types';
import { parseCsvToGraph } from './utils/csvParser';

const App: React.FC = () => {
  // Master Data (Source of Truth)
  const [masterData, setMasterData] = useState<GraphData>(DEFAULT_GRAPH_DATA);
  
  // Interaction State
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroups, setActiveGroups] = useState<Set<string>>(new Set(['center', 'planet', 'satellite']));
  const [showFilters, setShowFilters] = useState(false);

  // Expansion State: Set of node IDs that are EXPLICITLY EXPANDED.
  // Strategy: Center is always expanded. Others start collapsed.
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['AGI_CORE']));

  // -- Data Processing --

  // Calculate Derived Data based on filters and expansion
  const { visibleData, highlightedNodeIds } = useMemo(() => {
    // 1. Filter Nodes by Category (Checkbox)
    let filteredNodes = masterData.nodes.filter(n => activeGroups.has(n.group));
    let filteredNodeIds = new Set(filteredNodes.map(n => n.id));

    // 2. Handle Expansion Logic
    // We only show nodes if their "parent" (source) is expanded. 
    // This assumes a hierarchy. For a generic graph, we use neighbor connectivity.
    // Simpler approach for this "Branching Sphere":
    // A node is visible if it is 'center' OR it is connected to a node that is currently in the visible set AND that node is expanded.
    // Iterative visibility:
    // Center is always visible.
    // If Center is expanded, its neighbors are visible.
    // If Neighbor is expanded, its neighbors are visible.
    
    // We'll build the visible set starting from Center.
    const visibleIds = new Set<string>(['AGI_CORE']);
    const queue = ['AGI_CORE'];
    
    // Build adjacency list for fast lookup
    const neighbors: Record<string, string[]> = {};
    masterData.links.forEach(link => {
        const s = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const t = typeof link.target === 'object' ? (link.target as any).id : link.target;
        if (!neighbors[s]) neighbors[s] = [];
        if (!neighbors[t]) neighbors[t] = [];
        neighbors[s].push(t);
        neighbors[t].push(s); // Undirected for visibility
    });

    // BFS to find all visible nodes
    // A node is reachable if its parent is visible and expanded.
    // However, since graph can be cyclic, we just check if it's connected to an Expanded Visible Node.
    // But we need to be careful not to hide everything if we start collapsed.
    
    // Simplification for the "Sphere" UX:
    // Level 1 (Center + Planets) are always visible unless filtered by category.
    // Level 2 (Satellites) are visible ONLY if their connected Planet is expanded.
    
    // Let's use a hybrid approach based on the 'expandedNodes' set.
    // If a node ID is in 'expandedNodes', its neighbors are allowed to be shown.
    
    const finalNodes: GraphNode[] = [];
    const finalLinks: any[] = [];
    
    // We must include Center always.
    const centerNode = masterData.nodes.find(n => n.id === 'AGI_CORE');
    if (centerNode && activeGroups.has('center')) {
        // finalNodes.push(centerNode); // Will be added in loop
    }

    // Determine visibility based on expansion
    // If search is active, we IGNORE expansion and show matches + context.
    const isSearching = searchQuery.length > 0;

    if (isSearching) {
        // Search Mode: Show all matches + direct neighbors
        const lowerQuery = searchQuery.toLowerCase();
        const matches = masterData.nodes.filter(n => 
            n.name.toLowerCase().includes(lowerQuery) || 
            n.desc?.toLowerCase().includes(lowerQuery)
        );
        const matchIds = new Set(matches.map(n => n.id));
        
        // Add neighbors of matches to context, but maybe dimmed? 
        // For now, let's just show matches and the path to center?
        // Let's simply show ALL nodes that pass the Category Filter, and rely on Highlight to guide eye.
        // This is less confusing than disappearing nodes during search.
        finalNodes.push(...filteredNodes);
        
        // Links
        masterData.links.forEach(link => {
            const s = typeof link.source === 'object' ? (link.source as any).id : link.source;
            const t = typeof link.target === 'object' ? (link.target as any).id : link.target;
            if (filteredNodeIds.has(s) && filteredNodeIds.has(t)) {
                finalLinks.push(link);
            }
        });
        
        return { 
            visibleData: { nodes: finalNodes, links: finalLinks }, 
            highlightedNodeIds: matchIds 
        };
    } else {
        // Explore Mode: Use Expansion Logic
        // 1. Identify valid nodes based on category
        // 2. Filter based on expansion state
        
        // For this specific dataset structure:
        // Center -> always visible
        // Planet -> always visible (Level 1)
        // Satellite -> visible ONLY if connected Planet is in expandedNodes
        
        const nodesToShow = new Set<string>();
        
        masterData.nodes.forEach(node => {
            // Check Category Filter
            if (!activeGroups.has(node.group)) return;

            // Check Expansion
            if (node.group === 'center') {
                nodesToShow.add(node.id);
            } else if (node.group === 'planet') {
                nodesToShow.add(node.id); // Planets always visible initially as "Major Branches"
            } else if (node.group === 'satellite') {
                // Check if any neighbor is an expanded Planet
                const myNeighbors = neighbors[node.id] || [];
                const isConnectedToExpanded = myNeighbors.some(nid => 
                    expandedNodes.has(nid) // Connected to an expanded node
                );
                if (isConnectedToExpanded) {
                    nodesToShow.add(node.id);
                }
            }
        });

        // Build Final Arrays
        finalNodes.push(...masterData.nodes.filter(n => nodesToShow.has(n.id)));
        
        masterData.links.forEach(link => {
            const s = typeof link.source === 'object' ? (link.source as any).id : link.source;
            const t = typeof link.target === 'object' ? (link.target as any).id : link.target;
            if (nodesToShow.has(s) && nodesToShow.has(t)) {
                finalLinks.push(link);
            }
        });

        return { 
            visibleData: { nodes: finalNodes, links: finalLinks }, 
            highlightedNodeIds: new Set<string>() 
        };
    }
  }, [masterData, activeGroups, expandedNodes, searchQuery]);

  // -- Handlers --

  const handleNodeClick = (node: GraphNode) => {
    // 1. Focus Node (Camera fly-to handled in Graph component)
    setSelectedNode(node);
    
    // 2. Toggle Expansion (if not searching)
    if (!searchQuery) {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(node.id)) {
                next.delete(node.id); // Collapse
            } else {
                next.add(node.id); // Expand
            }
            return next;
        });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const newData = await parseCsvToGraph(file);
        setMasterData(newData);
        setExpandedNodes(new Set(['AGI_CORE'])); // Reset expansion
        setSelectedNode(null);
      } catch (err) {
        console.error("Failed to parse CSV", err);
        alert("Failed to parse CSV file.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset system to default configuration?")) {
      setMasterData(DEFAULT_GRAPH_DATA);
      setExpandedNodes(new Set(['AGI_CORE']));
      setSelectedNode(null);
      setSearchQuery('');
    }
  };

  const toggleGroup = (group: string) => {
      setActiveGroups(prev => {
          const next = new Set(prev);
          if (next.has(group)) next.delete(group);
          else next.add(group);
          return next;
      });
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-['Orbitron']">
      
      {/* Background Starscape Layer */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80" />

      {/* Main 3D Graph */}
      <div 
        className="absolute inset-0 z-10 cursor-move active:cursor-grabbing"
        onMouseEnter={() => setIsPaused(true)} 
        onMouseLeave={() => setIsPaused(false)}
      >
        <GalaxyGraph 
          data={visibleData} 
          onNodeClick={handleNodeClick} 
          isPaused={selectedNode !== null || isPaused}
          highlightedNodeIds={highlightedNodeIds}
          searchActive={searchQuery.length > 0}
        />
      </div>

      {/* --- UI Overlays --- */}

      {/* 1. Header & Controls (Top Left) */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-4 w-80 pointer-events-none">
        {/* Title Card */}
        <div className="p-6 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Cpu className="text-cyan-400 w-6 h-6 animate-pulse" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-white tracking-wider leading-none">NEBULA.AGI</h1>
                <p className="text-[10px] text-cyan-500/70 font-mono tracking-[0.2em] mt-1">KNOWLEDGE SYSTEM</p>
            </div>
          </div>
          
          <div className="mt-6 flex gap-2">
             <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-300 rounded-lg cursor-pointer transition-all text-[10px] font-bold uppercase tracking-wider">
              <Upload size={12} />
              Import CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <button 
                onClick={handleReset}
                className="flex items-center justify-center p-2 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-lg border border-white/5 transition-all"
                title="Reset System"
            >
                <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/10 w-fit pointer-events-auto">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[10px] text-slate-400 font-mono">
                    NODES: <span className="text-white font-bold">{visibleData.nodes.length}</span>
                </span>
            </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar (Top Right) */}
      <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-3 w-72 pointer-events-none">
        
        {/* Search Input */}
        <div className="relative w-full pointer-events-auto group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" />
            </div>
            <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes..." 
                className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 focus:border-cyan-500/50 text-white text-xs font-mono py-3 pl-10 pr-4 rounded-xl outline-none shadow-lg transition-all placeholder:text-slate-600"
            />
        </div>

        {/* Filter Toggle */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden shadow-lg w-full pointer-events-auto transition-all">
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/5 transition-colors uppercase tracking-wider"
            >
                <div className="flex items-center gap-2">
                    <Filter size={12} className="text-cyan-500" /> Filter Layers
                </div>
                {showFilters ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
            
            {showFilters && (
                <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                    {['center', 'planet', 'satellite'].map(group => (
                        <label key={group} className="flex items-center justify-between cursor-pointer group">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono group-hover:text-white transition-colors">
                                {group}
                            </span>
                            <div className={`
                                w-8 h-4 rounded-full relative transition-colors duration-300
                                ${activeGroups.has(group) ? 'bg-cyan-600' : 'bg-slate-700'}
                            `}>
                                <input 
                                    type="checkbox" 
                                    checked={activeGroups.has(group)} 
                                    onChange={() => toggleGroup(group)}
                                    className="hidden" 
                                />
                                <div className={`
                                    absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-300
                                    ${activeGroups.has(group) ? 'translate-x-4' : 'translate-x-0'}
                                `} />
                            </div>
                        </label>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* 3. Instructions (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        <p className="text-[10px] text-slate-500 font-mono bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
           Scroll to <span className="text-cyan-400">Zoom</span> • Drag to <span className="text-cyan-400">Pan</span> • Click Node to <span className="text-cyan-400">Expand</span>
        </p>
      </div>

      {/* Detail Panel */}
      <DetailPanel 
        node={selectedNode} 
        onClose={() => setSelectedNode(null)} 
      />

    </div>
  );
};

export default App;