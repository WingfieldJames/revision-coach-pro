import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Paper definitions for ALL subjects ──────────────────────────────────────

interface PaperDef {
  exam_board: string;
  subject: string;
  paper_number: number;
  paper_name: string;
  year: number;
  total_marks: number;
  time_limit_minutes: number;
  product_slug: string;
  sections: any[];
  questions: any[];
}

function q(num: string, text: string, marks: number, type: string, section: string, extra?: { extract_text?: string; diagram_required?: boolean }) {
  return { question_number: num, question_text: text, marks_available: marks, question_type: type, section, ...extra };
}

const ALL_PAPERS: PaperDef[] = [

  // ═══ EDEXCEL ECONOMICS ═══════════════════════════════════════════════════

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
      q("1a", "With reference to Extract A, identify two significant features of the data shown.", 5, "5-marker", "A", { extract_text: "Extract A shows data on UK house prices and housing supply from 2018 to 2023. Average house prices rose from £230,000 in 2018 to £290,000 in 2023, a 26% increase. New housing completions fell from 195,000 to 170,000 per year. The ratio of median house prices to median earnings reached 8.3 in 2023." }),
      q("1b", "With reference to the information provided, explain how the concept of price elasticity of supply is relevant to the UK housing market.", 8, "8-marker", "A"),
      q("1c", "With reference to Extract B and your own knowledge, assess the view that government subsidies for first-time buyers are the most effective policy to improve housing affordability.", 10, "10-marker", "A", { extract_text: "Extract B: The Help to Buy scheme supported over 350,000 purchases by 2023. Critics argue the policy inflated house prices by increasing demand without addressing supply constraints. The OBR estimated Help to Buy increased house prices by 0.8% overall, but by up to 5% in some areas." }),
      q("1d", "With reference to the extracts and your own knowledge, evaluate government intervention in the UK housing market. Consider both demand-side and supply-side policies.", 12, "12-marker", "A"),
      q("1e", "Evaluate the view that the UK housing market is a clear example of market failure that justifies significant government intervention.", 15, "15-marker", "A"),
      q("2a", "With reference to Extract C, identify two significant features of the data shown.", 5, "5-marker", "B", { extract_text: "Extract C shows UK electricity generation by source (2018–2023). Renewable energy generation increased from 33% to 42%. Gas-fired generation fell from 40% to 33%. Wholesale electricity prices tripled from £50/MWh in 2020 to £150/MWh in 2022, before falling to £90/MWh in 2023." }),
      q("2b", "With reference to the information provided, explain how negative externalities arise in the energy market and why they may lead to market failure.", 8, "8-marker", "B"),
      q("2c", "With reference to Extract D and your own knowledge, assess the effectiveness of carbon taxes as a method of correcting market failure in the energy market.", 10, "10-marker", "B", { extract_text: "Extract D: The UK ETS replaced the EU ETS in 2021. Carbon prices rose from £50 to £80 per tonne by 2023. The scheme accelerated the shift from coal to gas but had limited impact on renewable transition. Industry groups argue high carbon prices damage competitiveness." }),
      q("2d", "With reference to the extracts and your own knowledge, evaluate the impact of subsidies for renewable energy on economic efficiency and resource allocation.", 12, "12-marker", "B"),
      q("2e", "Evaluate the view that government intervention through regulation is more effective than market-based policies in achieving environmental objectives.", 15, "15-marker", "B"),
      q("3", "Evaluate the view that monopoly power is always detrimental to consumer welfare. Refer to at least one diagram in your answer.", 25, "25-marker", "C", { diagram_required: true }),
      q("4", "Evaluate the extent to which contestable markets deliver better outcomes for consumers than oligopolistic markets. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
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
      q("1a", "With reference to Extract A, identify two significant features of the data shown.", 5, "5-marker", "A", { extract_text: "Extract A shows UK CPI inflation rose from 0.7% in Jan 2021 to 11.1% in Oct 2022, before falling to 6.7% by Sep 2023. The Bank of England base rate increased 14 times to reach 5.25% by Aug 2023. Real wages fell by 3.1% in the year to March 2023." }),
      q("1b", "With reference to the information provided, explain how cost-push factors contributed to the inflationary pressures experienced by the UK economy.", 8, "8-marker", "A"),
      q("1c", "With reference to Extract B and your own knowledge, assess the effectiveness of monetary policy in controlling inflation in the UK.", 10, "10-marker", "A", { extract_text: "Extract B: The MPC raised rates from 0.1% to 5.25%. Mortgage approvals fell 28%. Inflation remained above the 2% target throughout 2023. Some economists argue monetary policy is less effective when inflation is supply-side driven." }),
      q("1d", "With reference to the extracts and your own knowledge, evaluate the trade-offs the Bank of England faces when setting interest rates during stagflation.", 12, "12-marker", "A"),
      q("1e", "Evaluate the view that fiscal policy would be more effective than monetary policy in managing the UK economy during the current environment.", 15, "15-marker", "A"),
      q("2a", "With reference to Extract C, identify two significant features of the data shown.", 5, "5-marker", "B", { extract_text: "Extract C shows the UK trade deficit in goods widened from £139bn to £186bn (2018–2023). Services surplus grew from £108bn to £132bn. Current account deficit was £83bn (3.1% of GDP). UK exports to the EU fell 7% while non-EU exports grew 4%." }),
      q("2b", "With reference to the information provided, explain how a depreciating exchange rate might affect the UK balance of trade.", 8, "8-marker", "B"),
      q("2c", "With reference to Extract D and your own knowledge, assess the impact of increased trade barriers on the UK economy since 2021.", 10, "10-marker", "B", { extract_text: "Extract D: Since leaving the EU single market, UK firms face customs checks and regulatory divergence. Trade barriers reduced UK-EU trade by ~15%. The UK has signed new deals with Australia and New Zealand. 24% of SMEs that exported to the EU have ceased doing so." }),
      q("2d", "With reference to the extracts and your own knowledge, evaluate whether the UK's comparative advantage has changed as a result of new trading relationships.", 12, "12-marker", "B"),
      q("2e", "Evaluate the view that free trade always leads to net economic benefits for all participating countries.", 15, "15-marker", "B"),
      q("3", "Evaluate the effectiveness of supply-side policies in promoting long-run economic growth. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
      q("4", "Evaluate the view that a floating exchange rate system is always preferable to a fixed exchange rate system. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
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
      q("1a", "With reference to Extract A, identify two significant features of the data shown.", 5, "5-marker", "A", { extract_text: "Extract A shows UK supermarket market share (2019–2022). Tesco fell from 27.4% to 26.9%, Aldi rose from 7.9% to 9.3%, Lidl from 5.9% to 7.1%. UK grocery market grew from £203bn to £228bn. Food prices rose 16.4% in the year to March 2023." }),
      q("1b", "With reference to the information provided, explain how the characteristics of an oligopoly are demonstrated in the UK supermarket industry.", 8, "8-marker", "A"),
      q("1c", "With reference to Extract B and your own knowledge, assess the extent to which discount supermarkets have increased contestability in the UK grocery market.", 10, "10-marker", "A", { extract_text: "Extract B: Aldi and Lidl opened 400+ new UK stores since 2015, investing £3.5bn. Combined market share doubled from 8% to 16.4%. Aldi's basket is ~20% cheaper than the Big Four. But barriers remain: a new supermarket costs £30m-£50m." }),
      q("1d", "With reference to the extracts and your own knowledge, evaluate the impact of non-price competition on consumer welfare in the UK supermarket industry.", 12, "12-marker", "A"),
      q("1e", "Evaluate the view that the CMA is effective in promoting competition and protecting consumers in oligopolistic markets.", 15, "15-marker", "A"),
      q("2a", "With reference to Extract C, identify two significant features of the data shown.", 5, "5-marker", "B", { extract_text: "Extract C shows UK labour market data (2019–2022). Unemployment fell from 3.8% to 3.5%. Vacancies hit a record 1.3m in March 2022. Nominal earnings growth was 6.0% but real earnings fell 2.5%. Economic inactivity rose from 20.4% to 21.6%." }),
      q("2b", "With reference to the information provided, explain how derived demand and wage determination are relevant to the UK labour market.", 8, "8-marker", "B"),
      q("2c", "With reference to Extract D and your own knowledge, assess the impact of the National Living Wage on employment and income inequality.", 10, "10-marker", "B", { extract_text: "Extract D: The NLW rose from £8.91 to £9.50 in April 2022. The Low Pay Commission estimated it raised wages for 2m workers. LSE research found no significant negative employment impact. 38% of small firms found the increase 'very difficult' to absorb." }),
      q("2d", "With reference to the extracts and your own knowledge, evaluate the effectiveness of education and training policies in addressing labour market failures.", 12, "12-marker", "B"),
      q("2e", "Evaluate the view that trade unions improve economic outcomes for workers without causing significant labour market distortions.", 15, "15-marker", "B"),
      q("3", "Evaluate the view that third-degree price discrimination always benefits producers more than consumers. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
      q("4", "Evaluate the view that perfect competition leads to the most efficient allocation of resources. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
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
      q("1a", "With reference to Extract A, identify two significant features of the data shown.", 5, "5-marker", "A", { extract_text: "Extract A shows UK government spending rose from £842bn (39% of GDP) in 2018/19 to £1,047bn (44% of GDP) in 2021/22. National debt increased from £1.8tn (84% of GDP) to £2.5tn (100% of GDP). Debt interest payments reached £111bn in 2022/23." }),
      q("1b", "With reference to the information provided, explain the difference between a budget deficit and the national debt, and why both matter for macroeconomic stability.", 8, "8-marker", "A"),
      q("1c", "With reference to Extract B and your own knowledge, assess the view that austerity measures are necessary to reduce the national debt.", 10, "10-marker", "A", { extract_text: "Extract B: The UK spent £370bn on COVID emergency support. The IMF recommended fiscal consolidation. The OECD noted premature austerity after 2008 slowed recovery. UK debt-to-GDP at 100% compares to Japan (263%), Italy (145%), US (123%)." }),
      q("1d", "With reference to the extracts and your own knowledge, evaluate automatic stabilisers versus discretionary fiscal policy in managing the economic cycle.", 12, "12-marker", "A"),
      q("1e", "Evaluate the view that the government should prioritise reducing the budget deficit over promoting economic growth.", 15, "15-marker", "A"),
      q("2a", "With reference to Extract C, identify two significant features of the data shown.", 5, "5-marker", "B", { extract_text: "Extract C: India's GDP growth was 6.8% vs China 3.0% and Brazil 2.9% in 2022. India's GDP per capita (PPP) was $8,379 vs China's $21,476. FDI into India reached $84bn. India's services sector was 53% of GDP; manufacturing only 17% vs China's 28%." }),
      q("2b", "With reference to the information provided, explain how foreign direct investment can promote economic development in emerging economies.", 8, "8-marker", "B"),
      q("2c", "With reference to Extract D and your own knowledge, assess the extent to which globalisation has benefited developing and emerging economies.", 10, "10-marker", "B", { extract_text: "Extract D: Global trade peaked at 61% of world GDP in 2008, now 57%. MNCs account for ~80% of world trade. FDI benefits have been unevenly distributed. Countries with strong institutions attracted more FDI than Sub-Saharan Africa." }),
      q("2d", "With reference to the extracts and your own knowledge, evaluate the role of the WTO in promoting economic development.", 12, "12-marker", "B"),
      q("2e", "Evaluate the view that protectionist trade policies can be justified for developing and emerging economies.", 15, "15-marker", "B"),
      q("3", "Evaluate the view that demand-side policies alone are sufficient to achieve sustained economic growth and full employment. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
      q("4", "Evaluate the extent to which inequality of income and wealth is an inevitable consequence of a market economy. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
    ],
  },

  // ═══ AQA ECONOMICS ═══════════════════════════════════════════════════════

  {
    exam_board: "AQA", subject: "Economics", paper_number: 1, year: 2023, total_marks: 80, time_limit_minutes: 120,
    paper_name: "AQA Economics Paper 1: Markets and Market Failure (June 2023)",
    product_slug: "aqa-economics",
    sections: [
      { id: "A", name: "Section A: Data Response", questions: ["1a","1b","1c","1d"] },
      { id: "B", name: "Section B: Essay (choose one)", questions: ["2","3"] },
    ],
    questions: [
      q("1a", "Using the data in Extract A, calculate the percentage change in UK renewable energy output between 2018 and 2023 and explain its significance.", 4, "4-marker", "A", { extract_text: "Extract A: UK renewable energy output rose from 110 TWh in 2018 to 155 TWh in 2023. Total electricity consumption was 300 TWh in 2023. Government subsidies for renewables totalled £12bn in 2023." }),
      q("1b", "Explain, using a diagram, how a subsidy on renewable energy affects the market for electricity.", 9, "9-marker", "A", { diagram_required: true }),
      q("1c", "Using the data in the extracts and your own economic knowledge, evaluate the effectiveness of government subsidies in correcting the market failure associated with carbon emissions.", 15, "15-marker", "A"),
      q("1d", "Using the data in the extracts and your own economic knowledge, evaluate the extent to which a carbon tax would be more effective than subsidies in reducing carbon emissions.", 25, "25-marker", "A"),
      q("2", "Evaluate the view that indirect taxes are the most effective way to correct negative externalities.", 25, "25-marker", "B"),
      q("3", "Evaluate the view that contestable markets always lead to better outcomes for consumers than monopoly.", 25, "25-marker", "B"),
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
      q("1a", "Using Extract A, calculate the UK's current account balance as a percentage of GDP in 2023.", 4, "4-marker", "A", { extract_text: "Extract A: UK GDP was £2,274bn in 2023. The current account deficit was £68bn. Exports of goods were £354bn, imports of goods £508bn. Services exports were £397bn, services imports £242bn." }),
      q("1b", "Explain, using an AD/AS diagram, the likely impact of a significant fall in the value of sterling on the UK economy.", 9, "9-marker", "A", { diagram_required: true }),
      q("1c", "Using the data and your own knowledge, assess the significance of the UK's current account deficit for long-term macroeconomic performance.", 15, "15-marker", "A"),
      q("1d", "Using the data and your own knowledge, evaluate the view that supply-side policies are more effective than demand-side policies in reducing a current account deficit.", 25, "25-marker", "A"),
      q("2", "Evaluate the effectiveness of quantitative easing as a tool of monetary policy.", 25, "25-marker", "B"),
      q("3", "Evaluate the view that globalisation inevitably increases income inequality within developed economies.", 25, "25-marker", "B"),
    ],
  },

  // ═══ CIE ECONOMICS ═══════════════════════════════════════════════════════

  {
    exam_board: "CIE", subject: "Economics", paper_number: 4, year: 2023, total_marks: 70, time_limit_minutes: 135,
    paper_name: "CIE Economics Paper 4: Data Response and Essays (June 2023)",
    product_slug: "cie-economics",
    sections: [
      { id: "A", name: "Section A: Data Response", questions: ["1a","1b","1c"] },
      { id: "B", name: "Section B: Essays (choose two)", questions: ["2","3","4","5"] },
    ],
    questions: [
      q("1a", "With reference to the data, identify and explain two trends in global trade patterns between 2018 and 2023.", 4, "4-marker", "A", { extract_text: "Data shows world merchandise trade grew from $19.5tn (2018) to $25.3tn (2023). China's share rose from 13% to 15%. Services trade grew faster than goods trade. Intra-regional trade (e.g. within Asia) grew more than inter-regional trade." }),
      q("1b", "Explain how the principle of comparative advantage can justify free trade even when one country has an absolute advantage in all goods.", 6, "6-marker", "A"),
      q("1c", "Discuss whether the benefits of free trade outweigh the costs for developing economies.", 10, "10-marker", "A"),
      q("2", "Discuss whether government intervention to correct market failure always improves resource allocation. [25]", 25, "25-marker", "B"),
      q("3", "Evaluate the view that monopoly is always against the public interest. [25]", 25, "25-marker", "B"),
      q("4", "Discuss the effectiveness of monetary policy in managing inflation in a developing economy. [25]", 25, "25-marker", "B"),
      q("5", "Evaluate the policies a government might use to reduce inequality of income distribution. [25]", 25, "25-marker", "B"),
    ],
  },

  // ═══ OCR COMPUTER SCIENCE ════════════════════════════════════════════════

  {
    exam_board: "OCR", subject: "Computer Science", paper_number: 1, year: 2023, total_marks: 140, time_limit_minutes: 150,
    paper_name: "OCR Computer Science Paper 1: Computer Systems (June 2023)",
    product_slug: "ocr-computer-science",
    sections: [
      { id: "A", name: "Section A: Short Answer", questions: ["1","2","3","4","5"] },
      { id: "B", name: "Section B: Extended Response", questions: ["6","7","8"] },
    ],
    questions: [
      q("1", "Describe the role of the ALU, CU, and registers within the CPU. Explain how the fetch-decode-execute cycle operates.", 8, "8-marker", "A"),
      q("2", "Explain the differences between RAM and ROM. Describe how virtual memory is used when RAM is insufficient.", 8, "8-marker", "A"),
      q("3", "Convert the denary number 217 into binary and hexadecimal. Show your working.", 6, "6-marker", "A"),
      q("4", "Describe the purpose of an operating system. Explain how it manages memory, processes, and I/O devices.", 10, "10-marker", "A"),
      q("5", "Explain the differences between TCP/IP and UDP protocols. Give examples of when each would be appropriate.", 8, "8-marker", "A"),
      q("6", "A school wants to implement a new network. Discuss the relative merits of a client-server vs peer-to-peer network for this context. Consider security, cost, and management.", 20, "20-marker", "B"),
      q("7", "Evaluate the ethical, legal, and environmental impacts of artificial intelligence in healthcare. Consider data protection legislation and algorithmic bias.", 20, "20-marker", "B"),
      q("8", "A company stores customer data in a relational database. Discuss the importance of normalisation, and explain the potential consequences of data redundancy. Include SQL examples.", 20, "20-marker", "B"),
    ],
  },

  // ═══ OCR PHYSICS ═════════════════════════════════════════════════════════

  {
    exam_board: "OCR", subject: "Physics", paper_number: 1, year: 2023, total_marks: 100, time_limit_minutes: 135,
    paper_name: "OCR Physics A Paper 1: Modelling Physics (June 2023)",
    product_slug: "ocr-physics",
    sections: [
      { id: "A", name: "Section A: Multiple Choice and Short Answer", questions: ["1","2","3","4","5","6"] },
      { id: "B", name: "Section B: Extended Response", questions: ["7","8"] },
    ],
    questions: [
      q("1", "A car accelerates uniformly from rest to 30 m/s in 12 seconds. Calculate: (a) the acceleration, (b) the distance travelled, (c) the resultant force if the car has mass 1200 kg.", 8, "8-marker", "A"),
      q("2", "Describe an experiment to determine the Young modulus of a metal wire. Include a labelled diagram, the measurements you would take, and how you would calculate the result.", 10, "10-marker", "A"),
      q("3", "Explain the difference between elastic and inelastic collisions. A 2 kg ball travelling at 5 m/s collides head-on with a stationary 3 kg ball. If the collision is perfectly elastic, calculate the velocities of both balls after the collision.", 10, "10-marker", "A"),
      q("4", "Explain what is meant by the principle of conservation of energy. A 0.5 kg ball is dropped from a height of 20 m. Calculate its velocity just before hitting the ground, ignoring air resistance.", 8, "8-marker", "A"),
      q("5", "Define specific heat capacity and specific latent heat. 2 kg of ice at -10°C is heated until it becomes steam at 100°C. Calculate the total energy required. (c_ice = 2100 J/kg°C, c_water = 4200 J/kg°C, L_f = 334,000 J/kg, L_v = 2,260,000 J/kg)", 12, "12-marker", "A"),
      q("6", "Explain what is meant by simple harmonic motion. Derive the relationship between period and length for a simple pendulum.", 10, "10-marker", "A"),
      q("7", "Discuss the evidence for and against the wave nature of light. Include reference to Young's double-slit experiment, the photoelectric effect, and wave-particle duality.", 20, "20-marker", "B"),
      q("8", "A power station generates 500 MW of electrical power. The electricity is transmitted at 400 kV through cables with a total resistance of 10 Ω. Calculate the power lost in transmission. Explain why electricity is transmitted at high voltage and evaluate the advantages and disadvantages of using AC vs DC for long-distance transmission.", 22, "22-marker", "B"),
    ],
  },

  // ═══ AQA CHEMISTRY ═══════════════════════════════════════════════════════

  {
    exam_board: "AQA", subject: "Chemistry", paper_number: 1, year: 2023, total_marks: 105, time_limit_minutes: 120,
    paper_name: "AQA Chemistry Paper 1: Inorganic and Physical Chemistry (June 2023)",
    product_slug: "aqa-chemistry",
    sections: [
      { id: "A", name: "Section A: Short Answer", questions: ["1","2","3","4","5"] },
      { id: "B", name: "Section B: Extended Response", questions: ["6","7"] },
    ],
    questions: [
      q("1", "Define enthalpy of formation. Using the data provided, calculate the enthalpy of combustion of propan-1-ol using Hess's Law. Show all working.", 10, "10-marker", "A"),
      q("2", "Describe and explain the trend in first ionisation energies across Period 3 (Na to Ar). Account for any anomalies.", 8, "8-marker", "A"),
      q("3", "Explain the term 'dynamic equilibrium'. For the reaction N₂(g) + 3H₂(g) ⇌ 2NH₃(g) ΔH = -92 kJ/mol, predict and explain the effect of: (a) increasing temperature, (b) increasing pressure, (c) adding a catalyst.", 12, "12-marker", "A"),
      q("4", "Describe the bonding and structure of sodium chloride, diamond, and ice. Explain how the structure of each substance affects its melting point.", 10, "10-marker", "A"),
      q("5", "Explain the terms 'rate of reaction' and 'activation energy'. Describe how a Maxwell-Boltzmann distribution can be used to explain the effect of temperature on reaction rate.", 10, "10-marker", "A"),
      q("6", "Describe the chemistry of the halogens (Group 7). Include their physical properties, trend in reactivity, displacement reactions, and the reactions of halide ions with concentrated sulfuric acid. Write balanced equations.", 25, "25-marker", "B"),
      q("7", "Discuss the factors that affect the position of equilibrium in industrial processes, with reference to the Haber process and the Contact process. Evaluate the compromises made between yield, rate, and cost.", 25, "25-marker", "B"),
    ],
  },

  // ═══ AQA PSYCHOLOGY ══════════════════════════════════════════════════════

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
      q("1", "Outline what is meant by 'conformity' and distinguish between compliance, identification, and internalisation.", 6, "6-marker", "A"),
      q("2", "Describe the procedure and findings of Milgram's (1963) study of obedience. Discuss two ethical issues raised by this research.", 8, "8-marker", "A"),
      q("3", "Discuss the role of social influence processes in social change. Refer to research evidence in your answer.", 16, "16-marker", "A"),
      q("4", "Outline the multi-store model of memory. Explain how it differs from the working memory model.", 6, "6-marker", "B"),
      q("5", "Explain what is meant by 'misleading information' in the context of eyewitness testimony. Refer to the research of Loftus and Palmer (1974).", 6, "6-marker", "B"),
      q("6", "Evaluate the cognitive interview as a method of improving the accuracy of eyewitness testimony. Refer to research evidence.", 16, "16-marker", "B"),
      q("7", "Outline Ainsworth's 'Strange Situation' procedure and describe the three attachment types she identified.", 6, "6-marker", "C"),
      q("8", "Explain Bowlby's theory of maternal deprivation. Outline one criticism of this theory.", 6, "6-marker", "C"),
      q("9", "Discuss the influence of early attachment on later relationships. Refer to research evidence in your answer.", 16, "16-marker", "C"),
      q("10", "Outline the behavioural, emotional, and cognitive characteristics of phobias.", 4, "4-marker", "D"),
      q("11", "Explain how systematic desensitisation is used to treat phobias. Outline one strength and one limitation of this approach.", 6, "6-marker", "D"),
      q("12", "Discuss the cognitive approach to explaining depression. Evaluate the effectiveness of cognitive behavioural therapy (CBT) as a treatment. Refer to research evidence.", 16, "16-marker", "D"),
    ],
  },

  // ═══ EDEXCEL MATHEMATICS ═════════════════════════════════════════════════

  {
    exam_board: "Edexcel", subject: "Mathematics", paper_number: 1, year: 2023, total_marks: 100, time_limit_minutes: 120,
    paper_name: "Edexcel Mathematics Paper 1: Pure Mathematics (June 2023)",
    product_slug: "edexcel-mathematics",
    sections: [
      { id: "A", name: "Full Paper", questions: ["1","2","3","4","5","6","7","8","9","10"] },
    ],
    questions: [
      q("1", "Simplify fully: (3x² - 12) / (x² - 5x + 6)", 3, "3-marker", "A"),
      q("2", "Find the equation of the tangent to the curve y = x³ - 4x + 1 at the point where x = 2.", 5, "5-marker", "A"),
      q("3", "Solve the equation 2sin²θ - sinθ - 1 = 0 for 0° ≤ θ ≤ 360°.", 6, "6-marker", "A"),
      q("4", "A geometric series has first term a = 8 and common ratio r = 0.6. (a) Find the sum to infinity. (b) Find the smallest value of n for which the sum of the first n terms exceeds 19.", 8, "8-marker", "A"),
      q("5", "The curve C has equation y = 2x³ - 9x² + 12x - 4. (a) Find dy/dx. (b) Find the coordinates of the stationary points. (c) Determine the nature of each stationary point.", 10, "10-marker", "A"),
      q("6", "Prove by contradiction that √2 is irrational.", 6, "6-marker", "A"),
      q("7", "A particle moves in a straight line. At time t seconds, the velocity v m/s is given by v = 3t² - 12t + 9. (a) Find the times when the particle is at rest. (b) Find the total distance travelled between t = 0 and t = 4.", 10, "10-marker", "A"),
      q("8", "Use integration by parts to find ∫ x·e²ˣ dx.", 6, "6-marker", "A"),
      q("9", "The function f(x) = ln(3x - 2) is defined for x > 2/3. (a) Find f⁻¹(x). (b) State the domain and range of f⁻¹. (c) On the same axes, sketch y = f(x) and y = f⁻¹(x).", 10, "10-marker", "A"),
      q("10", "Use the substitution u = 1 + √x to evaluate ∫₁⁴ (1/(1+√x)) dx. Give your answer in the form a + b·ln(c) where a, b, c are integers.", 12, "12-marker", "A"),
    ],
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // 1. Ensure tables exist
    await supabase.rpc("exec_sql", { sql: `
      CREATE TABLE IF NOT EXISTS public.mock_papers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
        exam_board TEXT NOT NULL,
        subject TEXT NOT NULL,
        paper_number INTEGER NOT NULL DEFAULT 1,
        paper_name TEXT NOT NULL,
        year INTEGER NOT NULL,
        total_marks INTEGER NOT NULL,
        time_limit_minutes INTEGER NOT NULL DEFAULT 120,
        content_source TEXT NOT NULL DEFAULT 'representative',
        sections JSONB DEFAULT '[]'::jsonb,
        questions JSONB NOT NULL DEFAULT '[]'::jsonb,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
      ALTER TABLE public.mock_papers ENABLE ROW LEVEL SECURITY;
      DO $p$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mock_papers' AND policyname='Anyone can view active mock papers') THEN
          CREATE POLICY "Anyone can view active mock papers" ON public.mock_papers FOR SELECT USING (active = true);
        END IF;
      END $p$;

      CREATE TABLE IF NOT EXISTS public.mock_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        paper_id UUID NOT NULL REFERENCES public.mock_papers(id) ON DELETE CASCADE,
        product_id UUID REFERENCES public.products(id),
        total_score INTEGER,
        max_score INTEGER NOT NULL,
        percentage NUMERIC(5,2),
        question_results JSONB NOT NULL DEFAULT '[]'::jsonb,
        answers JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','marking','completed')),
        started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        completed_at TIMESTAMP WITH TIME ZONE,
        time_taken_seconds INTEGER,
        tab_switches INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
      ALTER TABLE public.mock_results ENABLE ROW LEVEL SECURITY;
      DO $p$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mock_results' AND policyname='Users can view their own results') THEN
          CREATE POLICY "Users can view their own results" ON public.mock_results FOR SELECT USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mock_results' AND policyname='Users can insert their own results') THEN
          CREATE POLICY "Users can insert their own results" ON public.mock_results FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mock_results' AND policyname='Users can update their own results') THEN
          CREATE POLICY "Users can update their own results" ON public.mock_results FOR UPDATE USING (auth.uid() = user_id);
        END IF;
      END $p$;
    `}).catch(() => {
      // rpc might not exist — try raw approach below
    });

    // 2. Seed papers (skip existing)
    let inserted = 0;
    let skipped = 0;

    for (const paper of ALL_PAPERS) {
      // Check if exists
      const { data: existing } = await supabase
        .from("mock_papers")
        .select("id")
        .eq("exam_board", paper.exam_board)
        .eq("subject", paper.subject)
        .eq("paper_number", paper.paper_number)
        .eq("year", paper.year)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      // Look up product
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("slug", paper.product_slug)
        .maybeSingle();

      const { error } = await supabase.from("mock_papers").insert({
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
        console.error(`Failed to insert ${paper.paper_name}:`, error.message);
      } else {
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted, skipped, total: ALL_PAPERS.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
