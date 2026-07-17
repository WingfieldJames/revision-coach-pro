import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import logoDark from '@/assets/logo-dark.png';
import logoMark from '@/assets/logo-mark.png';
import matanImage from '@/assets/matan-g.png';
import ryanDaviesImage from '@/assets/ryan-davies.png';
import kathyKouImage from '@/assets/kathy-kou.png';
import alexandruImage from '@/assets/alexandru-leoca.png';
import louisYungImage from '@/assets/louis-yung.png';
import oliverMobolajiImage from '@/assets/oliver-mobolaji.png';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchProductAccess } from '@/hooks/useProductAccess';
import { useQueryClient } from '@tanstack/react-query';
import { getValidAffiliateCode } from '@/hooks/useAffiliateTracking';
import { DynamicFounderSection } from '@/components/DynamicFounderSection';

interface DynamicProduct {
  id: string;
  slug: string;
  subject: string;
  exam_board: string;
  name: string;
}

const P = 'hsl(263, 70%, 50%)';

// Custom GCSE subject order: Geography, Biology, Chemistry, Physics, Maths, then others
const GCSE_SUBJECT_ORDER = ['geography', 'biology', 'chemistry', 'physics', 'mathematics', 'maths'];

const formatBoard = (b: string) => {
  if (!b) return '';
  if (b === 'edexcel igcse') return 'Edexcel IGCSE';
  if (b === 'cie') return 'CIE';
  if (b === 'aqa') return 'AQA';
  if (b === 'ocr') return 'OCR';
  if (b === 'edexcel') return 'Edexcel';
  if (b === 'wjec') return 'WJEC';
  if (b === 'sqa') return 'SQA';
  return b.toUpperCase();
};

