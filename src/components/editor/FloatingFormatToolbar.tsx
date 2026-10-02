'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore, EditorElement } from '../../store/useEditorStore';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Minus, Plus, Check, X } from 'lucide-react';
import { loadWebFontIfNeeded } from '../../utils/fontLoader';

interface FloatingFormatToolbarProps {
  activeElement: EditorElement;
  /** Pixel-space bounding rect of the element relative to the canvas container */
  elementRect: { top: number; left: number; width: number };
  onClose: () => void;
}

const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
  'Trebuchet MS', 'Courier New', 'Inter', 'Poppins', 'Roboto',
  'Open Sans', 'Montserrat', 'Lato', 'Nunito', 'Merriweather',
  'Playfair Display', 'Oswald', 'Raleway', 'Ubuntu', 'Garamond',
];

/**
 * FloatingFormatToolbar — the contextual rich-text toolbar that appears anchored
 * above any active text element, exactly like Google Docs / Adobe Acrobat.
 *
 * Responsibilities:
 *   • Bold / Italic / Underline toggles
 *   • Font family picker
 *   • Font size stepper (−/number/+)
 *   • Text alignment (L/C/R)
 *   • Text color swatch (delegates to a mini color input)
 *   • Confirm (blur) / Cancel (restore) buttons
 *
 * Positioning: placed above the element in page-percentage space, converted to
 * pixel offsets by the parent EditorPage. The toolbar never covers the text being
 * edited.
 */
