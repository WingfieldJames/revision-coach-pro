import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Maximize2, Minimize2, RotateCcw, BarChart2, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

/* ── math helpers ────────────────────────────────────── */

const factorial = (n: number): number => {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};

const comb = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 0; i < Math.min(k, n - k); i++) {
    r *= (n - i);
    r /= (i + 1);
  }
  return r;
};

const binomPMF = (k: number, n: number, p: number) =>
  comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);

const binomCDF = (k: number, n: number, p: number) => {
  let s = 0;
  for (let i = 0; i <= Math.floor(k); i++) s += binomPMF(i, n, p);
  return Math.min(s, 1);
};

const normalPDF = (x: number, mu: number, sigma: number) =>
  (1 / (sigma * Math.sqrt(2 * Math.PI))) *
  Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));

// Approximation of the standard normal CDF (Abramowitz & Stegun)
const stdNormalCDF = (z: number): number => {
  if (z < -8) return 0;
  if (z > 8) return 1;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
  const p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(z));
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z / 2);
  return 0.5 * (1 + sign * y);
};

const normalCDF = (x: number, mu: number, sigma: number) =>
  stdNormalCDF((x - mu) / sigma);

// Inverse normal CDF (rational approximation)
const invStdNormal = (p: number): number => {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;
  const a = [
    -3.969683028665376e1, 2.209460984245205e2,
    -2.759285104469687e2, 1.383577518672690e2,
    -3.066479806614716e1, 2.506628277459239e0
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2,
    -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1,
    -2.400758277161838e0, -2.549732539343734e0,
    4.374664141464968e0, 2.938163982698783e0
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1,
    2.445134137142996e0, 3.754408661907416e0
  ];
  const pLow = 0.02425, pHigh = 1 - pLow;
  let q: number, r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5; r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
};

/* ── types ────────────────────────────────────────────── */

type DistType = 'binomial' | 'normal';
type TabType = 'explorer' | 'hypothesis';
type TailType = 'left' | 'right' | 'two';
type ProbMode = 'eq' | 'lt' | 'le' | 'gt' | 'ge' | 'between';

/* ── canvas drawing ──────────────────────────────────── */

const COLORS = {
  bar: 'hsl(262, 83%, 58%)',
  barHighlight: 'hsl(262, 83%, 45%)',
  line: 'hsl(262, 83%, 58%)',
  shade: 'hsla(262, 83%, 58%, 0.35)',
  critical: 'hsla(0, 72%, 51%, 0.35)',
  criticalLine: 'hsl(0, 72%, 51%)',
  testStat: 'hsl(142, 71%, 45%)',
  pValue: 'hsla(142, 71%, 45%, 0.25)',
  axis: 'hsl(0, 0%, 40%)',
  grid: 'hsl(0, 0%, 85%)',
  text: 'hsl(0, 0%, 20%)',
};

const drawBinomial = (
  ctx: CanvasRenderingContext2D, w: number, h: number,
  n: number, p: number,
  highlightFn?: (k: number) => boolean,
  shadeColor?: string,
) => {
  const pad = { top: 30, right: 20, bottom: 50, left: 60 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  // compute PMF
  const pmf: number[] = [];
  let maxP = 0;
  for (let k = 0; k <= n; k++) {
    const v = binomPMF(k, n, p);
    pmf.push(v);
    if (v > maxP) maxP = v;
  }
  maxP = Math.max(maxP, 0.01);

  // grid
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + plotH - (i / 5) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = COLORS.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText((maxP * i / 5).toFixed(3), pad.left - 6, y + 4);
  }

  // bars
  const barW = Math.max(2, plotW / (n + 2));
  for (let k = 0; k <= n; k++) {
    const x = pad.left + (k + 0.5) * (plotW / (n + 1)) - barW / 2;
    const barH = (pmf[k] / maxP) * plotH;
    const y = pad.top + plotH - barH;
    const hl = highlightFn?.(k);
    ctx.fillStyle = hl ? (shadeColor || COLORS.barHighlight) : COLORS.bar;
    ctx.globalAlpha = hl ? 0.9 : 0.7;
    ctx.fillRect(x, y, barW, barH);
    ctx.globalAlpha = 1;
  }

  // x-axis labels (skip some if n is large)
  const step = n <= 20 ? 1 : n <= 50 ? 5 : 10;
  ctx.fillStyle = COLORS.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  for (let k = 0; k <= n; k += step) {
    const x = pad.left + (k + 0.5) * (plotW / (n + 1));
    ctx.fillText(String(k), x, h - pad.bottom + 16);
  }

  // axis
  ctx.strokeStyle = COLORS.axis; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, h - pad.bottom); ctx.lineTo(w - pad.right, h - pad.bottom); ctx.stroke();

  // labels
  ctx.fillStyle = COLORS.text; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('k (successes)', w / 2, h - 6);
  ctx.save(); ctx.translate(14, h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('P(X = k)', 0, 0); ctx.restore();
};

