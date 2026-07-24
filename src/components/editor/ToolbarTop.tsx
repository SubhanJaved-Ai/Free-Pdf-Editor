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
  Hand,
  Undo2, 
  Redo2, 
  Sparkles, 
  Download, 
  UploadCloud, 
  Eraser,
  Save,
  Upload,
  Pencil,
  ArrowLeft,
  Check,
  Loader2,
  LayoutDashboard,
  Menu,
  Sliders,
  ChevronDown,
  FileText
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
  
  // All 50 premium signature fonts
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
    
    try {
      await document.fonts.load(fontStr);
      await document.fonts.ready;
    } catch (err) {
      console.warn('Font preload warning:', err);
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    ctx.font = fontStr;
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(signatureText, 400, 125);
    
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
      const dataUrl = canvas.toDataURL('image/png');
      addSignature(dataUrl);
      setActiveTool('signature');
      setIsSignatureOpen(false);
    }
  };

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

  const selectionTools = [
    { id: 'select', label: 'Select', icon: Pointer, shortcut: 'V', tip: 'Select and edit elements (V)' },
    { id: 'pan', label: 'Pan', icon: Hand, shortcut: 'H', tip: 'Pan document canvas (H)' },
  ] as const;

  const contentTools = [
    { id: 'text', label: 'Text', icon: Type, shortcut: 'T', tip: 'Add or edit text (T)' },
    { id: 'image', label: 'Image', icon: ImageIcon, shortcut: 'I', tip: 'Upload & insert image (I)' },
    { id: 'signature', label: 'Signature', icon: PenTool, shortcut: 'S', tip: 'Create or drop signature (S)' },
    { id: 'shape', label: 'Shape', icon: Square, shortcut: 'U', tip: 'Insert shape (U)' },
    { id: 'draw', label: 'Draw', icon: Pencil, shortcut: 'P', tip: 'Freehand drawing (P)' },
    { id: 'erase', label: 'Eraser', icon: Eraser, shortcut: 'E', tip: 'Erase content (E)' },
  ] as const;

  return (
    <header className="h-16 w-full bg-surface-container-lowest/95 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between px-3 md:px-5 shadow-sm z-50 flex-shrink-0 select-none">
      {/* LEFT SECTION: Branding & Document Info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Left Sidebar Toggle */}
        <button
          onClick={() => setMobileSidebarOpen(mobileSidebarOpen === 'left' ? null : 'left')}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-on-surface hover:bg-surface-variant transition-colors"
          aria-label="Toggle Pages Navigator"
        >
          <Menu size={19} />
        </button>

        {/* Back to Home Button */}
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all group"
          title="Back to Dashboard / Home"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform text-primary" />
          <span className="text-xs font-bold hidden lg:inline">Home</span>
        </button>

        <div className="h-5 w-px bg-outline-variant/30 hidden sm:block" />

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-primary via-primary-container to-secondary flex items-center justify-center shadow-md shadow-primary/20 flex-shrink-0">
            <span className="text-on-primary font-black text-xs tracking-widest">V</span>
          </div>
          <span className="font-display font-bold text-base tracking-tight text-on-surface hidden xl:inline">
            Veltis<span className="text-primary">PDF</span>
          </span>
        </div>

        <div className="h-5 w-px bg-outline-variant/30 hidden md:block" />

        {/* File Name & Auto-Save Badge */}
        <div className="flex items-center gap-2 min-w-0 hidden md:flex">
          <FileText size={15} className="text-on-surface-variant/70 flex-shrink-0" />
          <span className="text-xs font-semibold text-on-surface truncate max-w-[140px] lg:max-w-[200px]" title={fileName || 'Document'}>
            {fileName || 'Untitled Document.pdf'}
          </span>
          <SaveStatusIndicator />
        </div>
      </div>

      {/* CENTER SECTION: Logically Grouped Tool Ribbon */}
      <div className="flex items-center gap-1.5 md:gap-2 bg-surface-container/60 p-1 rounded-xl border border-outline-variant/30 shadow-inner max-w-full overflow-x-auto no-scrollbar">
        {/* GROUP 1: Selection Tools */}
        <div className="flex items-center gap-0.5 bg-surface-container-lowest/80 p-0.5 rounded-lg border border-outline-variant/20">
          {selectionTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  setIsSignatureOpen(false);
                }}
                title={tool.tip}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 relative group ${
                  isActive 
                    ? 'bg-primary text-on-primary shadow-sm ring-1 ring-primary/30' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <Icon size={15} />
                <span className="hidden xl:inline">{tool.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-outline-variant/30 flex-shrink-0" />

        {/* GROUP 2: Content & Annotation Tools */}
        <div className="flex items-center gap-0.5 bg-surface-container-lowest/80 p-0.5 rounded-lg border border-outline-variant/20 relative">
          {contentTools.map((tool) => {
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
                    title={tool.tip}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 relative group ${
                      isActive || isSignatureOpen
                        ? 'bg-primary text-on-primary shadow-sm ring-1 ring-primary/30' 
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <Icon size={15} />
                    <span className="hidden xl:inline">{tool.label}</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 hidden xl:inline ${isSignatureOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Signature Popover Panel */}
                  {isSignatureOpen && (
                    <div className="fixed inset-x-2 top-16 md:absolute md:inset-auto md:top-[calc(100%+10px)] md:left-1/2 md:-translate-x-1/2 w-auto md:w-[360px] bg-surface rounded-xl shadow-2xl border border-outline-variant/40 p-4 z-[150] flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
                      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                        <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Create Signature</span>
                        <button 
                          onClick={() => setIsSignatureOpen(false)}
                          className="text-on-surface-variant hover:text-on-surface text-base leading-none p-1"
                        >×</button>
                      </div>
                      
                      {/* Tabs */}
                      <div className="flex gap-1 bg-surface-container rounded-lg p-1">
                        {(['type', 'draw', 'upload'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setSignatureTab(tab)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all capitalize flex items-center justify-center gap-1.5 ${
                              signatureTab === tab
                                ? 'bg-surface text-primary shadow-sm'
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
                            className="w-full bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
                            placeholder="Type your name"
                          />
                          <div className="h-16 w-full border border-dashed border-outline-variant/40 rounded-lg flex items-center justify-center bg-surface-container-lowest overflow-hidden px-2">
                            <span style={{ fontFamily: `"${signatureFonts.find(f => f.name === selectedFont)?.family}"`, fontSize: '32px', color: '#000' }}>
                              {signatureText || 'Preview'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto pr-1">
                            {signatureFonts.map(font => (
                              <button
                                key={font.name}
                                onClick={() => setSelectedFont(font.name)}
                                className={`p-1.5 border rounded-md text-xs truncate transition-all ${
                                  selectedFont === font.name 
                                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm' 
                                    : 'border-outline-variant/20 text-on-surface hover:bg-surface-container'
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
                            className="w-full bg-primary text-on-primary font-bold py-2 rounded-lg hover:bg-primary-container transition-colors text-xs shadow disabled:opacity-40"
                          >
                            Use Typed Signature
                          </button>
                        </>
                      )}

                      {/* DRAW TAB */}
                      {signatureTab === 'draw' && (
                        <>
                          <p className="text-[11px] text-on-surface-variant">Draw signature using mouse/touch:</p>
                          <div className="border border-outline-variant/40 rounded-lg overflow-hidden bg-white relative">
                            <canvas
                              ref={canvasDrawRef}
                              width={320}
                              height={130}
                              className="w-full cursor-crosshair touch-none"
                              onMouseDown={handleDrawStart}
                              onMouseMove={handleDrawMove}
                              onMouseUp={handleDrawEnd}
                              onMouseLeave={handleDrawEnd}
                              onTouchStart={(e) => { e.preventDefault(); handleDrawStart(e as unknown as React.MouseEvent<HTMLCanvasElement>); }}
                              onTouchMove={(e) => { e.preventDefault(); handleDrawMove(e as unknown as React.MouseEvent<HTMLCanvasElement>); }}
                              onTouchEnd={(e) => { e.preventDefault(); handleDrawEnd(); }}
                            />
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-px w-4/5 bg-zinc-300 pointer-events-none" />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleClearDraw}
                              className="flex-1 py-1.5 rounded-lg border border-outline-variant/40 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                            >
                              Clear
                            </button>
                            <button
                              onClick={handleSaveDrawnSignature}
                              className="flex-1 bg-primary text-on-primary font-bold py-1.5 rounded-lg hover:bg-primary-container transition-colors text-xs shadow"
                            >
                              Use Signature
                            </button>
                          </div>
                        </>
                      )}

                      {/* UPLOAD TAB */}
                      {signatureTab === 'upload' && (
                        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-outline-variant/40 rounded-xl p-6 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                          <Upload size={24} className="text-on-surface-variant" />
                          <span className="text-xs font-semibold text-on-surface-variant">Click to browse image</span>
                          <span className="text-[10px] text-on-surface-variant/60">PNG, JPG, SVG</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadSignature} />
                        </label>
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
                title={tool.tip}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 relative group ${
                  isActive 
                    ? 'bg-primary text-on-primary shadow-sm ring-1 ring-primary/30' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <Icon size={15} />
                <span className="hidden xl:inline">{tool.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-outline-variant/30 flex-shrink-0" />

        {/* GROUP 3: Undo / Redo History */}
        <div className="flex items-center gap-0.5 bg-surface-container-lowest/80 p-0.5 rounded-lg border border-outline-variant/20">
          <button
            onClick={undo}
            disabled={past.length === 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition duration-150"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition duration-150"
          >
            <Redo2 size={15} />
          </button>
        </div>
      </div>

      {/* RIGHT SECTION: Document Actions & Utilities */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Mobile Right Sidebar Toggle */}
        <button
          onClick={() => setMobileSidebarOpen(mobileSidebarOpen === 'right' ? null : 'right')}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-on-surface bg-surface-container hover:bg-surface-variant transition-colors shadow-sm"
          aria-label="Toggle Properties Panel"
        >
          <Sliders size={18} />
        </button>

        {/* AI OCR Indicator */}
        {isOcrRunning && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary animate-pulse">
            <Sparkles size={13} className="animate-spin" />
            <span>OCR {Math.round(ocrProgress * 100)}%</span>
          </div>
        )}

        {/* Layout Mode Toggle */}
        <button 
          onClick={() => setLayoutMode(layoutMode === 'vertical' ? 'horizontal' : 'vertical')}
          title={`Switch to ${layoutMode === 'vertical' ? 'Horizontal' : 'Vertical'} Layout`}
          className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors border border-outline-variant/30"
        >
          <LayoutDashboard size={16} className={layoutMode === 'horizontal' ? 'rotate-90 text-primary' : ''} />
        </button>

        {/* Upload New Button */}
        <button 
          onClick={onUploadClick}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-bold transition-all border border-outline-variant/30"
          title="Upload new PDF document"
        >
          <UploadCloud size={15} />
          <span className="hidden xl:inline">Upload New</span>
        </button>

        {/* Save Button */}
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
          className={`flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
            saveState === 'saved'
              ? 'bg-emerald-600 text-white'
              : saveState === 'error'
              ? 'bg-error text-on-error'
              : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/40'
          }`}
          title="Save Session"
        >
          {saveState === 'saving' && <Loader2 size={15} className="animate-spin mr-1" />}
          {saveState === 'saved' && <Check size={15} className="mr-1" />}
          {saveState === 'idle' && <Save size={15} className="mr-1" />}
          <span className="hidden sm:inline">
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save'}
          </span>
        </button>

        {/* Primary Export Action */}
        <button
          onClick={onExport}
          title="Export — Download compiled PDF"
          className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-md hover:shadow-lg transition-all"
        >
          <Download size={15} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};

export default ToolbarTop;
