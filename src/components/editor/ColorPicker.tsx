'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Pipette, Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  allowTransparent?: boolean;
  label?: string;
  className?: string;
}

const DEFAULT_PRESETS = [
  '#000000',
  '#ffffff',
  '#475569',
  '#2563eb',
  '#059669',
  '#dc2626',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
];

/**
 * Validates and normalizes hex input.
 * Supports:
 * - #RGB -> #RRGGBB
 * - #RRGGBB -> #RRGGBB
 * - RGB -> #RRGGBB
 * - RRGGBB -> #RRGGBB
 * Returns normalized hex uppercase string or null if invalid.
 */
export function normalizeHexColor(input: string): string | null {
  if (!input) return null;
  let clean = input.trim();
  
  // Handle 'transparent' case
  if (clean.toLowerCase() === 'transparent') {
    return 'transparent';
  }

  // Remove leading '#' if present
  if (clean.startsWith('#')) {
    clean = clean.slice(1);
  }

  // Check 3-character hex (RGB)
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    const r = clean[0];
    const g = clean[1];
    const b = clean[2];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  // Check 6-character hex (RRGGBB)
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `#${clean}`.toUpperCase();
  }

  return null;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  allowTransparent = false,
  label,
  className = '',
}) => {
  const [hexInput, setHexInput] = useState<string>(
    value === 'transparent' ? 'transparent' : value.toUpperCase()
  );
  const [isValid, setIsValid] = useState<boolean>(true);

  // Sync internal text input whenever external `value` prop changes
  useEffect(() => {
    if (value === 'transparent') {
      setHexInput('transparent');
      setIsValid(true);
    } else {
      const normalized = normalizeHexColor(value);
      setHexInput(normalized || value.toUpperCase());
      setIsValid(!!normalized);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setHexInput(rawVal);

    if (rawVal.toLowerCase() === 'transparent' && allowTransparent) {
      setIsValid(true);
      onChange('transparent');
      return;
    }

    const normalized = normalizeHexColor(rawVal);
    if (normalized && normalized !== 'transparent') {
      setIsValid(true);
      onChange(normalized);
    } else {
      setIsValid(false);
    }
  };

  const handleInputBlur = () => {
    if (value === 'transparent') {
      setHexInput('transparent');
      setIsValid(true);
      return;
    }
    const normalized = normalizeHexColor(hexInput);
    if (normalized) {
      setHexInput(normalized);
      setIsValid(true);
      if (normalized !== value) {
        onChange(normalized);
      }
    } else {
      // Revert to current valid value if invalid
      setHexInput(value.toUpperCase());
      setIsValid(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleEyeDropper = useCallback(async () => {
    if ('EyeDropper' in window) {
      try {
        const EyeDropperClass = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex?: string }> } }).EyeDropper;
        const eyeDropper = new EyeDropperClass();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          onChange(hex);
        }
      } catch (err) {
        // User cancelled eye dropper or not allowed
      }
    }
  }, [onChange]);

  const pickerColorVal = value === 'transparent' || !value.startsWith('#') ? '#000000' : value;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">
          {label}
        </label>
      )}

      {/* Primary Color Control Bar */}
      <div className="flex items-center gap-2 bg-surface-container/60 p-1.5 rounded-xl border border-outline-variant/30 transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30">
        {/* Visual Swatch & Native Color Picker Trigger */}
        <div
          className="relative w-8 h-8 rounded-lg shadow-2xs border border-outline-variant/50 overflow-hidden flex-shrink-0 cursor-pointer group"
          style={{
            background:
              value === 'transparent'
                ? 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%) 50% / 8px 8px'
                : value,
          }}
          title="Click to open color picker"
        >
          <input
            type="color"
            value={pickerColorVal}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 opacity-0 cursor-pointer"
            title="Custom Color Picker"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
        </div>

        {/* HEX Input Field */}
        <div className="flex-1 flex items-center gap-1 min-w-0 bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2 py-1">
          <span className="text-xs font-mono font-bold text-on-surface-variant select-none">#</span>
          <input
            type="text"
            value={hexInput.startsWith('#') ? hexInput.slice(1) : hexInput}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder="000000"
            maxLength={11}
            className={`w-full text-xs font-mono font-bold bg-transparent border-none p-0 focus:outline-none uppercase ${
              isValid ? 'text-on-surface' : 'text-error'
            }`}
            title="Enter HEX color (e.g. 3B82F6, FF0000, FFF)"
          />

          {!isValid && (
            <span className="text-[9px] font-bold text-error bg-error/10 px-1 py-0.5 rounded flex-shrink-0" title="Invalid HEX format">
              Invalid
            </span>
          )}
        </div>

        {/* Eyedropper Tool (If Supported) */}
        {typeof window !== 'undefined' && 'EyeDropper' in window && (
          <button
            type="button"
            onClick={handleEyeDropper}
            className="p-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary/40 active:scale-95 transition-all flex-shrink-0"
            title="Pick color from screen (Eyedropper)"
          >
            <Pipette size={14} />
          </button>
        )}

        {/* Transparent Toggle Option */}
        {allowTransparent && (
          <button
            type="button"
            onClick={() => onChange(value === 'transparent' ? '#000000' : 'transparent')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex-shrink-0 ${
              value === 'transparent'
                ? 'border-primary text-primary bg-primary/10 shadow-2xs'
                : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {value === 'transparent' ? 'None' : 'Clear'}
          </button>
        )}
      </div>

      {/* Preset Swatches Grid */}
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {presets.map((c) => {
            const isSelected = value.toUpperCase() === c.toUpperCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                className={`w-5 h-5 rounded-md border transition-all relative flex items-center justify-center ${
                  isSelected
                    ? 'border-primary scale-110 shadow-xs ring-2 ring-primary/30 z-10'
                    : 'border-outline-variant/40 hover:scale-105 hover:border-outline-variant/80'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              >
                {isSelected && (
                  <Check
                    size={11}
                    className={
                      c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#fff'
                        ? 'text-black'
                        : 'text-white'
                    }
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
