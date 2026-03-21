import React from "react";
import schoolsMockup from "@/assets/schools-dashboard-mockup.png";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Bot, PenLine, FileText, BookOpen, Brain, BarChart3, School, GraduationCap, Users, Star, Database, Lock, FileCheck, UserCheck } from "lucide-react";

const trustItems = [
  "GDPR compliant",
  "UK data hosting",
  "Student data never used for training",
  "DfE Product Safety Standards aligned",
  "Cyber Essentials certified",
];

const features = [
  { icon: Bot, title: "AI Tutor", desc: "Answers like an examiner thinks. Trained on every past paper and mark scheme for AQA, Edexcel, OCR, and CIE." },
  { icon: PenLine, title: "Essay Marker", desc: "Instant feedback using exact marking criteria. Students upload a photo or type their essay — marked in seconds." },
  { icon: FileText, title: "Past Paper Finder", desc: "2,000+ questions searchable by topic, year, and difficulty. Students build exam technique from real questions." },
  { icon: BookOpen, title: "Revision Guide", desc: "Spec-aligned notes for every topic, written the way examiners want to see it — not a textbook, an exam weapon." },
  { icon: Brain, title: "A* Memory", desc: "Spaced repetition that remembers weak spots across every session and drills them until they stick." },
  { icon: BarChart3, title: "Teacher Dashboard", desc: "Class-level usage analytics, assignment setting, and progress tracking — everything you need, without the noise." },
];

const stats = [
  { number: "5k+", label: "Students using A*AI" },
  { number: "4.9★", label: "Average student rating" },
  { number: "2,000+", label: "Past paper questions" },
  { number: "4", label: "Exam boards supported" },
];

const complianceItems = [
  { icon: Lock, title: "UK GDPR compliant", desc: "Full Data Processing Agreement provided. ICO registered. Student data never leaves the UK." },
  { icon: UserCheck, title: "KCSIE 2025 aligned", desc: "Content filtering, safeguarding alerts to your DSL, and full audit logs for every AI interaction." },
  { icon: FileCheck, title: "DfE Product Safety Standards", desc: "Mapped against all 13 DfE generative AI standards. Full documentation provided on request." },
  { icon: Database, title: "No model training on student data", desc: "Contractually guaranteed. Student interactions are never used to train or improve AI models." },
];

const comparisonItems = [
  { name: "ChatGPT", desc: "Gives the answer. Doesn't know your exam board, your mark scheme, or what band your student is writing at." },
  { name: "Generic AI tutors", desc: "Broad curriculum coverage. Not built for A-Level exam technique, command words, or level-marked essays." },
  { name: "A*AI", desc: "Trained on your exact board and spec. Teaches exam technique, not just content — so students get better at the game.", highlight: true },
];

