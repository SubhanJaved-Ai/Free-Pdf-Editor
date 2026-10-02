'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore, EditorElement } from '../../store/useEditorStore';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Minus, Plus, Check, X } from 'lucide-react';
import { loadWebFontIfNeeded, getFontFallbackStack } from '../../utils/fontLoader';

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
  'Calibri', 'Cambria',
];

/**
 * FloatingFormatToolbar — the contextual rich-text toolbar that appears anchored
 * above any active text element, exactly like Google Docs / Adobe Acrobat.
 *
 * DESIGN RULES (Canva-grade):
 *  • ALWAYS initialise from activeElement — NEVER from global store defaults.
 *  • Toolbar button clicks apply changes to the element AND live-patch the
 *    contentEditable's inline style so the user sees results instantly.
 *  • The X button triggers an Escape keydown on the contentEditable, which
 *    restores the pre-edit snapshot (no data loss, full cancel semantics).
 *  • The ✓ button blurs the contentEditable, committing the text.
 */
export const FloatingFormatToolbar: React.FC<FloatingFormatToolbarProps> = ({
  activeElement,
  elementRect,
  onClose,
}) => {
  const { updateElement } = useEditorStore();
  const toolbarRef = useRef<HTMLDivElement>(null);

  // ── Local state mirrors the element's own properties (NOT global store defaults)
  const [fontFamily, setFontFamily] = useState(activeElement.fontFamily || 'Helvetica');
  const [fontSize, setFontSize] = useState(activeElement.fontSize || 14);

  // Sync whenever the active element itself changes (e.g., clicking a different text box)
  useEffect(() => {
    setFontFamily(activeElement.fontFamily || 'Helvetica');
    setFontSize(activeElement.fontSize || 14);
  }, [activeElement.id, activeElement.fontFamily, activeElement.fontSize]);

  // ── Helper: patch element in store AND live-update the DOM style ──────────────
  const getEditNode = (): HTMLElement | null =>
    document.getElementById(`text-edit-${activeElement.id}`);

  const update = (patch: Partial<EditorElement>) => {
    // Persist to store
    updateElement(activeElement.id, patch);

    // Live-patch the contentEditable DOM node so the user sees the change instantly
    // without waiting for a React re-render cycle.
    const node = getEditNode();
    if (!node) return;
    if (patch.fontFamily !== undefined) {
      loadWebFontIfNeeded(patch.fontFamily);
      node.style.fontFamily = getFontFallbackStack(patch.fontFamily);
    }
    if (patch.fontSize !== undefined) node.style.fontSize = `${patch.fontSize}px`;
    if (patch.fontWeight !== undefined) node.style.fontWeight = patch.fontWeight;
    if (patch.fontStyle !== undefined) node.style.fontStyle = patch.fontStyle;
    if (patch.textDecoration !== undefined) node.style.textDecoration = patch.textDecoration;
    if (patch.align !== undefined) node.style.textAlign = patch.align;
    if (patch.color !== undefined) node.style.color = patch.color;
  };

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    update({ fontFamily: family });
  };

  const handleFontSizeChange = (val: number) => {
    const clamped = Math.min(Math.max(val, 6), 200);
    setFontSize(clamped);
    update({ fontSize: clamped });
  };

  // Position: render the toolbar above the element, aligned to its left edge.
  const TOOLBAR_HEIGHT = 44; // px
  const GAP = 8;
  const topPx = Math.max(0, elementRect.top - TOOLBAR_HEIGHT - GAP);
  const leftPx = Math.max(0, elementRect.left);

  const isBold      = activeElement.fontWeight === 'bold';
  const isItalic    = activeElement.fontStyle === 'italic';
  const isUnderline = activeElement.textDecoration === 'underline';
  const alignment   = activeElement.align || 'left';

  // Stop all pointer events from bubbling to the canvas (would deselect the text)
  const stopProp = (e: React.MouseEvent | React.PointerEvent) => e.stopPropagation();

  return (
    <div
      ref={toolbarRef}
      className="absolute z-[200] flex items-center gap-0.5 px-1.5 py-1 bg-zinc-950/96 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl shadow-black/50 select-none"
      style={{
        top: topPx,
        left: leftPx,
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
          value={
            // Normalise rgb() format to #hex for the native color picker
            activeElement.color?.startsWith('rgb')
              ? rgbToHex(activeElement.color)
              : (activeElement.color || '#000000')
          }
          onChange={(e) => update({ color: e.target.value })}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
        />
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-white/10 mx-1 flex-shrink-0" />

      {/* ── Cancel (Escape = restore snapshot) ────────────────────── */}
      <button
        onClick={() => {
          // Fire an Escape keydown on the contentEditable — this triggers the
          // pre-edit snapshot restore logic in EditorPage's onKeyDown handler.
          const editNode = getEditNode();
          if (editNode) {
            editNode.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
            );
          }
          onClose();
        }}
        title="Cancel (Esc)"
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
      >
        <X size={13} />
      </button>

      {/* ── Confirm (blur + save) ──────────────────────────────────── */}
      <button
        onClick={() => {
          const editNode = getEditNode();
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

// ─── Utility ──────────────────────────────────────────────────────────────────
/** Convert CSS rgb(r,g,b) string to #rrggbb hex for native <input type="color"> */
function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '#000000';
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export default FloatingFormatToolbar;
