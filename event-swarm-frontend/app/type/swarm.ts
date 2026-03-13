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
  icon: any; // Or React.ElementType if you want strict typing for Lucide icons
  title: string;
  data: AgentState;
  glow: boolean;
  isRoot?: boolean;
};