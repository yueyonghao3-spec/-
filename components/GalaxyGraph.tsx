import React, { useRef, useEffect, useMemo } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';
import { GraphData, GraphNode } from '../types';

interface GalaxyGraphProps {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  isPaused: boolean; // Pause rotation
  highlightedNodeIds: Set<string>; // IDs of nodes matching search
  searchActive: boolean; // Is there an active search?
}

const GalaxyGraph: React.FC<GalaxyGraphProps> = ({ 
  data, 
  onNodeClick, 
  isPaused, 
  highlightedNodeIds,
  searchActive
}) => {
  const fgRef = useRef<ForceGraphMethods>();
  const rotationAngle = useRef(0);
  const distance = 350; // Camera distance

  // Fix the central node position to (0,0,0) to create a stable "sun"
  useEffect(() => {
    // We modify the data in-place for physics engine to pick up fx/fy/fz
    // This ensures the center node never drifts
    const centerNode = data.nodes.find(n => n.group === 'center');
    if (centerNode) {
      centerNode.fx = 0;
      centerNode.fy = 0;
      centerNode.fz = 0;
    }
  }, [data]);

  // Custom Physics Configuration for "Spherical" branching
  useEffect(() => {
    const fg = fgRef.current;
    if (fg) {
        // Stronger repulsion to spread nodes out
        fg.d3Force('charge')?.strength(-100); 
        
        // Custom link distance: Far from center, close to each other
        fg.d3Force('link')?.distance((link: any) => {
            if (link.source.id === 'AGI_CORE' || link.target.id === 'AGI_CORE') {
                return 150; // Radius of the first shell
            }
            return 40; // Cluster tightness for sub-branches
        });
    }
  }, [data]);

  // Auto-rotation logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused || !fgRef.current) return;
      
      // Increment angle
      rotationAngle.current += 0.001; // Slow and steady
      
      const x = distance * Math.sin(rotationAngle.current);
      const z = distance * Math.cos(rotationAngle.current);
      const y = distance * Math.sin(rotationAngle.current * 0.5) * 0.1; 
      
      fgRef.current.cameraPosition(
        { x, y, z }, 
        { x: 0, y: 0, z: 0 }, 
        1000 
      );
    }, 20);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={data}
      backgroundColor="#000000"
      nodeLabel="name"
      // Node Styling
      nodeThreeObject={(node: any) => {
        const isCenter = node.group === 'center';
        const isHighlighted = highlightedNodeIds.has(node.id);
        const isDimmed = searchActive && !isHighlighted && !isCenter; // Center is always bright

        // Base size
        let radius = isCenter ? 10 : Math.max(2, Math.sqrt(node.val || 1));
        if (isHighlighted) radius *= 1.5;

        // Geometry
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        
        // Color Logic
        let colorHex = 0x00f2ff; // Default Cyan
        if (isCenter) colorHex = 0x3b82f6; // Blue
        else if (node.group === 'planet') colorHex = 0xa855f7; // Purple
        else if (node.group === 'satellite') colorHex = 0x14b8a6; // Teal

        // If dimmed, turn gray
        if (isDimmed) colorHex = 0x334155;

        const color = new THREE.Color(colorHex);

        // Material
        const material = new THREE.MeshPhongMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: isCenter || isHighlighted ? 0.8 : (isDimmed ? 0.1 : 0.4),
          transparent: true,
          opacity: isDimmed ? 0.3 : 0.9,
          shininess: 100,
        });

        return new THREE.Mesh(geometry, material);
      }}
      // Link styling
      linkColor={(link: any) => {
        if (searchActive) {
            // Check if both ends are highlighted
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            if (highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId)) {
                return 'rgba(255, 255, 255, 0.6)';
            }
            return 'rgba(50, 50, 50, 0.1)';
        }
        return 'rgba(6, 182, 212, 0.2)';
      }}
      linkWidth={searchActive ? 1 : 0.5}
      linkDirectionalParticles={searchActive ? 0 : 2}
      linkDirectionalParticleWidth={2}
      linkDirectionalParticleSpeed={0.005}
      
      // Interaction
      onNodeClick={(node) => {
        // Fly to node
        const distRatio = 1 + 100 / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
        if (fgRef.current) {
            fgRef.current.cameraPosition(
                { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
                { x: node.x || 0, y: node.y || 0, z: node.z || 0 },
                2000
            );
        }
        onNodeClick(node as GraphNode);
      }}
      onNodeDragEnd={node => {
          // Re-lock center if dragged (though we fix it every render, this helps physics engine)
          if (node.group === 'center') {
              node.fx = 0; node.fy = 0; node.fz = 0;
          }
      }}
      
      // Controls
      showNavInfo={false} // We provide our own instructions
      enableZoom={true}
      enableNodeDrag={true}
      
      // Physics 
      d3VelocityDecay={0.2} 
      warmupTicks={50}
    />
  );
};

export default GalaxyGraph;