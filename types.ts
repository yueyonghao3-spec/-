export interface GraphNode {
  id: string;
  name: string;
  group: 'center' | 'planet' | 'satellite';
  val: number; // Size/Importance
  desc?: string; // Detail
  evidence?: string;
  analysis?: string;
  color?: string;
  // Force graph properties
  x?: number;
  y?: number;
  z?: number;
  fx?: number; // Fixed X
  fy?: number; // Fixed Y
  fz?: number; // Fixed Z
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  color?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface CsvRow {
  [key: string]: string;
}

// Default Data Constant with Hierarchy
export const DEFAULT_GRAPH_DATA: GraphData = {
  nodes: [
    // Center
    { id: 'AGI_CORE', name: 'AGI Singularity', group: 'center', val: 80, desc: 'The theoretical moment when AI surpasses human intelligence.', analysis: 'Central node of the system.' },
    
    // Level 1: Planets
    { id: 'Neural_Nets', name: 'Neural Networks', group: 'planet', val: 30, desc: 'Computing systems inspired by biological neural networks.' },
    { id: 'Reasoning', name: 'Reasoning', group: 'planet', val: 30, desc: 'The ability to make inferences from data.' },
    { id: 'Creativity', name: 'Creativity', group: 'planet', val: 30, desc: 'Generative capabilities in art and text.' },
    { id: 'Ethics', name: 'AI Ethics', group: 'planet', val: 30, desc: 'Moral principles governing AI behavior.' },
    { id: 'Robotics', name: 'Embodied AI', group: 'planet', val: 30, desc: 'AI operating in the physical world.' },
    
    // Level 2: Satellites (Branches)
    // Neural Nets branches
    { id: 'Transformers', name: 'Transformers', group: 'satellite', val: 15, desc: 'Attention-based architecture.' },
    { id: 'Backprop', name: 'Backpropagation', group: 'satellite', val: 10, desc: 'Gradient descent optimization.' },
    
    // Reasoning branches
    { id: 'CoT', name: 'Chain of Thought', group: 'satellite', val: 15, desc: 'Step-by-step reasoning technique.' },
    { id: 'Symbolic', name: 'Neuro-Symbolic', group: 'satellite', val: 15, desc: 'Combining logic with neural nets.' },

    // Creativity branches
    { id: 'Diffusion', name: 'Diffusion Models', group: 'satellite', val: 15, desc: 'Image generation technique.' },
    { id: 'LLMs', name: 'Large Language Models', group: 'satellite', val: 15, desc: 'Text generation foundations.' },

    // Ethics branches
    { id: 'Alignment', name: 'Alignment', group: 'satellite', val: 15, desc: 'Ensuring AI goals match human values.' },
    { id: 'Bias', name: 'Bias Mitigation', group: 'satellite', val: 15, desc: 'Reducing unfair prejudice in models.' },

    // Robotics branches
    { id: 'Sim2Real', name: 'Sim2Real', group: 'satellite', val: 15, desc: 'Transferring simulation skills to reality.' },
    { id: 'Sensors', name: 'Multimodal Sensors', group: 'satellite', val: 10, desc: 'Vision, touch, and audio integration.' },
  ],
  links: [
    // Center connections
    { source: 'AGI_CORE', target: 'Neural_Nets' },
    { source: 'AGI_CORE', target: 'Reasoning' },
    { source: 'AGI_CORE', target: 'Creativity' },
    { source: 'AGI_CORE', target: 'Ethics' },
    { source: 'AGI_CORE', target: 'Robotics' },

    // Planet connections
    { source: 'Neural_Nets', target: 'Transformers' },
    { source: 'Neural_Nets', target: 'Backprop' },
    { source: 'Reasoning', target: 'CoT' },
    { source: 'Reasoning', target: 'Symbolic' },
    { source: 'Creativity', target: 'Diffusion' },
    { source: 'Creativity', target: 'LLMs' },
    { source: 'Ethics', target: 'Alignment' },
    { source: 'Ethics', target: 'Bias' },
    { source: 'Robotics', target: 'Sim2Real' },
    { source: 'Robotics', target: 'Sensors' },
  ]
};