const drawNormal = (
  ctx: CanvasRenderingContext2D, w: number, h: number,
  mu: number, sigma: number,
  shadeFn?: (x: number) => boolean,
  shadeColor?: string,
  markers?: { x: number; color: string; label: string }[],
) => {
  const pad = { top: 30, right: 20, bottom: 50, left: 60 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const xMin = mu - 4 * sigma;
  const xMax = mu + 4 * sigma;
  const yMax = normalPDF(mu, mu, sigma) * 1.15;

  const toCanvasX = (x: number) => pad.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const toCanvasY = (y: number) => pad.top + plotH - (y / yMax) * plotH;

  // grid
  ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 0.5;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + plotH - (i / 5) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
  }

  // shade
  if (shadeFn) {
    ctx.fillStyle = shadeColor || COLORS.shade;
    ctx.beginPath();
    const steps = 400;
    let started = false;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      if (shadeFn(x)) {
        const cx = toCanvasX(x);
        const cy = toCanvasY(normalPDF(x, mu, sigma));
        if (!started) { ctx.moveTo(cx, toCanvasY(0)); ctx.lineTo(cx, cy); started = true; }
        else ctx.lineTo(cx, cy);
      } else if (started) {
        const px = xMin + ((i - 1) / steps) * (xMax - xMin);
        ctx.lineTo(toCanvasX(px), toCanvasY(0));
        ctx.closePath(); ctx.fill(); ctx.beginPath(); started = false;
      }
    }
    if (started) {
      ctx.lineTo(toCanvasX(xMax), toCanvasY(0));
      ctx.closePath(); ctx.fill();
    }
  }

  // curve
  ctx.strokeStyle = COLORS.line; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= 500; i++) {
    const x = xMin + (i / 500) * (xMax - xMin);
    const cx = toCanvasX(x);
    const cy = toCanvasY(normalPDF(x, mu, sigma));
    i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
  }
  ctx.stroke();

  // markers
  markers?.forEach(m => {
    const cx = toCanvasX(m.x);
    ctx.strokeStyle = m.color; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(cx, pad.top); ctx.lineTo(cx, pad.top + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = m.color; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(m.label, cx, pad.top - 6);
  });

  // x-axis labels
  ctx.fillStyle = COLORS.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  const range = xMax - xMin;
  const tickStep = range <= 10 ? 1 : range <= 50 ? 5 : range <= 100 ? 10 : Math.ceil(range / 10);
  for (let v = Math.ceil(xMin / tickStep) * tickStep; v <= xMax; v += tickStep) {
    ctx.fillText(v.toFixed(v === Math.round(v) ? 0 : 1), toCanvasX(v), h - pad.bottom + 16);
  }

  // axis
  ctx.strokeStyle = COLORS.axis; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, h - pad.bottom); ctx.lineTo(w - pad.right, h - pad.bottom); ctx.stroke();

  ctx.fillStyle = COLORS.text; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('x', w / 2, h - 6);
  ctx.save(); ctx.translate(14, h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('f(x)', 0, 0); ctx.restore();
};

