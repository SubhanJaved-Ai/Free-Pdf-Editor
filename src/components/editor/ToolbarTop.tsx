'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '../../store/useEditorStore';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { manualSave } from '../../hooks/useAutoSave';
import { 
  Pointer, 
  Type, 
  Image as ImageIcon, 
  PenTool, 
  Square, 
  Circle, 
  Undo2, 
  Redo2, 
  Sparkles, 
  Download, 
  UploadCloud, 
  Highlighter, 
  Eraser,
  Save,
  Upload,
  Pencil,
  ArrowLeft,
  Check,
  Loader2,
  LayoutDashboard,
  Menu,
  Sliders
} from 'lucide-react';

interface ToolbarTopProps {
  onExport: () => void;
  onUploadClick: () => void;
  onSaveClick: () => void;
}

export const ToolbarTop: React.FC<ToolbarTopProps> = ({ onExport, onUploadClick, onSaveClick }) => {
  const router = useRouter();
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const {
    activeTool,
    setActiveTool,
    past,
    future,
    undo,
    redo,
    fileName,
    layoutMode,
    setLayoutMode,
    isOcrRunning,
    ocrProgress,
    signatures,
    addSignature,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useEditorStore();

  const [isSignatureOpen, setIsSignatureOpen] = React.useState(false);
  const [signatureText, setSignatureText] = React.useState('John Doe');
  const [selectedFont, setSelectedFont] = React.useState('Great Vibes');
  const [signatureTab, setSignatureTab] = React.useState<'type' | 'draw' | 'upload'>('type');
  const canvasDrawRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawingSignature, setIsDrawingSignature] = React.useState(false);
  const drawPointsRef = React.useRef<{x: number; y: number}[]>([]);
  
  // All 50 premium signature fonts — loaded via <link> in layout.tsx
  const signatureFonts = [
    { name: 'Great Vibes', family: 'Great Vibes' },
    { name: 'Dancing Script', family: 'Dancing Script' },
    { name: 'Pacifico', family: 'Pacifico' },
    { name: 'Caveat', family: 'Caveat' },
    { name: 'Sacramento', family: 'Sacramento' },
    { name: 'Satisfy', family: 'Satisfy' },
    { name: 'Parisienne', family: 'Parisienne' },
    { name: 'Allura', family: 'Allura' },
    { name: 'Alex Brush', family: 'Alex Brush' },
    { name: 'Yellowtail', family: 'Yellowtail' },
    { name: 'Kaushan Script', family: 'Kaushan Script' },
    { name: 'Marck Script', family: 'Marck Script' },
    { name: 'Tangerine', family: 'Tangerine' },
    { name: 'Merienda', family: 'Merienda' },
    { name: 'Rochester', family: 'Rochester' },
    { name: 'Clicker Script', family: 'Clicker Script' },
    { name: 'Courgette', family: 'Courgette' },
    { name: 'Pinyon Script', family: 'Pinyon Script' },
    { name: 'Italianno', family: 'Italianno' },
    { name: 'Bad Script', family: 'Bad Script' },
    { name: 'Handlee', family: 'Handlee' },
    { name: 'Cookie', family: 'Cookie' },
    { name: 'Mr Dafoe', family: 'Mr Dafoe' },
    { name: 'Berkshire Swash', family: 'Berkshire Swash' },
    { name: 'Petit Formal Script', family: 'Petit Formal Script' },
    // Batch 2 — 25 additional premium fonts
    { name: 'Whisper', family: 'Whisper' },
    { name: 'Euphoria Script', family: 'Euphoria Script' },
    { name: 'Rouge Script', family: 'Rouge Script' },
    { name: 'Monsieur La Doulaise', family: 'Monsieur La Doulaise' },
    { name: 'Mrs Saint Delafield', family: 'Mrs Saint Delafield' },
    { name: 'Ruthie', family: 'Ruthie' },
    { name: 'Herr Von Muellerhoff', family: 'Herr Von Muellerhoff' },
    { name: 'Miss Fajardose', family: 'Miss Fajardose' },
    { name: 'Dr Sugiyama', family: 'Dr Sugiyama' },
    { name: 'Meie Script', family: 'Meie Script' },
    { name: 'Bilbo Swash Caps', family: 'Bilbo Swash Caps' },
    { name: 'Sevillana', family: 'Sevillana' },
    { name: 'Meddon', family: 'Meddon' },
    { name: 'Niconne', family: 'Niconne' },
    { name: 'Aguafina Script', family: 'Aguafina Script' },
    { name: 'Qwigley', family: 'Qwigley' },
    { name: 'League Script', family: 'League Script' },
    { name: 'Style Script', family: 'Style Script' },
    { name: 'Ms Madi', family: 'Ms Madi' },
    { name: 'Shalimar', family: 'Shalimar' },
    { name: 'Luxurious Script', family: 'Luxurious Script' },
    { name: 'Bonheur Royale', family: 'Bonheur Royale' },
    { name: 'Ballet', family: 'Ballet' },
    { name: 'Petemoss', family: 'Petemoss' },
    { name: 'Fleur De Leah', family: 'Fleur De Leah' },
  ];

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        addSignature(reader.result as string);
        setActiveTool('signature');
        setIsSignatureOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateTypedSignature = async () => {
    if (!signatureText.trim()) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, 800, 250);
    
    const fontFamily = signatureFonts.find(f => f.name === selectedFont)?.family || 'Great Vibes';
    const fontStr = `80px "${fontFamily}"`;
    
    // Explicitly load the exact font face before drawing
    try {
      await document.fonts.load(fontStr);
      // Double-ensure: wait for all fonts to be ready
      await document.fonts.ready;
    } catch (err) {
      console.warn('Font preload warning:', err);
    }
    
    // Small delay to guarantee rendering after load
    await new Promise(resolve => setTimeout(resolve, 50));
    
    ctx.font = fontStr;
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(signatureText, 400, 125);
    
    // Trim transparent edges for a tight signature image
    const imageData = ctx.getImageData(0, 0, 800, 250);
    let minX = 800, minY = 250, maxX = 0, maxY = 0;
    for (let y = 0; y < 250; y++) {
      for (let x = 0; x < 800; x++) {
        const alpha = imageData.data[(y * 800 + x) * 4 + 3];
        if (alpha > 10) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Add padding
    const pad = 10;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(800, maxX + pad);
    maxY = Math.min(250, maxY + pad);
    
    const trimW = maxX - minX;
    const trimH = maxY - minY;
    
    if (trimW > 0 && trimH > 0) {
      const trimCanvas = document.createElement('canvas');
      trimCanvas.width = trimW;
      trimCanvas.height = trimH;
      const trimCtx = trimCanvas.getContext('2d');
      if (trimCtx) {
        trimCtx.drawImage(canvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
        const dataUrl = trimCanvas.toDataURL('image/png');
        addSignature(dataUrl);
        setActiveTool('signature');
        setIsSignatureOpen(false);
      }
    } else {
      // Fallback: use full canvas
      const dataUrl = canvas.toDataURL('image/png');
      addSignature(dataUrl);
      setActiveTool('signature');
      setIsSignatureOpen(false);
    }
  };

  // Drawing signature handlers
  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasDrawRef.current;
    if (!canvas) return;
    setIsDrawingSignature(true);
    drawPointsRef.current = [];
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawPointsRef.current.push({ x, y });
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    const canvas = canvasDrawRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawPointsRef.current.push({ x, y });
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleDrawEnd = () => {
    setIsDrawingSignature(false);
  };

  const handleClearDraw = () => {
    const canvas = canvasDrawRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    drawPointsRef.current = [];
  };

  const handleSaveDrawnSignature = () => {
    const canvas = canvasDrawRef.current;
    if (!canvas || drawPointsRef.current.length < 3) return;
    const dataUrl = canvas.toDataURL('image/png');
    addSignature(dataUrl);
    setActiveTool('signature');
    setIsSignatureOpen(false);
    handleClearDraw();
  };

  const tools = [
    { id: 'select', label: 'Select', icon: Pointer, tip: 'Select and move elements' },
    { id: 'text', label: 'Text', icon: Type, tip: 'Edit and add text' },
    { id: 'image', label: 'Image', icon: ImageIcon, tip: 'Upload and edit images' },
    { id: 'signature', label: 'Signature', icon: PenTool, tip: 'Create or upload signatures' },
    { id: 'shape', label: 'Shapes', icon: Square, tip: 'Insert shapes and lines' },
    { id: 'draw', label: 'Draw', icon: Pencil, tip: 'Freehand drawing and annotations' },
    { id: 'erase', label: 'Eraser', icon: Eraser, tip: 'Erase content from the page' },
  ] as const;

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex justify-between items-center h-16 px-6">
      {/* Left side: Back & Branding */}
      <div className="flex items-center gap-4">
        {/* Mobile Left Sidebar Toggle */}
        <button
          onClick={() => setMobileSidebarOpen(mobileSidebarOpen === 'left' ? null : 'left')}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-on-surface hover:bg-surface-variant transition-colors"
        >
          <Menu size={20} />
        </button>

        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 group text-on-surface-variant hover:text-on-surface transition-colors ml-2 md:ml-0"
          title="Back to Home"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform duration-200 text-primary" />
          <span className="text-xs font-semibold hidden md:inline">Home</span>
        </button>
        
        <div className="h-6 w-px bg-outline-variant/30" />
        
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-gradient-to-tr from-primary via-primary-container to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-on-primary font-bold text-sm tracking-widest">V</span>
          </div>
          <span className="font-display font-semibold text-lg tracking-tight text-on-surface hidden lg:inline">Veltis<span className="text-primary">PDF</span></span>
        </div>
        
        <div className="h-6 w-px bg-outline-variant/50 hidden md:block" />
        
        <div className="flex items-center gap-2 hidden md:flex">
          <p className="text-sm font-medium text-on-surface-variant flex items-center gap-2 truncate max-w-[200px]">
            {fileName || 'No Document'}
          </p>
        </div>
      </div>

      {/* Main Drawing/Editing Tools - Kept in center for UX */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-surface-container-high border border-outline-variant/30 p-1 rounded-lg shadow-sm">
        {/* Undo/Redo Group inside central nav */}
        <div className="flex items-center gap-1 border-r border-outline-variant/30 pr-1 mr-1 hidden md:flex">
          <button
            onClick={undo}
            disabled={past.length === 0}
            title="Undo — Step back (Ctrl+Z)"
            className="p-2 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest disabled:opacity-30 disabled:pointer-events-none transition duration-150 relative group"
          >
            <Undo2 size={16} />
            <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-on-surface text-surface text-[9px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50">Undo</div>
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            title="Redo — Step forward (Ctrl+Shift+Z)"
            className="p-2 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest disabled:opacity-30 disabled:pointer-events-none transition duration-150 relative group"
          >
            <Redo2 size={16} />
            <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-on-surface text-surface text-[9px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50">Redo</div>
          </button>
        </div>

        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          if (tool.id === 'signature') {
            return (
              <div key={tool.id} className="relative">
                <button
                  onClick={() => {
                    setActiveTool('signature');
                    setIsSignatureOpen(!isSignatureOpen);
                  }}
                  title={`Signature — ${tool.tip}`}
                  className={`p-2 rounded-md transition duration-150 relative group ${
                    isActive || isSignatureOpen
                      ? 'bg-white text-primary shadow-sm ring-1 ring-primary/20' 
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  <Icon size={16} />
                  {/* Premium Tooltip */}
                  <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-on-surface text-surface text-[9px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50">
                    Signature
                  </div>
                </button>
                
                {isSignatureOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[360px] bg-white rounded-xl shadow-2xl border border-outline-variant/50 p-4 z-50 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-on-surface">Create Signature</h4>
                      <button 
                        onClick={() => setIsSignatureOpen(false)}
                        className="text-on-surface-variant hover:text-on-surface text-lg leading-none"
                      >×</button>
                    </div>
                    
                    {/* Tabs: Type / Draw / Upload */}
                    <div className="flex gap-1 bg-surface-container rounded-lg p-1">
                      {(['type', 'draw', 'upload'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setSignatureTab(tab)}
                          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all capitalize flex items-center justify-center gap-1.5 ${
                            signatureTab === tab
                              ? 'bg-white text-primary shadow-sm'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          {tab === 'type' && <Type size={12} />}
                          {tab === 'draw' && <Pencil size={12} />}
                          {tab === 'upload' && <Upload size={12} />}
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* TYPE TAB */}
                    {signatureTab === 'type' && (
                      <>
                        <input 
                          type="text" 
                          value={signatureText}
                          onChange={(e) => setSignatureText(e.target.value)}
                          className="w-full border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Type your name"
                        />
                        
                        {/* Live Preview */}
                        <div className="h-20 w-full border border-dashed border-outline-variant/50 rounded-lg flex items-center justify-center bg-surface-container-lowest overflow-hidden">
                          <span style={{ fontFamily: `"${signatureFonts.find(f => f.name === selectedFont)?.family}"`, fontSize: '42px', color: '#000' }}>
                            {signatureText || 'Preview'}
                          </span>
                        </div>
                        
                        {/* Font Grid */}
                        <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto pr-1">
                          {signatureFonts.map(font => (
                            <button
                              key={font.name}
                              onClick={() => setSelectedFont(font.name)}
                              className={`p-1.5 border rounded-lg text-sm flex items-center justify-center truncate transition-all ${
                                selectedFont === font.name 
                                  ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30 shadow-sm' 
                                  : 'border-outline-variant/30 text-on-surface hover:bg-surface-container hover:border-outline-variant/60'
                              }`}
                              style={{ fontFamily: `"${font.family}", cursive` }}
                            >
                              {signatureText || font.name}
                            </button>
                          ))}
                        </div>
                        
                        <button 
                          onClick={handleCreateTypedSignature}
                          disabled={!signatureText.trim()}
                          className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-lg hover:bg-primary-container transition-colors shadow-md disabled:opacity-40 disabled:pointer-events-none"
                        >
                          Use This Signature
                        </button>
                      </>
                    )}

                    {/* DRAW TAB */}
                    {signatureTab === 'draw' && (
                      <>
                        <p className="text-xs text-on-surface-variant">Draw your signature below:</p>
                        <div className="border border-outline-variant/50 rounded-lg overflow-hidden bg-white relative">
                          <canvas
                            ref={canvasDrawRef}
                            width={380}
                            height={150}
                            className="w-full cursor-crosshair"
                            onMouseDown={handleDrawStart}
                            onMouseMove={handleDrawMove}
                            onMouseUp={handleDrawEnd}
                            onMouseLeave={handleDrawEnd}
                          />
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-px w-3/4 bg-outline-variant/40" />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleClearDraw}
                            className="flex-1 py-2 rounded-lg border border-outline-variant/50 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                          >
                            Clear
                          </button>
                          <button
                            onClick={handleSaveDrawnSignature}
                            className="flex-1 bg-primary text-on-primary font-bold py-2 rounded-lg hover:bg-primary-container transition-colors shadow-md"
                          >
                            Use Drawn Signature
                          </button>
                        </div>
                      </>
                    )}

                    {/* UPLOAD TAB */}
                    {signatureTab === 'upload' && (
                      <>
                        <p className="text-xs text-on-surface-variant">Upload a signature image (PNG, JPG, SVG):</p>
                        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-outline-variant/50 rounded-xl p-8 hover:border-primary/50 hover:bg-primary/[0.03] transition-colors cursor-pointer">
                          <Upload size={32} className="text-on-surface-variant" />
                          <span className="text-sm font-medium text-on-surface-variant">Click to browse files</span>
                          <span className="text-xs text-on-surface-variant/60">PNG, JPG, SVG supported</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadSignature} />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                setIsSignatureOpen(false);
              }}
              title={`${tool.label} — ${tool.tip}`}
              className={`p-2 rounded-md transition duration-150 relative group ${ 
                isActive 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-primary/20' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
              }`}
            >
              <Icon size={16} />
              {/* Premium Tooltip */}
              <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-on-surface text-surface text-[9px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50">
                {tool.label}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Actions & Utilities */}
      <div className="flex items-center gap-4">
        {/* AI OCR Indicator */}
        {isOcrRunning && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary/10 border border-primary/20 text-xs font-semibold text-primary animate-pulse">
            <Sparkles size={13} className="animate-spin" />
            <span>OCR {Math.round(ocrProgress * 100)}%</span>
          </div>
        )}

        {/* Auto-save Status */}
        <SaveStatusIndicator />

        {/* Layout Toggle */}
        <button 
          onClick={() => setLayoutMode(layoutMode === 'vertical' ? 'horizontal' : 'vertical')}
          title={`Switch to ${layoutMode === 'vertical' ? 'Horizontal' : 'Vertical'} Layout`}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors border border-outline-variant/30 ml-2"
        >
          <LayoutDashboard size={16} className={layoutMode === 'horizontal' ? 'rotate-90 text-primary' : ''} />
        </button>

        {/* Top Header Actions */}
        <button 
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-sm font-medium transition-colors panel-transition border border-outline-variant/30"
        >
          <UploadCloud size={16} />
          <span className="hidden xl:inline">Upload New</span>
        </button>

        <button 
          onClick={async () => {
            setSaveState('saving');
            try {
              await manualSave();
              onSaveClick();
              setSaveState('saved');
              setTimeout(() => setSaveState('idle'), 2000);
            } catch {
              setSaveState('error');
              setTimeout(() => setSaveState('idle'), 3000);
            }
          }}
          disabled={saveState === 'saving'}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all panel-transition ${
            saveState === 'saved'
              ? 'bg-emerald-600 text-white'
              : saveState === 'error'
              ? 'bg-error text-on-error'
              : 'bg-primary text-on-primary hover:bg-primary-container'
          }`}
        >
          {saveState === 'saving' && <Loader2 size={16} className="animate-spin" />}
          {saveState === 'saved' && <Check size={16} />}
          {saveState === 'error' && <Save size={16} />}
          {saveState === 'idle' && <Save size={16} />}
          <span>
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved!' : saveState === 'error' ? 'Error' : 'Save'}
          </span>
        </button>

        <button
          onClick={onExport}
          title="Export — Download edited PDF"
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-secondary text-on-secondary text-sm font-semibold hover:bg-secondary-container shadow-md hover:shadow-lg transition-all panel-transition"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Mobile Right Sidebar Toggle */}
        <button
          onClick={() => setMobileSidebarOpen(mobileSidebarOpen === 'right' ? null : 'right')}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-on-surface bg-surface-container hover:bg-surface-variant transition-colors shadow-sm ml-1"
        >
          <Sliders size={18} />
        </button>
      </div>
    </header>
  );
};
export default ToolbarTop;
