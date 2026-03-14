// components/dashboard/types.ts

export type AgentState = {
  status: string;
  progress: number;
  task: string;
};

export type Packet = {
  id: string;
  from: string;
  to: string;
};

export type AgentNodeProps = {
  icon: any;
  title: string;
  data: AgentState;
  glow: boolean;
  isRoot?: boolean;
  phaseKey?: string;
  currentPhase?: string | null;
};