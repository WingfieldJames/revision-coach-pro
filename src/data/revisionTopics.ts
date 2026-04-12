// SEO landing page topic definitions per exam board
// Each topic generates a page at /revision/{slug}

export interface RevisionTopic {
  slug: string;
  topic: string;
  examBoard: string;
  subject: string;
  productSlug: string;
  intro: string;
  keyConcepts: string[];
  examQuestions: string[];
  faqs: { question: string; answer: string }[];
  relatedSlugs: string[];
}

// ── AQA Economics ──────────────────────────────────────────────────────────

const AQA_ECON: RevisionTopic[] = [
  {
    slug: "aqa-economics-market-failure", topic: "Market Failure", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "Market failure occurs when the free market fails to allocate resources efficiently, leading to a net welfare loss. It is one of the most heavily tested topics across AQA Economics Papers 1 and 3.",
    keyConcepts: ["Types of market failure: externalities, public goods, information failure, monopoly power", "Positive and negative externalities in production and consumption", "Merit goods and demerit goods", "The role of government intervention to correct market failure", "Cost-benefit analysis and government failure"],
    examQuestions: ["Evaluate the view that government intervention always corrects market failure (25 marks)", "Using a diagram, explain how negative externalities lead to a misallocation of resources (9 marks)", "Assess the effectiveness of indirect taxes in correcting market failure (15 marks)"],
    faqs: [
      { question: "What is the difference between market failure and government failure?", answer: "Market failure is when the free market misallocates resources. Government failure is when government intervention makes the allocation worse — for example, if a subsidy creates an even larger deadweight loss." },
      { question: "How many marks are market failure questions usually worth?", answer: "Market failure appears across all question types in AQA Paper 1: 4-mark data questions, 9-mark diagram explanations, 15-mark assess questions, and 25-mark evaluations." },
      { question: "What diagrams do I need for market failure?", answer: "You need: the standard externality diagram (showing MSC/MSB vs MPC/MPB), diagrams for indirect taxes and subsidies, and the public goods non-excludability/non-rivalry diagram." },
    ],
    relatedSlugs: ["aqa-economics-externalities", "aqa-economics-government-intervention", "aqa-economics-public-goods"],
  },
  {
    slug: "aqa-economics-oligopoly", topic: "Oligopoly", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "Oligopoly is a market structure dominated by a few large firms. It is a core AQA Paper 1 topic — examiners love testing game theory, the kinked demand curve, and price rigidity.",
    keyConcepts: ["Characteristics: few dominant firms, high barriers to entry, interdependence, product differentiation", "The kinked demand curve model and price rigidity", "Game theory and the prisoner's dilemma", "Collusion: cartels, tacit collusion, and why they break down", "Non-price competition: branding, loyalty schemes, quality", "Concentration ratios and the N-firm concentration ratio"],
    examQuestions: ["Evaluate the view that oligopoly always leads to higher prices for consumers (25 marks)", "Using a diagram, explain why prices tend to be rigid in an oligopolistic market (9 marks)", "Assess the factors that determine whether firms in an oligopoly are likely to collude (15 marks)"],
    faqs: [
      { question: "What is the kinked demand curve and do I need to draw it?", answer: "The kinked demand curve shows that in oligopoly, if one firm raises its price, rivals don't follow (elastic above the kink), but if it lowers its price, rivals match it (inelastic below). Yes, you should draw it — it appears frequently in 9 and 25 mark questions." },
      { question: "What real-world examples can I use for oligopoly?", answer: "UK supermarkets (Tesco, Sainsbury's, Asda, Aldi), mobile networks (EE, Three, Vodafone, O2), airlines (BA, Ryanair, easyJet), and streaming services (Netflix, Disney+, Amazon Prime)." },
      { question: "How does game theory link to oligopoly?", answer: "Game theory models strategic interaction between firms. The prisoner's dilemma shows why firms might compete even when collusion would benefit them all — because each firm has an incentive to cheat." },
    ],
    relatedSlugs: ["aqa-economics-monopoly", "aqa-economics-market-failure", "aqa-economics-government-intervention"],
  },
  {
    slug: "aqa-economics-monopoly", topic: "Monopoly", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "A monopoly exists when a single firm dominates a market with 25%+ market share. AQA examiners frequently test efficiency, price discrimination, and whether monopolies should be regulated.",
    keyConcepts: ["Definition: 25%+ market share (legal definition in the UK)", "Profit maximisation: MC = MR, with supernormal profit diagram", "Allocative and productive inefficiency in monopoly", "Natural monopoly and economies of scale", "Price discrimination: 1st, 2nd, and 3rd degree", "Regulation: price capping (RPI-X), profit regulation, competition policy"],
    examQuestions: ["Evaluate the view that monopoly power is always against the public interest (25 marks)", "Using a diagram, explain how a monopolist maximises profit and why this leads to allocative inefficiency (9 marks)", "Assess the effectiveness of regulation in controlling monopoly power (15 marks)"],
    faqs: [
      { question: "Is monopoly always bad for consumers?", answer: "No — this is a key evaluation point. Natural monopolies can achieve lower average costs through economies of scale. Monopolists may also invest supernormal profits in R&D and innovation (dynamic efficiency). Cross-subsidisation can benefit less profitable services." },
      { question: "What diagrams do I need for monopoly?", answer: "The monopoly profit maximisation diagram (AR, MR, MC, AC curves), the comparison with perfect competition diagram, and diagrams for 3rd-degree price discrimination." },
      { question: "How does monopoly link to contestable markets?", answer: "If a monopoly market is contestable (low barriers to entry/exit, no sunk costs), the threat of hit-and-run entry forces the monopolist to keep prices competitive — so the market structure alone doesn't determine outcomes." },
    ],
    relatedSlugs: ["aqa-economics-oligopoly", "aqa-economics-government-intervention", "aqa-economics-market-failure"],
  },
  {
    slug: "aqa-economics-fiscal-policy", topic: "Fiscal Policy", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "Fiscal policy — government spending and taxation — is a central macroeconomics topic in AQA Paper 2. You need to evaluate its effectiveness against monetary and supply-side alternatives.",
    keyConcepts: ["Definition: government manipulation of spending (G) and taxation (T) to influence AD", "Expansionary fiscal policy: increase G, decrease T → shift AD right", "Contractionary fiscal policy: decrease G, increase T → shift AD left", "The multiplier effect and its significance", "Automatic stabilisers vs discretionary fiscal policy", "Budget deficit, national debt, and crowding out", "Time lags and political constraints"],
    examQuestions: ["Evaluate the effectiveness of fiscal policy in achieving macroeconomic stability (25 marks)", "Using an AD/AS diagram, explain the likely impact of a significant increase in government spending (9 marks)", "Assess the view that the government should prioritise reducing the budget deficit (15 marks)"],
    faqs: [
      { question: "What is the difference between the budget deficit and the national debt?", answer: "The budget deficit is the annual shortfall (G > T in one year). The national debt is the total accumulated borrowing over all years. A deficit adds to the debt. The UK's debt is around 100% of GDP." },
      { question: "What are the time lags in fiscal policy?", answer: "Recognition lag (identifying the problem), decision lag (political process to agree on changes), implementation lag (time to build infrastructure or change tax codes), and impact lag (time for the policy to affect the economy). These can total 12-18 months." },
      { question: "How do I compare fiscal and monetary policy in a 25-marker?", answer: "Compare on: speed (monetary is faster), flexibility (monetary can be adjusted monthly, fiscal is annual), political independence (BoE is independent, fiscal is political), targeting (fiscal can target specific sectors), and side effects (fiscal creates debt, monetary affects exchange rates)." },
    ],
    relatedSlugs: ["aqa-economics-monetary-policy", "aqa-economics-supply-side-policies", "aqa-economics-economic-growth"],
  },
  {
    slug: "aqa-economics-monetary-policy", topic: "Monetary Policy", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "Monetary policy is set by the Bank of England through interest rates, quantitative easing, and forward guidance. It is essential for AQA Paper 2 — particularly evaluating its effectiveness against inflation.",
    keyConcepts: ["Bank of England's Monetary Policy Committee (MPC)", "Interest rate transmission mechanism", "Quantitative easing (QE): buying government bonds to increase money supply", "Inflation targeting: CPI target of 2%", "Forward guidance as a policy tool", "Limitations: liquidity trap, time lags, exchange rate effects"],
    examQuestions: ["Evaluate the effectiveness of monetary policy in controlling inflation (25 marks)", "Explain the transmission mechanism through which a change in interest rates affects aggregate demand (9 marks)", "Assess the view that quantitative easing is an effective tool when interest rates are near zero (15 marks)"],
    faqs: [
      { question: "How does the interest rate transmission mechanism work?", answer: "BoE changes base rate → commercial banks adjust savings/borrowing rates → affects consumer spending (mortgages, credit) and investment → changes AD → affects output and inflation. There is an 18-24 month lag." },
      { question: "What is a liquidity trap?", answer: "A liquidity trap occurs when interest rates are at or near zero and further cuts have no effect — consumers and firms hoard cash rather than spend. This is why QE was introduced after 2008." },
      { question: "Can monetary policy cause unemployment?", answer: "Yes — raising interest rates to control inflation can reduce AD and cause demand-deficient unemployment. This is the trade-off the MPC faces, illustrated by the Phillips Curve." },
    ],
    relatedSlugs: ["aqa-economics-fiscal-policy", "aqa-economics-inflation", "aqa-economics-supply-side-policies"],
  },
  {
    slug: "aqa-economics-supply-side-policies", topic: "Supply-Side Policies", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "Supply-side policies aim to increase the productive capacity of the economy by shifting LRAS to the right. AQA tests both market-based and interventionist approaches.",
    keyConcepts: ["Market-based: deregulation, privatisation, tax cuts, trade union reform, flexible labour markets", "Interventionist: education and training, infrastructure investment, R&D subsidies, industrial policy", "Impact on LRAS and the PPF", "Time lags: supply-side policies take years to have effect", "Evaluation: equity vs efficiency trade-offs"],
    examQuestions: ["Evaluate the view that supply-side policies are more effective than demand-side policies in achieving long-run economic growth (25 marks)", "Using an AD/AS diagram, explain how investment in education and training can increase the productive capacity of the economy (9 marks)", "Assess the effectiveness of deregulation as a supply-side policy (15 marks)"],
    faqs: [
      { question: "What is the difference between market-based and interventionist supply-side policies?", answer: "Market-based policies reduce government interference to let markets work more freely (deregulation, privatisation). Interventionist policies involve active government spending to improve productive capacity (education, infrastructure). AQA examiners want you to discuss both." },
      { question: "Why are supply-side policies slow to work?", answer: "They target the long-run productive capacity. Building infrastructure takes years, education reforms take a generation to affect the workforce, and R&D doesn't guarantee results. This is a key limitation compared to demand-side policies." },
      { question: "How do supply-side policies reduce inflation?", answer: "By increasing AS, they can reduce cost-push inflation and allow the economy to grow without generating demand-pull inflation. They shift LRAS right, meaning more output at lower prices." },
    ],
    relatedSlugs: ["aqa-economics-fiscal-policy", "aqa-economics-monetary-policy", "aqa-economics-economic-growth"],
  },
  {
    slug: "aqa-economics-externalities", topic: "Externalities", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "Externalities are costs or benefits that affect third parties not involved in a transaction. They cause the free market to over- or under-produce, creating a welfare loss.",
    keyConcepts: ["Negative externalities in production (e.g. pollution) and consumption (e.g. smoking)", "Positive externalities in production (e.g. R&D spillovers) and consumption (e.g. education)", "MSC = MPC + external cost; MSB = MPB + external benefit", "Welfare loss triangles on diagrams", "Solutions: taxes, subsidies, regulation, tradeable permits, property rights (Coase theorem)"],
    examQuestions: ["Using a diagram, explain how negative externalities lead to market failure (9 marks)", "Evaluate the effectiveness of indirect taxes in correcting negative externalities (25 marks)", "Assess the view that tradeable pollution permits are more effective than regulation in reducing emissions (15 marks)"],
    faqs: [
      { question: "What is the difference between private and social costs?", answer: "Private costs are borne by the producer/consumer directly. Social costs include private costs PLUS any external costs imposed on third parties. Market failure occurs when social cost > private cost (or social benefit > private benefit)." },
      { question: "How do I draw the externality diagram?", answer: "Draw MPC (supply) and MPB (demand) first to show the free market equilibrium. Then add MSC (above MPC for negative externality in production) or MSB (above MPB for positive externality in consumption). The welfare loss is the triangle between the two equilibria." },
      { question: "What is the Coase theorem?", answer: "If property rights are clearly defined and transaction costs are low, private bargaining can solve externalities without government intervention. In practice, high transaction costs and unclear property rights mean government intervention is usually needed." },
    ],
    relatedSlugs: ["aqa-economics-market-failure", "aqa-economics-government-intervention", "aqa-economics-public-goods"],
  },
  {
    slug: "aqa-economics-public-goods", topic: "Public Goods", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "Public goods are non-excludable and non-rivalrous, meaning the free market will not provide them — leading to the free rider problem. This is a fundamental source of market failure.",
    keyConcepts: ["Non-excludability: cannot prevent non-payers from consuming", "Non-rivalry: one person's consumption does not reduce availability for others", "Free rider problem: rational individuals won't pay voluntarily", "Quasi-public goods: goods with some but not all public good characteristics", "Government provision funded through taxation"],
    examQuestions: ["Explain why public goods will not be provided by the free market (4 marks)", "Using examples, distinguish between a public good and a quasi-public good (9 marks)", "Evaluate the view that the government should always provide public goods (25 marks)"],
    faqs: [
      { question: "What are examples of public goods?", answer: "National defence, street lighting, lighthouses, flood defences, and public fireworks displays. These are non-excludable and non-rivalrous. Education and healthcare are NOT public goods — they are merit goods (excludable and rivalrous)." },
      { question: "What is the free rider problem?", answer: "Since non-payers cannot be excluded from consuming a public good, rational individuals will not pay voluntarily — they will 'free ride' on others' contributions. This means no private firm has an incentive to supply the good." },
      { question: "What is a quasi-public good?", answer: "A good that has some characteristics of a public good but not all. For example, roads are non-excludable (mostly) but can be rivalrous during congestion. Parks are non-excludable but can become rivalrous when overcrowded." },
    ],
    relatedSlugs: ["aqa-economics-market-failure", "aqa-economics-externalities", "aqa-economics-government-intervention"],
  },
  {
    slug: "aqa-economics-government-intervention", topic: "Government Intervention", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "Government intervention aims to correct market failure through taxes, subsidies, regulation, and direct provision. AQA examiners want you to evaluate whether intervention actually improves outcomes.",
    keyConcepts: ["Indirect taxes (specific and ad valorem) to reduce consumption of demerit goods", "Subsidies to encourage consumption of merit goods and reduce costs", "Maximum and minimum prices", "Regulation and legislation", "Tradeable pollution permits", "Government failure: unintended consequences, imperfect information, regulatory capture"],
    examQuestions: ["Evaluate the view that government intervention in markets always improves economic welfare (25 marks)", "Using a diagram, explain how an indirect tax on cigarettes could correct market failure (9 marks)", "Assess the significance of government failure as a reason not to intervene in markets (15 marks)"],
    faqs: [
      { question: "What is government failure?", answer: "Government failure occurs when intervention leads to a worse allocation of resources than the free market would have achieved. Causes include: imperfect information, unintended consequences, administrative costs, political self-interest, and regulatory capture." },
      { question: "How do I evaluate government intervention in a 25-marker?", answer: "Structure: explain why the market fails, describe the intervention, analyse how it works using a diagram, then evaluate — does it actually correct the failure? Consider: information problems, time lags, government failure, distributional effects, and whether the costs of intervention exceed the benefits." },
      { question: "What is regulatory capture?", answer: "When the regulator starts acting in the interests of the industry it is supposed to regulate, rather than in the public interest. This can happen because regulators rely on industry for information, or because staff move between the regulator and industry." },
    ],
    relatedSlugs: ["aqa-economics-market-failure", "aqa-economics-externalities", "aqa-economics-fiscal-policy"],
  },
  {
    slug: "aqa-economics-economic-growth", topic: "Economic Growth", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "Economic growth is a sustained increase in real GDP. AQA Paper 2 tests causes, consequences, and policies — you need to distinguish between short-run and long-run growth.",
    keyConcepts: ["Short-run growth: increase in AD, movement along LRAS", "Long-run growth: increase in productive capacity, shift in LRAS", "Actual vs potential growth", "Causes: investment, technology, human capital, natural resources, institutional quality", "Costs of growth: inflation, inequality, environmental degradation, current account deficit", "Benefits: higher living standards, employment, tax revenue, reduced poverty"],
    examQuestions: ["Evaluate the view that economic growth is always desirable (25 marks)", "Using an AD/AS diagram, distinguish between short-run and long-run economic growth (9 marks)", "Assess the factors that determine the rate of economic growth in a developing economy (15 marks)"],
    faqs: [
      { question: "What is the difference between actual and potential growth?", answer: "Actual growth is the percentage increase in real GDP. Potential growth is the increase in the economy's productive capacity (LRAS shifting right). An economy can have actual growth by using spare capacity without increasing potential." },
      { question: "Why might economic growth be undesirable?", answer: "Key evaluation point: growth can worsen inequality (benefits concentrated among capital owners), cause environmental damage (resource depletion, pollution), generate inflation (if demand-led), and worsen the current account (if consumers spend on imports)." },
      { question: "How does investment cause growth?", answer: "Investment increases both AD (short-run, as firms spend on capital goods) and LRAS (long-run, as new capital increases productive capacity). This dual effect makes investment the most important driver of sustainable growth." },
    ],
    relatedSlugs: ["aqa-economics-supply-side-policies", "aqa-economics-fiscal-policy", "aqa-economics-inflation"],
  },
  {
    slug: "aqa-economics-inflation", topic: "Inflation", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "Inflation is a sustained increase in the general price level. AQA Paper 2 focuses on causes (demand-pull vs cost-push), consequences, and the effectiveness of policies to control it.",
    keyConcepts: ["Demand-pull inflation: excess AD relative to AS", "Cost-push inflation: rising costs of production shift AS left", "CPI and how it is measured", "Consequences: erosion of purchasing power, menu costs, shoe-leather costs, redistribution effects, uncertainty", "Fisher equation: real interest rate = nominal rate - inflation rate", "Phillips Curve: short-run trade-off between inflation and unemployment"],
    examQuestions: ["Evaluate the effectiveness of monetary policy in controlling inflation (25 marks)", "Using a diagram, explain the difference between demand-pull and cost-push inflation (9 marks)", "Assess the costs and benefits of a low and stable rate of inflation (15 marks)"],
    faqs: [
      { question: "What is the Bank of England's inflation target?", answer: "The CPI target is 2%, set by the government. The MPC must write a letter to the Chancellor if inflation deviates by more than 1 percentage point in either direction." },
      { question: "Why is deflation potentially worse than inflation?", answer: "Deflation can cause: consumers delaying purchases (expecting lower prices), rising real debt burdens, falling profits leading to unemployment, and a deflationary spiral. Japan experienced this for decades. A small positive inflation rate (2%) avoids these risks." },
      { question: "What is the difference between inflation and hyperinflation?", answer: "Inflation is a moderate, sustained price rise. Hyperinflation is extremely rapid inflation (50%+ per month) that destroys the currency's purchasing power — as seen in Zimbabwe (2008) and Venezuela (2018). Causes include excessive money printing to finance government deficits." },
    ],
    relatedSlugs: ["aqa-economics-monetary-policy", "aqa-economics-economic-growth", "aqa-economics-fiscal-policy"],
  },
  {
    slug: "aqa-economics-unemployment", topic: "Unemployment", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "Unemployment is measured by the claimant count and the Labour Force Survey. AQA tests types of unemployment and the policies used to reduce each type.",
    keyConcepts: ["Types: cyclical (demand-deficient), structural, frictional, seasonal, real wage", "Measurement: claimant count vs ILO/LFS measure", "Natural rate of unemployment (NAIRU)", "Costs: lost output, fiscal costs, social costs, hysteresis", "Policies: demand-side for cyclical, supply-side for structural"],
    examQuestions: ["Evaluate the most effective policies for reducing unemployment in the UK (25 marks)", "Explain the difference between demand-deficient and structural unemployment (9 marks)", "Assess the significance of the natural rate of unemployment (15 marks)"],
    faqs: [
      { question: "What is the natural rate of unemployment?", answer: "The level of unemployment that exists when the labour market is in equilibrium — it includes frictional and structural unemployment but NOT cyclical. The economy is at full employment when actual unemployment equals the natural rate." },
      { question: "Why do the claimant count and LFS give different figures?", answer: "The claimant count only measures people claiming unemployment benefits (JSA/Universal Credit). The LFS uses the ILO definition: anyone without work, available to work, and actively seeking work. LFS is typically higher as it captures people not claiming benefits." },
      { question: "What is hysteresis?", answer: "When a period of high cyclical unemployment causes a permanent increase in the natural rate — because long-term unemployed workers lose skills, motivation, and employability. This means demand-side policies alone may not be enough." },
    ],
    relatedSlugs: ["aqa-economics-fiscal-policy", "aqa-economics-supply-side-policies", "aqa-economics-economic-growth"],
  },
  {
    slug: "aqa-economics-international-trade", topic: "International Trade", examBoard: "AQA", subject: "Economics", productSlug: "aqa-economics",
    intro: "International trade theory and the balance of payments are key AQA Paper 2 topics. You need to understand comparative advantage, protectionism, and the UK's trading position.",
    keyConcepts: ["Absolute and comparative advantage", "Free trade benefits: lower prices, greater choice, specialisation, competition", "Arguments for protectionism: infant industries, dumping, national security, strategic trade policy", "Tariffs, quotas, subsidies, and non-tariff barriers", "Balance of payments: current account, capital/financial account", "WTO and regional trading blocs"],
    examQuestions: ["Evaluate the view that free trade always benefits all countries involved (25 marks)", "Using a diagram, explain the effects of imposing a tariff on imported goods (9 marks)", "Assess the significance of the UK's current account deficit (15 marks)"],
    faqs: [
      { question: "What is comparative advantage?", answer: "A country has a comparative advantage in producing a good if it can produce it at a lower opportunity cost than other countries. Even if Country A is better at producing everything (absolute advantage), both countries benefit by specialising in their comparative advantage and trading." },
      { question: "When is protectionism justified?", answer: "Infant industry argument (new industries need temporary protection), anti-dumping (foreign firms selling below cost), national security (defence industries), and correcting trade imbalances. However, protectionism can lead to retaliation, higher prices, and reduced competition." },
      { question: "What causes a current account deficit?", answer: "When a country imports more goods and services than it exports. Causes include: a strong exchange rate making exports expensive, high consumer spending on imports, declining competitiveness, and a loss of comparative advantage in key sectors." },
    ],
    relatedSlugs: ["aqa-economics-fiscal-policy", "aqa-economics-economic-growth", "aqa-economics-supply-side-policies"],
  },

  // ── Edexcel Economics (top topics) ────────────────────────────────────────

  {
    slug: "edexcel-economics-market-failure", topic: "Market Failure", examBoard: "Edexcel", subject: "Economics", productSlug: "edexcel-economics",
    intro: "Market failure is when free markets produce an inefficient allocation of resources. It is central to Edexcel Theme 1 and regularly appears as data response questions in Papers 1 and 3.",
    keyConcepts: ["Externalities: divergence between social and private costs/benefits", "Public goods: non-rival and non-excludable", "Information gaps and asymmetric information", "Monopoly power and market dominance", "Factor immobility", "Government intervention and government failure"],
    examQuestions: ["Evaluate the view that market failure always justifies government intervention (25 marks)", "With reference to the extract, explain two causes of market failure in the market described (8 marks)", "Assess the effectiveness of subsidies in correcting positive externalities (12 marks)"],
    faqs: [
      { question: "How is market failure different in Edexcel vs AQA?", answer: "The concepts are identical, but Edexcel tests them with data response questions that include extracts and data — you need to reference the source material in your answers, not just recall theory." },
      { question: "What are information gaps?", answer: "When consumers or producers lack complete information to make rational decisions. For example, smokers may not fully understand the health risks, leading to over-consumption of demerit goods." },
      { question: "How do I use the extract in my answer?", answer: "In Edexcel data response questions, you MUST reference the extract. Use phrases like 'as shown in Extract A...', 'the data suggests...', and 'this is evidenced by...' to link theory to the stimulus material." },
    ],
    relatedSlugs: ["edexcel-economics-externalities", "edexcel-economics-government-intervention", "edexcel-economics-monopoly"],
  },
  {
    slug: "edexcel-economics-externalities", topic: "Externalities", examBoard: "Edexcel", subject: "Economics", productSlug: "edexcel-economics",
    intro: "Externalities are third-party effects not reflected in market prices. Edexcel Theme 1 requires you to draw externality diagrams and evaluate corrective policies with reference to data.",
    keyConcepts: ["Negative externalities in production and consumption", "Positive externalities in production and consumption", "Welfare loss and gain diagrams", "Corrective policies: Pigouvian taxes, subsidies, regulation, tradeable permits", "Limitations of each policy approach"],
    examQuestions: ["With reference to the data, explain how negative externalities cause market failure (5 marks)", "Evaluate the effectiveness of carbon taxes in reducing pollution (15 marks)", "Using a diagram, assess the case for subsidising renewable energy (12 marks)"],
    faqs: [
      { question: "What is the Edexcel approach to externality diagrams?", answer: "Edexcel uses MSC/MPC and MSB/MPB notation. Make sure your diagram shows: the free market quantity (where MPC = MPB), the social optimum (where MSC = MSB), and the welfare loss triangle between them." },
      { question: "How do I evaluate a tax as a solution?", answer: "Advantages: raises revenue, internalises the externality, market-based. Limitations: difficult to calculate the correct tax rate, regressive (hurts lower incomes more), may not change behaviour if demand is inelastic, firms may relocate." },
    ],
    relatedSlugs: ["edexcel-economics-market-failure", "edexcel-economics-government-intervention", "edexcel-economics-monopoly"],
  },
  {
    slug: "edexcel-economics-fiscal-policy", topic: "Fiscal Policy", examBoard: "Edexcel", subject: "Economics", productSlug: "edexcel-economics",
    intro: "Fiscal policy involves changes to government spending and taxation to influence aggregate demand. Edexcel Theme 2 tests it heavily, especially in data response questions about UK economic performance.",
    keyConcepts: ["Expansionary and contractionary fiscal policy", "Government spending multiplier", "Automatic stabilisers: progressive taxes, unemployment benefits", "Budget deficit and national debt implications", "Fiscal rules and constraints", "Comparison with monetary and supply-side policies"],
    examQuestions: ["With reference to the extracts, evaluate the effectiveness of fiscal policy in promoting economic growth (15 marks)", "Assess the view that the government should always aim for a balanced budget (12 marks)", "Using a diagram, explain the impact of a reduction in income tax on aggregate demand (5 marks)"],
    faqs: [
      { question: "What is the difference between Edexcel and AQA on fiscal policy?", answer: "The theory is the same, but Edexcel emphasises data-driven analysis — you will be given real UK data on government spending, tax receipts, and deficits, and need to interpret it alongside your theory." },
      { question: "What is the multiplier effect?", answer: "An initial injection of spending creates a larger final increase in national income because the recipients of the spending re-spend a proportion. The size depends on the marginal propensity to consume (MPC). Multiplier = 1/(1-MPC)." },
    ],
    relatedSlugs: ["edexcel-economics-monetary-policy", "edexcel-economics-supply-side-policies", "edexcel-economics-economic-growth"],
  },
  {
    slug: "edexcel-economics-monetary-policy", topic: "Monetary Policy", examBoard: "Edexcel", subject: "Economics", productSlug: "edexcel-economics",
    intro: "Monetary policy is set by the Bank of England through interest rates and QE. Edexcel Theme 2 and Paper 3 frequently test the transmission mechanism and its limitations.",
    keyConcepts: ["Bank of England independence and the MPC", "Interest rate transmission mechanism", "Quantitative easing (QE) and its effects", "Exchange rate effects of interest rate changes", "Limitations: time lags, confidence effects, credit availability", "Forward guidance"],
    examQuestions: ["Evaluate the effectiveness of monetary policy in managing inflation in the UK (25 marks)", "With reference to the data, explain how a rise in interest rates affects consumer spending (8 marks)", "Assess the case for using QE when interest rates are near zero (12 marks)"],
    faqs: [
      { question: "Why is the Bank of England independent?", answer: "Independence reduces political influence over monetary policy — governments might be tempted to lower interest rates before elections. Independent central banks tend to achieve lower, more stable inflation because they focus on the CPI target rather than political cycles." },
      { question: "How does QE work?", answer: "The BoE creates new money electronically and uses it to buy government bonds from financial institutions. This increases the money supply, pushes down long-term interest rates, and encourages lending and spending. It was used after 2008 and during COVID." },
    ],
    relatedSlugs: ["edexcel-economics-fiscal-policy", "edexcel-economics-supply-side-policies", "edexcel-economics-inflation"],
  },
  {
    slug: "edexcel-economics-monopoly", topic: "Monopoly", examBoard: "Edexcel", subject: "Economics", productSlug: "edexcel-economics",
    intro: "Monopoly is a key market structure in Edexcel Theme 3. You need to analyse efficiency, evaluate regulation, and compare with other market structures using diagrams.",
    keyConcepts: ["Sources of monopoly power: barriers to entry, economies of scale, legal protection", "Profit maximisation: MC = MR", "Efficiency: allocative, productive, dynamic, X-inefficiency", "Natural monopoly", "Price discrimination", "Regulation: CMA, price capping, forced divestiture"],
    examQuestions: ["Evaluate the view that monopolies should always be broken up (25 marks)", "Using a diagram, explain why a monopolist charges a higher price and produces less output than a competitive market (8 marks)", "Assess the benefits and costs of price discrimination for consumers (12 marks)"],
    faqs: [
      { question: "What is X-inefficiency?", answer: "When a firm lacks competitive pressure and allows costs to rise above the minimum — e.g. overstaffing, wasteful spending, lack of innovation. It is a specific criticism of monopoly that goes beyond allocative and productive inefficiency." },
      { question: "What is the difference between first, second, and third degree price discrimination?", answer: "First degree: charge each consumer their maximum willingness to pay. Second degree: charge different prices based on quantity (bulk discounts). Third degree: charge different prices to different groups (e.g. student discounts, peak/off-peak pricing)." },
    ],
    relatedSlugs: ["edexcel-economics-oligopoly", "edexcel-economics-market-failure", "edexcel-economics-government-intervention"],
  },
  {
    slug: "edexcel-economics-oligopoly", topic: "Oligopoly", examBoard: "Edexcel", subject: "Economics", productSlug: "edexcel-economics",
    intro: "Oligopoly features heavily in Edexcel Theme 3. Data response questions often use real-world oligopoly examples — supermarkets, energy firms, tech companies.",
    keyConcepts: ["Interdependence and uncertainty", "Kinked demand curve model", "Game theory and Nash equilibrium", "Collusion vs competition", "Non-price competition", "Concentration ratios and Herfindahl-Hirschman Index"],
    examQuestions: ["With reference to the extract, evaluate whether the market described is best characterised as an oligopoly (12 marks)", "Using game theory, explain why firms in an oligopoly may choose not to lower prices (8 marks)", "Evaluate the effectiveness of competition policy in oligopolistic markets (25 marks)"],
    faqs: [
      { question: "What is the Herfindahl-Hirschman Index (HHI)?", answer: "The HHI is the sum of the squared market shares of all firms. HHI < 1,000 = competitive, 1,000-1,800 = moderately concentrated, > 1,800 = highly concentrated. It gives more weight to larger firms than a simple concentration ratio." },
      { question: "What is a Nash equilibrium?", answer: "A situation where no player can improve their payoff by unilaterally changing strategy, given the strategies of other players. In oligopoly, the Nash equilibrium often results in both firms competing even when collusion would benefit them both." },
    ],
    relatedSlugs: ["edexcel-economics-monopoly", "edexcel-economics-market-failure", "edexcel-economics-government-intervention"],
  },
  {
    slug: "edexcel-economics-supply-side-policies", topic: "Supply-Side Policies", examBoard: "Edexcel", subject: "Economics", productSlug: "edexcel-economics",
    intro: "Supply-side policies shift LRAS right, increasing the economy's productive potential. Edexcel Theme 2 tests both free-market and interventionist approaches with data-driven evaluation.",
    keyConcepts: ["Free-market policies: deregulation, privatisation, flexible labour markets, tax reform", "Interventionist policies: education, infrastructure, R&D support", "Impact on LRAS, potential output, and the PPF", "Long time lags and uncertainty", "Distributional consequences"],
    examQuestions: ["Evaluate the view that supply-side policies are the most effective way to achieve long-run economic growth (25 marks)", "With reference to the data, assess the impact of increased government spending on education on the UK economy (12 marks)", "Using a diagram, explain how deregulation can increase aggregate supply (5 marks)"],
    faqs: [
      { question: "How do I evaluate supply-side policies in a 25-marker?", answer: "Analyse 2-3 specific policies, explain how each shifts LRAS, use an AD/AS diagram, then evaluate: time lags, opportunity cost of funding, equity concerns, uncertainty about effectiveness, and comparison with demand-side alternatives." },
      { question: "What is the link between supply-side policies and unemployment?", answer: "Supply-side policies can reduce the natural rate of unemployment by improving labour market flexibility, skills, and mobility. However, free-market supply-side policies (like reducing union power) may increase inequality." },
    ],
    relatedSlugs: ["edexcel-economics-fiscal-policy", "edexcel-economics-monetary-policy", "edexcel-economics-economic-growth"],
  },
  {
    slug: "edexcel-economics-government-intervention", topic: "Government Intervention", examBoard: "Edexcel", subject: "Economics", productSlug: "edexcel-economics",
    intro: "Government intervention to correct market failure is a core evaluation topic in Edexcel Theme 1. You must assess whether intervention actually improves outcomes — and consider government failure.",
    keyConcepts: ["Taxes and subsidies to internalise externalities", "Regulation and legislation", "Price controls: maximum and minimum prices", "State provision of public and merit goods", "Information provision", "Government failure: unintended consequences, bureaucracy, rent-seeking"],
    examQuestions: ["Evaluate the effectiveness of government intervention in correcting market failure (25 marks)", "With reference to Extract B, assess the impact of a minimum price on alcohol (10 marks)", "Using a diagram, explain how a subsidy could correct the under-consumption of a merit good (5 marks)"],
    faqs: [
      { question: "What is government failure and why does it matter?", answer: "Government failure is when intervention worsens the misallocation of resources. It matters because it's the key counter-argument to any proposal for government intervention — examiners want to see you weigh intervention benefits against the risk of government failure." },
      { question: "How do maximum and minimum prices cause market failure?", answer: "A maximum price below equilibrium creates excess demand (shortage). A minimum price above equilibrium creates excess supply (surplus). Both distort market signals and can lead to inefficiency, black markets, or wasteful surplus." },
    ],
    relatedSlugs: ["edexcel-economics-market-failure", "edexcel-economics-externalities", "edexcel-economics-fiscal-policy"],
  },
  {
    slug: "edexcel-economics-economic-growth", topic: "Economic Growth", examBoard: "Edexcel", subject: "Economics", productSlug: "edexcel-economics",
    intro: "Economic growth — the increase in real GDP — is the central objective in Edexcel Theme 2. You need to evaluate whether growth is always beneficial and which policies best promote it.",
    keyConcepts: ["Actual vs potential growth", "GDP and its limitations as a measure of welfare", "Causes: investment, human capital, technology, institutional quality", "Short-run growth via AD increases", "Long-run growth via LRAS shifts", "Trade-offs: growth vs environment, growth vs equality"],
    examQuestions: ["Evaluate the extent to which GDP is an adequate measure of economic welfare (25 marks)", "With reference to the data, assess the causes of the UK's productivity slowdown (12 marks)", "Using a diagram, explain how increased investment leads to economic growth (5 marks)"],
    faqs: [
      { question: "Why is GDP a poor measure of welfare?", answer: "GDP ignores: income distribution, environmental degradation, unpaid work (caring, volunteering), the informal economy, quality of life factors, and sustainability. Alternative measures include HDI, GNH, and the Genuine Progress Indicator." },
      { question: "What is the productivity puzzle?", answer: "Since 2008, UK productivity growth has been much slower than its pre-crisis trend and slower than other developed economies. Causes debated include: low investment, zombie firms surviving on low interest rates, skills gaps, and sectoral shifts away from high-productivity manufacturing." },
    ],
    relatedSlugs: ["edexcel-economics-supply-side-policies", "edexcel-economics-fiscal-policy", "edexcel-economics-inflation"],
  },
  {
    slug: "edexcel-economics-inflation", topic: "Inflation", examBoard: "Edexcel", subject: "Economics", productSlug: "edexcel-economics",
    intro: "Inflation is tested extensively in Edexcel Theme 2 and Paper 3 synoptic questions. You need to distinguish demand-pull from cost-push and evaluate the BoE's response.",
    keyConcepts: ["CPI measurement and its limitations", "Demand-pull inflation: excess AD", "Cost-push inflation: rising production costs", "Wage-price spiral", "Consequences: redistribution, uncertainty, competitiveness", "Phillips Curve and the expectations-augmented Phillips Curve"],
    examQuestions: ["Evaluate the view that inflation is always harmful to the economy (25 marks)", "With reference to the data, explain the main causes of the UK's recent inflationary pressures (8 marks)", "Using a Phillips Curve diagram, assess the trade-off between inflation and unemployment (12 marks)"],
    faqs: [
      { question: "What are the limitations of CPI?", answer: "CPI may not reflect individual experience (different spending patterns), excludes housing costs (CPIH includes them), suffers from substitution bias, quality adjustment problems, and the basket of goods may not represent all consumers." },
      { question: "What is the expectations-augmented Phillips Curve?", answer: "Friedman and Phelps argued the trade-off is only short-run. In the long run, workers adjust wage expectations to actual inflation, so unemployment returns to the natural rate at any inflation rate. This implies there is no long-run trade-off." },
    ],
    relatedSlugs: ["edexcel-economics-monetary-policy", "edexcel-economics-economic-growth", "edexcel-economics-fiscal-policy"],
  },
];

export const REVISION_TOPICS: RevisionTopic[] = AQA_ECON;
