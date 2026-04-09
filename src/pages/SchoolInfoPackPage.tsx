import React from "react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { Download, ArrowLeft, CheckCircle, Shield, Bot, PenLine, FileText, BookOpen, Brain, BarChart3, Lock, UserCheck, FileCheck, Database } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Bot, title: "AI Tutor", desc: "Trained on every past paper and mark scheme for AQA, Edexcel, OCR, and CIE. Teaches exam technique, not just content." },
  { icon: PenLine, title: "Essay Marker", desc: "Instant feedback using exact marking criteria. Students upload a photo or type their answer — marked in seconds." },
  { icon: FileText, title: "Past Paper Finder", desc: "2,000+ real exam questions searchable by topic, year, and difficulty. Build exam technique from real papers." },
  { icon: BookOpen, title: "Revision Guide", desc: "Spec-aligned notes for every topic, written the way examiners want to see it." },
  { icon: Brain, title: "A* Memory", desc: "Spaced repetition that tracks weak spots across every session and drills them until they stick." },
  { icon: BarChart3, title: "Teacher Dashboard", desc: "Class-level usage analytics, student progress tracking, and licence management — everything you need." },
];

const complianceItems = [
  { icon: Lock, title: "UK GDPR Compliant", desc: "Full Data Processing Agreement provided. ICO registered. Student data never leaves the UK." },
  { icon: UserCheck, title: "KCSIE 2025 Aligned", desc: "Content filtering, safeguarding alerts, and full audit logs for every AI interaction." },
  { icon: FileCheck, title: "DfE AI Standards", desc: "Mapped against all 13 DfE generative AI product safety standards. Full documentation on request." },
  { icon: Database, title: "No Model Training", desc: "Contractually guaranteed. Student interactions are never used to train or improve AI models." },
];

