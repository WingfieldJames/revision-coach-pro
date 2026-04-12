import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

// All mock paper definitions
function q(num: string, text: string, marks: number, type: string, section: string, extra?: any) {
  return { question_number: num, question_text: text, marks_available: marks, question_type: type, section, ...extra };
}

const ALL_PAPERS = [
  {
    exam_board: "Edexcel", subject: "Economics", paper_number: 1, year: 2023, total_marks: 100, time_limit_minutes: 120,
    paper_name: "Edexcel Economics A Paper 1: Markets and Business Behaviour (June 2023)",
    product_slug: "edexcel-economics",
    sections: [
      { id: "A", name: "Section A: Data Response — Housing Market", questions: ["1a","1b","1c","1d","1e"] },
      { id: "B", name: "Section B: Data Response — Energy Market", questions: ["2a","2b","2c","2d","2e"] },
      { id: "C", name: "Section C: Essay (choose one)", questions: ["3","4"] },
    ],
    questions: [
      q("1a","With reference to Extract A, identify two significant features of the data shown.",5,"5-marker","A",{extract_text:"Extract A shows UK house prices rose from £230,000 (2018) to £290,000 (2023), a 26% increase. New housing completions fell from 195,000 to 170,000/year. House price to earnings ratio reached 8.3."}),
      q("1b","With reference to the information provided, explain how price elasticity of supply is relevant to the UK housing market.",8,"8-marker","A"),
      q("1c","With reference to Extract B and your own knowledge, assess the view that government subsidies for first-time buyers are the most effective policy to improve housing affordability.",10,"10-marker","A",{extract_text:"Extract B: Help to Buy supported 350,000+ purchases by 2023. Critics argue it inflated prices. The OBR estimated it increased prices by 0.8% overall, up to 5% in some areas."}),
      q("1d","With reference to the extracts, evaluate government intervention in the UK housing market. Consider demand-side and supply-side policies.",12,"12-marker","A"),
      q("1e","Evaluate the view that the UK housing market is a clear example of market failure justifying significant government intervention.",15,"15-marker","A"),
      q("2a","With reference to Extract C, identify two significant features of the data shown.",5,"5-marker","B",{extract_text:"Extract C: UK renewable electricity rose from 33% to 42% (2018–2023). Gas fell from 40% to 33%. Wholesale prices tripled from £50/MWh (2020) to £150/MWh (2022), falling to £90/MWh (2023)."}),
      q("2b","Explain how negative externalities arise in the energy market and why they may lead to market failure.",8,"8-marker","B"),
      q("2c","With reference to Extract D, assess the effectiveness of carbon taxes in correcting market failure in the energy market.",10,"10-marker","B",{extract_text:"Extract D: UK ETS carbon prices rose from £50 to £80/tonne (2021–2023). It accelerated the coal-to-gas shift but had limited impact on renewables. Industry argues high prices damage competitiveness."}),
      q("2d","Evaluate the impact of subsidies for renewable energy on economic efficiency and resource allocation.",12,"12-marker","B"),
      q("2e","Evaluate the view that regulation is more effective than market-based policies in achieving environmental objectives.",15,"15-marker","B"),
      q("3","Evaluate the view that monopoly power is always detrimental to consumer welfare. Use at least one diagram.",25,"25-marker","C",{diagram_required:true}),
      q("4","Evaluate the extent to which contestable markets deliver better outcomes than oligopolistic markets. Use at least one diagram.",25,"25-marker","C",{diagram_required:true}),
    ],
  },
  {
    exam_board: "Edexcel", subject: "Economics", paper_number: 2, year: 2023, total_marks: 100, time_limit_minutes: 120,
    paper_name: "Edexcel Economics A Paper 2: The National and Global Economy (June 2023)",
    product_slug: "edexcel-economics",
    sections: [
      { id: "A", name: "Section A: Data Response — UK Inflation", questions: ["1a","1b","1c","1d","1e"] },
      { id: "B", name: "Section B: Data Response — UK Trade", questions: ["2a","2b","2c","2d","2e"] },
      { id: "C", name: "Section C: Essay (choose one)", questions: ["3","4"] },
    ],
    questions: [
      q("1a","With reference to Extract A, identify two significant features of the data shown.",5,"5-marker","A",{extract_text:"UK CPI inflation rose from 0.7% (Jan 2021) to 11.1% (Oct 2022), falling to 6.7% (Sep 2023). BoE base rate increased 14 times to 5.25%. Real wages fell 3.1%."}),
      q("1b","Explain how cost-push factors contributed to the inflationary pressures experienced by the UK.",8,"8-marker","A"),
      q("1c","With reference to Extract B, assess the effectiveness of monetary policy in controlling UK inflation.",10,"10-marker","A",{extract_text:"MPC raised rates from 0.1% to 5.25%. Mortgage approvals fell 28%. Inflation stayed above 2% target throughout 2023. Some argue monetary policy is less effective against supply-side inflation."}),
      q("1d","Evaluate the trade-offs the Bank of England faces when setting interest rates during stagflation.",12,"12-marker","A"),
      q("1e","Evaluate the view that fiscal policy would be more effective than monetary policy in the current UK environment.",15,"15-marker","A"),
      q("2a","With reference to Extract C, identify two significant features of the data shown.",5,"5-marker","B",{extract_text:"UK goods trade deficit widened from £139bn to £186bn (2018–2023). Services surplus grew £108bn to £132bn. Current account deficit: £83bn (3.1% of GDP). EU exports fell 7%, non-EU grew 4%."}),
      q("2b","Explain how a depreciating exchange rate might affect the UK's balance of trade.",8,"8-marker","B"),
      q("2c","With reference to Extract D, assess the impact of increased trade barriers on the UK since 2021.",10,"10-marker","B",{extract_text:"Since leaving the EU single market, UK firms face customs checks and regulatory divergence. Barriers reduced UK-EU trade by ~15%. New deals with Australia/NZ signed. 24% of SMEs stopped EU exports."}),
      q("2d","Evaluate whether the UK's comparative advantage has changed as a result of new trading relationships.",12,"12-marker","B"),
      q("2e","Evaluate the view that free trade always leads to net economic benefits for all participating countries.",15,"15-marker","B"),
      q("3","Evaluate the effectiveness of supply-side policies in promoting long-run economic growth. Use at least one diagram.",25,"25-marker","C",{diagram_required:true}),
      q("4","Evaluate the view that a floating exchange rate is always preferable to a fixed exchange rate. Use at least one diagram.",25,"25-marker","C",{diagram_required:true}),
    ],
  },
  {
    exam_board: "Edexcel", subject: "Economics", paper_number: 1, year: 2022, total_marks: 100, time_limit_minutes: 120,
    paper_name: "Edexcel Economics A Paper 1: Markets and Business Behaviour (June 2022)",
    product_slug: "edexcel-economics",
    sections: [
      { id: "A", name: "Section A: Data Response — UK Supermarkets", questions: ["1a","1b","1c","1d","1e"] },
      { id: "B", name: "Section B: Data Response — UK Labour Market", questions: ["2a","2b","2c","2d","2e"] },
      { id: "C", name: "Section C: Essay (choose one)", questions: ["3","4"] },
    ],
    questions: [
      q("1a","With reference to Extract A, identify two significant features of the data shown.",5,"5-marker","A",{extract_text:"UK supermarket shares (2019–2022): Tesco fell 27.4%→26.9%, Aldi rose 7.9%→9.3%, Lidl 5.9%→7.1%. Grocery market grew £203bn→£228bn. Food prices rose 16.4%."}),
      q("1b","Explain how the characteristics of an oligopoly are demonstrated in the UK supermarket industry.",8,"8-marker","A"),
      q("1c","Assess the extent to which discount supermarkets have increased contestability in the UK grocery market.",10,"10-marker","A",{extract_text:"Aldi/Lidl opened 400+ UK stores since 2015 (£3.5bn invested). Combined share doubled 8%→16.4%. Aldi baskets ~20% cheaper. But new supermarkets cost £30m-£50m."}),
      q("1d","Evaluate the impact of non-price competition on consumer welfare in the UK supermarket industry.",12,"12-marker","A"),
      q("1e","Evaluate the view that the CMA is effective in promoting competition in oligopolistic markets.",15,"15-marker","A"),
      q("2a","With reference to Extract C, identify two significant features of the data shown.",5,"5-marker","B",{extract_text:"UK labour market (2019–2022): unemployment fell 3.8%→3.5%. Vacancies hit record 1.3m (March 2022). Nominal earnings +6.0%, real -2.5%. Inactivity rose 20.4%→21.6%."}),
      q("2b","Explain how derived demand and wage determination are relevant to the UK labour market.",8,"8-marker","B"),
      q("2c","Assess the impact of the National Living Wage on employment and income inequality.",10,"10-marker","B",{extract_text:"NLW rose £8.91→£9.50 (April 2022). Raised wages for 2m workers. LSE found no significant negative employment impact. 38% of small firms found increase 'very difficult'."}),
      q("2d","Evaluate the effectiveness of education and training policies in addressing labour market failures.",12,"12-marker","B"),
      q("2e","Evaluate the view that trade unions improve economic outcomes without causing significant distortions.",15,"15-marker","B"),
      q("3","Evaluate the view that third-degree price discrimination always benefits producers more than consumers. Use a diagram.",25,"25-marker","C",{diagram_required:true}),
      q("4","Evaluate the view that perfect competition leads to the most efficient resource allocation. Use a diagram.",25,"25-marker","C",{diagram_required:true}),
    ],
  },
  {
    exam_board: "Edexcel", subject: "Economics", paper_number: 2, year: 2022, total_marks: 100, time_limit_minutes: 120,
    paper_name: "Edexcel Economics A Paper 2: The National and Global Economy (June 2022)",
    product_slug: "edexcel-economics",
    sections: [
      { id: "A", name: "Section A: Data Response — UK Government Spending", questions: ["1a","1b","1c","1d","1e"] },
      { id: "B", name: "Section B: Data Response — Emerging Economies", questions: ["2a","2b","2c","2d","2e"] },
      { id: "C", name: "Section C: Essay (choose one)", questions: ["3","4"] },
    ],
    questions: [
      q("1a","With reference to Extract A, identify two significant features of the data shown.",5,"5-marker","A",{extract_text:"UK spending rose £842bn (39% GDP) to £1,047bn (44% GDP) 2018–2022. National debt £1.8tn (84% GDP)→£2.5tn (100% GDP). Debt interest reached £111bn in 2022/23."}),
      q("1b","Explain the difference between a budget deficit and national debt, and why both matter for stability.",8,"8-marker","A"),
      q("1c","Assess the view that austerity measures are necessary to reduce national debt.",10,"10-marker","A",{extract_text:"UK spent £370bn on COVID support. IMF recommended fiscal consolidation. OECD noted premature austerity after 2008 slowed recovery. UK debt 100% of GDP vs Japan 263%, US 123%."}),
      q("1d","Evaluate automatic stabilisers versus discretionary fiscal policy in managing the economic cycle.",12,"12-marker","A"),
      q("1e","Evaluate the view that governments should prioritise deficit reduction over economic growth.",15,"15-marker","A"),
      q("2a","With reference to Extract C, identify two significant features of the data shown.",5,"5-marker","B",{extract_text:"India GDP growth 6.8% vs China 3.0%, Brazil 2.9% (2022). India GDP/capita $8,379 vs China $21,476. FDI into India $84bn. India services 53% of GDP, manufacturing 17% vs China 28%."}),
      q("2b","Explain how foreign direct investment can promote economic development in emerging economies.",8,"8-marker","B"),
      q("2c","Assess the extent to which globalisation has benefited developing and emerging economies.",10,"10-marker","B",{extract_text:"Global trade peaked 61% of GDP (2008), now 57%. MNCs handle ~80% of world trade. Benefits unevenly distributed. Countries with strong institutions attracted more FDI."}),
      q("2d","Evaluate the role of the WTO in promoting economic development.",12,"12-marker","B"),
      q("2e","Evaluate the view that protectionist policies can be justified for developing economies.",15,"15-marker","B"),
      q("3","Evaluate the view that demand-side policies alone can achieve sustained growth and full employment. Use a diagram.",25,"25-marker","C",{diagram_required:true}),
      q("4","Evaluate the extent to which income and wealth inequality is inevitable in a market economy. Use a diagram.",25,"25-marker","C",{diagram_required:true}),
    ],
  },
  {
    exam_board: "AQA", subject: "Economics", paper_number: 1, year: 2023, total_marks: 80, time_limit_minutes: 120,
    paper_name: "AQA Economics Paper 1: Markets and Market Failure (June 2023)",
    product_slug: "aqa-economics",
    sections: [
      { id: "A", name: "Section A: Data Response", questions: ["1a","1b","1c","1d"] },
      { id: "B", name: "Section B: Essay (choose one)", questions: ["2","3"] },
    ],
    questions: [
      q("1a","Using Extract A, calculate the percentage change in UK renewable energy output (2018–2023) and explain its significance.",4,"4-marker","A",{extract_text:"UK renewable output rose 110→155 TWh (2018–2023). Total consumption 300 TWh. Government subsidies £12bn in 2023."}),
      q("1b","Explain, using a diagram, how a subsidy on renewable energy affects the electricity market.",9,"9-marker","A",{diagram_required:true}),
      q("1c","Evaluate the effectiveness of government subsidies in correcting market failure from carbon emissions.",15,"15-marker","A"),
      q("1d","Evaluate whether a carbon tax would be more effective than subsidies in reducing carbon emissions.",25,"25-marker","A"),
      q("2","Evaluate the view that indirect taxes are the most effective way to correct negative externalities.",25,"25-marker","B"),
      q("3","Evaluate the view that contestable markets always lead to better consumer outcomes than monopoly.",25,"25-marker","B"),
    ],
  },
  {
    exam_board: "AQA", subject: "Economics", paper_number: 2, year: 2023, total_marks: 80, time_limit_minutes: 120,
    paper_name: "AQA Economics Paper 2: The National Economy in a Global Context (June 2023)",
    product_slug: "aqa-economics",
    sections: [
      { id: "A", name: "Section A: Data Response", questions: ["1a","1b","1c","1d"] },
      { id: "B", name: "Section B: Essay (choose one)", questions: ["2","3"] },
    ],
    questions: [
      q("1a","Using Extract A, calculate the UK current account balance as a % of GDP in 2023.",4,"4-marker","A",{extract_text:"UK GDP £2,274bn in 2023. Current account deficit £68bn. Goods exports £354bn, imports £508bn. Services exports £397bn, imports £242bn."}),
      q("1b","Using an AD/AS diagram, explain the likely impact of a significant fall in sterling on the UK economy.",9,"9-marker","A",{diagram_required:true}),
      q("1c","Assess the significance of the UK current account deficit for long-term macroeconomic performance.",15,"15-marker","A"),
      q("1d","Evaluate whether supply-side policies are more effective than demand-side in reducing a current account deficit.",25,"25-marker","A"),
      q("2","Evaluate the effectiveness of quantitative easing as a monetary policy tool.",25,"25-marker","B"),
      q("3","Evaluate the view that globalisation inevitably increases income inequality in developed economies.",25,"25-marker","B"),
    ],
  },
  {
    exam_board: "OCR", subject: "Computer Science", paper_number: 1, year: 2023, total_marks: 140, time_limit_minutes: 150,
    paper_name: "OCR Computer Science Paper 1: Computer Systems (June 2023)",
    product_slug: "ocr-computer-science",
    sections: [
      { id: "A", name: "Section A: Short Answer", questions: ["1","2","3","4","5"] },
      { id: "B", name: "Section B: Extended Response", questions: ["6","7","8"] },
    ],
    questions: [
      q("1","Describe the role of the ALU, CU, and registers within the CPU. Explain the fetch-decode-execute cycle.",8,"8-marker","A"),
      q("2","Explain differences between RAM and ROM. Describe how virtual memory is used when RAM is insufficient.",8,"8-marker","A"),
      q("3","Convert the denary number 217 into binary and hexadecimal. Show your working.",6,"6-marker","A"),
      q("4","Describe the purpose of an operating system. Explain how it manages memory, processes, and I/O devices.",10,"10-marker","A"),
      q("5","Explain the differences between TCP/IP and UDP protocols with examples of appropriate use.",8,"8-marker","A"),
      q("6","A school wants a new network. Discuss client-server vs peer-to-peer considering security, cost, and management.",20,"20-marker","B"),
      q("7","Evaluate the ethical, legal, and environmental impacts of AI in healthcare. Consider data protection and algorithmic bias.",20,"20-marker","B"),
      q("8","Discuss database normalisation importance and consequences of data redundancy. Include SQL examples.",20,"20-marker","B"),
    ],
  },
  {
    exam_board: "OCR", subject: "Physics", paper_number: 1, year: 2023, total_marks: 100, time_limit_minutes: 135,
    paper_name: "OCR Physics A Paper 1: Modelling Physics (June 2023)",
    product_slug: "ocr-physics",
    sections: [
      { id: "A", name: "Section A: Short Answer", questions: ["1","2","3","4","5","6"] },
      { id: "B", name: "Section B: Extended Response", questions: ["7","8"] },
    ],
    questions: [
      q("1","A car accelerates from rest to 30 m/s in 12s. Calculate: (a) acceleration, (b) distance, (c) resultant force (mass 1200 kg).",8,"8-marker","A"),
      q("2","Describe an experiment to determine the Young modulus of a metal wire. Include diagram, measurements, and calculation method.",10,"10-marker","A"),
      q("3","Explain elastic vs inelastic collisions. A 2 kg ball at 5 m/s hits a stationary 3 kg ball — calculate velocities after perfectly elastic collision.",10,"10-marker","A"),
      q("4","Explain conservation of energy. A 0.5 kg ball drops from 20 m — calculate velocity before hitting the ground.",8,"8-marker","A"),
      q("5","Define specific heat capacity and latent heat. Calculate total energy to heat 2 kg ice at -10°C to steam at 100°C.",12,"12-marker","A"),
      q("6","Explain simple harmonic motion. Derive the period-length relationship for a simple pendulum.",10,"10-marker","A"),
      q("7","Discuss evidence for and against the wave nature of light. Reference Young's double-slit, photoelectric effect, and wave-particle duality.",20,"20-marker","B"),
      q("8","A 500 MW power station transmits at 400 kV through 10 Ω cables. Calculate power loss. Explain high-voltage transmission and evaluate AC vs DC.",22,"22-marker","B"),
    ],
  },
  {
    exam_board: "AQA", subject: "Chemistry", paper_number: 1, year: 2023, total_marks: 105, time_limit_minutes: 120,
    paper_name: "AQA Chemistry Paper 1: Inorganic and Physical Chemistry (June 2023)",
    product_slug: "aqa-chemistry",
    sections: [
      { id: "A", name: "Section A: Short Answer", questions: ["1","2","3","4","5"] },
      { id: "B", name: "Section B: Extended Response", questions: ["6","7"] },
    ],
    questions: [
      q("1","Define enthalpy of formation. Using Hess's Law, calculate the enthalpy of combustion of propan-1-ol. Show working.",10,"10-marker","A"),
      q("2","Describe and explain the trend in first ionisation energies across Period 3 (Na to Ar). Account for anomalies.",8,"8-marker","A"),
      q("3","Explain dynamic equilibrium. For N₂ + 3H₂ ⇌ 2NH₃ (ΔH = -92 kJ/mol), predict effects of: (a) increasing temperature, (b) increasing pressure, (c) adding catalyst.",12,"12-marker","A"),
      q("4","Describe bonding and structure of NaCl, diamond, and ice. Explain how structure affects melting point.",10,"10-marker","A"),
      q("5","Explain rate of reaction and activation energy. Use Maxwell-Boltzmann to explain temperature's effect on rate.",10,"10-marker","A"),
      q("6","Describe halogen chemistry: physical properties, reactivity trend, displacement reactions, halide ion reactions with conc. H₂SO₄. Write equations.",25,"25-marker","B"),
      q("7","Discuss equilibrium factors in the Haber and Contact processes. Evaluate compromises between yield, rate, and cost.",25,"25-marker","B"),
    ],
  },
  {
    exam_board: "AQA", subject: "Psychology", paper_number: 1, year: 2023, total_marks: 96, time_limit_minutes: 120,
    paper_name: "AQA Psychology Paper 1: Introductory Topics in Psychology (June 2023)",
    product_slug: "aqa-psychology",
    sections: [
      { id: "A", name: "Section A: Social Influence", questions: ["1","2","3"] },
      { id: "B", name: "Section B: Memory", questions: ["4","5","6"] },
      { id: "C", name: "Section C: Attachment", questions: ["7","8","9"] },
      { id: "D", name: "Section D: Psychopathology", questions: ["10","11","12"] },
    ],
    questions: [
      q("1","Outline what is meant by conformity. Distinguish between compliance, identification, and internalisation.",6,"6-marker","A"),
      q("2","Describe Milgram's (1963) procedure and findings. Discuss two ethical issues raised.",8,"8-marker","A"),
      q("3","Discuss the role of social influence processes in social change. Refer to evidence.",16,"16-marker","A"),
      q("4","Outline the multi-store model of memory. Explain how it differs from the working memory model.",6,"6-marker","B"),
      q("5","Explain misleading information in eyewitness testimony. Refer to Loftus and Palmer (1974).",6,"6-marker","B"),
      q("6","Evaluate the cognitive interview as a method of improving eyewitness testimony accuracy.",16,"16-marker","B"),
      q("7","Outline Ainsworth's Strange Situation and describe the three attachment types identified.",6,"6-marker","C"),
      q("8","Explain Bowlby's maternal deprivation theory. Outline one criticism.",6,"6-marker","C"),
      q("9","Discuss the influence of early attachment on later relationships. Refer to evidence.",16,"16-marker","C"),
      q("10","Outline the behavioural, emotional, and cognitive characteristics of phobias.",4,"4-marker","D"),
      q("11","Explain how systematic desensitisation treats phobias. Give one strength and one limitation.",6,"6-marker","D"),
      q("12","Discuss the cognitive approach to explaining depression. Evaluate CBT effectiveness.",16,"16-marker","D"),
    ],
  },
  {
    exam_board: "Edexcel", subject: "Mathematics", paper_number: 1, year: 2023, total_marks: 100, time_limit_minutes: 120,
    paper_name: "Edexcel Mathematics Paper 1: Pure Mathematics (June 2023)",
    product_slug: "edexcel-mathematics",
    sections: [{ id: "A", name: "Full Paper", questions: ["1","2","3","4","5","6","7","8","9","10"] }],
    questions: [
      q("1","Simplify fully: (3x² - 12) / (x² - 5x + 6)",3,"3-marker","A"),
      q("2","Find the equation of the tangent to y = x³ - 4x + 1 at x = 2.",5,"5-marker","A"),
      q("3","Solve 2sin²θ - sinθ - 1 = 0 for 0° ≤ θ ≤ 360°.",6,"6-marker","A"),
      q("4","Geometric series: a = 8, r = 0.6. (a) Sum to infinity. (b) Smallest n where S_n > 19.",8,"8-marker","A"),
      q("5","y = 2x³ - 9x² + 12x - 4. (a) Find dy/dx. (b) Stationary points. (c) Their nature.",10,"10-marker","A"),
      q("6","Prove by contradiction that √2 is irrational.",6,"6-marker","A"),
      q("7","Velocity v = 3t² - 12t + 9. (a) Times when particle is at rest. (b) Total distance t=0 to t=4.",10,"10-marker","A"),
      q("8","Use integration by parts to find ∫ x·e²ˣ dx.",6,"6-marker","A"),
      q("9","f(x) = ln(3x - 2), x > 2/3. (a) Find f⁻¹(x). (b) Domain and range of f⁻¹. (c) Sketch both.",10,"10-marker","A"),
      q("10","Use substitution u = 1 + √x to evaluate ∫₁⁴ 1/(1+√x) dx. Answer as a + b·ln(c).",12,"12-marker","A"),
    ],
  },
];