/* ── component ───────────────────────────────────────── */

export const StatisticalDistributionTool: React.FC = () => {
  const [tab, setTab] = useState<TabType>('explorer');
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button size="sm" variant={tab === 'explorer' ? 'default' : 'outline'} onClick={() => setTab('explorer')} className="text-xs gap-1.5">
            <BarChart2 className="h-3.5 w-3.5" /> Explorer
          </Button>
          <Button size="sm" variant={tab === 'hypothesis' ? 'default' : 'outline'} onClick={() => setTab('hypothesis')} className="text-xs gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Hypothesis Test
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setFullscreen(true)} className="text-xs gap-1">
          <Maximize2 className="h-3.5 w-3.5" /> Expand
        </Button>
      </div>

      <div className="min-h-[400px]">
        {tab === 'explorer' ? <DistributionExplorer /> : <HypothesisTestVisualiser />}
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1">
              <Button size="sm" variant={tab === 'explorer' ? 'default' : 'outline'} onClick={() => setTab('explorer')} className="text-xs gap-1.5">
                <BarChart2 className="h-3.5 w-3.5" /> Explorer
              </Button>
              <Button size="sm" variant={tab === 'hypothesis' ? 'default' : 'outline'} onClick={() => setTab('hypothesis')} className="text-xs gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Hypothesis Test
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setFullscreen(false)} className="text-xs gap-1">
              <Minimize2 className="h-3.5 w-3.5" /> Minimise
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            {tab === 'explorer' ? <DistributionExplorer fullscreen /> : <HypothesisTestVisualiser fullscreen />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ── Distribution Explorer ──────────────────────────── */

const DistributionExplorer: React.FC<{ fullscreen?: boolean }> = ({ fullscreen }) => {
  const [dist, setDist] = useState<DistType>('binomial');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Binomial params
  const [n, setN] = useState(20);
  const [p, setP] = useState(0.5);

  // Normal params
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1);

  // Probability calc
  const [probMode, setProbMode] = useState<ProbMode>('le');
  const [probK, setProbK] = useState(10);
  const [probA, setProbA] = useState(0);
  const [probB, setProbB] = useState(5);
  const [calcResult, setCalcResult] = useState<number | null>(null);

  const calcProb = useCallback(() => {
    let result = 0;
    if (dist === 'binomial') {
      switch (probMode) {
        case 'eq': result = binomPMF(probK, n, p); break;
        case 'lt': result = binomCDF(probK - 1, n, p); break;
        case 'le': result = binomCDF(probK, n, p); break;
        case 'gt': result = 1 - binomCDF(probK, n, p); break;
        case 'ge': result = 1 - binomCDF(probK - 1, n, p); break;
        case 'between': result = binomCDF(probB, n, p) - binomCDF(probA - 1, n, p); break;
      }
    } else {
      switch (probMode) {
        case 'eq': result = 0; break;
        case 'lt': case 'le': result = normalCDF(probK, mu, sigma); break;
        case 'gt': case 'ge': result = 1 - normalCDF(probK, mu, sigma); break;
        case 'between': result = normalCDF(probB, mu, sigma) - normalCDF(probA, mu, sigma); break;
      }
    }
    setCalcResult(result);
  }, [dist, probMode, probK, probA, probB, n, p, mu, sigma]);

  useEffect(() => { calcProb(); }, [calcProb]);

  // highlighter
  const highlightFn = useCallback((k: number) => {
    switch (probMode) {
      case 'eq': return k === probK;
      case 'lt': return k < probK;
      case 'le': return k <= probK;
      case 'gt': return k > probK;
      case 'ge': return k >= probK;
      case 'between': return k >= probA && k <= probB;
      default: return false;
    }
  }, [probMode, probK, probA, probB]);

  const shadeFnNormal = useCallback((x: number) => {
    switch (probMode) {
      case 'lt': case 'le': return x <= probK;
      case 'gt': case 'ge': return x >= probK;
      case 'between': return x >= probA && x <= probB;
      default: return false;
    }
  }, [probMode, probK, probA, probB]);

  // draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (dist === 'binomial') {
      drawBinomial(ctx, rect.width, rect.height, n, p, highlightFn, COLORS.shade);
    } else {
      drawNormal(ctx, rect.width, rect.height, mu, sigma, shadeFnNormal);
    }
  }, [dist, n, p, mu, sigma, highlightFn, shadeFnNormal]);

  const mean = dist === 'binomial' ? n * p : mu;
  const variance = dist === 'binomial' ? n * p * (1 - p) : sigma * sigma;
  const sd = Math.sqrt(variance);

  const reset = () => {
    if (dist === 'binomial') { setN(20); setP(0.5); setProbK(10); }
    else { setMu(0); setSigma(1); setProbK(0); }
    setProbMode('le'); setProbA(0); setProbB(5);
  };

  return (
    <div className="space-y-3">
      {/* Distribution toggle */}
      <div className="flex gap-1">
        <Button size="sm" variant={dist === 'binomial' ? 'default' : 'outline'} onClick={() => setDist('binomial')} className="text-xs">Binomial</Button>
        <Button size="sm" variant={dist === 'normal' ? 'default' : 'outline'} onClick={() => setDist('normal')} className="text-xs">Normal</Button>
        <Button size="sm" variant="ghost" onClick={reset} className="ml-auto text-xs gap-1"><RotateCcw className="h-3 w-3" /> Reset</Button>
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50 border border-border">
        {dist === 'binomial' ? (
          <>
            <div>
              <Label className="text-xs">n (trials): {n}</Label>
              <Slider min={1} max={50} step={1} value={[n]} onValueChange={([v]) => { setN(v); if (probK > v) setProbK(v); }} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">p (probability): {p.toFixed(2)}</Label>
              <Slider min={0.01} max={0.99} step={0.01} value={[p]} onValueChange={([v]) => setP(v)} className="mt-1" />
            </div>
          </>
        ) : (
          <>
            <div>
              <Label className="text-xs">μ (mean): {mu.toFixed(1)}</Label>
              <Slider min={-50} max={50} step={0.5} value={[mu]} onValueChange={([v]) => setMu(v)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">σ (std dev): {sigma.toFixed(1)}</Label>
              <Slider min={0.1} max={20} step={0.1} value={[sigma]} onValueChange={([v]) => setSigma(v)} className="mt-1" />
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-muted-foreground px-1">
        <span>Mean = <strong className="text-foreground">{mean.toFixed(4)}</strong></span>
        <span>Var = <strong className="text-foreground">{variance.toFixed(4)}</strong></span>
        <span>SD = <strong className="text-foreground">{sd.toFixed(4)}</strong></span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border border-border bg-card"
        style={{ height: fullscreen ? '45vh' : '220px' }}
      />

      {/* Probability calculator */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
        <Label className="text-xs font-semibold">Probability Calculator</Label>
        <div className="flex flex-wrap gap-1">
          {(['eq', 'lt', 'le', 'gt', 'ge', 'between'] as ProbMode[]).map(m => (
            <Button key={m} size="sm" variant={probMode === m ? 'default' : 'outline'} onClick={() => setProbMode(m)} className="text-[10px] px-2 h-7">
              {m === 'eq' ? 'P(X=k)' : m === 'lt' ? 'P(X<k)' : m === 'le' ? 'P(X≤k)' : m === 'gt' ? 'P(X>k)' : m === 'ge' ? 'P(X≥k)' : 'P(a≤X≤b)'}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          {probMode === 'between' ? (
            <>
              <div>
                <Label className="text-[10px]">a</Label>
                <Input type="number" value={probA} onChange={e => setProbA(Number(e.target.value))} className="h-7 w-20 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">b</Label>
                <Input type="number" value={probB} onChange={e => setProbB(Number(e.target.value))} className="h-7 w-20 text-xs" />
              </div>
            </>
          ) : (
            <div>
              <Label className="text-[10px]">k</Label>
              <Input type="number" value={probK} onChange={e => setProbK(Number(e.target.value))} className="h-7 w-20 text-xs" />
            </div>
          )}
        </div>
        {calcResult !== null && (
          <div className="text-sm font-semibold text-primary">
            P = {calcResult.toFixed(6)}
            {dist === 'normal' && probMode !== 'between' && probMode !== 'eq' && (
              <span className="text-xs text-muted-foreground ml-2">
                (z = {((probK - mu) / sigma).toFixed(4)})
              </span>
            )}
          </div>
        )}

        {/* Normal approx hint for binomial */}
        {dist === 'binomial' && n * p >= 5 && n * (1 - p) >= 5 && (
          <div className="text-[10px] text-muted-foreground bg-primary/5 rounded p-2 border border-primary/20">
            💡 Normal approximation valid: np={( n * p).toFixed(1)} ≥ 5, n(1-p)={(n * (1 - p)).toFixed(1)} ≥ 5 → X ~ N({(n * p).toFixed(1)}, {(n * p * (1 - p)).toFixed(2)})
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Hypothesis Test Visualiser ─────────────────────── */

const HypothesisTestVisualiser: React.FC<{ fullscreen?: boolean }> = ({ fullscreen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dist, setDist] = useState<DistType>('binomial');

  // Binomial
  const [n, setN] = useState(20);
  const [p0, setP0] = useState(0.5);

  // Normal
  const [mu0, setMu0] = useState(0);
  const [sigma, setSigma] = useState(1);

  // Hypothesis
  const [tail, setTail] = useState<TailType>('left');
  const [alpha, setAlpha] = useState(0.05);
  const [testStat, setTestStat] = useState<string>('');

  const testVal = testStat !== '' ? Number(testStat) : null;

  // Calculate critical values & p-value
  const criticals = (() => {
    if (dist === 'binomial') {
      if (tail === 'left') {
        // find largest c s.t. P(X <= c) <= alpha
        for (let c = 0; c <= n; c++) {
          if (binomCDF(c, n, p0) > alpha) return { lower: c - 1, upper: null, type: 'left' as const };
        }
        return { lower: n, upper: null, type: 'left' as const };
      } else if (tail === 'right') {
        for (let c = n; c >= 0; c--) {
          if (1 - binomCDF(c - 1, n, p0) > alpha) return { lower: null, upper: c + 1, type: 'right' as const };
        }
        return { lower: null, upper: 0, type: 'right' as const };
      } else {
        const halfAlpha = alpha / 2;
        let lower = -1;
        for (let c = 0; c <= n; c++) {
          if (binomCDF(c, n, p0) > halfAlpha) { lower = c - 1; break; }
        }
        let upper = n + 1;
        for (let c = n; c >= 0; c--) {
          if (1 - binomCDF(c - 1, n, p0) > halfAlpha) { upper = c + 1; break; }
        }
        return { lower, upper, type: 'two' as const };
      }
    } else {
      const zCrit = invStdNormal(1 - alpha);
      if (tail === 'left') return { lower: mu0 - zCrit * sigma, upper: null, type: 'left' as const };
      if (tail === 'right') return { lower: null, upper: mu0 + zCrit * sigma, type: 'right' as const };
      const zTwo = invStdNormal(1 - alpha / 2);
      return { lower: mu0 - zTwo * sigma, upper: mu0 + zTwo * sigma, type: 'two' as const };
    }
  })();

  const pValue = (() => {
    if (testVal === null) return null;
    if (dist === 'binomial') {
      const k = Math.round(testVal);
      if (tail === 'left') return binomCDF(k, n, p0);
      if (tail === 'right') return 1 - binomCDF(k - 1, n, p0);
      const pLeft = binomCDF(k, n, p0);
      const pRight = 1 - binomCDF(k - 1, n, p0);
      return 2 * Math.min(pLeft, pRight);
    } else {
      if (tail === 'left') return normalCDF(testVal, mu0, sigma);
      if (tail === 'right') return 1 - normalCDF(testVal, mu0, sigma);
      const z = Math.abs((testVal - mu0) / sigma);
      return 2 * (1 - stdNormalCDF(z));
    }
  })();

  const reject = pValue !== null ? pValue < alpha : null;

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (dist === 'binomial') {
      const highlightCritical = (k: number) => {
        if (tail === 'left') return criticals.lower !== null && k <= criticals.lower;
        if (tail === 'right') return criticals.upper !== null && k >= criticals.upper;
        return (criticals.lower !== null && k <= criticals.lower) || (criticals.upper !== null && k >= criticals.upper);
      };
      drawBinomial(ctx, rect.width, rect.height, n, p0, highlightCritical, COLORS.critical);

      // Draw test stat marker
      if (testVal !== null) {
        const pad = { left: 60, right: 20, top: 30, bottom: 50 };
        const plotW = rect.width - pad.left - pad.right;
        const k = Math.round(testVal);
        const barW = Math.max(2, plotW / (n + 2));
        const x = pad.left + (k + 0.5) * (plotW / (n + 1));
        ctx.strokeStyle = COLORS.testStat; ctx.lineWidth = 2.5; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, rect.height - pad.bottom); ctx.stroke();
        ctx.fillStyle = COLORS.testStat; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`x=${k}`, x, pad.top - 6);
      }
    } else {
      const shadeCritical = (x: number) => {
        if (tail === 'left') return criticals.lower !== null && x <= criticals.lower;
        if (tail === 'right') return criticals.upper !== null && x >= criticals.upper;
        return (criticals.lower !== null && x <= criticals.lower) || (criticals.upper !== null && x >= criticals.upper);
      };
      const markers: { x: number; color: string; label: string }[] = [];
      if (criticals.lower !== null) markers.push({ x: criticals.lower, color: COLORS.criticalLine, label: `c=${criticals.lower.toFixed(2)}` });
      if (criticals.upper !== null) markers.push({ x: criticals.upper, color: COLORS.criticalLine, label: `c=${criticals.upper.toFixed(2)}` });
      if (testVal !== null) markers.push({ x: testVal, color: COLORS.testStat, label: `x̄=${testVal}` });

      drawNormal(ctx, rect.width, rect.height, mu0, sigma, shadeCritical, COLORS.critical, markers);
    }
  }, [dist, n, p0, mu0, sigma, tail, alpha, testVal, criticals]);

  const reset = () => {
    setDist('binomial'); setN(20); setP0(0.5); setMu0(0); setSigma(1);
    setTail('left'); setAlpha(0.05); setTestStat('');
  };

  const tailLabels = {
    left: dist === 'binomial' ? 'H₁: p < p₀' : 'H₁: μ < μ₀',
    right: dist === 'binomial' ? 'H₁: p > p₀' : 'H₁: μ > μ₀',
    two: dist === 'binomial' ? 'H₁: p ≠ p₀' : 'H₁: μ ≠ μ₀',
  };

  return (
    <div className="space-y-3">
      {/* Distribution toggle */}
      <div className="flex gap-1">
        <Button size="sm" variant={dist === 'binomial' ? 'default' : 'outline'} onClick={() => setDist('binomial')} className="text-xs">Binomial</Button>
        <Button size="sm" variant={dist === 'normal' ? 'default' : 'outline'} onClick={() => setDist('normal')} className="text-xs">Normal</Button>
        <Button size="sm" variant="ghost" onClick={reset} className="ml-auto text-xs gap-1"><RotateCcw className="h-3 w-3" /> Reset</Button>
      </div>

      {/* Parameters under H₀ */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
        <Label className="text-xs font-semibold">Null Hypothesis H₀ Parameters</Label>
        <div className="grid grid-cols-2 gap-3">
          {dist === 'binomial' ? (
            <>
              <div>
                <Label className="text-[10px]">n (trials): {n}</Label>
                <Slider min={1} max={50} step={1} value={[n]} onValueChange={([v]) => setN(v)} className="mt-1" />
              </div>
              <div>
                <Label className="text-[10px]">p₀: {p0.toFixed(2)}</Label>
                <Slider min={0.01} max={0.99} step={0.01} value={[p0]} onValueChange={([v]) => setP0(v)} className="mt-1" />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-[10px]">μ₀: {mu0.toFixed(1)}</Label>
                <Slider min={-50} max={50} step={0.5} value={[mu0]} onValueChange={([v]) => setMu0(v)} className="mt-1" />
              </div>
              <div>
                <Label className="text-[10px]">σ: {sigma.toFixed(1)}</Label>
                <Slider min={0.1} max={20} step={0.1} value={[sigma]} onValueChange={([v]) => setSigma(v)} className="mt-1" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hypothesis & significance */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
        <Label className="text-xs font-semibold">Alternative Hypothesis H₁</Label>
        <div className="flex gap-1">
          {(['left', 'right', 'two'] as TailType[]).map(t => (
            <Button key={t} size="sm" variant={tail === t ? 'default' : 'outline'} onClick={() => setTail(t)} className="text-[10px] px-2 h-7">
              {tailLabels[t]}
            </Button>
          ))}
        </div>
        <div>
          <Label className="text-[10px]">Significance level α: {(alpha * 100).toFixed(1)}%</Label>
          <div className="flex gap-1 mt-1 flex-wrap">
            {[0.1, 0.05, 0.025, 0.01, 0.005].map(a => (
              <Button key={a} size="sm" variant={alpha === a ? 'default' : 'outline'} onClick={() => setAlpha(a)} className="text-[10px] px-2 h-6">
                {(a * 100)}%
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border border-border bg-card"
        style={{ height: fullscreen ? '40vh' : '220px' }}
      />

      {/* Critical values display */}
      <div className="flex flex-wrap gap-3 text-xs px-1">
        {criticals.lower !== null && (
          <span className="text-muted-foreground">Lower critical: <strong className="text-destructive">{typeof criticals.lower === 'number' ? (dist === 'binomial' ? criticals.lower : criticals.lower.toFixed(4)) : '—'}</strong></span>
        )}
        {criticals.upper !== null && (
          <span className="text-muted-foreground">Upper critical: <strong className="text-destructive">{typeof criticals.upper === 'number' ? (dist === 'binomial' ? criticals.upper : criticals.upper.toFixed(4)) : '—'}</strong></span>
        )}
      </div>

      {/* Test statistic input */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
        <Label className="text-xs font-semibold">Test Statistic</Label>
        <div className="flex gap-2 items-end">
          <div>
            <Label className="text-[10px]">{dist === 'binomial' ? 'Observed x' : 'Observed x̄'}</Label>
            <Input type="number" value={testStat} onChange={e => setTestStat(e.target.value)} placeholder="Enter value" className="h-7 w-28 text-xs" />
          </div>
        </div>
        {pValue !== null && (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-primary">
              p-value = {pValue.toFixed(6)}
              {dist === 'normal' && testVal !== null && (
                <span className="text-xs text-muted-foreground ml-2">
                  (z = {((testVal - mu0) / sigma).toFixed(4)})
                </span>
              )}
            </div>
            <div className={`text-xs font-semibold rounded px-2 py-1 inline-block ${reject ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
              {reject
                ? `Reject H₀ — p-value (${pValue.toFixed(4)}) < α (${alpha})`
                : `Do not reject H₀ — p-value (${pValue.toFixed(4)}) ≥ α (${alpha})`
              }
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              📝 In your exam, write a conclusion in context: e.g. "There is {reject ? 'sufficient' : 'insufficient'} evidence at the {(alpha * 100)}% significance level to suggest…"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
