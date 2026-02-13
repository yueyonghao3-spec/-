import Papa from 'papaparse';
import { GraphData, GraphNode, GraphLink } from '../types';

export const parseCsvToGraph = (file: File): Promise<GraphData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];
        const uniqueIds = new Set<string>();

        // Center Node (Fixed)
        const centerId = "AGI_CORE";
        nodes.push({
          id: centerId,
          name: "AGI Future",
          group: 'center',
          val: 60,
          desc: "The central core of Artificial General Intelligence.",
          analysis: "System Root",
          color: "#f0f9ff" // White-ish for star
        });
        uniqueIds.add(centerId);

        results.data.forEach((row: any) => {
          // Heuristic to find the Name column
          const name = row["主分支"] || row["Name"] || row["Node"] || row["Title"] || Object.values(row)[0];
          
          if (!name || typeof name !== 'string') return;
          
          const cleanId = name.trim();
          if (!cleanId || uniqueIds.has(cleanId)) return;

          // Mapping other columns
          const desc = row["子节点/细节"] || row["Description"] || row["Detail"] || "";
          const evidence = row["关键引用/证据"] || row["Evidence"] || row["Reference"] || "";
          const analysis = row["分析/洞见"] || row["Analysis"] || row["Insight"] || "";

          nodes.push({
            id: cleanId,
            name: cleanId,
            group: 'planet',
            val: 15 + Math.random() * 15, // Random size variation
            desc,
            evidence,
            analysis
          });
          uniqueIds.add(cleanId);

          // Link to center
          links.push({
            source: centerId,
            target: cleanId
          });
        });

        resolve({ nodes, links });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};