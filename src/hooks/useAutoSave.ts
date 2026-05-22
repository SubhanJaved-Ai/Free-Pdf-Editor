import { useEffect, useRef, useCallback } from 'react';
import { get, set, del } from 'idb-keyval';
import { useEditorStore } from '@/store/useEditorStore';

const AUTO_SAVE_KEY = 'aetherpdf_autosave';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const DEBOUNCE_DELAY = 2000; // 2 second debounce for edit-triggered saves

export interface AutoSaveData {
  pdfBytes: Uint8Array;
  fileName: string | null;
  elements: any[];
  zoom: number;
  pageIndex: number;
  timestamp: number;
  totalPages: number;
  pageOrders: number[];
  pageDimensions: any[];
}

// Global save status — exposed for toolbar display
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

let _lastSaveTime: number | null = null;
let _saveStatus: SaveStatus = 'idle';
let _saveListeners: Set<() => void> = new Set();

export function getSaveStatus(): SaveStatus { return _saveStatus; }
export function getLastSaveTime(): number | null { return _lastSaveTime; }

function notifyListeners() {
  _saveListeners.forEach(fn => fn());
}

export function subscribeSaveStatus(fn: () => void): () => void {
  _saveListeners.add(fn);
  return () => _saveListeners.delete(fn);
}

async function performSave(): Promise<boolean> {
  const state = useEditorStore.getState();
  if (!state.pdfBytes || state.pdfBytes.length === 0) return false;

  _saveStatus = 'saving';
  notifyListeners();

  const saveData: AutoSaveData = {
    pdfBytes: state.pdfBytes,
    fileName: state.fileName,
    elements: state.elements,
    zoom: state.zoom,
    pageIndex: state.currentPageIndex,
    timestamp: Date.now(),
    totalPages: state.totalPages,
    pageOrders: state.pageOrders,
    pageDimensions: state.pageDimensions,
  };

  try {
    await set(AUTO_SAVE_KEY, saveData);
    _lastSaveTime = Date.now();
    _saveStatus = 'saved';
    notifyListeners();
    console.log('[AutoSave] Session saved to IndexedDB.');
    return true;
  } catch (e) {
    console.error('[AutoSave] Failed to save session', e);
    _saveStatus = 'error';
    notifyListeners();
    return false;
  }
}

// Manual save — called by the Save button
export async function manualSave(): Promise<boolean> {
  return performSave();
}

export function useAutoSave() {
  const { pdfBytes, elements } = useEditorStore();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevElementsLenRef = useRef(elements.length);

  // Periodic auto-save every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      performSave();
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Edit-triggered debounced save — fires when elements array changes
  useEffect(() => {
    if (!pdfBytes || pdfBytes.length === 0) return;
    
    // Skip the initial mount
    if (prevElementsLenRef.current === 0 && elements.length > 0) {
      prevElementsLenRef.current = elements.length;
      return;
    }
    prevElementsLenRef.current = elements.length;

    // Debounce — save 2s after the last change
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      performSave();
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [elements, pdfBytes]);

  return null;
}

export async function checkAutoSave(): Promise<AutoSaveData | undefined> {
  try {
    return await get<AutoSaveData>(AUTO_SAVE_KEY);
  } catch (e) {
    console.error('Failed to get autosave', e);
    return undefined;
  }
}

export async function clearAutoSave() {
  try {
    await del(AUTO_SAVE_KEY);
    _lastSaveTime = null;
    _saveStatus = 'idle';
    notifyListeners();
  } catch (e) {
    console.error('Failed to clear autosave', e);
  }
}
