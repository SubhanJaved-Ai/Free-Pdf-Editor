'use client';

import React, { useState, useEffect } from 'react';
import { subscribeSaveStatus, getSaveStatus, getLastSaveTime, SaveStatus } from '../../hooks/useAutoSave';
import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react';

export const SaveStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Subscribe to save status changes
  useEffect(() => {
    const update = () => {
      setStatus(getSaveStatus());
    };
    const unsub = subscribeSaveStatus(update);
    update(); // initial
    return unsub;
  }, []);

  // Update "time ago" text every 10 seconds
  useEffect(() => {
    const updateTimeAgo = () => {
      const lastSave = getLastSaveTime();
      if (!lastSave) {
        setTimeAgo('');
        return;
      }
      const diff = Math.floor((Date.now() - lastSave) / 1000);
      if (diff < 5) setTimeAgo('just now');
      else if (diff < 60) setTimeAgo(`${diff}s ago`);
      else if (diff < 3600) setTimeAgo(`${Math.floor(diff / 60)}m ago`);
      else setTimeAgo(`${Math.floor(diff / 3600)}h ago`);
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [status]); // re-run when status changes

  if (status === 'idle' && !timeAgo) return null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md select-none transition-all duration-300">
      {status === 'saving' && (
        <>
          <Loader2 size={12} className="text-primary animate-spin" />
          <span className="text-[10px] font-medium text-on-surface-variant">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Cloud size={12} className="text-emerald-500" />
          <span className="text-[10px] font-medium text-on-surface-variant">
            Saved {timeAgo}
          </span>
        </>
      )}
      {status === 'error' && (
        <>
          <CloudOff size={12} className="text-error" />
          <span className="text-[10px] font-medium text-error">Save failed</span>
        </>
      )}
    </div>
  );
};

export default SaveStatusIndicator;
