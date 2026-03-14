import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-[#0f171e] border border-[#1e293b] rounded-2xl p-8 flex-1 min-w-75 m-3 hover:border-[#00e5ff]/30 transition-colors duration-300 group">
      <div className="w-12 h-12 rounded-full bg-[#1e293b] flex items-center justify-center mb-6 group-hover:bg-[#1e293b]/80 transition-colors">
        <Icon className="text-[#00e5ff] w-6 h-6" />
      </div>
      <h3 className="text-white text-xl font-semibold mb-4">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}