const fmtPrice = (n?: number) => {
  if (n === undefined || n === null || Number.isNaN(n)) return '';
  return Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`;
};

// Feature card icons (verbatim from the Compare Page Refined design)
const ICONS: Record<string, { i1: string; i2: string; i3: string; i4: string }> = {
  bot: { i1: 'M12 8V4H8', i2: 'M4 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z', i3: 'M9 13v2', i4: 'M15 13v2' },
  pen: { i1: 'M12 20h9', i2: 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z', i3: '', i4: '' },
  file: { i1: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', i2: 'M14 2v5h6', i3: 'M16 13H8', i4: 'M16 17H8' },
  chart: { i1: 'M3 3v18h18', i2: 'M18 17V9', i3: 'M13 17V5', i4: 'M8 17v-3' },
  brain: { i1: 'M9 18h6', i2: 'M10 22h4', i3: 'M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z', i4: '' },
  book: { i1: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', i2: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z', i3: '', i4: '' },
};

export const GCSEComparePage = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [gcseProducts, setGcseProducts] = useState<DynamicProduct[]>([]);
  const [priceBySlug, setPriceBySlug] = useState<Record<string, { monthly?: number; lifetime?: number }>>({});
  const [subject, setSubject] = useState<string>('');
  const [examBoard, setExamBoard] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'monthly' | 'lifetime'>('lifetime');
  const [hasProductAccess, setHasProductAccess] = useState(false);

  // Sticky-header scroll shrink + board dropdown open state
  const [scrolled, setScrolled] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!boardMenuOpen) return;
    const onDocClick = () => setBoardMenuOpen(false);
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [boardMenuOpen]);

  // Handle payment success redirect
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    const sessionId = searchParams.get('session_id');
    if (paymentSuccess === 'true' && sessionId) {
      const verify = async () => {
        try {
          await supabase.functions.invoke('verify-payment', { body: { sessionId } });
        } catch (e) {
          console.error('Payment verification:', e);
        }
        const product = getCurrentProduct();
        if (product) {
          window.history.replaceState({}, '', '/gcse');
          setTimeout(() => { window.location.href = `/s/${product.slug}/premium`; }, 1500);
        }
      };
      verify();
    }
  }, [searchParams]);

  // Load GCSE products directly from products table + build the live price map
  useEffect(() => {
    const loadGCSEProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, slug, subject, exam_board, name, qualification_type, monthly_price, lifetime_price')
        .eq('active', true);

      if (data) {
        const prices: Record<string, { monthly?: number; lifetime?: number }> = {};
        for (const p of data as { slug?: string; monthly_price?: number; lifetime_price?: number }[]) {
          if (p.slug) prices[p.slug] = { monthly: p.monthly_price ?? undefined, lifetime: p.lifetime_price ?? undefined };
        }
        setPriceBySlug(prices);

        const gcse = data.filter((p: any) => (p as any).qualification_type === 'GCSE');
        setGcseProducts(gcse as DynamicProduct[]);
        if (gcse.length > 0) {
          const first = gcse[0];
          setSubject(first.subject.toLowerCase().replace(/\s+/g, '-'));
          setExamBoard(first.exam_board.toLowerCase());
        }
      }
    };
    loadGCSEProducts();
  }, []);

  // Build subjects list (custom GCSE order)
  const allSubjects = React.useMemo(() => {
    const subjects: string[] = [];
    for (const p of gcseProducts) {
      const key = p.subject.toLowerCase().replace(/\s+/g, '-');
      if (!subjects.includes(key)) subjects.push(key);
    }
    return subjects.sort((a, b) => {
      const ai = GCSE_SUBJECT_ORDER.indexOf(a);
      const bi = GCSE_SUBJECT_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [gcseProducts]);

  // Build subject labels
  const subjectLabels = React.useMemo(() => {
    const labels: Record<string, string> = {};
    for (const p of gcseProducts) {
      const key = p.subject.toLowerCase().replace(/\s+/g, '-');
      if (!labels[key]) {
        labels[key] = p.subject.replace(/\b\w/g, c => c.toUpperCase());
      }
    }
    return labels;
  }, [gcseProducts]);

  // Build boards for current subject
  const boardsForSubject = React.useMemo(() => {
    const boards: string[] = [];
    for (const p of gcseProducts) {
      const subjectKey = p.subject.toLowerCase().replace(/\s+/g, '-');
      const boardKey = p.exam_board.toLowerCase();
      if (subjectKey === subject && !boards.includes(boardKey)) boards.push(boardKey);
    }
    return boards;
  }, [subject, gcseProducts]);

  // Get current dynamic product
  const getCurrentProduct = React.useCallback(() => {
    return gcseProducts.find(p => {
      const subjectKey = p.subject.toLowerCase().replace(/\s+/g, '-');
      const boardKey = p.exam_board.toLowerCase();
      return subjectKey === subject && boardKey === examBoard;
    });
  }, [gcseProducts, subject, examBoard]);

  const getCurrentProductSlug = () => {
    const p = getCurrentProduct();
    return p?.slug || null;
  };

  // Check product access
  useEffect(() => {
    const checkAccess = async () => {
      const productSlug = getCurrentProductSlug();
      if (!user || loading || !productSlug) {
        setHasProductAccess(false);
        return;
      }
      try {
        const access = await fetchProductAccess(queryClient, user.id, productSlug);
        setHasProductAccess(access.hasAccess);
      } catch (error) {
        console.error('Error checking product access:', error);
        setHasProductAccess(false);
      }
    };
    checkAccess();
  }, [user, subject, examBoard, loading, queryClient]);

  // Auto-select first board
  useEffect(() => {
    if (!examBoard && boardsForSubject.length > 0) {
      setExamBoard(boardsForSubject[0]);
    }
  }, [examBoard, boardsForSubject]);

  useEffect(() => {
    if (!searchParams.get('payment_success')) {
      window.scrollTo(0, 0);
    }
  }, []);

  const handleFreeClick = async () => {
    const product = getCurrentProduct();
    if (!product) return;
    const path = `/s/${product.slug}/free`;
    if (!user) {
      window.location.href = `/login?redirect=${path.replace('/', '')}`;
      return;
    }
    window.location.href = path;
  };

  const handlePremiumClick = async (selectedPaymentType: 'monthly' | 'lifetime' = paymentType) => {
    const product = getCurrentProduct();
    if (!product) return;

    if (!user) {
      window.location.href = '/login?redirect=stripe';
      return;
    }

    if (hasProductAccess) {
      window.location.href = `/s/${product.slug}/premium`;
      return;
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        alert('Please log in again to continue');
        window.location.href = '/login';
        return;
      }
      if (!product.id && !product.slug) {
        alert('Please select a GCSE subject before upgrading.');
        return;
      }
      const affiliateCode = getValidAffiliateCode();
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        body: { paymentType: selectedPaymentType, productId: product.id, productSlug: product.slug, affiliateCode }
      });
      if (error) {
        alert(`Failed to create checkout session: ${(error as any).message || String(error)}`);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      alert(`Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Derived view data (mirrors the Compare Page Refined design)
  // ─────────────────────────────────────────────────────────────
  const hasSubjects = allSubjects.length > 0;
  const currentProduct = getCurrentProduct();
  const subjectLabel = subjectLabels[subject] || subject;
  const boardLabel = formatBoard(examBoard);
  const isLife = paymentType === 'lifetime';

  // Header scroll-shrink values (verbatim from the design)
  const sc = scrolled;
  const navWrapPad = sc ? '10px 16px 0 16px' : '0px';
  const navPad = sc ? '6px 20px' : '20px 24px 8px 24px';
  const navBorder = sc ? '1px solid #ece9f5' : '1px solid transparent';
  const navRadius = sc ? '18px' : '0px';
  const navShadow = sc ? '0 12px 32px rgba(24,18,50,0.10), 0 2px 8px rgba(24,18,50,0.06)' : 'none';
  const logoH = sc ? '54px' : '76px';

  // Feature cards
  const markerName = ({ economics: 'Essay marker', psychology: 'Essay marker', 'computer-science': 'Long answer marker', english: 'Essay marker', history: 'Essay marker' } as Record<string, string>)[subject] || 'Answer marker';
  const diagram = ({
    'computer-science': { title: 'Diagram generator', desc: 'Auto-generate data structures, logic gates, and network diagrams from any prompt.' },
    mathematics: { title: 'Graph plotter', desc: 'Auto-generate labelled graphs and diagrams from any prompt.' },
    maths: { title: 'Graph plotter', desc: 'Auto-generate labelled graphs and diagrams from any prompt.' },
  } as Record<string, { title: string; desc: string }>)[subject] || { title: 'Diagram generator', desc: `Auto-generate labelled ${subjectLabel} diagrams from any prompt.` };
  const features = [
    { ...ICONS.bot, title: 'AI tutor', desc: 'Trained on every past paper and mark scheme. Answers like an examiner thinks.' },
    { ...ICONS.pen, title: markerName, desc: `Instant feedback using exact ${boardLabel} marking criteria. Upload a photo or type it in.` },
    { ...ICONS.file, title: 'Past paper finder', desc: '2,000+ questions searchable by topic, year and difficulty.' },
    { ...ICONS.chart, title: diagram.title, desc: diagram.desc },
    { ...ICONS.brain, title: 'A* memory', desc: 'Remembers your weak spots across every session and drills them until they stick.' },
    { ...ICONS.book, title: 'Revision guide', desc: 'Spec-aligned notes for every topic. Written the way examiners want to see it.' },
  ];

  // Plans — live prices from the DB for the current product
  const currentSlug = getCurrentProductSlug();
  const currentPrices = currentSlug ? priceBySlug[currentSlug] : undefined;
  const monthlyPrice = fmtPrice(currentPrices?.monthly);
  const lifetimePrice = fmtPrice(currentPrices?.lifetime);
  const planName = isLife ? 'Exam Season Pass' : 'Monthly';
  const planPrice = isLife ? lifetimePrice : monthlyPrice;
  const planPeriod = isLife ? 'one-time' : '/month';
  const planSub = isLife ? 'Everything, until results day. One payment.' : 'Full access, month by month.';
  const freePerks = [
    `AI tutor for ${boardLabel} ${subjectLabel}`,
    `${markerName} with real marking criteria`,
    'Past paper finder & revision guide',
    'Diagram generator & A* memory',
  ];
  const proPerks: { text: string; weight: number }[] = [
    { text: 'Everything in Free', weight: 400 },
    { text: 'Even more A* training data', weight: 600 },
    { text: 'Priority support from the team', weight: 400 },
    { text: isLife ? 'One payment — covers the whole exam season' : 'Flexible — cancel anytime', weight: 400 },
  ];

  // Testimonials marquee (verbatim from the design)
  const T = [
    { pre: 'A*AI helped me go ', hl: 'from a C in my summer mocks to getting predicted an A', post: ' in November.', image: matanImage, name: 'Matan G', role: 'Year 11 Student' },
    { pre: 'The banded marking gave my answer full marks - ', hl: 'exactly what my teacher gave it', post: '.', image: ryanDaviesImage, name: 'Ryan Davies', role: 'Year 11' },
    { pre: 'In those final weeks before the exam it was a lifesaver, helping me ', hl: 'smash my GCSE mocks', post: '.', image: '/lovable-uploads/8e3350f3-3dd2-4e1f-b88a-c678f461e79d.png', name: 'Sina Naderi', role: 'GCSE Student' },
    { pre: 'Got my ', hl: 'first ever full marks on a long answer', post: " and then again today with A*AI's help", image: kathyKouImage, name: 'Kathy Kou', role: 'Year 10' },
    { pre: '', hl: 'Convinced my teacher to buy it', post: ' and use it in our lessons — showed it to him and he was shocked', image: alexandruImage, name: 'Alexandru Leoca', role: 'Year 10' },
    { pre: 'The feedback was ', hl: 'more detailed than any standard examiner marking', post: '. My teacher recommended it to my classmates.', image: louisYungImage, name: 'Louis Yung', role: 'Year 10' },
    { pre: 'Diagrams generated instantly, ', hl: 'feedback I could actually use', post: '.', image: '', name: 'Natas Bubelis', role: 'Year 11' },
    { pre: 'Bro... ', hl: 'I wish I found this sooner', post: ". It's perfect.", image: oliverMobolajiImage, name: 'Oliver Mobolaji', role: 'Year 11' },
  ].map(t => ({
    ...t,
    fallback: t.image ? '' : t.name.split(' ').map(n => n[0]).join(''),
  }));
  const marquee = [...T, ...T];

  const font = "'DM Sans', sans-serif";

  return (
    <div className="compare-landing" style={{ minHeight: '100vh', background: '#ffffff', color: '#18181b', fontFamily: font }}>
      <style>{`
        @keyframes marqueeX { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pathPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.8; } }
        .compare-landing a { color: hsl(263, 70%, 50%); text-decoration: none; }
        .compare-landing a:hover { color: hsl(263, 70%, 42%); }
        .compare-landing ::-webkit-scrollbar { height: 6px; width: 6px; }
        .compare-landing ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 3px; }
        .compare-landing .nav-link:hover { color: #18181b !important; }
        .compare-landing .btn-primary-sm:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 16px rgba(79,54,179,0.25) !important; background: hsl(263, 70%, 45%) !important; }
        .compare-landing .btn-primary:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 20px rgba(79,54,179,0.25) !important; background: hsl(263, 70%, 45%) !important; }
        .compare-landing .btn-outline:hover { background: hsl(263, 70%, 50%) !important; border-color: hsl(263, 70%, 50%) !important; color: #ffffff !important; }
        .compare-landing .board-btn:hover { background: #f7f9fb !important; }
        .compare-landing .board-item:hover { background: #f7f9fb !important; }
        .compare-landing .start-link:hover { opacity: 0.75 !important; }
        .compare-landing .feature-card:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 28px rgba(79,54,179,0.10) !important; }
        .compare-landing .marquee-track:hover { animation-play-state: paused !important; }
        @media (max-width: 768px) {
          .compare-landing .cmp-nav-center { display: none !important; }
          .compare-landing .cmp-section { padding-left: 20px !important; padding-right: 20px !important; }
          .compare-landing .cmp-h1 { font-size: 34px !important; }
          .compare-landing .cmp-pills-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -20px 40px; padding: 0 20px; }
          .compare-landing .cmp-subject-row { flex-wrap: wrap !important; gap: 12px !important; align-items: flex-start !important; }
          .compare-landing .cmp-features { grid-template-columns: 1fr !important; }
          .compare-landing .cmp-plans { grid-template-columns: 1fr !important; }
          .compare-landing .cmp-founder-inner { flex-direction: column !important; gap: 24px !important; text-align: center; }
          .compare-landing .cmp-section-pad { padding-top: 56px !important; padding-bottom: 56px !important; }
        }
      `}</style>

      <SEOHead
        title="Choose Your GCSE A* AI Subject"
        description="Compare A* AI plans for GCSE revision. AI-powered tutoring for all GCSE subjects, trained on your exact exam board. Free to start."
        canonical="https://astarai.co.uk/gcse"
      />

      {/* ═══ Header ═══ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, padding: navWrapPad, transition: 'padding 0.35s cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: navPad, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', border: navBorder, borderRadius: navRadius, boxShadow: navShadow, transition: 'padding 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), border-radius 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), border-color 0.35s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img src={logoDark} alt="A* AI logo" style={{ height: logoH, width: 'auto', display: 'block', transition: 'height 0.35s cubic-bezier(0.22, 0.61, 0.36, 1)' }} />
          </div>
          <div className="cmp-nav-center" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{ display: 'flex', gap: '24px', paddingBottom: '1px', borderBottom: '1px solid #e6e4ec' }}>
              <div className="nav-link" onClick={() => { navigate('/'); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100); }} style={{ fontSize: '14px', paddingBottom: '5px', color: '#71717a', cursor: 'pointer' }}>Home</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', paddingBottom: '5px', marginBottom: '-1.5px', borderBottom: '2px solid #18181b', color: '#18181b', fontWeight: 500, cursor: 'pointer' }}>Subjects
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
              </div>
              <div className="nav-link" onClick={() => window.open('https://astarai.printify.me', '_blank')} style={{ fontSize: '14px', paddingBottom: '5px', color: '#71717a', cursor: 'pointer' }}>Merch</div>
              <div className="nav-link" onClick={() => navigate('/schools')} style={{ fontSize: '14px', paddingBottom: '5px', color: '#71717a', cursor: 'pointer' }}>Schools</div>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <button className="btn-primary-sm" onClick={handleFreeClick} style={{ background: P, color: '#ffffff', border: 'none', borderRadius: '9999px', padding: '10px 24px', fontFamily: font, fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.3s' }}>Start Studying</button>
          </div>
        </div>
      </header>

      {/* ═══ Choose your GCSE subject ═══ */}
      <section className="cmp-section" style={{ position: 'relative', overflow: 'hidden', padding: '40px 32px 0 32px' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <svg viewBox="-400 0 2000 400" fill="none" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', left: '50%', top: 0, height: '100%', minWidth: '120vw', transform: 'translateX(-50%)' }}>
            <path d="M-1000 90 C -600 120, 100 150, 500 130 C 900 110, 1400 160, 2200 120" stroke="rgba(79,54,179,0.10)" strokeWidth="0.9" style={{ animation: 'pathPulse 22s ease-in-out infinite' }}></path>
            <path d="M-940 150 C -560 175, 130 195, 540 170 C 940 150, 1440 195, 2260 185" stroke="rgba(79,54,179,0.11)" strokeWidth="1.1" style={{ animation: 'pathPulse 20s ease-in-out infinite' }}></path>
            <path d="M-880 210 C -520 235, 160 245, 580 220 C 980 195, 1480 235, 2320 245" stroke="rgba(79,54,179,0.12)" strokeWidth="1.3" style={{ animation: 'pathPulse 24s ease-in-out infinite' }}></path>
            <path d="M-820 270 C -480 295, 190 295, 620 270 C 1020 245, 1520 280, 2380 305" stroke="rgba(79,54,179,0.10)" strokeWidth="1.5" style={{ animation: 'pathPulse 21s ease-in-out infinite' }}></path>
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '1152px', margin: '0 auto' }}>
          <h1 className="cmp-h1" style={{ fontSize: '52px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', color: '#18181b' }}>Choose your GCSE <img src={logoMark} alt="A*" style={{ height: '0.9em', width: 'auto', objectFit: 'contain', verticalAlign: '-0.08em' }} /> <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>subject<svg viewBox="0 0 300 14" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: '-8px', width: '100%', height: '14px', overflow: 'visible' }}><path d="M4 9 C 60 2, 130 3, 158 6 C 200 10, 255 9, 296 4" stroke={P} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.55"></path></svg></span></h1>
          <p style={{ fontSize: '18px', color: '#71717a', margin: '0 0 32px 0' }}>Every subject comes with its own AI, trained on your exact exam board.</p>

          {hasSubjects && (
            <div className="cmp-pills-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
              <div style={{ display: 'inline-flex', borderRadius: '9999px', border: '1px solid #e6e4ec', background: '#ffffff', padding: '6px', gap: '4px' }}>
                {allSubjects.map((s) => {
                  const activePill = s === subject;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setSubject(s);
                        setBoardMenuOpen(false);
                        const dp = gcseProducts.find(p => p.subject.toLowerCase().replace(/\s+/g, '-') === s);
                        setExamBoard(dp ? dp.exam_board.toLowerCase() : '');
                      }}
                      style={{ padding: '8px 20px', fontSize: '14px', fontWeight: 500, fontFamily: font, borderRadius: '9999px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', background: activePill ? P : 'transparent', color: activePill ? '#ffffff' : '#18181b' }}
                    >
                      {subjectLabels[s] || s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasSubjects && subject && (
            <>
              {/* Subject header row */}
              <div className="cmp-subject-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: '#18181b' }}>{subjectLabel}</div>
                  <div style={{ position: 'relative' }}>
                    <button className="board-btn" onClick={(e) => { e.stopPropagation(); setBoardMenuOpen(o => !o); }} style={{ borderRadius: '9999px', padding: '6px 16px', fontSize: '14px', fontWeight: 500, fontFamily: font, border: '1px solid #e6e4ec', background: '#ffffff', color: '#18181b', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{boardLabel || 'Select board'}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                    </button>
                    {boardMenuOpen && boardsForSubject.length > 1 && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 40, minWidth: '150px', background: '#ffffff', border: '1px solid #ece9f5', borderRadius: '12px', boxShadow: '0 12px 32px rgba(24,18,50,0.12)', padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {boardsForSubject.map((b) => {
                          const activeBoard = b === examBoard;
                          return (
                            <button key={b} className="board-item" onClick={() => { setExamBoard(b); setBoardMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', background: activeBoard ? 'hsla(263, 70%, 50%, 0.06)' : 'transparent', borderRadius: '8px', fontFamily: font, fontSize: '14px', fontWeight: 500, color: '#18181b', cursor: 'pointer', textAlign: 'left' }}>
                              <span style={{ display: 'inline-flex', width: '14px', color: P }}>{activeBoard ? '✓' : ''}</span>{formatBoard(b)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '13px', color: '#a1a1aa' }}>GCSE · Full spec coverage</span>
                </div>
                <button className="start-link" onClick={handleFreeClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, fontFamily: font, border: 'none', background: 'none', cursor: 'pointer', backgroundImage: 'linear-gradient(135deg, #4f36b3 0%, #7c5ce7 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Start studying
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
              </div>

              {/* Feature cards */}
              <div id="pricing" className="cmp-features" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {features.map((f, i) => (
                  <div key={i} className="feature-card" style={{ background: '#f7f9fb', borderRadius: '12px', padding: '28px', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '14px' }}>
                      {f.i1 && <path d={f.i1}></path>}{f.i2 && <path d={f.i2}></path>}{f.i3 && <path d={f.i3}></path>}{f.i4 && <path d={f.i4}></path>}
                    </svg>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#18181b', marginBottom: '8px' }}>{f.title}</div>
                    <div style={{ fontSize: '14px', color: '#71717a', lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#71717a', margin: '16px 0 0 0' }}>Free to start · No credit card required</p>
            </>
          )}
        </div>
      </section>

      {/* ═══ Plans ═══ */}
      {hasSubjects && subject && (
        <section className="cmp-section cmp-section-pad" style={{ padding: '88px 32px' }}>
          <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '44px', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px 0', color: '#18181b' }}>Start free. Upgrade when it clicks.</h2>
              <p style={{ fontSize: '17px', color: '#71717a', margin: '0 0 28px 0' }}>Every plan is per subject, built for {boardLabel} {subjectLabel}.</p>
              <div style={{ display: 'inline-flex', borderRadius: '9999px', border: '1px solid #e6e4ec', background: '#ffffff', padding: '5px', gap: '4px' }}>
                <button onClick={() => setPaymentType('monthly')} style={{ padding: '8px 22px', fontSize: '14px', fontWeight: 600, fontFamily: font, borderRadius: '9999px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: isLife ? 'transparent' : P, color: isLife ? '#18181b' : '#ffffff' }}>Monthly</button>
                <button onClick={() => setPaymentType('lifetime')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 22px', fontSize: '14px', fontWeight: 600, fontFamily: font, borderRadius: '9999px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: isLife ? P : 'transparent', color: isLife ? '#ffffff' : '#18181b' }}>Exam Season Pass <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: isLife ? 'rgba(255,255,255,0.2)' : 'hsla(263, 70%, 50%, 0.1)', color: isLife ? '#ffffff' : P }}>Best value</span></button>
              </div>
            </div>

            <div className="cmp-plans" style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: '24px', alignItems: 'stretch' }}>
              {/* Free */}
              <div style={{ background: '#f7f9fb', borderRadius: '20px', padding: '36px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', marginBottom: '12px' }}>Free</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.02em', color: '#18181b' }}>£0</span>
                </div>
                <p style={{ fontSize: '14px', color: '#71717a', margin: '0 0 24px 0' }}>Everything you need to get started.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {freePerks.map((text, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '15px', color: '#2c2c33' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '3px' }}><path d="M20 6 9 17l-5-5"></path></svg>{text}
                    </div>
                  ))}
                </div>
                <button className="btn-outline" onClick={handleFreeClick} style={{ marginTop: '28px', padding: '13px 24px', borderRadius: '9999px', background: 'transparent', color: '#18181b', fontFamily: font, fontWeight: 600, fontSize: '15px', border: '1px solid rgba(24,24,27,0.3)', cursor: 'pointer', transition: 'all 0.3s' }}>Start for free</button>
              </div>

              {/* Premium */}
              <div style={{ position: 'relative', background: '#ffffff', borderRadius: '20px', padding: '36px', display: 'flex', flexDirection: 'column', border: '1.5px solid hsla(263, 70%, 50%, 0.45)', boxShadow: '0 1px 3px rgba(24,18,50,0.05), 0 16px 40px rgba(79,54,179,0.12)' }}>
                <span style={{ position: 'absolute', top: '-13px', left: '32px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ffffff', background: P, padding: '5px 14px', borderRadius: '9999px' }}>Most popular</span>
                <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: P, marginBottom: '12px' }}>{planName}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.02em', color: '#18181b' }}>{planPrice || '—'}</span>
                  <span style={{ fontSize: '14px', color: '#71717a' }}>{planPeriod}</span>
                </div>
                <p style={{ fontSize: '14px', color: '#71717a', margin: '0 0 24px 0' }}>{planSub}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {proPerks.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '15px', color: '#2c2c33' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '3px' }}><path d="M20 6 9 17l-5-5"></path></svg><span><span style={{ fontWeight: p.weight }}>{p.text}</span></span>
                    </div>
                  ))}
                </div>
                <button className="btn-primary" onClick={() => handlePremiumClick(paymentType)} style={{ marginTop: '28px', padding: '13px 24px', borderRadius: '9999px', background: P, color: '#ffffff', fontFamily: font, fontWeight: 600, fontSize: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.3s' }}>{hasProductAccess ? 'Go to your premium bot →' : `Get the ${planName} →`}</button>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '12px 0 0 0', textAlign: 'center' }}>Secure checkout via Stripe · Cancel anytime</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ Built by A* students (DB-driven founder strip) ═══ */}
      {hasSubjects && currentProduct && (
        <DynamicFounderSection
          variant="strip"
          productId={currentProduct.id}
          subjectLabel={subjectLabel}
        />
      )}

      {/* ═══ Testimonials marquee ═══ */}
      {hasSubjects && (
        <section id="testimonials" className="cmp-section-pad" style={{ padding: '80px 0', overflow: 'hidden', background: 'linear-gradient(to bottom, #ffffff, hsla(263, 60%, 50%, 0.035) 40%, #ffffff)' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px', padding: '0 32px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: '#18181b' }}>Loved by students <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>across the UK<svg viewBox="0 0 300 14" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: '-8px', width: '100%', height: '14px', overflow: 'visible' }}><path d="M4 9 C 60 2, 130 3, 158 6 C 200 10, 255 9, 296 4" stroke={P} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.55"></path></svg></span></h2>
          </div>
          <div style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
            <div className="marquee-track" style={{ display: 'flex', gap: '16px', width: 'max-content', animation: 'marqueeX 55s linear infinite', willChange: 'transform' }}>
              {marquee.map((t, i) => (
                <div key={i} style={{ position: 'relative', width: '360px', flexShrink: 0, background: '#ffffff', borderRadius: '20px', padding: '22px', border: '1px solid #ece9f5', boxShadow: '0 1px 3px rgba(24,18,50,0.05), 0 8px 24px rgba(79,54,179,0.05)' }}>
                  <span style={{ position: 'absolute', top: '10px', right: '18px', fontSize: '44px', fontWeight: 800, color: 'hsla(263, 70%, 50%, 0.13)', lineHeight: 1, userSelect: 'none' }}>*</span>
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: '#2c2c33' }}>{t.pre}<span style={{ background: 'linear-gradient(transparent 55%, hsla(263, 70%, 50%, 0.18) 55%)', borderRadius: '2px', padding: '0 1px', fontWeight: 600 }}>{t.hl}</span>{t.post}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundImage: t.image ? `url("${t.image}")` : 'none', backgroundColor: 'hsla(263, 70%, 50%, 0.15)', backgroundSize: 'cover', backgroundPosition: 'center 20%', boxShadow: '0 0 0 2px #ffffff, 0 0 0 4px hsla(263, 70%, 50%, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P, fontWeight: 600, fontSize: '13px' }}>{t.fallback}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#18181b' }}>{t.name}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#71717a' }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Final CTA ═══ */}
      {hasSubjects && subject && (
        <section className="cmp-section cmp-section-pad" style={{ padding: '96px 32px', textAlign: 'center', borderTop: '1px solid rgba(228,228,232,0.6)', background: 'hsla(263, 70%, 50%, 0.02)' }}>
          <h2 style={{ fontSize: '44px', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px 0', color: '#18181b' }}>Ready when you are.</h2>
          <p style={{ fontSize: '17px', color: '#71717a', margin: '0 0 32px 0' }}>Your {boardLabel} {subjectLabel} AI is trained and waiting.</p>
          <button className="btn-primary" onClick={handleFreeClick} style={{ padding: '16px 40px', borderRadius: '9999px', background: P, color: '#ffffff', fontFamily: font, fontWeight: 600, fontSize: '18px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.3s' }}>Let's get you started on {boardLabel} {subjectLabel} →</button>
          <p style={{ fontSize: '13px', color: '#71717a', margin: '14px 0 0 0' }}>Get started <span style={{ position: 'relative', display: 'inline-block' }}>free<svg viewBox="0 0 40 8" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: '-4px', width: '100%', height: '6px', overflow: 'visible', pointerEvents: 'none' }}><path d="M2 5 C 10 2, 22 2.5, 28 4 C 32 5, 36 4.5, 38 3" stroke={P} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"></path></svg></span> • No card needed</p>
        </section>
      )}

      {/* ═══ Footer ═══ */}
      <footer style={{ padding: '64px 32px', textAlign: 'center', borderTop: '1px solid rgba(228,228,232,0.6)' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>
          <p style={{ color: '#71717a', margin: '0 0 24px 0', fontSize: '16px' }}>Your AI-powered GCSE revision coach</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginBottom: '24px', color: '#71717a', fontSize: '16px' }}>
            <Link to="/gcse">Plans</Link><span>•</span>
            <Link to="/#faq">FAQs</Link><span>•</span>
            <Link to="/login" onClick={() => window.scrollTo(0, 0)}>Sign in</Link><span>•</span>
            <Link to="/contact">Contact</Link>
          </div>
          <p style={{ fontSize: '14px', color: '#71717a', margin: '0 0 24px 0' }}>Secure checkout via Stripe • Your chats stay private</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
            <a href="https://www.instagram.com/a.star.ai/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            </a>
            <a href="https://www.tiktok.com/@a.star.ai" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
            </a>
            <a href="https://www.youtube.com/@a_star_ai" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
            </a>
            <a href="https://www.linkedin.com/company/astar-ai/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
            <p style={{ fontSize: '14px', color: '#71717a', margin: 0 }}>© 2025 A* AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
