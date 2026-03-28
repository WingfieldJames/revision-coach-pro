import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Plus, Trash2, Maximize2, Minimize2, ZoomIn, ZoomOut,
  RotateCcw, Eye, EyeOff, ChevronDown, ChevronUp, Move,
  Crosshair, Target,
} from 'lucide-react';
import * as math from 'mathjs';

/* ───────── types ───────── */
interface FunctionEntry {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
  lineWidth: number;
}

interface PointLabel {
  x: number;
  y: number;
  label: string;
  color: string;
}

const COLORS = [
  'hsl(var(--primary))',
  '#ef4444', '#22c55e', '#f59e0b', '#06b6d4', '#ec4899',
  '#8b5cf6', '#14b8a6',
];

const EXAMPLE_GRAPHS = [
  { name: 'Quadratic', expr: 'x^2' },
  { name: 'Cubic', expr: 'x^3 - 3*x' },
  { name: 'Sine wave', expr: 'sin(x)' },
  { name: 'Cosine wave', expr: 'cos(x)' },
  { name: 'Tan', expr: 'tan(x)' },
  { name: 'Exponential', expr: 'e^x' },
  { name: 'Natural log', expr: 'log(x)' },
  { name: 'Reciprocal', expr: '1/x' },
  { name: 'Abs value', expr: 'abs(x)' },
  { name: 'Square root', expr: 'sqrt(x)' },
  { name: 'Circle (top)', expr: 'sqrt(25 - x^2)' },
  { name: 'Circle (bottom)', expr: '-sqrt(25 - x^2)' },
];

