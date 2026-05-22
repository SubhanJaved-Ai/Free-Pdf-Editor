'use client';

import React from 'react';
import { AutoSaveData } from '../../hooks/useAutoSave';
import { Clock, FileText, RotateCcw, Plus } from 'lucide-react';

interface SessionRecoveryModalProps {
  saveData: AutoSaveData;
  onRestore: () => void;
  onStartFresh: () => void;
}

export const SessionRecoveryModal: React.FC<SessionRecoveryModalProps> = ({ 
  saveData, 
  onRestore, 
  onStartFresh 
}) => {
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const fileSize = saveData.pdfBytes ? 
    (saveData.pdfBytes.length / 1024 / 1024).toFixed(1) + ' MB' : 
    'Unknown';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant/30 w-[440px] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-primary via-primary-container to-secondary p-6 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <RotateCcw size={16} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Session Recovery</h2>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              We found an unsaved editing session. Would you like to continue where you left off?
            </p>
          </div>
        </div>

        {/* Session Details Card */}
        <div className="px-6 -mt-4 relative z-10">
          <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">
                  {saveData.fileName || 'Untitled Document'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                    <Clock size={10} />
                    {formatDate(saveData.timestamp)}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    {fileSize}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    {saveData.totalPages || '?'} pages
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {saveData.elements?.length || 0} elements
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {Math.round((saveData.zoom || 1) * 100)}% zoom
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-5 flex gap-3">
          <button
            onClick={onStartFresh}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface text-on-surface-variant text-sm font-medium hover:bg-surface-container-high hover:text-on-surface transition-all duration-150"
          >
            <Plus size={15} />
            Start Fresh
          </button>
          <button
            onClick={onRestore}
            className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container shadow-md hover:shadow-lg transition-all duration-150"
          >
            <RotateCcw size={15} />
            Restore Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionRecoveryModal;