export const SchoolInfoPackPage = () => {
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white">
      <SEOHead
        title="Schools Info Pack | A* AI"
        description="Everything your school needs to know about A*AI — features, pricing, compliance, and implementation."
        canonical="https://astarai.co.uk/schools/info-pack"
      />

      {/* Screen-only nav bar */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link to="/progress" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to Schools
        </Link>
        <Button variant="brand" size="sm" onClick={handlePrint} className="rounded-full">
          <Download className="h-4 w-4 mr-2" /> Save as PDF
        </Button>
      </div>

      <div className="max-w-[800px] mx-auto px-8 py-12 print:px-0 print:py-0">

        {/* Header */}
        <div className="text-center mb-12 print:mb-8">
          <img src="/brand-logo.png" alt="A* AI" className="h-10 mx-auto mb-6 print:h-8" />
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 print:text-3xl">
            A* AI for Schools
          </h1>
          <p className="text-lg text-gray-500 max-w-[520px] mx-auto">
            The A-Level AI tutor built for your exam board, your mark scheme, and your students.
          </p>
        </div>

        {/* The Problem */}
        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold mb-3">The Problem</h2>
          <p className="text-gray-600 leading-relaxed">
            Your students are already using AI — just not the right one. ChatGPT doesn't know your mark scheme.
            It can't tell a student why their 25-marker would drop a level band, or what an Edexcel examiner
            actually wants to see. It gives answers — not the thinking behind them.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            A*AI is different. Every response is grounded in past papers, mark schemes, and examiner reports —
            so students learn to think like examiners, not just get answers from one.
          </p>
        </section>

        {/* Features */}
        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold mb-6">What's Included</h2>
          <div className="grid grid-cols-2 gap-5 print:gap-3">
            {features.map((f) => (
              <div key={f.title} className="border border-gray-200 rounded-xl p-5 print:p-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <f.icon className="h-5 w-5 text-[#4f36b3] flex-shrink-0" />
                  <h3 className="font-bold text-sm">{f.title}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Purchase a licence", desc: "Choose the number of seats your school needs. Volume discounts apply automatically." },
              { step: "2", title: "Invite your students", desc: "Add students by email from your teacher dashboard. They receive a link to join and get instant premium access." },
              { step: "3", title: "Track progress", desc: "Monitor student engagement, streaks, and mastery from the teacher dashboard. GDPR-compliant aggregate data." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-[#4f36b3] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-0.5">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold mb-6">Pricing</h2>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-5 font-semibold text-gray-700">Seats</th>
                  <th className="text-left py-3 px-5 font-semibold text-gray-700">Price per seat</th>
                  <th className="text-left py-3 px-5 font-semibold text-gray-700">Example</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="py-3 px-5 font-semibold">First 10 seats</td>
                  <td className="py-3 px-5 font-semibold">£8.99/month</td>
                  <td className="py-3 px-5 text-gray-500">10 seats = £89.90/mo</td>
                </tr>
                <tr className="border-t border-gray-100 bg-[#f5f3ff]">
                  <td className="py-3 px-5 font-semibold text-[#4f36b3]">Seats 11–30</td>
                  <td className="py-3 px-5 font-semibold">£5.99/month</td>
                  <td className="py-3 px-5 text-gray-500">20 seats = £209.70/mo</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="py-3 px-5 font-semibold">Seats 31+</td>
                  <td className="py-3 px-5 font-semibold">£3.99/month</td>
                  <td className="py-3 px-5 text-gray-500">50 seats = £289.50/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Pricing is graduated — the first 10 seats are always £8.99, then seats 11–30 are £5.99 each, and every seat after 30 is £3.99.
          </p>

          <div className="mt-5 bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="font-bold text-sm mb-1">Enterprise / Whole Sixth Form</h3>
            <p className="text-sm text-gray-500">
              Unlimited seats, SSO integration, dedicated account manager, co-branded impact report,
              and priority feature requests. From <span className="font-semibold text-gray-900">£999/year</span>.
              Contact us for a bespoke quote.
            </p>
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 text-xs text-gray-400">
            {["Cancel anytime", "No setup fees", "All 6 tools included", "Teacher dashboard included"].map((li) => (
              <li key={li} className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-[#4f36b3]" /> {li}
              </li>
            ))}
          </ul>
        </section>

        {/* Compliance */}
        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold mb-6">Compliance & Data Protection</h2>
          <div className="grid grid-cols-2 gap-4 print:gap-3">
            {complianceItems.map((c) => (
              <div key={c.title} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#f0ecfb] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <c.icon className="h-3 w-3 text-[#4f36b3]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-0.5">{c.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Subject Coverage */}
        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-bold mb-4">Subject & Exam Board Coverage</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              "Edexcel Economics",
              "AQA Economics",
              "CIE Economics",
              "OCR Computer Science",
              "OCR Physics",
              "AQA Chemistry",
              "AQA Psychology",
              "Edexcel Mathematics",
            ].map((subj) => (
              <div key={subj} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3.5 w-3.5 text-[#4f36b3] flex-shrink-0" />
                {subj}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            New subjects added termly. Request a subject and we'll prioritise it for your school.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center border-t border-gray-200 pt-10 print:pt-6">
          <h2 className="text-2xl font-bold mb-2">Ready to get started?</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Book a 20-minute demo or purchase seats directly from our website.
          </p>
          <div className="flex gap-3 justify-center print:hidden">
            <a href="https://calendly.com/jrrwingfield0/30min" target="_blank" rel="noopener noreferrer">
              <Button variant="brand" className="rounded-full">Book a demo</Button>
            </a>
            <Link to="/progress">
              <Button variant="outline" className="rounded-full">Purchase seats</Button>
            </Link>
          </div>
          <div className="mt-6 text-xs text-gray-400 space-y-1">
            <p>astarai.co.uk · hello@astarai.co.uk</p>
            <p>A* AI Ltd · Registered in England & Wales</p>
          </div>
        </section>
      </div>
    </div>
  );
};