/* ───────── helpers ───────── */
const safeEval = (expr: string, x: number): number | null => {
  try {
    const result = math.evaluate(expr, { x, pi: Math.PI, e: Math.E });
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
};

const derivative = (expr: string, x: number, h = 1e-7): number | null => {
  const y1 = safeEval(expr, x - h);
  const y2 = safeEval(expr, x + h);
  if (y1 === null || y2 === null) return null;
  return (y2 - y1) / (2 * h);
};

const findRoots = (expr: string, xMin: number, xMax: number): number[] => {
  const roots: number[] = [];
  const steps = 500;
  const dx = (xMax - xMin) / steps;
  for (let i = 0; i < steps; i++) {
    const x1 = xMin + i * dx;
    const x2 = x1 + dx;
    const y1 = safeEval(expr, x1);
    const y2 = safeEval(expr, x2);
    if (y1 === null || y2 === null) continue;
    if (y1 * y2 <= 0) {
      // bisection
      let a = x1, b = x2;
      for (let j = 0; j < 50; j++) {
        const mid = (a + b) / 2;
        const ym = safeEval(expr, mid);
        if (ym === null) break;
        if (Math.abs(ym) < 1e-10) { a = mid; break; }
        const ya = safeEval(expr, a);
        if (ya !== null && ya * ym < 0) b = mid; else a = mid;
      }
      const root = (a + b) / 2;
      if (!roots.some(r => Math.abs(r - root) < dx * 2)) roots.push(root);
    }
  }
  return roots;
};

const findTurningPoints = (expr: string, xMin: number, xMax: number): Array<{ x: number; y: number; type: 'max' | 'min' }> => {
  const points: Array<{ x: number; y: number; type: 'max' | 'min' }> = [];
  const steps = 500;
  const dx = (xMax - xMin) / steps;
  for (let i = 1; i < steps - 1; i++) {
    const x = xMin + i * dx;
    const d1 = derivative(expr, x - dx);
    const d2 = derivative(expr, x + dx);
    if (d1 === null || d2 === null) continue;
    if (d1 * d2 < 0) {
      // refine
      let a = x - dx, b = x + dx;
      for (let j = 0; j < 50; j++) {
        const mid = (a + b) / 2;
        const dm = derivative(expr, mid);
        if (dm === null) break;
        if (Math.abs(dm) < 1e-10) { a = mid; break; }
        const da = derivative(expr, a);
        if (da !== null && da * dm < 0) b = mid; else a = mid;
      }
      const px = (a + b) / 2;
      const py = safeEval(expr, px);
      if (py === null) continue;
      const type = d1 > 0 ? 'max' : 'min';
      if (!points.some(p => Math.abs(p.x - px) < dx * 3)) {
        points.push({ x: px, y: py, type });
      }
    }
  }
  return points;
};

/* ───────── main component ───────── */
export const GraphSketcherTool: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [functions, setFunctions] = useState<FunctionEntry[]>([
    { id: '1', expression: 'x^2', color: COLORS[0], visible: true, lineWidth: 2 },
  ]);
  const [xRange, setXRange] = useState<[number, number]>([-10, 10]);
  const [yRange, setYRange] = useState<[number, number]>([-10, 10]);
  const [showGrid, setShowGrid] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
  const [pointLabels, setPointLabels] = useState<PointLabel[]>([]);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; xRange: [number, number]; yRange: [number, number] } | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [showTangent, setShowTangent] = useState(false);
  const [tangentFuncIdx, setTangentFuncIdx] = useState(0);
  const [tangentX, setTangentX] = useState(0);
  const [paramA, setParamA] = useState(1);
  const [showParamSlider, setShowParamSlider] = useState(false);

  const addFunction = () => {
    const idx = functions.length % COLORS.length;
    setFunctions(prev => [...prev, {
      id: Date.now().toString(),
      expression: '',
      color: COLORS[idx],
      visible: true,
      lineWidth: 2,
    }]);
  };

  const removeFunction = (id: string) => {
    setFunctions(prev => prev.filter(f => f.id !== id));
  };

  const updateFunction = (id: string, updates: Partial<FunctionEntry>) => {
    setFunctions(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const resetView = () => {
    setXRange([-10, 10]);
    setYRange([-10, 10]);
  };

  const zoom = (factor: number) => {
    setXRange(([a, b]) => {
      const mid = (a + b) / 2, half = (b - a) / 2 * factor;
      return [mid - half, mid + half];
    });
    setYRange(([a, b]) => {
      const mid = (a + b) / 2, half = (b - a) / 2 * factor;
      return [mid - half, mid + half];
    });
  };

  /* ── drawing ── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    const toCanvasX = (x: number) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * W;
    const toCanvasY = (y: number) => H - ((y - yRange[0]) / (yRange[1] - yRange[0])) * H;
    const fromCanvasX = (cx: number) => xRange[0] + (cx / W) * (xRange[1] - xRange[0]);
    const fromCanvasY = (cy: number) => yRange[0] + ((H - cy) / H) * (yRange[1] - yRange[0]);

    // background
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
    ctx.fillStyle = bgColor ? `hsl(${bgColor})` : '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // grid
    if (showGrid) {
      const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
      ctx.strokeStyle = gridColor ? `hsl(${gridColor})` : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;

      const xStep = Math.pow(10, Math.floor(Math.log10((xRange[1] - xRange[0]) / 5)));
      const yStep = Math.pow(10, Math.floor(Math.log10((yRange[1] - yRange[0]) / 5)));

      for (let x = Math.ceil(xRange[0] / xStep) * xStep; x <= xRange[1]; x += xStep) {
        const cx = toCanvasX(x);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
      }
      for (let y = Math.ceil(yRange[0] / yStep) * yStep; y <= yRange[1]; y += yStep) {
        const cy = toCanvasY(y);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      }
    }

    // axes
    const fgColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
    ctx.strokeStyle = fgColor ? `hsl(${fgColor})` : '#fff';
    ctx.lineWidth = 1;
    const ox = toCanvasX(0), oy = toCanvasY(0);
    if (ox >= 0 && ox <= W) { ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke(); }
    if (oy >= 0 && oy <= H) { ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke(); }

    // axis labels
    ctx.fillStyle = fgColor ? `hsl(${fgColor})` : '#fff';
    ctx.font = '11px system-ui, sans-serif';
    ctx.globalAlpha = 0.5;
    const xStep = Math.pow(10, Math.floor(Math.log10((xRange[1] - xRange[0]) / 5)));
    const yStep = Math.pow(10, Math.floor(Math.log10((yRange[1] - yRange[0]) / 5)));
    for (let x = Math.ceil(xRange[0] / xStep) * xStep; x <= xRange[1]; x += xStep) {
      if (Math.abs(x) < xStep * 0.1) continue;
      const cx = toCanvasX(x);
      const label = Number.isInteger(x) ? x.toString() : x.toFixed(1);
      ctx.fillText(label, cx + 2, oy + 14 > H ? H - 4 : Math.max(14, oy + 14));
    }
    for (let y = Math.ceil(yRange[0] / yStep) * yStep; y <= yRange[1]; y += yStep) {
      if (Math.abs(y) < yStep * 0.1) continue;
      const cy = toCanvasY(y);
      const label = Number.isInteger(y) ? y.toString() : y.toFixed(1);
      ctx.fillText(label, ox + 4 > W - 30 ? 4 : Math.max(4, ox + 4), cy - 4);
    }
    ctx.globalAlpha = 1;

    // plot each function
    const newLabels: PointLabel[] = [];
    functions.forEach((fn, fi) => {
      if (!fn.visible || !fn.expression.trim()) return;
      const expr = fn.expression.replace(/a/g, `(${paramA})`);

      ctx.strokeStyle = fn.color;
      ctx.lineWidth = fn.lineWidth;
      ctx.beginPath();
      let started = false;
      const step = (xRange[1] - xRange[0]) / (W * 2);
      for (let px = xRange[0]; px <= xRange[1]; px += step) {
        const y = safeEval(expr, px);
        if (y === null || y < yRange[0] - (yRange[1] - yRange[0]) * 0.5 || y > yRange[1] + (yRange[1] - yRange[0]) * 0.5) {
          started = false;
          continue;
        }
        const cx = toCanvasX(px);
        const cy = toCanvasY(y);
        if (!started) { ctx.moveTo(cx, cy); started = true; }
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      // analysis: roots, turning points, y-intercept
      if (showAnalysis) {
        const roots = findRoots(expr, xRange[0], xRange[1]);
        roots.forEach(r => {
          const cx = toCanvasX(r);
          const cy = toCanvasY(0);
          ctx.fillStyle = fn.color;
          ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
          newLabels.push({ x: cx, y: cy, label: `Root: (${r.toFixed(2)}, 0)`, color: fn.color });
        });

        const yInt = safeEval(expr, 0);
        if (yInt !== null && 0 >= xRange[0] && 0 <= xRange[1]) {
          const cx = toCanvasX(0);
          const cy = toCanvasY(yInt);
          ctx.fillStyle = fn.color;
          ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
          newLabels.push({ x: cx, y: cy, label: `y-int: (0, ${yInt.toFixed(2)})`, color: fn.color });
        }

        const tps = findTurningPoints(expr, xRange[0], xRange[1]);
        tps.forEach(tp => {
          const cx = toCanvasX(tp.x);
          const cy = toCanvasY(tp.y);
          ctx.fillStyle = fn.color;
          ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
          newLabels.push({
            x: cx, y: cy,
            label: `${tp.type === 'max' ? 'Max' : 'Min'}: (${tp.x.toFixed(2)}, ${tp.y.toFixed(2)})`,
            color: fn.color,
          });
        });
      }

      // tangent line
      if (showTangent && fi === tangentFuncIdx) {
        const ty = safeEval(expr, tangentX);
        const slope = derivative(expr, tangentX);
        if (ty !== null && slope !== null) {
          const x1 = xRange[0], x2 = xRange[1];
          const y1 = ty + slope * (x1 - tangentX);
          const y2 = ty + slope * (x2 - tangentX);
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = fn.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.moveTo(toCanvasX(x1), toCanvasY(y1));
          ctx.lineTo(toCanvasX(x2), toCanvasY(y2));
          ctx.stroke();
          ctx.restore();

          const cx = toCanvasX(tangentX);
          const cy = toCanvasY(ty);
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = fn.color;
          ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
          newLabels.push({ x: cx, y: cy, label: `Tangent: y = ${slope.toFixed(3)}x + ${(ty - slope * tangentX).toFixed(3)}`, color: fn.color });
        }
      }
    });

    // draw labels
    ctx.font = 'bold 11px system-ui, sans-serif';
    newLabels.forEach(l => {
      ctx.fillStyle = l.color;
      const textWidth = ctx.measureText(l.label).width;
      const lx = Math.min(l.x + 8, W - textWidth - 4);
      const ly = Math.max(l.y - 8, 14);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = bgColor ? `hsl(${bgColor})` : '#0a0a0a';
      ctx.fillRect(lx - 2, ly - 11, textWidth + 4, 14);
      ctx.globalAlpha = 1;
      ctx.fillStyle = l.color;
      ctx.fillText(l.label, lx, ly);
    });

    // hover crosshair
    if (hoverPoint) {
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = fgColor ? `hsl(${fgColor})` : '#fff';
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      const hx = toCanvasX(hoverPoint.x);
      const hy = toCanvasY(hoverPoint.y);
      ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(W, hy); ctx.stroke();
      ctx.restore();

      ctx.fillStyle = fgColor ? `hsl(${fgColor})` : '#fff';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(`(${hoverPoint.x.toFixed(3)}, ${hoverPoint.y.toFixed(3)})`, toCanvasX(hoverPoint.x) + 10, toCanvasY(hoverPoint.y) - 10);
    }

    setPointLabels(newLabels);
  }, [functions, xRange, yRange, showGrid, showAnalysis, hoverPoint, showTangent, tangentFuncIdx, tangentX, paramA]);

  useEffect(() => { draw(); }, [draw]);

  /* ── mouse interactions ── */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = rect.width;
    const H = rect.height;
    const gx = xRange[0] + (mx / W) * (xRange[1] - xRange[0]);
    const gy = yRange[0] + ((H - my) / H) * (yRange[1] - yRange[0]);

    if (isPanning && panStart) {
      const dx = (mx - panStart.x) / W * (panStart.xRange[1] - panStart.xRange[0]);
      const dy = (my - panStart.y) / H * (panStart.yRange[1] - panStart.yRange[0]);
      setXRange([panStart.xRange[0] - dx, panStart.xRange[1] - dx]);
      setYRange([panStart.yRange[0] + dy, panStart.yRange[1] + dy]);
      return;
    }

    // snap to nearest function
    let closest: { x: number; y: number; dist: number } | null = null;
    functions.forEach(fn => {
      if (!fn.visible || !fn.expression.trim()) return;
      const expr = fn.expression.replace(/a/g, `(${paramA})`);
      const y = safeEval(expr, gx);
      if (y === null) return;
      const canvasY = H - ((y - yRange[0]) / (yRange[1] - yRange[0])) * H;
      const dist = Math.abs(canvasY - my);
      if (dist < 30 && (!closest || dist < closest.dist)) {
        closest = { x: gx, y, dist };
      }
    });
    setHoverPoint(closest ? { x: closest.x, y: closest.y } : null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    zoom(factor);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      setIsPanning(true);
      const rect = canvasRef.current!.getBoundingClientRect();
      setPanStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        xRange: [...xRange] as [number, number],
        yRange: [...yRange] as [number, number],
      });
    }
  };

  const handleMouseUp = () => { setIsPanning(false); setPanStart(null); };

  const loadExample = (expr: string) => {
    if (functions.length === 0 || (functions.length === 1 && !functions[0].expression)) {
      setFunctions([{ id: '1', expression: expr, color: COLORS[0], visible: true, lineWidth: 2 }]);
    } else {
      const idx = functions.length % COLORS.length;
      setFunctions(prev => [...prev, { id: Date.now().toString(), expression: expr, color: COLORS[idx], visible: true, lineWidth: 2 }]);
    }
    setShowExamples(false);
  };

  /* ── symbol buttons ── */
  const symbolButtons = [
    { label: 'x²', insert: 'x^2' },
    { label: 'x³', insert: 'x^3' },
    { label: '√x', insert: 'sqrt(x)' },
    { label: 'sin', insert: 'sin(x)' },
    { label: 'cos', insert: 'cos(x)' },
    { label: 'tan', insert: 'tan(x)' },
    { label: 'eˣ', insert: 'e^x' },
    { label: 'ln', insert: 'log(x)' },
    { label: '|x|', insert: 'abs(x)' },
    { label: 'π', insert: 'pi' },
    { label: '1/x', insert: '1/x' },
    { label: 'asin', insert: 'asin(x)' },
  ];

  const graphContent = (fullscreen: boolean) => (
    <div className={`flex flex-col gap-3 ${fullscreen ? 'h-full' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base text-foreground">Graph Sketcher</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoom(0.8)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoom(1.25)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAnalysis(v => !v)}>
            {showAnalysis ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFullscreen(v => !v)}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Symbol palette */}
      <div className="flex flex-wrap gap-1">
        {symbolButtons.map(s => (
          <button
            key={s.label}
            className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors font-mono"
            onClick={() => {
              // insert into first empty or last function
              const target = functions.find(f => !f.expression.trim()) || functions[functions.length - 1];
              if (target) updateFunction(target.id, { expression: target.expression + s.insert });
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Functions list */}
      <div className="space-y-2">
        {functions.map((fn, i) => (
          <div key={fn.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 cursor-pointer"
              style={{ backgroundColor: fn.color }}
              onClick={() => updateFunction(fn.id, { visible: !fn.visible })}
            />
            <span className="text-xs text-muted-foreground font-mono w-6">y=</span>
            <Input
              value={fn.expression}
              onChange={(e) => updateFunction(fn.id, { expression: e.target.value })}
              placeholder="e.g. x^2 + 2*x - 1"
              className="h-8 text-sm font-mono flex-1 bg-secondary border-0"
            />
            {functions.length > 1 && (
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => removeFunction(fn.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={addFunction}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add function
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setShowExamples(v => !v)}>
            {showExamples ? <ChevronUp className="h-3.5 w-3.5 mr-1" /> : <ChevronDown className="h-3.5 w-3.5 mr-1" />}
            Examples
          </Button>
        </div>
      </div>

      {/* Examples dropdown */}
      {showExamples && (
        <div className="grid grid-cols-3 gap-1">
          {EXAMPLE_GRAPHS.map(eg => (
            <button
              key={eg.name}
              className="text-xs px-2 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors text-left"
              onClick={() => loadExample(eg.expr)}
            >
              {eg.name}
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className={`relative rounded-lg overflow-hidden border border-border ${fullscreen ? 'flex-1 min-h-0' : 'h-[300px]'}`}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPoint(null)}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
          <Move className="h-3 w-3" /> Drag to pan • Scroll to zoom
        </div>
      </div>

      {/* Advanced tools row */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant={showTangent ? 'default' : 'outline'}
          size="sm"
          className="text-xs h-7"
          onClick={() => setShowTangent(v => !v)}
        >
          <Target className="h-3.5 w-3.5 mr-1" /> Tangent
        </Button>
        <Button
          variant={showParamSlider ? 'default' : 'outline'}
          size="sm"
          className="text-xs h-7"
          onClick={() => setShowParamSlider(v => !v)}
        >
          <Crosshair className="h-3.5 w-3.5 mr-1" /> Parameter 'a'
        </Button>
        <Button
          variant={showGrid ? 'default' : 'outline'}
          size="sm"
          className="text-xs h-7"
          onClick={() => setShowGrid(v => !v)}
        >
          Grid
        </Button>
      </div>

      {/* Tangent controls */}
      {showTangent && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground text-xs">x =</span>
          <Slider
            value={[tangentX]}
            min={xRange[0]}
            max={xRange[1]}
            step={(xRange[1] - xRange[0]) / 200}
            onValueChange={([v]) => setTangentX(v)}
            className="flex-1"
          />
          <span className="text-xs font-mono w-12 text-right">{tangentX.toFixed(2)}</span>
        </div>
      )}

      {/* Parameter slider */}
      {showParamSlider && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground text-xs">a =</span>
          <Slider
            value={[paramA]}
            min={-5}
            max={5}
            step={0.1}
            onValueChange={([v]) => setParamA(v)}
            className="flex-1"
          />
          <span className="text-xs font-mono w-12 text-right">{paramA.toFixed(1)}</span>
        </div>
      )}

      {/* Range controls */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground w-6">x:</span>
          <Input
            type="number"
            value={xRange[0]}
            onChange={(e) => setXRange([Number(e.target.value), xRange[1]])}
            className="h-7 text-xs w-16 bg-secondary border-0"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="number"
            value={xRange[1]}
            onChange={(e) => setXRange([xRange[0], Number(e.target.value)])}
            className="h-7 text-xs w-16 bg-secondary border-0"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground w-6">y:</span>
          <Input
            type="number"
            value={yRange[0]}
            onChange={(e) => setYRange([Number(e.target.value), yRange[1]])}
            className="h-7 text-xs w-16 bg-secondary border-0"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="number"
            value={yRange[1]}
            onChange={(e) => setYRange([yRange[0], Number(e.target.value)])}
            className="h-7 text-xs w-16 bg-secondary border-0"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {graphContent(false)}

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-6 flex flex-col">
          <ScrollArea className="flex-1">
            {graphContent(true)}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
