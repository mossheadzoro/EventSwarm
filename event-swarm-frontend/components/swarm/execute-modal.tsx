// components/dashboard/execute-modal.tsx
import React from "react";
import { Brain, Play, X } from "lucide-react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function ExecuteModal({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  onConfirm, 
  isUpdating 
}: any) {
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#0a1017] border border-[#1e293b] rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.1)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1e293b] bg-[#0d141f]">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Brain className="w-6 h-6 text-[#00e5ff]" />
                  Initialize Swarm Sequence
                </h2>
                <p className="text-sm text-gray-400 mt-1">Verify parameters before handing off to AI Agents.</p>
              </div>
              <button 
                onClick={onClose}
                disabled={isUpdating}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Event Name</label>
                  <input 
                    type="text" 
                    value={formData.event_name}
                    onChange={(e) => setFormData({...formData, event_name: e.target.value})}
                    disabled={isUpdating}
                    className="w-full bg-[#0f171e] border border-[#1e293b] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all disabled:opacity-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Date</label>
                    <input 
                      type="text" 
                      value={formData.event_date}
                      onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                      disabled={isUpdating}
                      className="w-full bg-[#0f171e] border border-[#1e293b] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Type</label>
                    <input 
                      type="text" 
                      value={formData.event_type}
                      onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                      disabled={isUpdating}
                      className="w-full bg-[#0f171e] border border-[#1e293b] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase flex justify-between">
                  <span>Schedule Data (CSV)</span>
                  <span className="text-[#00e5ff]/50 font-mono lowercase">Parsed from buffer</span>
                </label>
                <textarea 
                  value={formData.schedule_csv}
                  onChange={(e) => setFormData({...formData, schedule_csv: e.target.value})}
                  rows={4}
                  disabled={isUpdating}
                  className="w-full bg-[#0f171e] border border-[#1e293b] text-gray-300 font-mono text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all resize-y disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase flex justify-between">
                  <span>Participant Roster (CSV)</span>
                  <span className="text-[#00e5ff]/50 font-mono lowercase">Parsed from buffer</span>
                </label>
                <textarea 
                  value={formData.participant_csv}
                  onChange={(e) => setFormData({...formData, participant_csv: e.target.value})}
                  rows={4}
                  disabled={isUpdating}
                  className="w-full bg-[#0f171e] border border-[#1e293b] text-gray-300 font-mono text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all resize-y disabled:opacity-50"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#1e293b] bg-[#0d141f] flex justify-end gap-3">
              <Button 
                onClick={onClose}
                disabled={isUpdating}
                className="bg-transparent border border-[#334155] text-gray-300 hover:bg-[#1e293b] hover:text-white px-6 h-11 disabled:opacity-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={onConfirm}
                disabled={isUpdating}
                className="group relative flex items-center justify-center gap-2 px-8 h-11 bg-green-500 hover:bg-green-400 text-[#0a1017] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <span className="animate-pulse">Initializing...</span>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Confirm & Initialize
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}