export const AdminSeedPage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const runSeed = async () => {
    setStatus("running");
    setLog([]);

    try {
      // Test table access
      addLog("Checking mock_papers table...");
      const { error: tableCheck } = await (supabase as any).from("mock_papers").select("id").limit(1);
      if (tableCheck) {
        addLog(`ERROR: Table doesn't exist yet. Run the CREATE TABLE SQL in Supabase SQL Editor first.`);
        addLog(`Table error: ${tableCheck.message}`);
        setStatus("error");
        return;
      }
      addLog("Table exists.");

      let inserted = 0;
      let skipped = 0;

      for (const paper of ALL_PAPERS) {
        // Check if exists
        const { data: existing } = await (supabase as any)
          .from("mock_papers")
          .select("id")
          .eq("exam_board", paper.exam_board)
          .eq("subject", paper.subject)
          .eq("paper_number", paper.paper_number)
          .eq("year", paper.year)
          .maybeSingle();

        if (existing) {
          addLog(`SKIP: ${paper.paper_name} (exists)`);
          skipped++;
          continue;
        }

        // Look up product
        const { data: product } = await (supabase as any)
          .from("products")
          .select("id")
          .eq("slug", paper.product_slug)
          .maybeSingle();

        const { error } = await (supabase as any).from("mock_papers").insert({
          exam_board: paper.exam_board,
          subject: paper.subject,
          paper_number: paper.paper_number,
          paper_name: paper.paper_name,
          year: paper.year,
          total_marks: paper.total_marks,
          time_limit_minutes: paper.time_limit_minutes,
          content_source: "representative",
          sections: paper.sections,
          questions: paper.questions,
          product_id: product?.id || null,
          active: true,
        });

        if (error) {
          addLog(`FAIL: ${paper.paper_name} — ${error.message}`);
        } else {
          addLog(`OK: ${paper.paper_name}`);
          inserted++;
        }
      }

      addLog(`\nDone: ${inserted} inserted, ${skipped} skipped`);
      setStatus("done");
    } catch (err: any) {
      addLog(`FATAL: ${err.message}`);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-6">
          <h1 className="text-xl font-bold mb-4">Seed Mock Papers</h1>
          <p className="text-sm text-muted-foreground mb-4">
            This inserts {ALL_PAPERS.length} mock papers across all subjects. Safe to run multiple times — duplicates are skipped.
          </p>

          {status === "idle" && (
            <Button variant="brand" onClick={runSeed}>
              Seed All Papers
            </Button>
          )}

          {status === "running" && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Seeding...
            </div>
          )}

          {status === "done" && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" /> Complete! Mock Exams should now work.
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="h-4 w-4" /> See log below for errors.
            </div>
          )}

          {log.length > 0 && (
            <pre className="mt-4 bg-muted rounded-lg p-3 text-xs max-h-80 overflow-y-auto whitespace-pre-wrap">
              {log.join("\n")}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
