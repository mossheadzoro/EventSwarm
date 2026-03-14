

// components/dashboard/job-selector.tsx
import React from "react";

export function JobSelector({ jobs, activeJob, setActiveJob }: any) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <div className="flex gap-3 mb-2 overflow-x-auto pb-8 rocket-scrollbar-h">
      {jobs.map((job: any) => (
        <button
          key={job._id}
          onClick={() => setActiveJob(job)}
          className={`px-4 py-2 rounded-lg border text-sm whitespace-nowrap transition-colors ${
            activeJob?._id === job._id
              ? "bg-[#00e5ff] text-black border-[#00e5ff]"
              : "bg-[#0f171e] border-[#1e293b] text-gray-400 hover:text-white hover:border-gray-500"
          }`}
        >
          {job.event_name}
        </button>
      ))}
    </div>
  );
}