export const FloatingFormatToolbar: React.FC<FloatingFormatToolbarProps> = ({
  activeElement,
  elementRect,
  onClose,
}) => {
  const { updateElement } = useEditorStore();
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Local font family state for the dropdown (avoids triggering an element update on every keystroke)
  const [fontFamily, setFontFamily] = useState(activeElement.fontFamily || 'Helvetica');
  const [fontSize, setFontSize] = useState(activeElement.fontSize || 14);

  // Sync if active element changes while toolbar is open (e.g., click a different text element)
  useEffect(() => {
    setFontFamily(activeElement.fontFamily || 'Helvetica');
    setFontSize(activeElement.fontSize || 14);
  }, [activeElement.id, activeElement.fontFamily, activeElement.fontSize]);

  const update = (patch: Partial<EditorElement>) => {
    updateElement(activeElement.id, patch);
  };

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    loadWebFontIfNeeded(family);
    update({ fontFamily: family });
  };

  const handleFontSizeChange = (val: number) => {
    const clamped = Math.min(Math.max(val, 6), 200);
    setFontSize(clamped);
    update({ fontSize: clamped });
  };

  // Position: render the toolbar above the element, centred horizontally on its left edge.
  // elementRect is in CSS pixels inside the scaled page container.
  const TOOLBAR_HEIGHT = 44; // px
  const GAP = 8; // gap between toolbar bottom and element top
  const topPx = Math.max(0, elementRect.top - TOOLBAR_HEIGHT - GAP);
  const leftPx = Math.max(0, elementRect.left);

  const isBold = activeElement.fontWeight === 'bold';
  const isItalic = activeElement.fontStyle === 'italic';
  const isUnderline = activeElement.textDecoration === 'underline';
  const alignment = activeElement.align || 'left';

  // Stop all pointer events from bubbling to the canvas (which would deselect the text)
  const stopProp = (e: React.MouseEvent | React.PointerEvent) => e.stopPropagation();

  return (
    <div
      ref={toolbarRef}
      className="absolute z-[200] flex items-center gap-0.5 px-1.5 py-1 bg-zinc-950/96 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl shadow-black/50 select-none"
      style={{
        top: topPx,
        left: leftPx,
        // Never render off-screen to the right
        maxWidth: 'calc(100% - 16px)',
        fontSize: '13px',
        animation: 'fadeSlideIn 120ms ease-out both',
      }}
      onClick={stopProp}
      onPointerDown={stopProp}
    >
      {/* ── Font Family Dropdown ───────────────────────────────────── */}
      <select
        value={fontFamily}
        onChange={(e) => handleFontFamilyChange(e.target.value)}
        title="Font Family"
        className="h-7 bg-zinc-800 text-zinc-100 text-[11px] font-medium rounded-lg px-1.5 border border-white/10 focus:outline-none focus:border-blue-500/60 cursor-pointer max-w-[110px] truncate"
        style={{ fontFamily }}
      >
        {FONT_FAMILIES.map(f => (
          <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
        ))}
      </select>

      {/* Separator */}
      <div className="w-px h-5 bg-white/10 mx-1 flex-shrink-0" />

      {/* ── Font Size Stepper ─────────────────────────────────────── */}
      <div className="flex items-center gap-0.5">
        <button
          className="w-6 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          onClick={() => handleFontSizeChange(fontSize - 1)}
          title="Decrease font size"
        >
          <Minus size={10} />
        </button>
        <input
          type="number"
          min={6}
          max={200}
          value={fontSize}
          onChange={(e) => handleFontSizeChange(parseInt(e.target.value) || 14)}
          className="w-9 h-7 bg-zinc-800 text-zinc-100 text-[11px] font-mono font-bold text-center rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/60"
          title="Font size"
        />
        <button
          className="w-6 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          onClick={() => handleFontSizeChange(fontSize + 1)}
          title="Increase font size"
        >
          <Plus size={10} />
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-white/10 mx-1 flex-shrink-0" />

      {/* ── Bold / Italic / Underline ─────────────────────────────── */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => update({ fontWeight: isBold ? 'normal' : 'bold' })}
          title="Bold (Ctrl+B)"
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors font-bold text-xs ${
            isBold ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          <Bold size={13} />
        </button>
        <button
          onClick={() => update({ fontStyle: isItalic ? 'normal' : 'italic' })}
          title="Italic (Ctrl+I)"
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
            isItalic ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          <Italic size={13} />
        </button>
        <button
          onClick={() => update({ textDecoration: isUnderline ? 'none' : 'underline' })}
          title="Underline (Ctrl+U)"
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
            isUnderline ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          <Underline size={13} />
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-white/10 mx-1 flex-shrink-0" />

      {/* ── Alignment ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5">
        {(['left', 'center', 'right'] as const).map((a) => {
          const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight;
          return (
            <button
              key={a}
              onClick={() => update({ align: a })}
              title={`Align ${a}`}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                alignment === a ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              <Icon size={13} />
            </button>
          );
        })}
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-white/10 mx-1 flex-shrink-0" />

      {/* ── Text Color ────────────────────────────────────────────── */}
      <div className="relative flex items-center" title="Text Color">
        <label
          htmlFor={`fmt-color-${activeElement.id}`}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
          title="Text Color"
        >
          {/* Coloured underline swatch — the A with colour strip below */}
          <span className="relative flex flex-col items-center gap-px">
            <span className="text-[13px] font-bold leading-none text-zinc-200">A</span>
            <span
              className="w-4 h-[3px] rounded-full"
              style={{ backgroundColor: activeElement.color || '#ffffff' }}
            />
          </span>
        </label>
        <input
          id={`fmt-color-${activeElement.id}`}
          type="color"
          value={activeElement.color || '#000000'}
          onChange={(e) => update({ color: e.target.value })}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
        />
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-white/10 mx-1 flex-shrink-0" />

      {/* ── Confirm (blur) ────────────────────────────────────────── */}
      <button
        onClick={() => {
          // Blur the active contentEditable element — this triggers the onBlur save handler
          const editNode = document.getElementById(`text-edit-${activeElement.id}`);
          if (editNode) editNode.blur();
          onClose();
        }}
        title="Done editing (Enter)"
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
      >
        <Check size={13} />
      </button>
    </div>
  );
};

export default FloatingFormatToolbar;
