import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import logoDark from '@/assets/logo-dark.png';
import kathyKou from '@/assets/kathy-kou.png';
import oliverMobolaji from '@/assets/oliver-mobolaji.png';
import dlyetTewolde from '@/assets/dlyet-tewolde.png';
import ryanDavies from '@/assets/ryan-davies.png';
import louisYung from '@/assets/louis-yung.png';
import alexandruLeoca from '@/assets/alexandru-leoca.png';
import sterlingRoad from '@/assets/sterling-road.png';

interface StudentLog { time: string; text: string; k: string; tag: string; }
interface Student {
  name: string; hours: string; prompts: number; attempt: string;
  attemptColor: string; dot: string; badge: string; badgeBg: string; badgeColor: string;
  skills: number[]; insight?: string; logs: StudentLog[];
}

export const SchoolsPage = () => {
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [sel, setSel] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorX, setCursorX] = useState('640px');
  const [cursorY, setCursorY] = useState('240px');
  const [cursorPulse, setCursorPulse] = useState(0);
  const [cursorPulseOpacity, setCursorPulseOpacity] = useState(0);

  const userClicked = useRef(false);
  const timersRef = useRef<number[]>([]);

  // Header scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Animated demo cursor: glides over the roster, "clicks" students to show the drill-down.
  useEffect(() => {
    const T: number[] = [];
    const step = (t: number, fn: () => void) => {
      T.push(window.setTimeout(() => { if (!userClicked.current) fn(); }, t));
    };
    const rowY = (i: number) => 100 + i * 60; // row centres in the student list
    const move = (t: number, i: number) => step(t, () => { setCursorX('235px'); setCursorY(rowY(i) + 'px'); });
    const click = (t: number, i: number) => {
      step(t, () => { setCursorPulse(1.7); setCursorPulseOpacity(0.5); setSel(i); });
      step(t + 420, () => { setCursorPulse(0); setCursorPulseOpacity(0); });
    };
    step(1100, () => { setCursorVisible(true); });
    move(1400, 3); click(2700, 3);   // Jess — needs attention
    move(5600, 4); click(6900, 4);   // Daniel — gone quiet
    move(9800, 2); click(11100, 2);  // Chloe — on track
    move(13800, 3); click(15100, 3); // back to Jess
    step(16200, () => { setCursorVisible(false); });
    timersRef.current = T;
    return () => { T.forEach(t => clearTimeout(t)); };
  }, []);

  const selectStudent = (i: number) => {
    userClicked.current = true;
    timersRef.current.forEach(t => clearTimeout(t));
    setCursorVisible(false);
    setSel(i);
  };

  const P = 'hsl(263, 70%, 50%)';
  const sc = scrolled;

  // Header scroll values
  const navWrapPad = sc ? '10px 16px 0 16px' : '0px';
  const navPad = sc ? '6px 20px' : '20px 24px 8px 24px';
  const navBorder = sc ? '1px solid #ece9f5' : '1px solid transparent';
  const navRadius = sc ? '18px' : '0px';
  const navShadow = sc ? '0 12px 32px rgba(24,18,50,0.10), 0 2px 8px rgba(24,18,50,0.06)' : 'none';
  const logoH = sc ? '54px' : '76px';
  const showHeroChips = true;

  // ── Roster demo data ──
  const tagStyles: Record<string, { tagBg: string; tagColor: string }> = {
    good: { tagBg: 'rgba(34,197,94,0.1)', tagColor: '#16a34a' },
    warn: { tagBg: 'rgba(245,158,11,0.14)', tagColor: '#b45309' },
    quiet: { tagBg: '#f4f4f5', tagColor: '#71717a' },
  };
  const students: Student[] = [
    { name: 'Amira Khan', hours: '3h 40m', prompts: 42, attempt: '96%', attemptColor: '#16a34a', dot: '#22c55e',
      badge: 'On track', badgeBg: 'rgba(34,197,94,0.1)', badgeColor: '#16a34a',
      skills: [82, 74, 78, 71],
      logs: [
        { time: 'Tue', text: 'Coached through demand-pull vs cost-push inflation — 3 spec sources cited', k: 'good', tag: 'Attempt ✓' },
        { time: 'Tue', text: 'AD/AS diagram generated and labelled for cost-push inflation', k: 'good', tag: 'Low offload' },
        { time: 'Mon', text: 'Essay marked 19/25 — evaluation up two marks on last attempt', k: 'good', tag: 'Attempt ✓' },
      ] },
    { name: 'Ben Osei', hours: '2h 10m', prompts: 25, attempt: '91%', attemptColor: '#16a34a', dot: '#22c55e',
      badge: 'On track', badgeBg: 'rgba(34,197,94,0.1)', badgeColor: '#16a34a',
      skills: [68, 72, 64, 58],
      logs: [
        { time: 'Wed', text: 'Worked through elasticity calculations — hint-level support only', k: 'good', tag: 'Attempt ✓' },
        { time: 'Tue', text: 'Past paper finder: 8-mark questions on market failure', k: 'good', tag: 'Low offload' },
        { time: 'Mon', text: 'Asked for a definition list — coached to build his own first', k: 'good', tag: 'Attempt ✓' },
      ] },
    { name: 'Chloe Sanders', hours: '4h 05m', prompts: 51, attempt: '94%', attemptColor: '#16a34a', dot: '#22c55e',
      badge: 'On track', badgeBg: 'rgba(34,197,94,0.1)', badgeColor: '#16a34a',
      skills: [88, 81, 84, 79],
      logs: [
        { time: 'Wed', text: 'Full mock paper 1 attempted — marked to June 2024 boundaries', k: 'good', tag: 'Attempt ✓' },
        { time: 'Tue', text: 'Monopsony diagram drawn, then compared against her own sketch', k: 'good', tag: 'Low offload' },
        { time: 'Sun', text: 'Revision guide built for Theme 3 business growth', k: 'good', tag: 'Low offload' },
      ] },
    { name: 'Jess Miller', hours: '5h 30m', prompts: 74, attempt: '62%', attemptColor: '#b45309', dot: '#f59e0b',
      badge: 'Needs attention', badgeBg: 'rgba(245,158,11,0.14)', badgeColor: '#b45309',
      skills: [76, 70, 85, 38],
      insight: 'Strong analysis, weak evaluation — and most sessions are late-night answer-seeking. Suggested: set a timed 25-marker with strict scaffolding.',
      logs: [
        { time: '23:41', text: '"Just give me the evaluation points for monopoly" — gate held, coached to attempt instead', k: 'warn', tag: 'Gate held' },
        { time: '22:15', text: 'Genuine attempt on trade union wage effects — hint-level support given', k: 'good', tag: 'Attempt ✓' },
        { time: 'Mon', text: 'Essay marked 14/25 — evaluation flagged as weakest AO', k: 'warn', tag: 'High offload' },
      ] },
    { name: 'Daniel Reid', hours: '0h 20m', prompts: 3, attempt: '—', attemptColor: '#a1a1aa', dot: '#d4d4d8',
      badge: 'Gone quiet', badgeBg: '#f4f4f5', badgeColor: '#71717a',
      skills: [61, 55, 52, 47],
      insight: 'No sessions in 5 days — worth a nudge before the Theme 2 mock.',
      logs: [
        { time: 'Thu', text: 'Last session 5 days ago — 3 prompts on the circular flow of income', k: 'quiet', tag: 'Quiet' },
      ] },
    { name: 'Freya Thomas', hours: '2h 55m', prompts: 33, attempt: '97%', attemptColor: '#16a34a', dot: '#22c55e',
      badge: 'On track', badgeBg: 'rgba(34,197,94,0.1)', badgeColor: '#16a34a',
      skills: [79, 83, 72, 68],
      logs: [
        { time: 'Wed', text: 'Coached through exchange rate transmission — strong first attempt', k: 'good', tag: 'Attempt ✓' },
        { time: 'Tue', text: 'My Mistakes drill: externalities diagrams from last month', k: 'good', tag: 'Low offload' },
        { time: 'Mon', text: 'Exam countdown checked, revision plan updated for Paper 2', k: 'good', tag: 'Low offload' },
      ] },
  ];

  const selIdx = Math.min(sel, students.length - 1);
  const selStudent = students[selIdx];
  const rosterRows = students.map((s, i) => ({
    name: s.name,
    initials: s.name.split(' ').map((n: string) => n[0]).join(''),
    meta: s.hours + ' · ' + s.prompts + ' prompts',
    attempt: s.attempt,
    attemptColor: s.attemptColor,
    dotColor: s.dot,
    avBg: i === selIdx ? P : 'hsla(263, 70%, 50%, 0.1)',
    avColor: i === selIdx ? '#ffffff' : P,
    bg: i === selIdx ? 'hsla(263, 70%, 50%, 0.06)' : 'transparent',
    border: i === selIdx ? 'hsla(263, 70%, 50%, 0.25)' : 'transparent',
  }));
  const skillLabels = ['Knowledge', 'Application', 'Analysis', 'Evaluation'];
  const detailSkills = selStudent.skills.map((v: number, i: number) => ({
    label: skillLabels[i],
    val: String(v),
    valColor: v < 50 ? '#b45309' : '#18181b',
    pct: v + '%',
    barColor: v < 50 ? '#f59e0b' : P,
  }));
  const detailStats = [
    { value: selStudent.hours, label: 'Hours this week' },
    { value: String(selStudent.prompts), label: 'Prompts this week' },
    { value: selStudent.attempt, label: 'Attempt-first rate' },
  ];
  const detailLogs = selStudent.logs.map((l) => ({ time: l.time, text: l.text, tag: l.tag, ...tagStyles[l.k] }));
  const detailName = selStudent.name;
  const detailMeta = '13B Economics A · Year 13';
  const detailBadge = selStudent.badge;
  const detailBadgeBg = selStudent.badgeBg;
  const detailBadgeColor = selStudent.badgeColor;
  const detailInsight = selStudent.insight || false;

  const gateStrip = [
    { title: 'Attempt required', desc: 'No engagement with "just write it" — students show their thinking first.' },
    { title: 'Genuine-attempt check', desc: 'Reasoning shape, not correctness. Wrong-but-real always passes.' },
    { title: 'Progressive hints', desc: 'Hint → partial → more, only as the student keeps working.' },
    { title: 'Reveal as comparison', desc: 'Full answers only after a real attempt, framed against their own work.' },
  ].map((s, i) => ({ ...s, num: i + 1 }));

  // ── Hero trust chips ──
  const trustChips = [
    { label: 'Attempt-first by design' },
    { label: 'Every interaction audit-logged' },
    { label: 'AI disclosure always on (EU AI Act)' },
    { label: 'KCSIE-aligned safeguarding' },
    { label: 'Pupil data stored in the UK' },
  ];

  // ── Teacher control bullets ──
  const controlPoints = [
    { title: 'Scaffolding tightness', desc: 'light, standard or strict — how hard the Coach pushes students to reason it out alone.' },
    { title: 'Writing-aid mode locked by default', desc: 'full model answers exist only if you unlock them, class by class.' },
    { title: 'Tool visibility per class', desc: 'switch any tool off and it disappears from students entirely.' },
    { title: 'Blocked topics & usage caps', desc: 'steer the Coach away from coursework, and cap daily or weekly messages.' },
  ];

  // ── Tool toggles mock ──
  const toolToggles = [
    { label: 'Diagram generator', on: true },
    { label: 'Past paper finder', on: true },
    { label: 'Mock exams', on: true },
    { label: 'Revision guide', on: true },
    { label: 'My Mistakes', on: true },
    { label: 'Exam countdown', on: false },
  ].map(t => ({ label: t.label, togBg: t.on ? P : '#e4e4e7', knobLeft: t.on ? '15px' : '2px' }));

  // ── Dashboard tour cards ──
  const dashCards = [
    { title: 'The offloading report', desc: 'A per-class trend of how much students lean on the AI. In the pilot cohort it fell 0.70 → 0.19 in six weeks — the case study your SLT presents.', i1: 'M3 3v16a2 2 0 0 0 2 2h16', i2: 'm19 9-5 5-4-4-3 3', i3: '' },
    { title: 'Full audit trail', desc: 'Every prompt, response, source and gate decision written server-side. Open any student’s transcript, any time.', i1: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', i2: 'M14 2v5h6', i3: 'M16 13H8' },
    { title: 'Roster & usage', desc: 'Who’s using the Coach, how often, and who’s gone quiet — usage visibility in one view, as DfE guidance expects.', i1: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', i2: 'M22 21v-2a4 4 0 0 0-3-3.87', i3: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
    { title: 'Skills breakdown', desc: 'Knowledge, application, analysis and evaluation tracked per student — spot the one who can analyse but can’t evaluate.', i1: 'M3 3v18h18', i2: 'M18 17V9', i3: 'M13 17V5' },
    { title: 'Safeguarding queue', desc: 'A recall-biased screen flags concerning messages straight to your DSL — bypassing the class teacher, with an alert on arrival.', i1: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', i2: '', i3: '' },
    { title: 'Assignments & transcripts', desc: 'Set a past paper to a class, then review each attempt with its full Coach conversation alongside — see exactly how they got there.', i1: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', i2: 'M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z', i3: '' },
  ];

  // ── Regulation cards ──
  const trustCards = [
    { title: 'Attempt-first, by construction', tag: 'DfE-aligned', desc: 'The gate is a server-side state machine, not a system prompt. The model cannot be talked out of it — and every gate decision is logged.', i1: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10', i2: 'm9 12 2 2 4-4', i3: '' },
    { title: 'AI disclosure, always on', tag: 'EU AI Act Art. 50', desc: 'A persistent, non-dismissable banner tells students they’re talking to an AI on every screen. Not a setting — a constant.', i1: 'M12 16v-4', i2: 'M12 8h.01', i3: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20' },
    { title: 'Safeguarding routed to your DSL', tag: 'KCSIE', desc: 'Tuned for recall over precision: better ten false alarms than one miss. Flags go to your Designated Safeguarding Lead only — never buried in a teacher’s inbox.', i1: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', i2: '', i3: '' },
    { title: 'Pupil data stored in the UK', tag: 'UK GDPR', desc: 'Pupil records live in a London data centre and are never used to train models. Full DPA and sub-processor list in the info pack.', i1: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20', i2: 'M2 12h20', i3: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10' },
    { title: 'No fake friendliness', tag: 'By design', desc: 'No persona, no flattery, no "great question!". The Coach anchors every comment to exam technique — because sycophancy is a safeguarding issue, not a style choice.', i1: 'M8 15h8', i2: 'M9 9h.01', i3: 'M15 9h.01' },
    { title: 'Everything inspectable', tag: 'Audit-logged', desc: 'Prompts, responses, sources, attempt checks, offloading scores — written server-side where students can’t edit and vendors can’t hide.', i1: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7', i2: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6', i3: '' },
  ];

  // ── Student tools ──
  const studentTools = [
    { title: 'AI Coach', desc: 'Trained on every past paper and mark scheme for the exact spec.', i1: 'M12 8V4H8', i2: 'M4 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z', i3: 'M9 13v2', i4: 'M15 13v2' },
    { title: 'Essay marker', desc: 'Exam-board marking criteria. Teacher-unlocked per class.', i1: 'M12 20h9', i2: 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z', i3: '', i4: '' },
    { title: 'Past paper finder', desc: '2,000+ questions by topic, year and difficulty.', i1: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', i2: 'M14 2v5h6', i3: 'M16 13H8', i4: 'M16 17H8' },
    { title: 'Diagram generator', desc: 'Labelled, spec-accurate diagrams from any prompt.', i1: 'M3 3v18h18', i2: 'M18 17V9', i3: 'M13 17V5', i4: 'M8 17v-3' },
    { title: 'Mock exams', desc: 'Timed papers marked to real grade boundaries.', i1: 'M12 6v6l4 2', i2: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20', i3: '', i4: '' },
    { title: 'My Mistakes', desc: 'Weak spots remembered across sessions and drilled.', i1: 'M9 18h6', i2: 'M10 22h4', i3: 'M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z', i4: '' },
    { title: 'Revision guide', desc: 'Spec-aligned notes written the way examiners reward.', i1: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', i2: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z', i3: '', i4: '' },
    { title: 'Your school’s branding', desc: 'Your logo and colours on every student screen.', i1: 'M14 22v-4a2 2 0 1 0-4 0v4', i2: 'm18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2', i3: 'm4 6 8-4 8 4', i4: 'M6 5v17' },
  ];

  // ── Quotes ──
  const quotes = [
    { pre: 'After using A* AI and reflecting on it with my teachers, we all agreed it was really accurate in terms of marking. The feedback was ', hl: 'more detailed than any standard examiner marking', post: '. My teacher recommended it to my classmates.', name: 'Louis Yung', role: 'Year 12 student', avatarBg: `url(${louisYung})` },
    { pre: '', hl: 'Convinced my econ teacher to buy it', post: ' and use it in our lessons. Showed it to him and he was shocked.', name: 'Alexandru Leoca', role: 'Year 12 student', avatarBg: `url(${alexandruLeoca})` },
  ];

  // ── Pilot steps ──
  const pilotSteps = [
    { num: 'STEP 1', title: 'Book a 20-minute demo', desc: 'See the gate, the dashboard and the governance pack. Bring your DSL and your DPO — we like those questions.' },
    { num: 'STEP 2', title: 'We seat one class', desc: 'Students onboard in a lesson. You set scaffolding, tools and caps for the class before they type a word.' },
    { num: 'STEP 3', title: 'You get the evidence', desc: 'After six weeks: the offloading trend, skills movement and full audit trail — an SLT-ready report on what the AI actually did.' },
  ];

  const openPilot = () => window.open('https://calendly.com/jrrwingfield0/30min', '_blank');
  const goInfoPack = () => navigate('/schools/info-pack');

  return (
    <div className="schools-landing" style={{ minHeight: '100vh', background: '#ffffff', color: '#18181b', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes chipFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pathPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.8; } }
        @keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes riseIn { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dotBlink { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }
        @keyframes drawLine { from { stroke-dashoffset: 600; } to { stroke-dashoffset: 0; } }
        .schools-landing a { color: hsl(263, 70%, 50%); text-decoration: none; }
        .schools-landing a:hover { color: hsl(263, 70%, 42%); }
        .schools-landing .nav-link:hover { color: #18181b !important; }
        .schools-landing .btn-primary-sm:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 16px rgba(79,54,179,0.25) !important; background: hsl(263, 70%, 45%) !important; }
        .schools-landing .btn-primary:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 20px rgba(79,54,179,0.25) !important; background: hsl(263, 70%, 45%) !important; }
        .schools-landing .btn-secondary:hover { background: hsl(263, 70%, 50%) !important; border-color: hsl(263, 70%, 50%) !important; color: #ffffff !important; }
        .schools-landing .roster-row:hover { background: #faf9fd !important; }
        .schools-landing .dash-card:hover { transform: translateY(-4px) !important; box-shadow: 0 16px 32px rgba(24,18,50,0.1) !important; }
        .schools-landing .btn-white:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 24px rgba(0,0,0,0.35) !important; }
        .schools-landing .trust-card:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.16) !important; }
        .schools-landing .student-tool:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 28px rgba(24,18,50,0.08) !important; border-color: hsla(263, 70%, 50%, 0.35) !important; }
      `}</style>

      <SEOHead
        title="A* AI for Schools — The first AI teachers can trust"
        description="See what every student is doing — down to the prompt. Hours, usage, attempts and every logged interaction, in one dashboard."
        canonical="/schools"
      />

      {/* ═══ Header ═══ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, padding: navWrapPad, transition: 'padding 0.35s cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: navPad, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', border: navBorder, borderRadius: navRadius, boxShadow: navShadow, transition: 'padding 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), border-radius 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), border-color 0.35s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img src={logoDark} alt="A* AI logo" style={{ height: logoH, width: 'auto', display: 'block', transition: 'height 0.35s cubic-bezier(0.22, 0.61, 0.36, 1)' }} />
          </div>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{ display: 'flex', gap: '24px', paddingBottom: '1px', borderBottom: '1px solid #e6e4ec' }}>
              <div className="nav-link" onClick={() => navigate('/')} style={{ fontSize: '14px', paddingBottom: '5px', color: '#71717a', cursor: 'pointer' }}>Home</div>
              <div className="nav-link" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', paddingBottom: '5px', color: '#71717a', cursor: 'pointer' }}>Subjects
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
              </div>
              <div className="nav-link" onClick={() => navigate('/')} style={{ fontSize: '14px', paddingBottom: '5px', color: '#71717a', cursor: 'pointer' }}>Merch</div>
              <div onClick={() => navigate('/schools')} style={{ fontSize: '14px', paddingBottom: '5px', marginBottom: '-1.5px', borderBottom: '2px solid #18181b', color: '#18181b', fontWeight: 500, cursor: 'pointer' }}>Schools</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button className="btn-primary-sm" onClick={openPilot} style={{ background: 'hsl(263, 70%, 50%)', color: '#ffffff', border: 'none', borderRadius: '9999px', padding: '10px 24px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.3s' }}>Book a Pilot</button>
          </div>
        </div>
      </header>

      {/* ═══ Hero ═══ */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <svg viewBox="-400 0 2000 500" fill="none" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', left: '50%', top: 0, height: '100%', minWidth: '120vw', transform: 'translateX(-50%)' }}>
            <path d="M-1000 110 C -600 140, 100 170, 500 150 C 900 130, 1400 180, 2200 140" stroke="rgba(79,54,179,0.10)" strokeWidth="0.9" style={{ animation: 'pathPulse 22s ease-in-out infinite' }}></path>
            <path d="M-940 180 C -560 205, 130 225, 540 200 C 940 180, 1440 225, 2260 215" stroke="rgba(79,54,179,0.11)" strokeWidth="1.1" style={{ animation: 'pathPulse 20s ease-in-out infinite' }}></path>
            <path d="M-880 250 C -520 275, 160 285, 580 260 C 980 235, 1480 275, 2320 285" stroke="rgba(79,54,179,0.12)" strokeWidth="1.3" style={{ animation: 'pathPulse 24s ease-in-out infinite' }}></path>
            <path d="M-820 320 C -480 345, 190 345, 620 320 C 1020 295, 1520 330, 2380 355" stroke="rgba(79,54,179,0.11)" strokeWidth="1.5" style={{ animation: 'pathPulse 21s ease-in-out infinite' }}></path>
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '1280px', margin: '0 auto', padding: '36px 32px 28px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ maxWidth: '1040px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px 6px 8px', borderRadius: '9999px', border: '1px solid #e6e4ec', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', boxShadow: '0 0 16px rgba(168,85,247,0.12), 0 0 6px rgba(168,85,247,0.08)' }}>
                  <div style={{ display: 'flex' }}>
                    <img src={kathyKou} alt="Kathy" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: '2px solid #ffffff', position: 'relative', zIndex: 4 }} />
                    <img src={oliverMobolaji} alt="Oliver" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: '2px solid #ffffff', marginLeft: '-7px', position: 'relative', zIndex: 3 }} />
                    <img src={dlyetTewolde} alt="Dlyet" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: '2px solid #ffffff', marginLeft: '-7px', position: 'relative', zIndex: 2 }} />
                    <img src={ryanDavies} alt="Ryan" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: '2px solid #ffffff', marginLeft: '-7px', position: 'relative', zIndex: 1 }} />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#18181b' }}>Built on the coach 10,000 students already use</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px 6px 12px', borderRadius: '9999px', border: '1px solid #e6e4ec', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', boxShadow: '0 0 16px rgba(168,85,247,0.12), 0 0 6px rgba(168,85,247,0.08)' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#71717a' }}>Backed by</span>
                  <img src={sterlingRoad} alt="Sterling Road" style={{ height: '22px', width: 'auto', display: 'block', mixBlendMode: 'multiply' }} />
                </div>
              </div>

              <h1 style={{ fontSize: '46px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 14px 0', color: '#18181b', whiteSpace: 'nowrap' }}>The first AI teachers can <span style={{ color: 'hsl(263, 70%, 50%)' }}>actually trust</span></h1>

              <p style={{ fontSize: '20px', color: '#71717a', maxWidth: '40rem', margin: '0 0 24px 0', lineHeight: 1.55 }}>See what every student is doing — down to the prompt. Hours, usage, attempts and every logged interaction, in one dashboard.</p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <button className="btn-primary" onClick={openPilot} style={{ padding: '14px 32px', borderRadius: '9999px', background: 'hsl(263, 70%, 50%)', color: '#ffffff', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '18px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.3s' }}>Book a Pilot →</button>
                <button className="btn-secondary" onClick={goInfoPack} style={{ padding: '14px 32px', borderRadius: '9999px', background: 'transparent', color: '#18181b', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '18px', border: '1px solid rgba(24,24,27,0.3)', cursor: 'pointer', transition: 'all 0.3s' }}>Get the Info Pack</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Student visibility demo ═══ */}
      <section style={{ padding: '12px 0 80px 0', background: '#ffffff', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px' }}>

          <div style={{ position: 'relative', animation: 'riseIn 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) 0.15s both' }}>
            <div style={{ background: '#ffffff', border: '1px solid #ece9f5', borderRadius: '16px', boxShadow: '0 24px 60px rgba(24,18,50,0.12), 0 4px 16px rgba(24,18,50,0.06)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f0eef7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'hsla(263, 70%, 50%, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(263, 70%, 50%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"></path></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#18181b' }}>Roster · 13B Economics A</div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Meridian Sixth Form · This week</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', background: 'rgba(34,197,94,0.1)', padding: '4px 10px', borderRadius: '9999px' }}>Live</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr' }}>
                {/* Student list */}
                <div style={{ borderRight: '1px solid #f0eef7', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {rosterRows.map((r, i: number) => (
                    <div key={i} className="roster-row" onClick={() => selectStudent(i)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 12px', borderRadius: '10px', background: r.bg, border: `1px solid ${r.border}`, cursor: 'pointer', transition: 'all 0.25s ease' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: r.avBg, color: r.avColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{r.initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#18181b' }}>{r.name}</div>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>{r.meta}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: r.attemptColor }}>{r.attempt}</span>
                        <span style={{ display: 'inline-flex', width: '7px', height: '7px', borderRadius: '50%', background: r.dotColor }}></span>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '10px 12px 6px 12px', fontSize: '11.5px', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
                    Click any student to drill in
                  </div>
                </div>

                {/* Student detail */}
                <div style={{ padding: '22px 26px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#18181b' }}>{detailName}</div>
                      <div style={{ fontSize: '13px', color: '#71717a' }}>{detailMeta}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: detailBadgeColor, background: detailBadgeBg, padding: '5px 12px', borderRadius: '9999px' }}>{detailBadge}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                    {detailStats.map((ds, i: number) => (
                      <div key={i} style={{ padding: '12px 14px', border: '1px solid #f0eef7', borderRadius: '10px', background: '#fbfaff' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#18181b' }}>{ds.value}</div>
                        <div style={{ fontSize: '11.5px', color: '#71717a' }}>{ds.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '22px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: '10px' }}>Exam skills</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {detailSkills.map((sk, i: number) => (
                          <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#3f3f46' }}>{sk.label}</span>
                              <span style={{ fontSize: '12.5px', fontWeight: 700, color: sk.valColor }}>{sk.val}</span>
                            </div>
                            <div style={{ height: '6px', borderRadius: '9999px', background: '#f0eef7', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: sk.pct, borderRadius: '9999px', background: sk.barColor, transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: '10px' }}>Logged activity</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {detailLogs.map((lg, i: number) => (
                          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px', border: '1px solid #f0eef7', borderRadius: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', flexShrink: 0, width: '40px', paddingTop: '2px' }}>{lg.time}</span>
                            <span style={{ fontSize: '12.5px', color: '#3f3f46', lineHeight: 1.45, flex: 1 }}>{lg.text}</span>
                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: lg.tagColor, background: lg.tagBg, padding: '3px 8px', borderRadius: '9999px', flexShrink: 0, whiteSpace: 'nowrap' }}>{lg.tag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {detailInsight && (
                    <div style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '10px', background: 'hsla(263, 70%, 50%, 0.06)', border: '1px solid hsla(263, 70%, 50%, 0.18)' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="hsl(263, 70%, 50%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z"></path></svg>
                      <p style={{ margin: 0, fontSize: '13px', color: '#3f3f46', lineHeight: 1.5 }}><span style={{ fontWeight: 700, color: '#18181b' }}>Teacher insight:</span> {detailInsight}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Demo cursor */}
            {cursorVisible && (
              <div style={{ position: 'absolute', left: cursorX, top: cursorY, zIndex: 20, pointerEvents: 'none', transition: 'left 1.1s cubic-bezier(0.4, 0, 0.2, 1), top 1.1s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <div style={{ position: 'absolute', left: '-8px', top: '-8px', width: '36px', height: '36px', borderRadius: '50%', background: 'hsla(263, 70%, 50%, 0.3)', transform: `scale(${cursorPulse})`, opacity: cursorPulseOpacity, transition: 'transform 0.35s ease, opacity 0.35s ease' }}></div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#18181b" stroke="#ffffff" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))', position: 'relative', display: 'block' }}><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path></svg>
              </div>
            )}

            {showHeroChips && (
              <>
                <div style={{ position: 'absolute', top: '-14px', right: '-14px', zIndex: 15, display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #ece9f5', borderRadius: '9999px', padding: '9px 16px', boxShadow: '0 8px 24px rgba(24,18,50,0.12)', animation: 'chipFloat 5s ease-in-out infinite' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 17h6v-6"></path><path d="m22 17-8.5-8.5-5 5L2 7"></path></svg>
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>AI reliance <span style={{ color: '#16a34a' }}>down 73%</span> in 6 weeks</span>
                </div>
                <div style={{ position: 'absolute', bottom: '-16px', left: '-18px', zIndex: 15, display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #ece9f5', borderRadius: '9999px', padding: '9px 16px', boxShadow: '0 8px 24px rgba(24,18,50,0.12)', animation: 'chipFloat 6s ease-in-out infinite 1.2s' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'hsla(263, 70%, 50%, 0.12)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(263, 70%, 50%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>Safeguarding flag → routed to your DSL</span>
                </div>
              </>
            )}
          </div>

          {/* Governed by design strip */}
          <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a1a1aa', margin: 0 }}>Governed by design</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
              {trustChips.map((tc, i: number) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '9999px', border: '1px solid #ece9f5', background: '#faf9fd', fontSize: '13px', fontWeight: 500, color: '#52525b' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(263, 70%, 50%)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                  {tc.label}
                </span>
              ))}
            </div>
          </div>

          {/* Built-to-teach strip */}
          <div style={{ marginTop: '36px' }}>
            <p style={{ textAlign: 'center', fontSize: '15px', fontWeight: 600, color: '#71717a', margin: '0 0 16px 0' }}>And when they ask it for answers? It teaches instead.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {gateStrip.map((gs, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '16px 18px', borderRadius: '14px', background: '#ffffff', border: '1px solid rgba(228,228,232,0.8)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'hsla(263, 70%, 50%, 0.1)', color: 'hsl(263, 70%, 50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{gs.num}</div>
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#18181b', marginBottom: '2px' }}>{gs.title}</div>
                    <div style={{ fontSize: '12.5px', color: '#71717a', lineHeight: 1.45 }}>{gs.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Teacher control ═══ */}
      <section style={{ padding: '88px 0', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', gap: '64px', alignItems: 'center' }}>
            {/* Copy */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '16px', fontWeight: 500, color: '#71717a', margin: '0 0 8px 0' }}>Tunable per class</p>
              <h2 style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 20px 0' }}>You set the rules.<br />The Coach <span style={{ color: 'hsl(263, 70%, 50%)' }}>follows them.</span></h2>
              <p style={{ fontSize: '18px', color: '#71717a', lineHeight: 1.6, margin: '0 0 28px 0' }}>Not one setting for the whole school — every class gets its own Coach. Your Year 12s who need confidence get fuller hints; your Year 13s get pushed to reason it out alone.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {controlPoints.map((cp, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'hsla(263, 70%, 50%, 0.1)', flexShrink: 0, marginTop: '1px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(263, 70%, 50%)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                    </span>
                    <p style={{ margin: 0, fontSize: '16px', color: '#3f3f46', lineHeight: 1.55 }}><span style={{ fontWeight: 700, color: '#18181b' }}>{cp.title}</span> — {cp.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tunability panel mock */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ background: '#ffffff', border: '1px solid #ece9f5', borderRadius: '16px', boxShadow: '0 20px 50px rgba(24,18,50,0.1)', padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>Coach settings</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#52525b', border: '1px solid #ece9f5', borderRadius: '8px', padding: '6px 12px' }}>13B · Economics A
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#3f3f46', marginBottom: '8px' }}>Scaffolding tightness</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    <div style={{ textAlign: 'center', padding: '8px 0', borderRadius: '8px', border: '1px solid #ece9f5', fontSize: '13px', fontWeight: 500, color: '#71717a' }}>Light</div>
                    <div style={{ textAlign: 'center', padding: '8px 0', borderRadius: '8px', border: '1px solid hsl(263, 70%, 50%)', background: 'hsl(263, 70%, 50%)', fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Standard</div>
                    <div style={{ textAlign: 'center', padding: '8px 0', borderRadius: '8px', border: '1px solid #ece9f5', fontSize: '13px', fontWeight: 500, color: '#71717a' }}>Strict</div>
                  </div>
                </div>

                <div style={{ border: '1px solid #ece9f5', background: '#faf9fd', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#18181b' }}>Writing-aid mode (full model answers)</div>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>Locked (safe default) — only you can unlock it</div>
                      </div>
                    </div>
                    <div style={{ width: '36px', height: '20px', borderRadius: '9999px', background: '#e4e4e7', position: 'relative', flexShrink: 0 }}><span style={{ position: 'absolute', top: '2px', left: '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></span></div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#3f3f46', marginBottom: '8px' }}>Tools students can see</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {toolToggles.map((tt, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #f0eef7', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#3f3f46' }}>{tt.label}</span>
                        <div style={{ width: '30px', height: '17px', borderRadius: '9999px', background: tt.togBg, position: 'relative', flexShrink: 0 }}><span style={{ position: 'absolute', top: '2px', left: tt.knobLeft, width: '13px', height: '13px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}></span></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ border: '1px solid #ece9f5', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '2px' }}>Daily message cap</div>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>20 prompts</div>
                  </div>
                  <div style={{ border: '1px solid #ece9f5', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '2px' }}>Blocked topics</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#3f3f46' }}>coursework, NEA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Transparency / dashboard tour ═══ */}
      <section style={{ padding: '88px 0', background: '#f7f9fb' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '16px', fontWeight: 500, color: '#71717a', margin: '0 0 8px 0' }}>Total transparency</p>
            <h2 style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>See <span style={{ color: 'hsl(263, 70%, 50%)' }}>every interaction</span>. Prove the impact.</h2>
            <p style={{ fontSize: '18px', color: '#71717a', maxWidth: '44rem', margin: '16px auto 0 auto', lineHeight: 1.6 }}>Every prompt, response and source is logged server-side — nothing a student can hide, nothing a teacher can't inspect. And the dashboard turns that log into the report your SLT actually wants: proof that reliance falls as skill rises.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            {dashCards.map((dc, i: number) => (
              <div key={i} className="dash-card" style={{ background: '#ffffff', border: '1px solid rgba(228,228,232,0.8)', borderRadius: '16px', padding: '26px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)', transition: 'all 0.3s' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'hsla(263, 70%, 50%, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(263, 70%, 50%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={dc.i1}></path><path d={dc.i2}></path><path d={dc.i3}></path></svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>{dc.title}</h3>
                <p style={{ fontSize: '14.5px', color: '#71717a', lineHeight: 1.55, margin: 0 }}>{dc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Regulation / trust ═══ */}
      <section style={{ padding: '88px 0', background: '#17141f', color: '#ffffff' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', gap: '64px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, position: 'sticky', top: '120px' }}>
              <p style={{ fontSize: '16px', fontWeight: 500, color: '#a5a0b8', margin: '0 0 8px 0' }}>Built for the rules</p>
              <h2 style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 20px 0', color: '#ffffff' }}>Compliance is the <span style={{ color: 'hsl(263, 80%, 72%)' }}>architecture</span>, not an appendix</h2>
              <p style={{ fontSize: '18px', color: '#a5a0b8', lineHeight: 1.6, margin: '0 0 28px 0' }}>Most AI tools bolt a policy PDF onto a general-purpose chatbot. A* AI was rebuilt for schools from the database up — so the guarantees hold by construction, and you can show your DPO exactly how.</p>
              <button className="btn-white" onClick={goInfoPack} style={{ padding: '13px 28px', borderRadius: '9999px', background: '#ffffff', color: '#17141f', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '16px', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}>Download the governance one-pager</button>
            </div>
            <div style={{ flex: 1.15, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {trustCards.map((tc, i: number) => (
                <div key={i} className="trust-card" style={{ display: 'flex', gap: '16px', padding: '20px 22px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', transition: 'all 0.3s' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'hsla(263, 80%, 72%, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="hsl(263, 80%, 76%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={tc.i1}></path><path d={tc.i2}></path><path d={tc.i3}></path></svg>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#ffffff' }}>{tc.title}</h3>
                      <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'hsl(263, 80%, 76%)', background: 'hsla(263, 80%, 72%, 0.12)', padding: '3px 9px', borderRadius: '9999px' }}>{tc.tag}</span>
                    </div>
                    <p style={{ fontSize: '14.5px', color: '#a5a0b8', lineHeight: 1.55, margin: 0 }}>{tc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Student experience ═══ */}
      <section style={{ padding: '88px 0' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontSize: '16px', fontWeight: 500, color: '#71717a', margin: '0 0 8px 0' }}>The full A* AI coach — inside your guardrails</p>
            <h2 style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>Everything students <span style={{ color: 'hsl(263, 70%, 50%)' }}>already love</span></h2>
            <p style={{ fontSize: '18px', color: '#71717a', maxWidth: '42rem', margin: '16px auto 0 auto', lineHeight: 1.6 }}>The same coach 10,000 students chose for themselves — every tool below can be switched on or off per class, and it all runs under your school's name, logo and colours.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {studentTools.map((st, i: number) => (
              <div key={i} className="student-tool" style={{ border: '1px solid rgba(228,228,232,0.8)', borderRadius: '14px', padding: '22px 20px', transition: 'all 0.3s', background: '#ffffff' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(263, 70%, 50%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}><path d={st.i1}></path><path d={st.i2}></path><path d={st.i3}></path><path d={st.i4}></path></svg>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>{st.title}</h3>
                <p style={{ fontSize: '13.5px', color: '#71717a', lineHeight: 1.5, margin: 0 }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Proof band ═══ */}
      <section style={{ padding: '80px 0', background: '#f7f9fb' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '44px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>Proven with students <span style={{ color: 'hsl(263, 70%, 50%)' }}>before schools</span></h2>
            <p style={{ fontSize: '18px', color: '#71717a', maxWidth: '40rem', margin: '14px auto 0 auto', lineHeight: 1.6 }}>This isn't a pitch deck product. Students chose it — and paid for it — on their own, then brought it to their teachers.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px' }}>
            <div style={{ background: '#ffffff', border: '1px solid rgba(228,228,232,0.8)', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '44px', fontWeight: 800, color: 'hsl(263, 70%, 50%)', letterSpacing: '-0.02em' }}>10,000</div>
              <div style={{ fontSize: '15px', color: '#71717a', marginTop: '4px' }}>A-Level &amp; GCSE students already using A* AI</div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid rgba(228,228,232,0.8)', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '44px', fontWeight: 800, color: 'hsl(263, 70%, 50%)', letterSpacing: '-0.02em' }}>A*</div>
              <div style={{ fontSize: '15px', color: '#71717a', marginTop: '4px' }}>trained by top students at Oxford, Cambridge, LSE, Imperial &amp; UCL</div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid rgba(228,228,232,0.8)', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '44px', fontWeight: 800, color: 'hsl(263, 70%, 50%)', letterSpacing: '-0.02em' }}>23/25</div>
              <div style={{ fontSize: '15px', color: '#71717a', marginTop: '4px' }}>essay marking that matches real teacher marks</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '40px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a1a1aa' }}>Backed by</span>
            <img src={sterlingRoad} alt="Sterling Road" style={{ height: '30px', width: 'auto', display: 'block', mixBlendMode: 'multiply' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {quotes.map((q, i: number) => (
              <div key={i} style={{ background: '#ffffff', border: '1px solid rgba(228,228,232,0.8)', borderRadius: '16px', padding: '26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '16px', color: '#3f3f46', lineHeight: 1.6, margin: 0 }}>"{q.pre}<span style={{ background: 'linear-gradient(transparent 55%, hsla(263, 70%, 50%, 0.18) 55%)', fontWeight: 600, color: '#18181b' }}>{q.hl}</span>{q.post}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundImage: q.avatarBg, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{q.name}</div>
                    <div style={{ fontSize: '13px', color: '#71717a' }}>{q.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Pilot CTA ═══ */}
      <section style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '52px', fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.02em', margin: '0 0 16px 0' }}>Run a pilot with <span style={{ color: 'hsl(263, 70%, 50%)' }}>one class</span> this half term</h2>
          <p style={{ fontSize: '19px', color: '#71717a', maxWidth: '40rem', margin: '0 auto 44px auto', lineHeight: 1.6 }}>Six weeks. One class. At the end you get the offloading report — hard evidence for your SLT that the AI built skill instead of doing the work.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '44px', textAlign: 'left' }}>
            {pilotSteps.map((ps, i: number) => (
              <div key={i} style={{ border: '1px solid rgba(228,228,232,0.8)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(263, 70%, 50%)', letterSpacing: '0.08em', marginBottom: '8px' }}>{ps.num}</div>
                <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>{ps.title}</div>
                <div style={{ fontSize: '14.5px', color: '#71717a', lineHeight: 1.55 }}>{ps.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <button className="btn-primary" onClick={openPilot} style={{ padding: '16px 40px', borderRadius: '9999px', background: 'hsl(263, 70%, 50%)', color: '#ffffff', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '18px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.3s' }}>Book a Pilot →</button>
            <button className="btn-secondary" onClick={goInfoPack} style={{ padding: '16px 40px', borderRadius: '9999px', background: 'transparent', color: '#18181b', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '18px', border: '1px solid rgba(24,24,27,0.3)', cursor: 'pointer', transition: 'all 0.3s' }}>Get the Info Pack</button>
          </div>
          <p style={{ fontSize: '14px', color: '#71717a', margin: '18px 0 0 0' }}>20-minute demo call • DPA &amp; governance pack included • No commitment</p>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer style={{ padding: '64px 32px', textAlign: 'center', borderTop: '1px solid rgba(228,228,232,0.6)' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>
          <p style={{ color: '#71717a', margin: '0 0 24px 0', fontSize: '16px' }}>A* AI (A Star AI) - Your AI-powered A-Level revision coach for Economics, CS, Physics &amp; more | astarai</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginBottom: '24px', color: '#71717a', fontSize: '16px' }}>
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Plans</a><span>•</span>
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>FAQs</a><span>•</span>
            <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign in</a><span>•</span>
            <a href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact</a>
          </div>
          <p style={{ fontSize: '14px', color: '#71717a', margin: '0 0 24px 0' }}>Secure checkout via Stripe • Your chats stay private</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            <p style={{ fontSize: '14px', color: '#71717a', margin: 0 }}>© 2025 A* AI</p>
          </div>
        </div>
      </footer>

    </div>
  );
};
