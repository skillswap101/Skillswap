import React, { useRef, useState, useEffect } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  ArrowRight,
  Type,
  RotateCcw,
  Download,
  Trash2,
  Maximize2,
} from 'lucide-react';

interface WhiteboardProps {
  onSaveSnapshot?: (dataUrl: string) => void;
}

export const CollaborativeWhiteboard: React.FC<WhiteboardProps> = ({ onSaveSnapshot }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'arrow' | 'text'>('pen');
  const [color, setColor] = useState<string>('#6366f1'); // Indigo
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);

  const colors = [
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Sky', value: '#38bdf8' },
    { label: 'White', value: '#f8fafc' },
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI sizing
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = 420;

    // Dark grid background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridSize = 24;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Save initial state
    const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initial]);
    setHistoryStep(0);
  }, []);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    setHistory([...newHistory, currentData]);
    setHistoryStep(newHistory.length);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const prevStep = historyStep - 1;
      ctx.putImageData(history[prevStep], 0, 0);
      setHistoryStep(prevStep);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridSize = 24;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    saveHistory();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkillSwap_Whiteboard_${Date.now()}.png`;
    a.click();
    if (onSaveSnapshot) onSaveSnapshot(url);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartX(x);
    setStartY(y);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = 1.0;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * 3.5;
      ctx.globalAlpha = 0.35;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = lineWidth * 4;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'rect') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(startX, startY, x - startX, y - startY);
    } else if (tool === 'circle') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === 'arrow') {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.stroke();
      // Arrow head
      const angle = Math.atan2(y - startY, x - startX);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 12 * Math.cos(angle - Math.PI / 6), y - 12 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x - 12 * Math.cos(angle + Math.PI / 6), y - 12 * Math.sin(angle + Math.PI / 6));
      ctx.fill();
    } else if (tool === 'text') {
      const text = prompt('Enter annotation text:');
      if (text) {
        ctx.font = '14px ui-sans-serif, system-ui, sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
      }
    }

    setIsDrawing(false);
    saveHistory();
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Toolbar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Tool Selectors */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Pen"
          >
            <Pen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('highlighter')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'highlighter' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Highlighter"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('rect')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Rectangle"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'circle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Circle"
          >
            <Circle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('arrow')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'arrow' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Arrow"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('text')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Text Annotation"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'eraser' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Eraser"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          {colors.map(c => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-4 h-4 rounded-full border transition-transform ${
                color === c.value ? 'scale-125 border-white ring-2 ring-indigo-500/50' : 'border-transparent opacity-80'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>

        {/* Stroke Size */}
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[10px] font-mono">Size</span>
          <input
            type="range"
            min="1"
            max="12"
            value={lineWidth}
            onChange={e => setLineWidth(Number(e.target.value))}
            className="w-16 accent-indigo-500 h-1.5 rounded bg-slate-800 cursor-pointer"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={historyStep <= 0}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
            title="Clear Board"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 w-full bg-slate-950 cursor-crosshair relative overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};