export const ProgressPage = () => {
  return (
    <div className="min-h-screen bg-background font-sans">
      <SEOHead
        title="Schools | A* AI – B2B for Schools"
        description="Give every sixth form student an AI tutor that knows their exam board, mark scheme, and exactly what examiners want to see."
        canonical="https://astarai.co.uk/progress"
      />
      <Header
        showNavLinks
        customRightContent={
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="outline" className="rounded-full px-5 font-semibold text-sm" onClick={() => window.open('/login', '_self')}>
              Log into your school account
            </Button>
            <Button variant="brand" className="rounded-full px-5 font-semibold text-sm" onClick={() => window.open('https://calendly.com/jrrwingfield0/30min', '_blank')}>
              Book a demo
            </Button>
          </div>
        }
      />

      {/* HERO */}
      <section className="relative pt-20 pb-0 px-6 sm:px-16">
        <div className="flex flex-col md:flex-row items-start gap-12 md:gap-8">
          {/* Left text */}
          <div className="max-w-[520px] flex-shrink-0 md:w-1/2">
            <Badge variant="secondary" className="mb-7 text-primary font-semibold bg-primary/10 border-0 rounded-full px-4 py-1.5 text-[13px]">
              <School className="w-3.5 h-3.5 mr-1.5" />
              For schools &amp; sixth forms
            </Badge>
            <h1 className="text-4xl sm:text-[50px] font-extrabold leading-[1.1] tracking-tight mb-5">
              The A-Level AI tutor{" "}
              <span className="text-primary">built for your school.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-9 max-w-[560px]">
              Give every sixth form student a tutor that knows their exam board, their mark scheme, and exactly what examiners want to see.
            </p>
            <div className="flex flex-wrap gap-3.5 items-center">
              <a href="https://calendly.com/jrrwingfield0/30min" target="_blank" rel="noopener noreferrer">
                <Button variant="brand" size="xl" className="rounded-full">
                  Book a demo →
                </Button>
              </a>
              <Button variant="outline" size="xl" className="rounded-full">
                Download info pack
              </Button>
            </div>
            <p className="mt-4 text-[13px] text-muted-foreground/60">
              No commitment required · GDPR compliant · UK data hosting
            </p>
          </div>

          {/* Right mockup */}
          <div className="md:w-1/2 flex items-start justify-end md:-mt-12 z-0">
            <img
              src={schoolsMockup}
              alt="A*AI Schools dashboard showing student activity, feature usage and licence overview"
              className="w-full max-w-[420px] xl:max-w-[460px] h-auto"
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-20 -mt-32 py-14 px-6 sm:px-16 bg-secondary border-y border-border">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s) => (
            <Card key={s.label} className="border">
              <CardContent className="p-7">
                <div className="text-3xl sm:text-[34px] font-extrabold text-primary tracking-tight mb-1.5">{s.number}</div>
                <div className="text-[13px] text-muted-foreground leading-snug">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="py-16 sm:py-[72px] px-6 sm:px-16">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
            Your students are already using AI.<br />
            <span className="text-primary">Just not the right one.</span>
          </h2>
          <p className="text-[17px] text-muted-foreground max-w-[540px] leading-relaxed">
            ChatGPT doesn't know your mark scheme. It can't tell a student why their 25-marker would drop a level band, or what an Edexcel examiner actually wants to see. It gives answers — not the thinking behind them.
          </p>
          <p className="text-[17px] text-muted-foreground max-w-[540px] leading-relaxed mt-4">
            A*AI is built differently. Every response is grounded in past papers, mark schemes, and examiner reports — so students learn to think like examiners, not just get answers from one.
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-2xl">
          {comparisonItems.map((item) => (
            <Card key={item.name} className={`${item.highlight ? "border-primary border-2 shadow-elevated" : ""}`}>
              <CardContent className="p-5 flex gap-4 items-start">
                <span className={`text-sm font-bold whitespace-nowrap ${item.highlight ? "text-primary" : "text-muted-foreground"}`}>
                  {item.name}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 sm:py-[72px] px-6 sm:px-16">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
            Everything your sixth form needs.{" "}
            <span className="text-primary">In one platform.</span>
          </h2>
          <p className="text-[17px] text-muted-foreground max-w-[500px]">
            Not a generic AI. An AI trained on past papers, mark schemes, and examiner reports — for your exact exam board.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card key={f.title} className="bg-secondary border-0">
              <CardContent className="p-7">
                <f.icon className="w-6 h-6 text-primary mb-3.5" />
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="bg-secondary border-y border-border px-6 sm:px-16 py-4 flex flex-wrap items-center gap-5 sm:gap-8">
        {trustItems.map((item) => (
          <div key={item} className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground whitespace-nowrap">
            <span className="w-[7px] h-[7px] rounded-full bg-primary flex-shrink-0" />
            {item}
          </div>
        ))}
      </div>

      {/* COMPLIANCE */}
      <section className="py-16 sm:py-[72px] px-6 sm:px-16 border-b border-border">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
            Built for schools.{" "}
            <span className="text-primary">Compliant by design.</span>
          </h2>
          <p className="text-[17px] text-muted-foreground max-w-[500px]">
            We handle the compliance so your IT Director, DSL, and Bursar can say yes with confidence.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[740px]">
          {complianceItems.map((c) => (
            <div key={c.title} className="flex items-start gap-3.5 bg-secondary rounded-xl p-5 border border-border">
              <div className="w-[22px] h-[22px] rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-3 h-3 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold mb-1">{c.title}</h4>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="py-16 sm:py-[72px] px-6 sm:px-16 bg-secondary border-b border-border">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
            Simple, transparent pricing.
          </h2>
          <p className="text-[17px] text-muted-foreground max-w-[500px]">
            Annual licence aligned to the academic year. No hidden fees.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[780px]">
          {/* Founding Partner */}
          <Card className="border-2 border-primary">
            <CardContent className="p-8">
              <Badge className="mb-4 rounded-full text-[11px] uppercase tracking-wide font-bold">Founding Partner</Badge>
              <h3 className="text-xl font-extrabold mb-2">Independent School</h3>
              <p className="text-sm text-muted-foreground mb-1 leading-snug">Whole sixth form access. For schools joining in our founding cohort.</p>
              <div className="text-4xl font-extrabold text-primary tracking-tight my-5">
                £999 <span className="text-base font-medium text-muted-foreground">/ year</span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {["Unlimited student accounts", "All 6 tools included", "Teacher dashboard + analytics", "Dedicated account manager", "Co-branded impact report", "Priority feature requests"].map((li) => (
                  <li key={li} className="flex items-center gap-2.5 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {li}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Standard */}
          <Card>
            <CardContent className="p-8">
              <h3 className="text-xl font-extrabold mb-2 mt-8">Independent School</h3>
              <p className="text-sm text-muted-foreground mb-1 leading-snug">Standard annual licence from September 2026 onwards.</p>
              <div className="text-4xl font-extrabold text-primary tracking-tight my-5">
                £2,500 <span className="text-base font-medium text-muted-foreground">/ year</span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {["Unlimited student accounts", "All 6 tools included", "Teacher dashboard + analytics", "SSO (Google / Microsoft)", "DPA + compliance pack", "Termly billing available"].map((li) => (
                  <li key={li} className="flex items-center gap-2.5 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {li}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-[88px] px-6 sm:px-16 text-center">
        <h2 className="text-3xl sm:text-[40px] font-extrabold tracking-tight mb-3.5 leading-tight">
          Ready to bring A*AI<br />
          <span className="text-primary">to your sixth form?</span>
        </h2>
        <p className="text-lg text-muted-foreground mb-9">
          Book a 20-minute demo. We'll show you exactly how it works for your exam boards and subjects.
        </p>
        <div className="flex flex-wrap gap-3.5 justify-center">
          <a href="https://calendly.com/jrrwingfield0/30min" target="_blank" rel="noopener noreferrer">
            <Button variant="brand" size="xl" className="rounded-full">
              Book a demo →
            </Button>
          </a>
          <Button variant="outline" size="xl" className="rounded-full">
            Email us instead
          </Button>
        </div>
        <p className="mt-5 text-[13px] text-muted-foreground/50">
          Usually responds within 24 hours · No sales pressure
        </p>
      </section>
    </div>
  );
};
