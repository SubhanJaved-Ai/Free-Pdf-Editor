'use client';

import React from 'react';
import { useEditorStore, EditorElement } from '../../store/useEditorStore';
import { Trash2, Copy, ArrowUp, ArrowDown, Type, RotateCcw } from 'lucide-react';

interface FloatingToolbarProps {
  selectedElement: EditorElement;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ selectedElement }) => {
  const { deleteElement, addElement, restoreElement } = useEditorStore();

  if (!selectedElement) return null;

  // Calculate position: we place it 40px above the element y coordinate
  // selectedElement.x and selectedElement.y are in percentage coordinates of the page
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${selectedElement.x}%`,
    top: `calc(${selectedElement.y}% - 42px)`,
    transform: 'translateX(0)',
    zIndex: 100,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElement(selectedElement.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Copy element and shift x/y coordinates slightly to visually stack it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...cleanElement } = selectedElement;
    addElement({
      ...cleanElement,
      x: Math.min(cleanElement.x + 2, 90),
      y: Math.min(cleanElement.y + 2, 90)
    });
  };

  const handleLayerUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { elements } = useEditorStore.getState();
    const index = elements.findIndex(el => el.id === selectedElement.id);
    if (index === elements.length - 1) return;
    
    const newElements = [...elements];
    const temp = newElements[index];
    newElements[index] = newElements[index + 1];
    newElements[index + 1] = temp;
    useEditorStore.setState({ elements: newElements });
  };

  const handleLayerDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { elements } = useEditorStore.getState();
    const index = elements.findIndex(el => el.id === selectedElement.id);
    if (index === 0) return;
    
    const newElements = [...elements];
    const temp = newElements[index];
    newElements[index] = newElements[index - 1];
    newElements[index - 1] = temp;
    useEditorStore.setState({ elements: newElements });
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    restoreElement(selectedElement.id);
  };

  return (
    <div 
      style={style} 
      className="flex items-center gap-1 p-1 bg-zinc-950/95 backdrop-blur border border-white/10 rounded-lg shadow-xl shadow-black/40 animate-in fade-in slide-in-from-bottom-2 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Element Type Indicator */}
      <div className="px-2 py-1 text-[9px] font-bold text-zinc-500 border-r border-white/5 uppercase select-none">
        {selectedElement.type}
      </div>

      {/* Layer Depth Shifters */}
      <button
        onClick={handleLayerUp}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
        title="Bring Forward"
      >
        <ArrowUp size={12} />
      </button>
      <button
        onClick={handleLayerDown}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
        title="Send Backward"
      >
        <ArrowDown size={12} />
      </button>

      {/* Edit Text Button (For text elements) */}
      {selectedElement.type === 'text' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            useEditorStore.getState().setActiveElementId(selectedElement.id);
          }}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition flex items-center gap-1 px-1.5 border-r border-white/5"
          title="Edit Text Content"
        >
          <Type size={12} className="text-veltis-cyan" />
          <span className="text-[9px] font-semibold text-zinc-300">Edit Text</span>
        </button>
      )}

      {/* Restore Original (For original PDF elements) */}
      {selectedElement.isOriginalPdfElement && (
        <button
          onClick={handleRestore}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition flex items-center gap-1 px-1.5 border-r border-white/5"
          title="Restore Original Text & Position"
        >
          <RotateCcw size={12} />
          <span className="text-[9px] font-semibold text-zinc-300">Restore</span>
        </button>
      )}

      {/* Duplicate Element */}
      <button
        onClick={handleDuplicate}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition border-r border-white/5 pr-1.5"
        title="Duplicate Element"
      >
        <Copy size={12} />
      </button>

      {/* Delete Element */}
      <button
        onClick={handleDelete}
        className="p-1.5 rounded hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition"
        title="Delete Element"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};
export default FloatingToolbar;
