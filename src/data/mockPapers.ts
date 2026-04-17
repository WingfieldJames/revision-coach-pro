// Complete mock paper definitions for all subjects
// Each paper matches the real exam structure for its board

interface QuestionDef {
  question_number: string;
  question_text: string;
  marks_available: number;
  question_type: string;
  section: string;
  extract_text?: string;
  diagram_required?: boolean;
  options?: string[];
}

interface PaperDef {
  exam_board: string;
  subject: string;
  paper_number: number;
  paper_name: string;
  year: number;
  total_marks: number;
  time_limit_minutes: number;
  product_slug: string;
  sections: { id: string; name: string; questions: string[] }[];
  questions: QuestionDef[];
}

function q(num: string, text: string, marks: number, type: string, section: string, extra?: Partial<QuestionDef>): QuestionDef {
  return { question_number: num, question_text: text, marks_available: marks, question_type: type, section, ...extra };
}

function mcq(num: string, text: string, section: string, options: string[]): QuestionDef {
  return { question_number: num, question_text: text, marks_available: 1, question_type: "MCQ", section, options };
}

// ═══════════════════════════════════════════════════════════════════════════
// EDEXCEL ECONOMICS — Papers 1, 2, 3
// Structure: P1/P2 = Section A (5×5m short answer) + Section B (data response 50m) + Section C (essay 25m)
// P3 = two data response sections with choice on final question
// ═══════════════════════════════════════════════════════════════════════════

const EDEXCEL_ECON_P1_2023: PaperDef = {
  exam_board: "Edexcel", subject: "Economics", paper_number: 1, year: 2023, total_marks: 100, time_limit_minutes: 120,
  paper_name: "Edexcel Economics A Paper 1: Markets and Business Behaviour (June 2023)",
  product_slug: "edexcel-economics",
  sections: [
    { id: "A", name: "Section A: Short Answer Questions", questions: ["1","2","3","4","5"] },
    { id: "B", name: "Section B: Data Response — Housing Market", questions: ["6a","6b","6c","6d","6e"] },
    { id: "C", name: "Section C: Essay (choose one)", questions: ["7","8"] },
  ],
  questions: [
    q("1", "Define the term 'price elasticity of demand'.", 2, "2-marker", "A"),
    q("2", "With the help of a diagram, explain how a maximum price set below the equilibrium price would affect the market.", 5, "5-marker", "A", { diagram_required: true }),
    q("3", "Explain one reason why a firm in a monopolistically competitive market can only earn normal profit in the long run.", 5, "5-marker", "A"),
    q("4", "With the help of a diagram, explain how an increase in the minimum wage above the equilibrium wage rate may lead to unemployment.", 5, "5-marker", "A", { diagram_required: true }),
    q("5", "Calculate the cross elasticity of demand when the price of good X rises by 15% and the demand for good Y falls by 30%. State the relationship between goods X and Y.", 5, "5-marker", "A"),
    q("6a", "With reference to Extract A, identify two significant features of the data shown.", 5, "5-marker", "B", { extract_text: "Extract A shows data on UK house prices and housing supply from 2018 to 2023. Average house prices rose from £230,000 in 2018 to £290,000 in 2023, a 26% increase. New housing completions fell from 195,000 to 170,000 per year. The ratio of median house prices to median earnings reached 8.3 in 2023, compared to 7.8 in 2018." }),
    q("6b", "With reference to the information provided, explain how the concept of price elasticity of supply is relevant to the UK housing market.", 8, "8-marker", "B"),
    q("6c", "With reference to Extract B and your own knowledge, assess the view that government subsidies for first-time buyers are the most effective policy to improve housing affordability.", 10, "10-marker", "B", { extract_text: "Extract B: The Help to Buy scheme supported over 350,000 purchases by 2023. Critics argue the policy inflated prices by increasing demand without addressing supply constraints. The OBR estimated Help to Buy increased prices by 0.8% overall, but by up to 5% in some areas." }),
    q("6d", "With reference to the extracts and your own knowledge, evaluate government intervention in the UK housing market. Consider both demand-side and supply-side policies.", 12, "12-marker", "B"),
    q("6e", "Evaluate the view that the UK housing market is a clear example of market failure that justifies significant government intervention.", 15, "15-marker", "B"),
    q("7", "Evaluate the view that monopoly power is always detrimental to consumer welfare. Refer to at least one diagram in your answer.", 25, "25-marker", "C", { diagram_required: true }),
    q("8", "Evaluate the extent to which contestable markets deliver better outcomes for consumers than oligopolistic markets. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
  ],
};

const EDEXCEL_ECON_P2_2023: PaperDef = {
  exam_board: "Edexcel", subject: "Economics", paper_number: 2, year: 2023, total_marks: 100, time_limit_minutes: 120,
  paper_name: "Edexcel Economics A Paper 2: The National and Global Economy (June 2023)",
  product_slug: "edexcel-economics",
  sections: [
    { id: "A", name: "Section A: Short Answer Questions", questions: ["1","2","3","4","5"] },
    { id: "B", name: "Section B: Data Response — UK Inflation", questions: ["6a","6b","6c","6d","6e"] },
    { id: "C", name: "Section C: Essay (choose one)", questions: ["7","8"] },
  ],
  questions: [
    q("1", "Define the term 'aggregate demand'.", 2, "2-marker", "A"),
    q("2", "With the help of a diagram, explain the impact of a fall in consumer confidence on the level of real GDP.", 5, "5-marker", "A", { diagram_required: true }),
    q("3", "Explain one way in which supply-side policies differ from demand-side policies.", 5, "5-marker", "A"),
    q("4", "Using the data: UK imports = £650bn, UK exports = £580bn, GDP = £2,200bn. Calculate the current account balance as a % of GDP.", 5, "5-marker", "A"),
    q("5", "Explain one reason why a government might choose to devalue its currency.", 5, "5-marker", "A"),
    q("6a", "With reference to Extract A, identify two significant features of the data shown.", 5, "5-marker", "B", { extract_text: "UK CPI inflation rose from 0.7% in Jan 2021 to 11.1% in Oct 2022, before falling to 6.7% by Sep 2023. The Bank of England base rate increased 14 consecutive times to reach 5.25% by Aug 2023. Average real wages fell by 3.1% in the year to March 2023." }),
    q("6b", "With reference to the information provided, explain how cost-push factors contributed to the inflationary pressures experienced by the UK economy.", 8, "8-marker", "B"),
    q("6c", "With reference to Extract B and your own knowledge, assess the effectiveness of monetary policy in controlling inflation in the UK.", 10, "10-marker", "B", { extract_text: "The MPC raised rates from 0.1% to 5.25%. Mortgage approvals fell 28%. Inflation remained above the 2% target throughout 2023. Some economists argue monetary policy is less effective against supply-side inflation. Business investment fell 1.2%." }),
    q("6d", "With reference to the extracts and your own knowledge, evaluate the trade-offs the Bank of England faces when setting interest rates during a period of high inflation and low growth.", 12, "12-marker", "B"),
    q("6e", "Evaluate the view that fiscal policy would be more effective than monetary policy in managing the UK economy during the current macroeconomic environment.", 15, "15-marker", "B"),
    q("7", "Evaluate the effectiveness of supply-side policies in promoting long-run economic growth. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
    q("8", "Evaluate the view that a floating exchange rate system is always preferable to a fixed exchange rate system. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
  ],
};

const EDEXCEL_ECON_P3_2023: PaperDef = {
  exam_board: "Edexcel", subject: "Economics", paper_number: 3, year: 2023, total_marks: 100, time_limit_minutes: 120,
  paper_name: "Edexcel Economics A Paper 3: Microeconomics and Macroeconomics (June 2023)",
  product_slug: "edexcel-economics",
  sections: [
    { id: "A", name: "Section A: Micro Data Response", questions: ["1a","1b","1c","1d","1e"] },
    { id: "B", name: "Section B: Macro Data Response", questions: ["2a","2b","2c","2d","2e"] },
  ],
  questions: [
    q("1a", "With reference to Extract A, identify two significant features of the data shown.", 5, "5-marker", "A", { extract_text: "Extract A shows UK energy market data. Average dual fuel bills rose from £1,138 in 2021 to £2,500 in 2023 under the Energy Price Guarantee. The five largest suppliers control 73% of the market, down from 95% in 2015. Ofgem investigated claims of excess profits totalling £7.5bn across major suppliers." }),
    q("1b", "With reference to the information provided, explain how barriers to entry affect competition in the UK energy market.", 8, "8-marker", "A"),
    q("1c", "With reference to Extract B and your own knowledge, evaluate the effectiveness of Ofgem as a regulator of the UK energy market.", 12, "12-marker", "A", { extract_text: "Extract B: Ofgem sets the energy price cap to protect consumers. However, 29 energy suppliers collapsed between 2021 and 2023, affecting 4.3 million customers. Critics argue the price cap prevented suppliers from covering costs, while supporters say it saved households an average of £500/year." }),
    q("1d", "Evaluate the view that nationalisation of the UK energy market would benefit consumers more than the current regulatory approach. [Answer EITHER 1d OR 1e]", 25, "25-marker", "A", { diagram_required: true }),
    q("1e", "Evaluate the view that price cap regulation is the best method of protecting consumers in markets with significant monopoly power. [Answer EITHER 1d OR 1e]", 25, "25-marker", "A", { diagram_required: true }),
    q("2a", "With reference to Extract C, identify two significant features of the data shown.", 5, "5-marker", "B", { extract_text: "Extract C: UK government debt reached 100% of GDP in 2023 (£2.5 trillion). Annual borrowing was £128bn. Tax revenue as a share of GDP rose to 37%, the highest since the 1940s. The OBR projected that without policy changes, debt would reach 310% of GDP by 2070 due to an ageing population." }),
    q("2b", "With reference to the information provided, explain how an ageing population creates challenges for fiscal policy.", 8, "8-marker", "B"),
    q("2c", "With reference to Extract D and your own knowledge, evaluate whether raising taxes or cutting spending is more effective in reducing government debt.", 12, "12-marker", "B", { extract_text: "Extract D: The IMF recommends a mix of spending restraint and tax reform. Analysis shows that spending-based consolidation tends to be less contractionary than tax-based consolidation. However, cutting public investment can reduce long-term growth potential." }),
    q("2d", "Evaluate the view that the UK government should prioritise reducing debt over stimulating economic growth. [Answer EITHER 2d OR 2e]", 25, "25-marker", "B", { diagram_required: true }),
    q("2e", "Evaluate the view that monetary policy is more effective than fiscal policy in managing the UK macroeconomy. [Answer EITHER 2d OR 2e]", 25, "25-marker", "B", { diagram_required: true }),
  ],
};

const EDEXCEL_ECON_P1_2022: PaperDef = {
  exam_board: "Edexcel", subject: "Economics", paper_number: 1, year: 2022, total_marks: 100, time_limit_minutes: 120,
  paper_name: "Edexcel Economics A Paper 1: Markets and Business Behaviour (June 2022)",
  product_slug: "edexcel-economics",
  sections: [
    { id: "A", name: "Section A: Short Answer Questions", questions: ["1","2","3","4","5"] },
    { id: "B", name: "Section B: Data Response — UK Supermarkets", questions: ["6a","6b","6c","6d","6e"] },
    { id: "C", name: "Section C: Essay (choose one)", questions: ["7","8"] },
  ],
  questions: [
    q("1", "Define the term 'allocative efficiency'.", 2, "2-marker", "A"),
    q("2", "With the help of a diagram, explain how a subsidy on electric vehicles would affect the market.", 5, "5-marker", "A", { diagram_required: true }),
    q("3", "Explain one reason why a natural monopoly may be more efficient than a competitive market.", 5, "5-marker", "A"),
    q("4", "Calculate the concentration ratio of the top 4 firms given these market shares: Firm A 27%, Firm B 15%, Firm C 10%, Firm D 9%, Others 39%.", 5, "5-marker", "A"),
    q("5", "Explain one difference between a merger and a takeover.", 5, "5-marker", "A"),
    q("6a", "With reference to Extract A, identify two significant features of the data shown.", 5, "5-marker", "B", { extract_text: "UK supermarket shares (2019–2022): Tesco fell 27.4% to 26.9%, Aldi rose 7.9% to 9.3%, Lidl 5.9% to 7.1%. Grocery market grew from £203bn to £228bn. Food prices rose 16.4% in the year to March 2023." }),
    q("6b", "With reference to the information provided, explain how the characteristics of an oligopoly are demonstrated in the UK supermarket industry.", 8, "8-marker", "B"),
    q("6c", "With reference to Extract B and your own knowledge, assess the extent to which discount supermarkets have increased contestability in the UK grocery market.", 10, "10-marker", "B", { extract_text: "Aldi and Lidl opened 400+ UK stores since 2015 (£3.5bn invested). Combined share doubled from 8% to 16.4%. Aldi baskets ~20% cheaper. But new supermarkets cost £30m-£50m, planning takes 12-18 months, and established retailers control prime locations." }),
    q("6d", "With reference to the extracts, evaluate the impact of non-price competition on consumer welfare in the UK supermarket industry.", 12, "12-marker", "B"),
    q("6e", "Evaluate the view that the CMA is effective in promoting competition and protecting consumers in oligopolistic markets.", 15, "15-marker", "B"),
    q("7", "Evaluate the view that third-degree price discrimination always benefits producers more than consumers. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
    q("8", "Evaluate the view that perfect competition leads to the most efficient allocation of resources. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
  ],
};

const EDEXCEL_ECON_P2_2022: PaperDef = {
  exam_board: "Edexcel", subject: "Economics", paper_number: 2, year: 2022, total_marks: 100, time_limit_minutes: 120,
  paper_name: "Edexcel Economics A Paper 2: The National and Global Economy (June 2022)",
  product_slug: "edexcel-economics",
  sections: [
    { id: "A", name: "Section A: Short Answer Questions", questions: ["1","2","3","4","5"] },
    { id: "B", name: "Section B: Data Response — UK Government Spending", questions: ["6a","6b","6c","6d","6e"] },
    { id: "C", name: "Section C: Essay (choose one)", questions: ["7","8"] },
  ],
  questions: [
    q("1", "Define the term 'real GDP'.", 2, "2-marker", "A"),
    q("2", "With the help of a diagram, explain the likely effect of a significant rise in oil prices on the UK economy.", 5, "5-marker", "A", { diagram_required: true }),
    q("3", "Explain one reason why a government might impose a tariff on imported goods.", 5, "5-marker", "A"),
    q("4", "Using the data: nominal GDP = £2,300bn, GDP deflator = 115. Calculate real GDP.", 5, "5-marker", "A"),
    q("5", "Explain one advantage of a flexible exchange rate system.", 5, "5-marker", "A"),
    q("6a", "With reference to Extract A, identify two significant features of the data shown.", 5, "5-marker", "B", { extract_text: "UK government spending rose from £842bn (39% GDP) in 2018/19 to £1,047bn (44% GDP) in 2021/22. National debt increased from £1.8tn (84% GDP) to £2.5tn (100% GDP). Debt interest reached £111bn in 2022/23, up from £38bn in 2019/20." }),
    q("6b", "With reference to the information, explain the difference between a budget deficit and the national debt, and why both matter for macroeconomic stability.", 8, "8-marker", "B"),
    q("6c", "With reference to Extract B, assess the view that austerity measures are necessary to reduce the national debt.", 10, "10-marker", "B", { extract_text: "The UK spent £370bn on COVID emergency support. The IMF recommended fiscal consolidation. The OECD noted premature austerity after 2008 slowed recovery. UK debt-to-GDP at 100% compares to Japan 263%, Italy 145%, US 123%." }),
    q("6d", "With reference to the extracts, evaluate automatic stabilisers versus discretionary fiscal policy in managing the economic cycle.", 12, "12-marker", "B"),
    q("6e", "Evaluate the view that the government should prioritise reducing the budget deficit over promoting economic growth.", 15, "15-marker", "B"),
    q("7", "Evaluate the view that demand-side policies alone are sufficient to achieve sustained economic growth and full employment. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
    q("8", "Evaluate the extent to which income and wealth inequality is an inevitable consequence of a market economy. Refer to at least one diagram.", 25, "25-marker", "C", { diagram_required: true }),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// AQA ECONOMICS — Papers 1, 2, 3
// P1/P2 = data response (choice 1 of 2) + essay (choice 1 of 3)
// P3 = 30 MCQs + case study
// ═══════════════════════════════════════════════════════════════════════════

const AQA_ECON_P1_2023: PaperDef = {
  exam_board: "AQA", subject: "Economics", paper_number: 1, year: 2023, total_marks: 80, time_limit_minutes: 120,
  paper_name: "AQA Economics Paper 1: Markets and Market Failure (June 2023)",
  product_slug: "aqa-economics",
  sections: [
    { id: "A", name: "Section A: Data Response (compulsory)", questions: ["1a","1b","1c","1d"] },
    { id: "B", name: "Section B: Essay (choose one)", questions: ["2","3","4"] },
  ],
  questions: [
    q("1a", "Using Extract A, calculate the percentage change in UK renewable energy output between 2018 and 2023 and explain its significance.", 4, "4-marker", "A", { extract_text: "UK renewable energy output rose from 110 TWh in 2018 to 155 TWh in 2023. Total electricity consumption was 300 TWh in 2023. Government subsidies for renewables totalled £12bn in 2023." }),
    q("1b", "Explain, using a diagram, how a subsidy on renewable energy affects the market for electricity.", 9, "9-marker", "A", { diagram_required: true }),
    q("1c", "Using the data and your own economic knowledge, evaluate the effectiveness of government subsidies in correcting the market failure associated with carbon emissions.", 15, "15-marker", "A"),
    q("1d", "Using the data and your own knowledge, evaluate the extent to which a carbon tax would be more effective than subsidies in reducing carbon emissions.", 25, "25-marker", "A"),
    q("2", "Evaluate the view that indirect taxes are the most effective way to correct negative externalities. [25 marks]", 25, "25-marker", "B"),
    q("3", "Evaluate the view that contestable markets always lead to better outcomes for consumers than monopoly. [25 marks]", 25, "25-marker", "B"),
    q("4", "Evaluate the effectiveness of competition policy in promoting efficiency and protecting consumers. [25 marks]", 25, "25-marker", "B"),
  ],
};

const AQA_ECON_P2_2023: PaperDef = {
  exam_board: "AQA", subject: "Economics", paper_number: 2, year: 2023, total_marks: 80, time_limit_minutes: 120,
  paper_name: "AQA Economics Paper 2: The National Economy in a Global Context (June 2023)",
  product_slug: "aqa-economics",
  sections: [
    { id: "A", name: "Section A: Data Response (compulsory)", questions: ["1a","1b","1c","1d"] },
    { id: "B", name: "Section B: Essay (choose one)", questions: ["2","3","4"] },
  ],
  questions: [
    q("1a", "Using Extract A, calculate the UK's current account balance as a percentage of GDP in 2023.", 4, "4-marker", "A", { extract_text: "UK GDP was £2,274bn in 2023. Current account deficit was £68bn. Goods exports £354bn, imports £508bn. Services exports £397bn, imports £242bn." }),
    q("1b", "Explain, using an AD/AS diagram, the likely impact of a significant fall in the value of sterling on the UK economy.", 9, "9-marker", "A", { diagram_required: true }),
    q("1c", "Using the data and your own knowledge, assess the significance of the UK's current account deficit for long-term macroeconomic performance.", 15, "15-marker", "A"),
    q("1d", "Evaluate the view that supply-side policies are more effective than demand-side policies in reducing a current account deficit.", 25, "25-marker", "A"),
    q("2", "Evaluate the effectiveness of quantitative easing as a tool of monetary policy. [25 marks]", 25, "25-marker", "B"),
    q("3", "Evaluate the view that globalisation inevitably increases income inequality within developed economies. [25 marks]", 25, "25-marker", "B"),
    q("4", "Evaluate the view that economic growth is always desirable. [25 marks]", 25, "25-marker", "B"),
  ],
};

const AQA_ECON_P3_2023: PaperDef = {
  exam_board: "AQA", subject: "Economics", paper_number: 3, year: 2023, total_marks: 80, time_limit_minutes: 120,
  paper_name: "AQA Economics Paper 3: Economic Principles and Issues (June 2023)",
  product_slug: "aqa-economics",
  sections: [
    { id: "A", name: "Section A: Multiple Choice (30 questions)", questions: Array.from({length:30},(_,i)=>`mc${i+1}`) },
    { id: "B", name: "Section B: Case Study", questions: ["31a","31b","31c","31d"] },
  ],
  questions: [
    // 30 MCQs covering micro + macro
    mcq("mc1", "A leftward shift of the supply curve, ceteris paribus, will cause:", "A", ["A fall in equilibrium price and a rise in quantity", "A rise in equilibrium price and a fall in quantity", "A rise in both equilibrium price and quantity", "A fall in both equilibrium price and quantity"]),
    mcq("mc2", "Which of the following is an example of a public good?", "A", ["Street lighting", "A gym membership", "A loaf of bread", "A private school education"]),
    mcq("mc3", "A negative externality in consumption occurs when:", "A", ["The social cost exceeds the private cost", "The social benefit is less than the private benefit", "The private cost exceeds the social cost", "The social benefit exceeds the private benefit"]),
    mcq("mc4", "In a perfectly competitive market in long-run equilibrium, firms earn:", "A", ["Supernormal profit", "Normal profit", "Subnormal profit", "Zero revenue"]),
    mcq("mc5", "Which of the following is most likely to increase the contestability of a market?", "A", ["Increased sunk costs", "Deregulation", "Patent protection", "Vertical integration"]),
    mcq("mc6", "The kinked demand curve model of oligopoly predicts:", "A", ["Price rigidity", "Perfect competition", "Allocative efficiency", "Constant market entry"]),
    mcq("mc7", "A monopolist practising first-degree price discrimination will:", "A", ["Charge every consumer the same price", "Charge each consumer their maximum willingness to pay", "Charge different prices based on time of purchase", "Charge lower prices to groups with elastic demand"]),
    mcq("mc8", "The marginal revenue product of labour is calculated by:", "A", ["Marginal physical product × price of output", "Total revenue ÷ number of workers", "Wage rate × number of workers", "Total product × marginal cost"]),
    mcq("mc9", "A decrease in the rate of income tax is an example of:", "A", ["Contractionary fiscal policy", "Expansionary fiscal policy", "Contractionary monetary policy", "Expansionary monetary policy"]),
    mcq("mc10", "Which of the following is included in the calculation of GDP using the expenditure method?", "A", ["Consumer spending on imports", "Transfer payments", "Consumer spending on domestic goods", "Depreciation of capital"]),
    mcq("mc11", "An increase in the money supply is most likely to lead to:", "A", ["Higher interest rates", "Lower interest rates", "Higher exchange rates", "Reduced inflation"]),
    mcq("mc12", "Cost-push inflation is most likely caused by:", "A", ["An increase in consumer spending", "A rise in commodity prices", "A decrease in interest rates", "Increased government borrowing"]),
    mcq("mc13", "The Phillips Curve shows an inverse relationship between:", "A", ["Inflation and economic growth", "Unemployment and inflation", "Interest rates and investment", "Exports and imports"]),
    mcq("mc14", "Which of the following is a supply-side policy?", "A", ["Reducing the Bank of England base rate", "Increasing government spending on infrastructure", "Increasing income tax rates", "Reducing the government budget deficit"]),
    mcq("mc15", "Comparative advantage exists when a country can produce a good at:", "A", ["A lower absolute cost", "A lower opportunity cost", "A higher absolute cost", "A higher quantity"]),
    mcq("mc16", "A tariff on imports is likely to:", "A", ["Reduce the domestic price of the good", "Increase consumer surplus", "Increase government revenue", "Increase the quantity imported"]),
    mcq("mc17", "The J-curve effect suggests that following a depreciation of the currency:", "A", ["The trade balance immediately improves", "The trade balance initially worsens before improving", "Exports fall permanently", "Imports increase permanently"]),
    mcq("mc18", "Which of the following would cause the aggregate demand curve to shift to the right?", "A", ["An increase in interest rates", "An increase in income tax rates", "An increase in consumer confidence", "A decrease in government spending"]),
    mcq("mc19", "A merit good is one that is:", "A", ["Non-rivalrous and non-excludable", "Under-consumed relative to the socially optimal level", "Over-consumed relative to the socially optimal level", "Provided only by the government"]),
    mcq("mc20", "The law of diminishing marginal returns states that:", "A", ["Total output will always fall as more inputs are added", "As more of a variable factor is added to a fixed factor, marginal output will eventually fall", "Average costs always rise as output increases", "Fixed costs increase with output"]),
    mcq("mc21", "An appreciation of sterling would be most likely to:", "A", ["Increase UK export competitiveness", "Reduce the sterling price of imports", "Increase demand-pull inflation", "Increase the UK trade surplus"]),
    mcq("mc22", "Quantitative easing works primarily by:", "A", ["Increasing the base interest rate", "Central bank purchasing government bonds to increase money supply", "Reducing government spending", "Increasing reserve requirements for banks"]),
    mcq("mc23", "A Lorenz curve that moves further from the line of equality indicates:", "A", ["Greater income equality", "Greater income inequality", "A lower Gini coefficient", "Higher economic growth"]),
    mcq("mc24", "In the long run, a monopolistically competitive firm will produce where:", "A", ["MC = MR and earns supernormal profit", "MC = MR and earns normal profit", "P = MC and earns supernormal profit", "P = ATC and earns supernormal profit"]),
    mcq("mc25", "A regressive tax is one where:", "A", ["Higher earners pay a higher proportion of income in tax", "The tax rate increases with income", "Lower earners pay a higher proportion of income in tax", "Everyone pays the same amount of tax"]),
    mcq("mc26", "The multiplier effect means that:", "A", ["An initial injection leads to a larger final increase in national income", "Government spending always reduces unemployment", "Tax cuts always increase economic growth", "Monetary policy is more effective than fiscal policy"]),
    mcq("mc27", "A natural monopoly exists when:", "A", ["A firm has a government-granted monopoly", "One firm can supply the entire market at a lower cost than two or more firms", "There are no barriers to entry", "The firm produces a unique product"]),
    mcq("mc28", "The output gap is:", "A", ["The difference between actual GDP and potential GDP", "The difference between exports and imports", "The government budget deficit", "The gap between saving and investment"]),
    mcq("mc29", "Which of the following best describes the term 'hot money'?", "A", ["Money laundered through offshore accounts", "Short-term capital flows attracted by higher interest rates or speculation", "Government aid to developing countries", "Long-term foreign direct investment"]),
    mcq("mc30", "A government wishing to reduce a current account deficit could:", "A", ["Increase interest rates to appreciate the exchange rate", "Implement supply-side policies to improve export competitiveness", "Increase tariffs on all imports", "Reduce income tax to boost consumer spending"]),
    // Case study section
    q("31a", "Using the data, explain two factors that contributed to the changes in UK productivity described in the case study.", 10, "10-marker", "B", { extract_text: "The UK's labour productivity grew by only 0.4% per year between 2010 and 2023, compared to 2.1% per year in the decade before the financial crisis. The UK ranks below the US, Germany, and France in output per hour worked. Business investment as a share of GDP fell from 10.2% in 2007 to 9.6% in 2023. R&D spending was 1.7% of GDP compared to an OECD average of 2.7%." }),
    q("31b", "With reference to the case study, analyse how low productivity growth may affect the UK's macroeconomic performance.", 15, "15-marker", "B"),
    q("31c", "Evaluate the effectiveness of supply-side policies the UK government could use to address the productivity gap.", 25, "25-marker", "B"),
    q("31d", "To what extent is increased government spending on education and training the most important policy for improving UK productivity?", 25, "25-marker", "B"),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// OCR PHYSICS A — Papers 1, 2 (with MCQ Section A), Paper 3
// ═══════════════════════════════════════════════════════════════════════════

const OCR_PHYSICS_P1_2023: PaperDef = {
  exam_board: "OCR", subject: "Physics", paper_number: 1, year: 2023, total_marks: 100, time_limit_minutes: 135,
  paper_name: "OCR Physics A Paper 1: Modelling Physics (June 2023)",
  product_slug: "ocr-physics",
  sections: [
    { id: "A", name: "Section A: Multiple Choice (15 questions)", questions: Array.from({length:15},(_,i)=>`mc${i+1}`) },
    { id: "B", name: "Section B: Structured Questions", questions: ["16","17","18","19","20","21"] },
  ],
  questions: [
    // 15 MCQs
    mcq("mc1", "A ball is dropped from rest. After falling for 2.0 s, its velocity is approximately:", "A", ["10 m/s", "20 m/s", "40 m/s", "5 m/s"]),
    mcq("mc2", "The unit of the Young modulus is:", "A", ["N", "Pa", "N/m", "J"]),
    mcq("mc3", "Which of the following is a scalar quantity?", "A", ["Velocity", "Force", "Speed", "Momentum"]),
    mcq("mc4", "A force of 20 N acts on a mass of 4 kg. The acceleration is:", "A", ["5 m/s²", "80 m/s²", "0.2 m/s²", "24 m/s²"]),
    mcq("mc5", "The principle of conservation of momentum applies to:", "A", ["Elastic collisions only", "Inelastic collisions only", "All collisions in a closed system", "Only collisions with no external forces and equal masses"]),
    mcq("mc6", "A material that obeys Hooke's law has a force-extension graph that is:", "A", ["A straight line through the origin", "A curve", "A straight line not through the origin", "A horizontal line"]),
    mcq("mc7", "The wavelength of a wave can be found from:", "A", ["Speed × frequency", "Speed ÷ frequency", "Frequency ÷ speed", "Speed × period"]),
    mcq("mc8", "Destructive interference occurs when two waves meet with a path difference of:", "A", ["0", "λ/2", "λ", "2λ"]),
    mcq("mc9", "The specific heat capacity of a substance is the energy required to raise the temperature of:", "A", ["1 kg by 1°C", "1 g by 1°C", "1 mol by 1°C", "1 kg by 1 K above absolute zero"]),
    mcq("mc10", "In simple harmonic motion, the maximum acceleration occurs at:", "A", ["The equilibrium position", "Maximum displacement", "Half the maximum displacement", "When velocity is maximum"]),
    mcq("mc11", "The total energy of an object in simple harmonic motion is proportional to:", "A", ["Amplitude", "Amplitude²", "Frequency", "Period"]),
    mcq("mc12", "Two resistors of 6 Ω and 3 Ω are connected in parallel. The combined resistance is:", "A", ["9 Ω", "2 Ω", "4.5 Ω", "18 Ω"]),
    mcq("mc13", "The electromotive force (EMF) of a cell is defined as:", "A", ["The current through the cell × internal resistance", "The energy transferred per unit charge by the cell", "The potential difference across the external circuit", "The power output of the cell"]),
    mcq("mc14", "A progressive wave transfers:", "A", ["Energy only", "Matter only", "Both energy and matter", "Neither energy nor matter"]),
    mcq("mc15", "The gravitational field strength at the surface of a planet depends on:", "A", ["The planet's mass only", "The planet's radius only", "Both the planet's mass and radius", "The planet's density only"]),
    // Structured questions
    q("16", "A car accelerates uniformly from rest to 30 m/s in 12 seconds. Calculate: (a) the acceleration, (b) the distance travelled, (c) the resultant force if the car has mass 1200 kg.", 8, "8-marker", "B"),
    q("17", "Describe an experiment to determine the Young modulus of a metal wire. Include a labelled diagram, the measurements you would take, and how you would calculate the result.", 10, "10-marker", "B"),
    q("18", "A 2 kg ball travelling at 5 m/s collides head-on with a stationary 3 kg ball. If the collision is perfectly elastic, calculate the velocities of both balls after the collision. Explain the difference between elastic and inelastic collisions.", 12, "12-marker", "B"),
    q("19", "Define specific heat capacity and specific latent heat. Calculate the total energy required to heat 2 kg of ice at -10°C to steam at 100°C. (c_ice = 2100 J/kg°C, c_water = 4200 J/kg°C, L_f = 334,000 J/kg, L_v = 2,260,000 J/kg)", 13, "13-marker", "B"),
    q("20", "Discuss the evidence for and against the wave nature of light. Reference Young's double-slit experiment, the photoelectric effect, and wave-particle duality.", 20, "20-marker", "B"),
    q("21", "A 500 MW power station transmits electricity at 400 kV through cables with total resistance 10 Ω. Calculate the power lost. Explain why electricity is transmitted at high voltage and evaluate AC vs DC for long-distance transmission.", 22, "22-marker", "B"),
  ],
};

const OCR_PHYSICS_P2_2023: PaperDef = {
  exam_board: "OCR", subject: "Physics", paper_number: 2, year: 2023, total_marks: 100, time_limit_minutes: 135,
  paper_name: "OCR Physics A Paper 2: Exploring Physics (June 2023)",
  product_slug: "ocr-physics",
  sections: [
    { id: "A", name: "Section A: Multiple Choice (15 questions)", questions: Array.from({length:15},(_,i)=>`mc${i+1}`) },
    { id: "B", name: "Section B: Structured Questions", questions: ["16","17","18","19","20","21"] },
  ],
  questions: [
    mcq("mc1", "The electric field strength at a distance r from a point charge Q is proportional to:", "A", ["Q/r", "Q/r²", "Qr", "Qr²"]),
    mcq("mc2", "A capacitor of capacitance 100 μF is charged to 12 V. The energy stored is:", "A", ["7.2 mJ", "1.2 mJ", "14.4 mJ", "0.6 mJ"]),
    mcq("mc3", "The magnetic flux through a coil is measured in:", "A", ["Tesla", "Weber", "Henry", "Volt"]),
    mcq("mc4", "In a transformer, the ratio of voltages equals the ratio of:", "A", ["Currents", "Resistances", "Number of turns", "Power outputs"]),
    mcq("mc5", "The half-life of a radioactive isotope is:", "A", ["The time for the activity to fall to zero", "The time for half the nuclei to decay", "The time for the mass to halve", "Half the time for complete decay"]),
    mcq("mc6", "Alpha particles are:", "A", ["Electrons", "Helium nuclei", "Protons", "Neutrons"]),
    mcq("mc7", "The photoelectric effect provides evidence for:", "A", ["The wave nature of light", "The particle nature of light", "Wave-particle duality of electrons", "Electromagnetic induction"]),
    mcq("mc8", "The de Broglie wavelength of a particle is given by:", "A", ["λ = h/p", "λ = hp", "λ = p/h", "λ = h/E"]),
    mcq("mc9", "In nuclear fission:", "A", ["Light nuclei join together", "A heavy nucleus splits into lighter nuclei", "Energy is absorbed", "Mass is created"]),
    mcq("mc10", "The binding energy per nucleon is greatest for elements near:", "A", ["Hydrogen", "Iron", "Uranium", "Helium"]),
    mcq("mc11", "An electric current in a magnetic field experiences a force. This is used in:", "A", ["Transformers", "Electric motors", "Generators only", "Capacitors"]),
    mcq("mc12", "The time constant of a capacitor-resistor circuit is:", "A", ["R + C", "R × C", "R/C", "C/R"]),
    mcq("mc13", "Which radiation is most ionising?", "A", ["Alpha", "Beta", "Gamma", "X-rays"]),
    mcq("mc14", "The equation E = mc² implies that:", "A", ["Mass can be converted to energy", "Energy always equals mass", "Light has mass", "Speed is constant"]),
    mcq("mc15", "Faraday's law states that the induced EMF is proportional to:", "A", ["The magnetic flux", "The rate of change of magnetic flux", "The current", "The resistance"]),
    q("16", "Describe the motion of charged particles in electric and magnetic fields. Explain how these principles are used in a mass spectrometer.", 10, "10-marker", "B"),
    q("17", "A parallel plate capacitor with plate area 0.04 m² and separation 2 mm is connected to a 100 V supply. Calculate: (a) the capacitance, (b) the charge stored, (c) the energy stored, (d) the electric field strength between the plates.", 12, "12-marker", "B"),
    q("18", "Explain the process of electromagnetic induction. Describe how a simple AC generator works, and explain why the output is sinusoidal.", 12, "12-marker", "B"),
    q("19", "Explain radioactive decay including alpha, beta-minus, and gamma emission. For each, state the nature of the radiation, its penetrating power, and write a decay equation for a named isotope.", 13, "13-marker", "B"),
    q("20", "Describe the Rutherford scattering experiment. Explain what the results revealed about atomic structure and why they disproved the plum pudding model.", 11, "11-marker", "B"),
    q("21", "Discuss the principles of nuclear fusion as a potential energy source. Evaluate the scientific, engineering, and economic challenges of achieving commercial fusion power.", 20, "20-marker", "B"),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// AQA CHEMISTRY — Papers 1, 2, Paper 3 (with 30 MCQs)
// ═══════════════════════════════════════════════════════════════════════════

const AQA_CHEM_P1_2023: PaperDef = {
  exam_board: "AQA", subject: "Chemistry", paper_number: 1, year: 2023, total_marks: 105, time_limit_minutes: 120,
  paper_name: "AQA Chemistry Paper 1: Inorganic and Physical Chemistry (June 2023)",
  product_slug: "aqa-chemistry",
  sections: [
    { id: "A", name: "Short and Long Answer Questions", questions: ["1","2","3","4","5","6","7"] },
  ],
  questions: [
    q("1", "Define enthalpy of formation. Using the data provided, calculate the enthalpy of combustion of propan-1-ol using Hess's Law. Show all working.", 10, "10-marker", "A"),
    q("2", "Describe and explain the trend in first ionisation energies across Period 3 (Na to Ar). Account for any anomalies.", 8, "8-marker", "A"),
    q("3", "Explain the term 'dynamic equilibrium'. For N₂(g) + 3H₂(g) ⇌ 2NH₃(g) (ΔH = -92 kJ/mol), predict and explain the effect of: (a) increasing temperature, (b) increasing pressure, (c) adding a catalyst.", 12, "12-marker", "A"),
    q("4", "Describe the bonding and structure of sodium chloride, diamond, and ice. Explain how structure affects melting point.", 10, "10-marker", "A"),
    q("5", "Explain rate of reaction and activation energy. Use Maxwell-Boltzmann distributions to explain the effect of temperature on reaction rate.", 10, "10-marker", "A"),
    q("6", "Describe the chemistry of the halogens: physical properties, reactivity trend, displacement reactions, and halide ion reactions with concentrated sulfuric acid. Write balanced equations.", 25, "25-marker", "A"),
    q("7", "Discuss equilibrium factors in the Haber and Contact processes. Evaluate the compromises between yield, rate, and cost.", 25, "25-marker", "A"),
  ],
};

const AQA_CHEM_P3_2023: PaperDef = {
  exam_board: "AQA", subject: "Chemistry", paper_number: 3, year: 2023, total_marks: 90, time_limit_minutes: 120,
  paper_name: "AQA Chemistry Paper 3: Chemistry and Questions Across the Specification (June 2023)",
  product_slug: "aqa-chemistry",
  sections: [
    { id: "A", name: "Section A: Multiple Choice (30 questions)", questions: Array.from({length:30},(_,i)=>`mc${i+1}`) },
    { id: "B", name: "Section B: Structured Questions", questions: ["31","32","33","34"] },
  ],
  questions: [
    mcq("mc1", "Which of the following has the highest first ionisation energy?", "A", ["Na", "Mg", "Al", "Si"]),
    mcq("mc2", "In a titration, the indicator methyl orange changes from:", "A", ["Colourless to pink", "Red to yellow", "Yellow to blue", "Blue to colourless"]),
    mcq("mc3", "The oxidation state of chromium in Cr₂O₇²⁻ is:", "A", ["+3", "+6", "+7", "+4"]),
    mcq("mc4", "Which of the following molecules is non-polar?", "A", ["HCl", "NH₃", "CO₂", "H₂O"]),
    mcq("mc5", "The bond angle in a tetrahedral molecule is approximately:", "A", ["90°", "109.5°", "120°", "180°"]),
    mcq("mc6", "An increase in temperature increases the rate of reaction because:", "A", ["It lowers the activation energy", "More molecules exceed the activation energy", "It increases the concentration", "It acts as a catalyst"]),
    mcq("mc7", "Which of the following is an aldehyde?", "A", ["CH₃COCH₃", "CH₃CHO", "CH₃COOH", "CH₃CH₂OH"]),
    mcq("mc8", "The type of isomerism shown by butan-1-ol and butan-2-ol is:", "A", ["Structural isomerism", "Geometric isomerism", "Optical isomerism", "Chain isomerism"]),
    mcq("mc9", "In electrophilic addition of HBr to propene, the major product is:", "A", ["1-bromopropane", "2-bromopropane", "1,2-dibromopropane", "propan-1-ol"]),
    mcq("mc10", "A buffer solution resists changes in pH because:", "A", ["It contains a strong acid and strong base", "The weak acid/conjugate base equilibrium shifts to counteract pH changes", "It has a very high concentration", "Water molecules absorb excess H⁺ ions"]),
    mcq("mc11", "Lattice enthalpy is defined as the enthalpy change when:", "A", ["A crystal is dissolved in water", "Gaseous ions form one mole of ionic solid", "An ionic solid is formed from its elements", "A gas condenses to a liquid"]),
    mcq("mc12", "The electron configuration of Fe²⁺ is:", "A", ["[Ar] 3d⁶ 4s²", "[Ar] 3d⁶", "[Ar] 3d⁵ 4s¹", "[Ar] 3d⁴ 4s²"]),
    mcq("mc13", "Which of the following reagents would you use to test for a C=C double bond?", "A", ["Bromine water", "Sodium hydroxide", "Silver nitrate", "Universal indicator"]),
    mcq("mc14", "A 0.1 mol/dm³ solution of a strong acid has a pH of:", "A", ["0", "1", "2", "7"]),
    mcq("mc15", "Which type of reaction is esterification?", "A", ["Addition", "Substitution", "Condensation", "Elimination"]),
    mcq("mc16", "The entropy of a system increases when:", "A", ["A gas is compressed", "A liquid freezes", "A solid dissolves in water", "A gas condenses"]),
    mcq("mc17", "In a Born-Haber cycle, which enthalpy is always endothermic?", "A", ["Lattice enthalpy of formation", "Electron affinity of chlorine", "Atomisation enthalpy", "Enthalpy of formation"]),
    mcq("mc18", "A transition metal complex ion with coordination number 6 has which shape?", "A", ["Tetrahedral", "Square planar", "Octahedral", "Linear"]),
    mcq("mc19", "The mass spectrum of chlorine (³⁵Cl and ³⁷Cl) shows peaks at m/z values of:", "A", ["35 and 37 only", "35, 37, 70, 72, and 74", "35, 37, and 72", "70 and 74"]),
    mcq("mc20", "Benzene undergoes electrophilic substitution rather than addition because:", "A", ["It has weak C-H bonds", "Addition would break the delocalised π system", "It has no double bonds", "The carbon atoms are sp³ hybridised"]),
    mcq("mc21", "Which of the following can exhibit optical isomerism?", "A", ["Butan-1-ol", "Butan-2-ol", "Propan-1-ol", "Methanol"]),
    mcq("mc22", "In the Contact process, the catalyst used is:", "A", ["Iron", "Vanadium(V) oxide", "Platinum", "Nickel"]),
    mcq("mc23", "The Kₐ value for a weak acid determines:", "A", ["The amount of acid dissolved", "The strength of the acid", "The concentration of the acid", "The volume of acid needed"]),
    mcq("mc24", "A nucleophile is a species that:", "A", ["Accepts an electron pair", "Donates an electron pair", "Is positively charged", "Has an incomplete octet"]),
    mcq("mc25", "Which of the following amino acids can exist as a zwitterion?", "A", ["None of them", "All amino acids", "Only acidic amino acids", "Only basic amino acids"]),
    mcq("mc26", "The electrode potential becomes more positive when:", "A", ["The concentration of the reduced form increases", "The concentration of the oxidised form increases", "The temperature decreases", "A catalyst is added"]),
    mcq("mc27", "Geometric (E/Z) isomerism requires:", "A", ["A chiral carbon", "Restricted rotation and different groups on each carbon of the double bond", "A benzene ring", "A carbonyl group"]),
    mcq("mc28", "The reaction of a carboxylic acid with a base is:", "A", ["Esterification", "Neutralisation", "Hydrolysis", "Polymerisation"]),
    mcq("mc29", "In electrochemistry, the more positive electrode potential indicates:", "A", ["A stronger reducing agent", "A stronger oxidising agent", "A weaker oxidising agent", "A less reactive metal"]),
    mcq("mc30", "An NMR spectrum of ethanol (CH₃CH₂OH) would show how many peaks?", "A", ["1", "2", "3", "4"]),
    // Case study
    q("31", "A student investigates the rate of reaction between magnesium and hydrochloric acid by measuring gas volume. Describe the experimental procedure, explain how to ensure reliable results, and sketch the expected graph.", 15, "15-marker", "B"),
    q("32", "Analyse the data provided and calculate the enthalpy of neutralisation. Discuss sources of error and suggest improvements.", 15, "15-marker", "B"),
    q("33", "A student performs a titration of sodium hydroxide against sulfuric acid. Calculate the concentration of the acid given the titre results provided. Evaluate the accuracy of the experiment.", 15, "15-marker", "B"),
    q("34", "Discuss how the principles of green chemistry can be applied to industrial processes. Evaluate the economic and environmental trade-offs.", 15, "15-marker", "B"),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// AQA PSYCHOLOGY — Paper 1 (with embedded MCQs)
// ═══════════════════════════════════════════════════════════════════════════

const AQA_PSYCH_P1_2023: PaperDef = {
  exam_board: "AQA", subject: "Psychology", paper_number: 1, year: 2023, total_marks: 96, time_limit_minutes: 120,
  paper_name: "AQA Psychology Paper 1: Introductory Topics in Psychology (June 2023)",
  product_slug: "aqa-psychology",
  sections: [
    { id: "A", name: "Section A: Social Influence", questions: ["1","2","3","4"] },
    { id: "B", name: "Section B: Memory", questions: ["5","6","7","8"] },
    { id: "C", name: "Section C: Attachment", questions: ["9","10","11","12"] },
    { id: "D", name: "Section D: Psychopathology", questions: ["13","14","15","16"] },
  ],
  questions: [
    // Social Influence
    mcq("1", "Which of the following best describes 'internalisation' as a type of conformity?", "A", ["Publicly agreeing but privately disagreeing", "Conforming to gain approval from a group", "Genuinely accepting the group's views as your own", "Conforming only when observed by others"]),
    q("2", "Outline two explanations for obedience, as identified by Milgram.", 4, "4-marker", "A"),
    q("3", "Describe the procedure and findings of Asch's (1951) line study of conformity.", 6, "6-marker", "A"),
    q("4", "Discuss the role of social influence processes in social change. Refer to research evidence in your answer.", 16, "16-marker", "A"),
    // Memory
    mcq("5", "In the working memory model, the component responsible for processing visual information is the:", "B", ["Phonological loop", "Visuo-spatial sketchpad", "Central executive", "Episodic buffer"]),
    q("6", "Outline the multi-store model of memory. Explain how it differs from the working memory model.", 6, "6-marker", "B"),
    q("7", "Explain what is meant by 'misleading information' in eyewitness testimony. Refer to Loftus and Palmer (1974).", 6, "6-marker", "B"),
    q("8", "Evaluate the cognitive interview as a method of improving the accuracy of eyewitness testimony. Refer to research evidence.", 16, "16-marker", "B"),
    // Attachment
    mcq("9", "In Ainsworth's Strange Situation, a child classified as Type B (securely attached) would typically:", "C", ["Show little distress when the mother leaves", "Show distress when the mother leaves but be easily comforted on return", "Show distress and resist comfort from the mother on return", "Show no preference between mother and stranger"]),
    q("10", "Outline Ainsworth's Strange Situation procedure and describe the three attachment types.", 6, "6-marker", "C"),
    q("11", "Explain Bowlby's theory of maternal deprivation. Outline one criticism of this theory.", 6, "6-marker", "C"),
    q("12", "Discuss the influence of early attachment on later relationships. Refer to research evidence.", 16, "16-marker", "C"),
    // Psychopathology
    mcq("13", "According to the behavioural approach, phobias are acquired through:", "D", ["Genetic inheritance", "Classical conditioning", "Cognitive distortions", "Neurochemical imbalances"]),
    q("14", "Outline the behavioural, emotional, and cognitive characteristics of depression.", 6, "6-marker", "D"),
    q("15", "Explain how systematic desensitisation is used to treat phobias. Give one strength and one limitation.", 6, "6-marker", "D"),
    q("16", "Discuss the cognitive approach to explaining depression. Evaluate the effectiveness of CBT as a treatment.", 16, "16-marker", "D"),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// OCR COMPUTER SCIENCE — Papers 1, 2
// ═══════════════════════════════════════════════════════════════════════════

const OCR_CS_P1_2023: PaperDef = {
  exam_board: "OCR", subject: "Computer Science", paper_number: 1, year: 2023, total_marks: 140, time_limit_minutes: 150,
  paper_name: "OCR Computer Science Paper 1: Computer Systems (June 2023)",
  product_slug: "ocr-computer-science",
  sections: [
    { id: "A", name: "Section A: Short Answer", questions: ["1","2","3","4","5","6","7"] },
    { id: "B", name: "Section B: Extended Response", questions: ["8","9","10"] },
  ],
  questions: [
    q("1", "Describe the role of the ALU, CU, and registers within the CPU. Explain how the fetch-decode-execute cycle operates.", 8, "8-marker", "A"),
    q("2", "Explain differences between RAM and ROM. Describe how virtual memory is used when RAM is insufficient.", 8, "8-marker", "A"),
    q("3", "Convert the denary number 217 to (a) binary, (b) hexadecimal. Convert the binary number 10110011 to (c) denary, (d) hexadecimal. Show working.", 8, "8-marker", "A"),
    q("4", "Describe the purpose of an operating system. Explain how it manages memory, processes, and I/O devices.", 10, "10-marker", "A"),
    q("5", "Explain differences between TCP/IP and UDP protocols with appropriate use-case examples.", 8, "8-marker", "A"),
    q("6", "Describe the purpose and operation of each layer of the TCP/IP protocol stack.", 8, "8-marker", "A"),
    q("7", "Explain the difference between lossy and lossless compression. Give an example of when each would be appropriate.", 6, "6-marker", "A"),
    q("8", "A school wants to implement a new network. Discuss client-server vs peer-to-peer considering security, cost, maintenance, and scalability.", 20, "20-marker", "B"),
    q("9", "Evaluate the ethical, legal, and environmental impacts of AI in healthcare. Consider data protection, algorithmic bias, and energy consumption.", 20, "20-marker", "B"),
    q("10", "A company stores customer data in a relational database. Discuss normalisation (1NF, 2NF, 3NF), explain consequences of data redundancy, and write example SQL queries for common operations.", 20, "20-marker", "B"),
  ],
};

const OCR_CS_P2_2023: PaperDef = {
  exam_board: "OCR", subject: "Computer Science", paper_number: 2, year: 2023, total_marks: 140, time_limit_minutes: 150,
  paper_name: "OCR Computer Science Paper 2: Algorithms and Programming (June 2023)",
  product_slug: "ocr-computer-science",
  sections: [
    { id: "A", name: "Section A: Computational Thinking", questions: ["1","2","3","4","5","6"] },
    { id: "B", name: "Section B: Programming and Problem Solving", questions: ["7","8","9","10"] },
  ],
  questions: [
    q("1", "Describe the characteristics of a binary search algorithm. State a precondition for its use. Trace through a binary search for the value 42 in the sorted list [12, 23, 34, 42, 56, 67, 78].", 8, "8-marker", "A"),
    q("2", "Compare and contrast merge sort and bubble sort in terms of: (a) time complexity, (b) space complexity, (c) suitability for large datasets.", 10, "10-marker", "A"),
    q("3", "Explain the difference between a stack and a queue. For each, describe a real-world application and show push/pop or enqueue/dequeue operations on the sequence [A, B, C, D].", 10, "10-marker", "A"),
    q("4", "Draw a binary search tree from inserting the values 50, 30, 70, 20, 40, 60, 80 in order. Show the result of: (a) an in-order traversal, (b) a pre-order traversal, (c) deleting the node 30.", 10, "10-marker", "A"),
    q("5", "Explain what is meant by recursion. Write pseudocode for a recursive function that calculates n! (factorial). Show the call stack for factorial(4).", 8, "8-marker", "A"),
    q("6", "Explain Dijkstra's shortest path algorithm. Apply it to find the shortest path from A to F in a given weighted graph. Show your working at each step.", 12, "12-marker", "A"),
    q("7", "A ticket booking system needs to: store customer details, search for available events, book tickets, and generate receipts. Design a solution using appropriate data structures, write pseudocode for the booking process, and explain your design choices.", 20, "20-marker", "B"),
    q("8", "Explain the principles of object-oriented programming: encapsulation, inheritance, and polymorphism. For each, give a code example using a scenario of your choice.", 16, "16-marker", "B"),
    q("9", "A company needs a program to analyse sales data from a CSV file. Write pseudocode to: (a) read the file, (b) calculate total sales per month, (c) identify the month with highest sales, (d) output results to a new file.", 14, "14-marker", "B"),
    q("10", "Discuss the importance of testing in software development. Describe the differences between unit testing, integration testing, and acceptance testing. Explain how test data (normal, boundary, erroneous) should be selected.", 16, "16-marker", "B"),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// CIE ECONOMICS — Papers 1, 2, 3, 4
// Papers 1 & 3 are MCQ, Papers 2 & 4 are written
// ═══════════════════════════════════════════════════════════════════════════

const CIE_ECON_P1_2023: PaperDef = {
  exam_board: "CIE", subject: "Economics", paper_number: 1, year: 2023, total_marks: 30, time_limit_minutes: 60,
  paper_name: "CIE Economics Paper 1: Multiple Choice (AS) (June 2023)",
  product_slug: "cie-economics",
  sections: [{ id: "A", name: "Multiple Choice (30 questions)", questions: Array.from({length:30},(_,i)=>`mc${i+1}`) }],
  questions: [
    mcq("mc1", "An increase in the price of a good leads to a movement along the demand curve. This is called:", "A", ["A shift in demand", "An extension in demand", "A contraction in supply", "An increase in demand"]),
    mcq("mc2", "When price elasticity of demand is -0.5, demand is:", "A", ["Perfectly elastic", "Price elastic", "Price inelastic", "Unit elastic"]),
    mcq("mc3", "A public good is characterised by:", "A", ["Excludability and rivalry", "Non-excludability and non-rivalry", "Excludability and non-rivalry", "High prices"]),
    mcq("mc4", "An external cost is also known as a:", "A", ["Private cost", "Social benefit", "Negative externality", "Positive externality"]),
    mcq("mc5", "The condition for allocative efficiency is:", "A", ["MC = AC", "P = MC", "MR = MC", "TR = TC"]),
    mcq("mc6", "A price floor set above equilibrium will cause:", "A", ["A shortage", "A surplus", "No effect", "A decrease in price"]),
    mcq("mc7", "Cross elasticity of demand between substitute goods is:", "A", ["Negative", "Positive", "Zero", "Infinite"]),
    mcq("mc8", "If income elasticity of demand is negative, the good is:", "A", ["A normal good", "A luxury good", "An inferior good", "A Giffen good"]),
    mcq("mc9", "Diminishing marginal returns occur when:", "A", ["All inputs are increased", "A variable input is added to a fixed input", "Total output falls", "Average cost falls"]),
    mcq("mc10", "In monopolistic competition, firms differentiate their products through:", "A", ["Identical pricing", "Branding and advertising", "Government regulation", "Collusion"]),
    mcq("mc11", "A firm maximises profit where:", "A", ["TR is maximised", "MR = MC", "AR = AC", "Price is highest"]),
    mcq("mc12", "Consumer surplus is the difference between:", "A", ["Price and marginal cost", "Willingness to pay and actual price paid", "Total revenue and total cost", "Supply and demand"]),
    mcq("mc13", "A subsidy on a good will:", "A", ["Shift the supply curve left", "Shift the supply curve right", "Shift the demand curve left", "Have no effect on the market"]),
    mcq("mc14", "Which market structure has the highest barriers to entry?", "A", ["Perfect competition", "Monopolistic competition", "Oligopoly", "Monopoly"]),
    mcq("mc15", "Government failure occurs when:", "A", ["Markets always fail", "Government intervention worsens the allocation of resources", "Taxes are too low", "There is no government intervention"]),
    mcq("mc16", "GDP measures:", "A", ["Total wealth in an economy", "Total output produced in an economy over a period", "Government spending only", "Exports minus imports"]),
    mcq("mc17", "Demand-pull inflation is caused by:", "A", ["Rising costs of production", "Excess aggregate demand", "Falling money supply", "Technological progress"]),
    mcq("mc18", "The circular flow model shows:", "A", ["How money flows between households and firms", "The water cycle", "International trade only", "Government spending patterns"]),
    mcq("mc19", "An injection into the circular flow is:", "A", ["Savings", "Taxation", "Investment", "Imports"]),
    mcq("mc20", "Structural unemployment is caused by:", "A", ["Seasonal changes in demand", "A decline in certain industries", "Workers moving between jobs", "A general lack of demand"]),
    mcq("mc21", "The current account of the balance of payments includes:", "A", ["Foreign direct investment", "Portfolio investment", "Trade in goods and services", "Changes in reserves"]),
    mcq("mc22", "A depreciation of the exchange rate will tend to:", "A", ["Make exports cheaper", "Make imports cheaper", "Reduce inflation", "Attract foreign investment"]),
    mcq("mc23", "Fiscal policy involves changes in:", "A", ["Interest rates", "Money supply", "Government spending and taxation", "Exchange rates"]),
    mcq("mc24", "An increase in the money supply would tend to:", "A", ["Increase interest rates", "Decrease interest rates", "Have no effect on interest rates", "Increase the exchange rate"]),
    mcq("mc25", "Supply-side policies aim to:", "A", ["Increase aggregate demand", "Increase aggregate supply and potential output", "Reduce government spending", "Control inflation through demand management"]),
    mcq("mc26", "The Human Development Index measures:", "A", ["GDP only", "Life expectancy, education, and income", "Trade volumes", "Government spending"]),
    mcq("mc27", "Infant industry protection is justified on the grounds that:", "A", ["Mature industries need protection", "New industries need temporary protection to become competitive", "Free trade is always harmful", "Tariffs generate revenue"]),
    mcq("mc28", "The terms of trade measure:", "A", ["Volume of exports divided by volume of imports", "Index of export prices divided by index of import prices", "Total trade as a share of GDP", "The exchange rate"]),
    mcq("mc29", "A progressive tax system means:", "A", ["Everyone pays the same rate", "Higher earners pay a higher percentage", "Lower earners pay more", "Tax rates never change"]),
    mcq("mc30", "The opportunity cost of a decision is:", "A", ["The monetary cost", "The next best alternative forgone", "The total cost of all alternatives", "The sunk cost"]),
  ],
};

const CIE_ECON_P4_2023: PaperDef = {
  exam_board: "CIE", subject: "Economics", paper_number: 4, year: 2023, total_marks: 70, time_limit_minutes: 135,
  paper_name: "CIE Economics Paper 4: Data Response and Essays (A2) (June 2023)",
  product_slug: "cie-economics",
  sections: [
    { id: "A", name: "Section A: Data Response", questions: ["1a","1b","1c"] },
    { id: "B", name: "Section B: Essays (choose two)", questions: ["2","3","4","5"] },
  ],
  questions: [
    q("1a", "With reference to the data, identify and explain two trends in global trade patterns between 2018 and 2023.", 4, "4-marker", "A", { extract_text: "World merchandise trade grew from $19.5tn (2018) to $25.3tn (2023). China's share rose from 13% to 15%. Services trade grew faster than goods. Intra-regional trade (within Asia) grew more than inter-regional trade." }),
    q("1b", "Explain how comparative advantage justifies free trade even when one country has absolute advantage in all goods.", 6, "6-marker", "A"),
    q("1c", "Discuss whether the benefits of free trade outweigh the costs for developing economies.", 10, "10-marker", "A"),
    q("2", "Discuss whether government intervention to correct market failure always improves resource allocation.", 25, "25-marker", "B"),
    q("3", "Evaluate the view that monopoly is always against the public interest.", 25, "25-marker", "B"),
    q("4", "Discuss the effectiveness of monetary policy in managing inflation in a developing economy.", 25, "25-marker", "B"),
    q("5", "Evaluate the policies a government might use to reduce inequality of income distribution.", 25, "25-marker", "B"),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// EDEXCEL MATHEMATICS — Papers 1, 2 (Pure), Paper 3 (Stats & Mechanics)
// ═══════════════════════════════════════════════════════════════════════════

const EDEXCEL_MATHS_P1_2023: PaperDef = {
  exam_board: "Edexcel", subject: "Mathematics", paper_number: 1, year: 2023, total_marks: 100, time_limit_minutes: 120,
  paper_name: "Edexcel Mathematics Paper 1: Pure Mathematics 1 (June 2023)",
  product_slug: "edexcel-mathematics",
  sections: [{ id: "A", name: "Full Paper", questions: ["1","2","3","4","5","6","7","8","9","10","11","12"] }],
  questions: [
    q("1", "Simplify fully: (3x² - 12) / (x² - 5x + 6).", 3, "3-marker", "A"),
    q("2", "Find the equation of the tangent to the curve y = x³ - 4x + 1 at the point where x = 2.", 5, "5-marker", "A"),
    q("3", "Solve the equation 2sin²θ - sinθ - 1 = 0 for 0° ≤ θ ≤ 360°.", 6, "6-marker", "A"),
    q("4", "A geometric series has first term a = 8 and common ratio r = 0.6. (a) Find the sum to infinity. (b) Find the smallest n for which S_n > 19.", 8, "8-marker", "A"),
    q("5", "The curve C has equation y = 2x³ - 9x² + 12x - 4. (a) Find dy/dx. (b) Find the stationary points. (c) Determine their nature.", 10, "10-marker", "A"),
    q("6", "Prove by contradiction that √2 is irrational.", 6, "6-marker", "A"),
    q("7", "A particle moves with velocity v = 3t² - 12t + 9 m/s. (a) Find when the particle is at rest. (b) Find total distance travelled from t=0 to t=4.", 10, "10-marker", "A"),
    q("8", "Use integration by parts to find ∫ x·e²ˣ dx.", 6, "6-marker", "A"),
    q("9", "f(x) = ln(3x - 2), x > 2/3. (a) Find f⁻¹(x). (b) State domain and range of f⁻¹. (c) Sketch y = f(x) and y = f⁻¹(x).", 10, "10-marker", "A"),
    q("10", "The curve C has parametric equations x = 2t + 1, y = t² - 3t. (a) Find dy/dx in terms of t. (b) Find the equation of the normal to C at t = 2.", 8, "8-marker", "A"),
    q("11", "Show that the equation x³ + 3x - 7 = 0 has a root between x = 1 and x = 2. Use the Newton-Raphson method with x₀ = 1.5 to find this root correct to 3 decimal places.", 8, "8-marker", "A"),
    q("12", "Use the substitution u = 1 + √x to evaluate ∫₁⁴ 1/(1+√x) dx. Give your answer in the form a + b·ln(c).", 12, "12-marker", "A"),
  ],
};

const EDEXCEL_MATHS_P3_2023: PaperDef = {
  exam_board: "Edexcel", subject: "Mathematics", paper_number: 3, year: 2023, total_marks: 100, time_limit_minutes: 120,
  paper_name: "Edexcel Mathematics Paper 3: Statistics and Mechanics (June 2023)",
  product_slug: "edexcel-mathematics",
  sections: [
    { id: "A", name: "Section A: Statistics", questions: ["1","2","3","4","5"] },
    { id: "B", name: "Section B: Mechanics", questions: ["6","7","8","9","10"] },
  ],
  questions: [
    q("1", "A random variable X follows a normal distribution with mean 50 and standard deviation 8. Find: (a) P(X > 58), (b) P(42 < X < 62), (c) the value of k such that P(X < k) = 0.9.", 8, "8-marker", "A"),
    q("2", "A teacher claims that more than 60% of students prefer online learning. In a sample of 80 students, 54 prefer online learning. Test the teacher's claim at the 5% significance level.", 10, "10-marker", "A"),
    q("3", "The table shows the heights (cm) of 30 students: 155, 158, 160, 161, 163, 165, 166, 167, 168, 169, 170, 170, 171, 172, 173, 174, 175, 175, 176, 177, 178, 179, 180, 181, 182, 183, 185, 187, 190, 195. (a) Find the median and IQR. (b) Identify any outliers using 1.5×IQR. (c) Draw a box plot.", 10, "10-marker", "A"),
    q("4", "Two events A and B are such that P(A) = 0.4, P(B) = 0.3, P(A∩B) = 0.15. (a) Find P(A∪B). (b) Are A and B independent? Justify. (c) Find P(A|B).", 8, "8-marker", "A"),
    q("5", "A biased coin has probability p of landing heads. It is tossed 10 times and the number of heads X is recorded. (a) State the distribution of X. (b) Given P(X=3) = 0.2013 and p < 0.5, show that p ≈ 0.25. (c) Find P(X ≥ 2).", 14, "14-marker", "A"),
    q("6", "A particle of mass 3 kg is on a smooth inclined plane at 30° to the horizontal. It is connected by a light inextensible string over a smooth pulley to a particle of mass 5 kg hanging freely. Find: (a) the acceleration of the system, (b) the tension in the string.", 8, "8-marker", "B"),
    q("7", "A projectile is launched at 40 m/s at 60° above the horizontal from ground level. Find: (a) the maximum height, (b) the time of flight, (c) the range. Take g = 9.8 m/s².", 10, "10-marker", "B"),
    q("8", "A car of mass 1200 kg travels along a straight road. The driving force is 2000 N and the resistance to motion is 500 N. (a) Find the acceleration. (b) Find the distance travelled as it accelerates from 10 m/s to 25 m/s. (c) Find the power delivered by the engine at 25 m/s.", 10, "10-marker", "B"),
    q("9", "A ball of mass 0.2 kg is dropped from a height of 5 m onto a horizontal surface. It rebounds to a height of 3.2 m. (a) Find the speed just before impact. (b) Find the speed just after impact. (c) Find the impulse exerted by the surface. (d) If contact time is 0.05 s, find the average force.", 12, "12-marker", "B"),
    q("10", "Two particles P (mass 2 kg, velocity 6 m/s) and Q (mass 3 kg, velocity -2 m/s) collide head-on. After collision, P has velocity 1 m/s. (a) Find the velocity of Q after collision. (b) Find the loss in kinetic energy. (c) State whether the collision is elastic or inelastic.", 10, "10-marker", "B"),
  ],
};


// ═══════════════════════════════════════════════════════════════════════════
// 2022 PAPERS + MISSING PAPER NUMBERS
// ═══════════════════════════════════════════════════════════════════════════

// Edexcel Economics P3 2022
const EDEXCEL_ECON_P3_2022: PaperDef = {
  exam_board: "Edexcel", subject: "Economics", paper_number: 3, year: 2022, total_marks: 100, time_limit_minutes: 120,
  paper_name: "Edexcel Economics A Paper 3: Microeconomics and Macroeconomics (June 2022)",
  product_slug: "edexcel-economics",
  sections: [
    { id: "A", name: "Section A: Micro Data Response", questions: ["1a","1b","1c","1d","1e"] },
    { id: "B", name: "Section B: Macro Data Response", questions: ["2a","2b","2c","2d","2e"] },
  ],
  questions: [
    q("1a", "With reference to Extract A, identify two significant features of the data shown.", 5, "5-marker", "A", { extract_text: "Extract A shows UK pharmaceutical industry data. The top 5 firms hold 62% of market share. R&D spending in the sector reached £4.9bn in 2022, with average drug development costing £1.2bn and taking 12 years. Patent protection lasts 20 years from filing, but effective market exclusivity averages 10-12 years." }),
    q("1b", "With reference to the information, explain how patents create barriers to entry in the pharmaceutical market.", 8, "8-marker", "A"),
    q("1c", "With reference to Extract B, evaluate whether the pharmaceutical industry demonstrates natural monopoly characteristics.", 12, "12-marker", "A", { extract_text: "Extract B: Generic drug manufacturers can produce medicines at 80-90% lower cost once patents expire. However, the initial R&D investment creates enormous sunk costs. The NHS spent £18.2bn on medicines in 2022, of which branded drugs accounted for 74%." }),
    q("1d", "Evaluate the view that patent protection in the pharmaceutical industry improves consumer welfare in the long run. [Answer EITHER 1d OR 1e]", 25, "25-marker", "A", { diagram_required: true }),
    q("1e", "Evaluate the effectiveness of government regulation in ensuring pharmaceutical companies act in the public interest. [Answer EITHER 1d OR 1e]", 25, "25-marker", "A", { diagram_required: true }),
    q("2a", "With reference to Extract C, identify two significant features of the data shown.", 5, "5-marker", "B", { extract_text: "Extract C: UK productivity (output per hour) grew by only 0.4% per year between 2010-2022, compared to 2.1% pre-2008. The UK ranks below the US, Germany, and France in output per worker. Business investment was 9.6% of GDP vs OECD average of 12%." }),
    q("2b", "With reference to the information, explain how low productivity growth affects the UK's long-run aggregate supply.", 8, "8-marker", "B"),
    q("2c", "With reference to Extract D, evaluate whether increased government spending on infrastructure is the most effective policy to boost UK productivity.", 12, "12-marker", "B", { extract_text: "Extract D: The government announced £600bn of infrastructure spending over 5 years. Critics argue that skills shortages and planning delays mean much of this spending will be inflationary rather than productivity-enhancing. Business groups call for corporation tax cuts to incentivise private investment." }),
    q("2d", "Evaluate the view that the UK's productivity problem is primarily a failure of the private sector rather than the government. [Answer EITHER 2d OR 2e]", 25, "25-marker", "B", { diagram_required: true }),
    q("2e", "Evaluate the view that supply-side reforms are more important than demand management for improving UK living standards. [Answer EITHER 2d OR 2e]", 25, "25-marker", "B", { diagram_required: true }),
  ],
};

// AQA Economics 2022 (P1, P2, P3)
const AQA_ECON_P1_2022: PaperDef = {
  exam_board: "AQA", subject: "Economics", paper_number: 1, year: 2022, total_marks: 80, time_limit_minutes: 120,
  paper_name: "AQA Economics Paper 1: Markets and Market Failure (June 2022)",
  product_slug: "aqa-economics",
  sections: [
    { id: "A", name: "Section A: Data Response (compulsory)", questions: ["1a","1b","1c","1d"] },
    { id: "B", name: "Section B: Essay (choose one)", questions: ["2","3","4"] },
  ],
  questions: [
    q("1a", "Using Extract A, calculate the four-firm concentration ratio for the UK broadband market and comment on its significance.", 4, "4-marker", "A", { extract_text: "UK broadband market shares (2022): BT/EE 34%, Virgin Media 20%, Sky 14%, TalkTalk 8%, Others 24%. Average broadband prices rose 8.5% in 2022. Ofcom reported that switching rates remained below 15%." }),
    q("1b", "Using a diagram, explain how non-price competition operates in the UK broadband market.", 9, "9-marker", "A", { diagram_required: true }),
    q("1c", "Using the extracts and your own knowledge, evaluate the effectiveness of Ofcom in promoting competition in the broadband market.", 15, "15-marker", "A"),
    q("1d", "Using the data and your own knowledge, evaluate whether consumers would benefit from breaking up BT's network infrastructure into a separate company.", 25, "25-marker", "A"),
    q("2", "Evaluate the view that free markets always allocate resources efficiently. [25 marks]", 25, "25-marker", "B"),
    q("3", "Evaluate the view that minimum prices are the most effective way to reduce the consumption of demerit goods. [25 marks]", 25, "25-marker", "B"),
    q("4", "Evaluate the extent to which labour markets can be left to operate freely without government intervention. [25 marks]", 25, "25-marker", "B"),
  ],
};

const AQA_ECON_P2_2022: PaperDef = {
  exam_board: "AQA", subject: "Economics", paper_number: 2, year: 2022, total_marks: 80, time_limit_minutes: 120,
  paper_name: "AQA Economics Paper 2: The National Economy in a Global Context (June 2022)",
  product_slug: "aqa-economics",
  sections: [
    { id: "A", name: "Section A: Data Response (compulsory)", questions: ["1a","1b","1c","1d"] },
    { id: "B", name: "Section B: Essay (choose one)", questions: ["2","3","4"] },
  ],
  questions: [
    q("1a", "Using Extract A, calculate the change in the UK's terms of trade between 2020 and 2022.", 4, "4-marker", "A", { extract_text: "UK trade data: Export price index rose from 100 (2020) to 118 (2022). Import price index rose from 100 to 132. The trade deficit in goods was £186bn in 2022, while the services surplus was £132bn." }),
    q("1b", "Using an AD/AS diagram, explain the likely impact of a deterioration in the terms of trade on the UK economy.", 9, "9-marker", "A", { diagram_required: true }),
    q("1c", "Using the data and your own knowledge, assess the significance of the UK's growing trade deficit in goods.", 15, "15-marker", "A"),
    q("1d", "Using the data and your own knowledge, evaluate the view that a weaker pound would solve the UK's trade deficit.", 25, "25-marker", "A"),
    q("2", "Evaluate the view that reducing income inequality should be the primary objective of government economic policy. [25 marks]", 25, "25-marker", "B"),
    q("3", "Evaluate the effectiveness of fiscal policy in promoting economic growth during a recession. [25 marks]", 25, "25-marker", "B"),
    q("4", "Evaluate the view that developing countries benefit more from free trade than from protectionism. [25 marks]", 25, "25-marker", "B"),
  ],
};

const AQA_ECON_P3_2022: PaperDef = {
  exam_board: "AQA", subject: "Economics", paper_number: 3, year: 2022, total_marks: 80, time_limit_minutes: 120,
  paper_name: "AQA Economics Paper 3: Economic Principles and Issues (June 2022)",
  product_slug: "aqa-economics",
  sections: [
    { id: "A", name: "Section A: Multiple Choice (30 questions)", questions: Array.from({length:30},(_,i)=>`mc${i+1}`) },
    { id: "B", name: "Section B: Case Study", questions: ["31a","31b","31c","31d"] },
  ],
  questions: [
    mcq("mc1", "An increase in the minimum wage above the equilibrium level will:", "A", ["Reduce unemployment", "Create excess supply of labour", "Increase the demand for labour", "Have no effect on the labour market"]),
    mcq("mc2", "A negative externality in production shifts:", "A", ["The MPC curve to the left", "The MSC curve above the MPC curve", "The demand curve to the right", "The MPB curve below the MSB curve"]),
    mcq("mc3", "Allocative efficiency occurs where:", "A", ["MC = AC", "P = MC", "MR = MC", "AR = AC"]),
    mcq("mc4", "A merit good is:", "A", ["Non-rival and non-excludable", "Under-consumed in a free market", "Over-consumed in a free market", "Provided only by government"]),
    mcq("mc5", "The cross elasticity of demand for complementary goods is:", "A", ["Positive", "Negative", "Zero", "Infinite"]),
    mcq("mc6", "In monopolistic competition, firms can earn supernormal profit in the:", "A", ["Short run only", "Long run only", "Both short and long run", "Neither short nor long run"]),
    mcq("mc7", "A tariff on imports will:", "A", ["Reduce the domestic price", "Increase government revenue", "Increase consumer surplus", "Shift the supply curve left"]),
    mcq("mc8", "GDP at market prices minus indirect taxes plus subsidies equals:", "A", ["GDP at factor cost", "GNI", "Net national income", "Real GDP"]),
    mcq("mc9", "Demand-pull inflation is most likely caused by:", "A", ["Rising oil prices", "Excessive growth of AD", "Supply chain disruptions", "Rising import costs"]),
    mcq("mc10", "The natural rate of unemployment includes:", "A", ["Cyclical unemployment", "Frictional and structural unemployment", "Demand-deficient unemployment", "All types of unemployment"]),
    mcq("mc11", "Quantitative easing primarily works by:", "A", ["Raising interest rates", "Increasing the money supply through bond purchases", "Reducing government spending", "Increasing tax revenue"]),
    mcq("mc12", "A supply-side policy is:", "A", ["An increase in government spending", "A cut in interest rates", "Investment in education and training", "An increase in income tax"]),
    mcq("mc13", "The multiplier effect will be larger when:", "A", ["The MPC is lower", "The tax rate is higher", "The MPC is higher", "Imports are higher"]),
    mcq("mc14", "A current account deficit could be reduced by:", "A", ["An appreciation of the currency", "Increased consumer spending", "Improved export competitiveness", "Reduced interest rates"]),
    mcq("mc15", "Absolute advantage means:", "A", ["Producing at lower opportunity cost", "Producing more output with the same resources", "Having a trade surplus", "Being the largest economy"]),
    mcq("mc16", "The law of diminishing returns applies in the:", "A", ["Long run only", "Short run only", "Both short and long run", "Neither short nor long run"]),
    mcq("mc17", "Price discrimination requires:", "A", ["Perfect competition", "Different price elasticities in separate markets", "Government regulation", "Identical consumers"]),
    mcq("mc18", "An increase in interest rates would most directly:", "A", ["Increase investment", "Reduce the exchange rate", "Reduce consumer spending on credit", "Increase aggregate demand"]),
    mcq("mc19", "The Gini coefficient ranges from:", "A", ["0 (complete equality) to 1 (complete inequality)", "-1 to +1", "0 to 100", "1 to 10"]),
    mcq("mc20", "A public good is:", "A", ["Rival and excludable", "Non-rival and non-excludable", "Provided by the private sector", "A good the public wants"]),
    mcq("mc21", "Structural unemployment is caused by:", "A", ["Seasonal changes", "A lack of aggregate demand", "Changes in the structure of the economy", "Frictional factors"]),
    mcq("mc22", "An appreciation of the exchange rate will:", "A", ["Make exports more competitive", "Make imports cheaper", "Increase inflation", "Increase the trade surplus"]),
    mcq("mc23", "The Phillips Curve shows:", "A", ["A positive relationship between inflation and growth", "An inverse relationship between unemployment and inflation", "A positive relationship between interest rates and investment", "No relationship between any variables"]),
    mcq("mc24", "Economies of scale lead to:", "A", ["Rising average costs", "Falling average costs as output increases", "Constant average costs", "Rising marginal costs only"]),
    mcq("mc25", "The Bank of England's primary objective is:", "A", ["Full employment", "Price stability (2% CPI target)", "Economic growth", "A balanced budget"]),
    mcq("mc26", "A progressive tax means:", "A", ["Everyone pays the same amount", "Higher earners pay a higher proportion", "Tax rates decrease with income", "Only the rich pay tax"]),
    mcq("mc27", "Government failure occurs when:", "A", ["The government runs a deficit", "Government intervention leads to a worse allocation of resources", "The government raises taxes", "Markets fail"]),
    mcq("mc28", "The infant industry argument supports:", "A", ["Free trade", "Permanent protectionism", "Temporary protectionism for new industries", "Export subsidies"]),
    mcq("mc29", "A contractionary fiscal policy involves:", "A", ["Increasing government spending", "Reducing taxes", "Reducing government spending and/or raising taxes", "Lowering interest rates"]),
    mcq("mc30", "In the circular flow, a withdrawal/leakage is:", "A", ["Investment", "Government spending", "Exports", "Savings"]),
    q("31a", "Using the data, explain two factors that contributed to the rise in UK house prices described in the case study.", 10, "10-marker", "B", { extract_text: "UK house prices rose 10.8% in 2022. Average house price reached £295,000. Mortgage rates rose from 1.5% to 5.5%. Housing completions fell 12% from 2019 levels. Population grew by 606,000 in 2022. The ratio of house prices to earnings reached 8.3." }),
    q("31b", "Analyse how rising interest rates affected the UK housing market and the wider economy.", 15, "15-marker", "B"),
    q("31c", "Evaluate government policies to improve housing affordability in the UK.", 25, "25-marker", "B"),
    q("31d", "To what extent is the UK housing market an example of market failure?", 25, "25-marker", "B"),
  ],
};

// OCR CS 2022
const OCR_CS_P1_2022: PaperDef = {
  exam_board: "OCR", subject: "Computer Science", paper_number: 1, year: 2022, total_marks: 140, time_limit_minutes: 150,
  paper_name: "OCR Computer Science Paper 1: Computer Systems (June 2022)",
  product_slug: "ocr-computer-science",
  sections: [
    { id: "A", name: "Section A: Short Answer", questions: ["1","2","3","4","5","6","7"] },
    { id: "B", name: "Section B: Extended Response", questions: ["8","9","10"] },
  ],
  questions: [
    q("1", "Explain the differences between RISC and CISC processor architectures. Give one advantage of each.", 8, "8-marker", "A"),
    q("2", "Describe three types of secondary storage (magnetic, optical, solid-state) and compare their speed, capacity, and cost.", 8, "8-marker", "A"),
    q("3", "Perform the following binary arithmetic. Show all working: (a) 10110101 + 01101110, (b) 11001010 - 00110111.", 8, "8-marker", "A"),
    q("4", "Explain the purpose of a firewall, encryption, and MAC address filtering in network security.", 10, "10-marker", "A"),
    q("5", "Describe the stages of the software development life cycle (SDLC). Explain when a waterfall model would be preferred over agile.", 8, "8-marker", "A"),
    q("6", "Explain what is meant by normalisation in databases. Describe the differences between 1NF, 2NF, and 3NF with an example.", 8, "8-marker", "A"),
    q("7", "Explain the differences between compilation and interpretation. Give a scenario where each would be appropriate.", 6, "6-marker", "A"),
    q("8", "A hospital wants to implement an electronic patient records system. Discuss the technical, ethical, and legal considerations. Consider data protection, accessibility, and system reliability.", 20, "20-marker", "B"),
    q("9", "Compare and contrast the use of cloud computing versus local server infrastructure for a medium-sized business. Consider cost, security, scalability, and reliability.", 20, "20-marker", "B"),
    q("10", "Discuss the impact of quantum computing on current encryption methods. Evaluate whether organisations should be preparing now for the threat of quantum decryption.", 20, "20-marker", "B"),
  ],
};

// OCR Physics 2022
const OCR_PHYSICS_P1_2022: PaperDef = {
  exam_board: "OCR", subject: "Physics", paper_number: 1, year: 2022, total_marks: 100, time_limit_minutes: 135,
  paper_name: "OCR Physics A Paper 1: Modelling Physics (June 2022)",
  product_slug: "ocr-physics",
  sections: [
    { id: "A", name: "Section A: Multiple Choice (15 questions)", questions: Array.from({length:15},(_,i)=>`mc${i+1}`) },
    { id: "B", name: "Section B: Structured Questions", questions: ["16","17","18","19","20","21"] },
  ],
  questions: [
    mcq("mc1", "A car decelerates uniformly from 20 m/s to rest in 8 s. The deceleration is:", "A", ["2.5 m/s²", "160 m/s²", "0.4 m/s²", "1.6 m/s²"]),
    mcq("mc2", "The SI unit of energy is:", "A", ["Watt", "Joule", "Newton", "Pascal"]),
    mcq("mc3", "Which is a vector quantity?", "A", ["Mass", "Energy", "Displacement", "Temperature"]),
    mcq("mc4", "Work done is calculated by:", "A", ["Force × distance in the direction of the force", "Force × time", "Mass × velocity", "Power × distance"]),
    mcq("mc5", "The stress on a material is defined as:", "A", ["Force × area", "Force ÷ area", "Extension ÷ length", "Energy ÷ volume"]),
    mcq("mc6", "A standing wave is formed by:", "A", ["A single wave reflecting off a boundary", "Superposition of two waves travelling in opposite directions", "A wave diffracting through a gap", "A wave refracting at a boundary"]),
    mcq("mc7", "The frequency of a wave increases. If the speed stays constant, the wavelength:", "A", ["Increases", "Decreases", "Stays the same", "Becomes zero"]),
    mcq("mc8", "Constructive interference occurs when the path difference is:", "A", ["λ/2", "nλ (whole number of wavelengths)", "3λ/4", "Zero only"]),
    mcq("mc9", "Internal energy is the sum of:", "A", ["Kinetic and gravitational potential energy", "Random kinetic and potential energy of molecules", "Work done and heat transferred", "Pressure and volume"]),
    mcq("mc10", "In SHM, the velocity is maximum at:", "A", ["Maximum displacement", "The equilibrium position", "Half amplitude", "The turning points"]),
    mcq("mc11", "The period of a simple pendulum depends on:", "A", ["Mass and length", "Length and g only", "Mass and g", "Amplitude and length"]),
    mcq("mc12", "Three 12 Ω resistors in parallel have a combined resistance of:", "A", ["36 Ω", "4 Ω", "12 Ω", "6 Ω"]),
    mcq("mc13", "Power dissipated in a resistor is:", "A", ["I²R", "IR²", "V/I", "I/R"]),
    mcq("mc14", "A transverse wave has oscillations:", "A", ["Along the direction of travel", "Perpendicular to the direction of travel", "In a circular path", "Without energy transfer"]),
    mcq("mc15", "The moment of a force about a point equals:", "A", ["Force × perpendicular distance from the point", "Force × mass", "Force ÷ distance", "Force × velocity"]),
    q("16", "A ball is thrown horizontally at 15 m/s from a cliff 45 m high. Calculate: (a) time to reach the ground, (b) horizontal distance travelled, (c) velocity on impact (magnitude and direction).", 10, "10-marker", "B"),
    q("17", "In a Young's double-slit experiment, the slit separation is 0.5 mm and the screen is 1.5 m away. The fringe spacing is 1.8 mm. Calculate the wavelength of light used. Explain what happens to the fringe pattern if one slit is covered.", 10, "10-marker", "B"),
    q("18", "A copper wire of length 2 m and cross-sectional area 1.5 × 10⁻⁶ m² has a resistance of 0.023 Ω. Calculate the resistivity of copper. A potential difference of 6 V is applied across the wire. Calculate the current and power dissipated.", 10, "10-marker", "B"),
    q("19", "Explain the first law of thermodynamics. A gas in a cylinder is compressed by a piston. 500 J of work is done on the gas, and 200 J of heat escapes. Calculate the change in internal energy.", 10, "10-marker", "B"),
    q("20", "Describe an experiment to measure the speed of sound using a resonance tube. Include a diagram, the measurements taken, and how the speed is calculated.", 18, "18-marker", "B"),
    q("21", "Discuss the evidence that supports the particle model of electromagnetic radiation. Reference the photoelectric effect, and explain why the wave model fails to explain it. Include the equation E = hf.", 22, "22-marker", "B"),
  ],
};

// AQA Chemistry P2 2023 + 2022
const AQA_CHEM_P2_2023: PaperDef = {
  exam_board: "AQA", subject: "Chemistry", paper_number: 2, year: 2023, total_marks: 105, time_limit_minutes: 120,
  paper_name: "AQA Chemistry Paper 2: Organic and Physical Chemistry (June 2023)",
  product_slug: "aqa-chemistry",
  sections: [
    { id: "A", name: "Short and Long Answer Questions", questions: ["1","2","3","4","5","6","7"] },
  ],
  questions: [
    q("1", "Draw the mechanism for the nucleophilic substitution of 1-bromobutane with aqueous sodium hydroxide. State the type of mechanism and the role of the hydroxide ion.", 8, "8-marker", "A"),
    q("2", "Describe how you would distinguish between propanal and propanone using chemical tests. Write equations for the positive test.", 8, "8-marker", "A"),
    q("3", "Explain what is meant by optical isomerism. Draw the two enantiomers of 2-hydroxypropanoic acid (lactic acid). Explain how you could distinguish between a racemic mixture and a pure enantiomer.", 10, "10-marker", "A"),
    q("4", "Describe the process of addition polymerisation and condensation polymerisation. Give one example of each. Explain the environmental issues associated with disposal of addition polymers.", 12, "12-marker", "A"),
    q("5", "A student dissolves 2.65 g of anhydrous sodium carbonate in 250 cm³ of water. Calculate the concentration in mol/dm³. A 25.0 cm³ sample is titrated against hydrochloric acid. 23.50 cm³ of acid is required. Calculate the concentration of the acid.", 12, "12-marker", "A"),
    q("6", "Discuss the chemistry of alcohols including classification (primary, secondary, tertiary), oxidation reactions, dehydration, and ester formation. Write balanced equations for each reaction type.", 25, "25-marker", "A"),
    q("7", "Discuss the factors that affect the rate of an organic reaction. Compare SN1 and SN2 mechanisms in terms of rate equations, intermediates, and stereochemistry.", 25, "25-marker", "A"),
  ],
};

const AQA_CHEM_P1_2022: PaperDef = {
  exam_board: "AQA", subject: "Chemistry", paper_number: 1, year: 2022, total_marks: 105, time_limit_minutes: 120,
  paper_name: "AQA Chemistry Paper 1: Inorganic and Physical Chemistry (June 2022)",
  product_slug: "aqa-chemistry",
  sections: [
    { id: "A", name: "Short and Long Answer Questions", questions: ["1","2","3","4","5","6","7"] },
  ],
  questions: [
    q("1", "State Hess's law. Draw an energy cycle and use the bond enthalpies provided to calculate the enthalpy of combustion of methane. (C-H: 413, O=O: 498, C=O: 805, O-H: 463 kJ/mol)", 10, "10-marker", "A"),
    q("2", "Describe and explain the trend in atomic radius and electronegativity across Period 3. Explain why there is a discontinuity in first ionisation energy between Mg and Al.", 10, "10-marker", "A"),
    q("3", "Explain what is meant by the term 'buffer solution'. Describe how an acidic buffer made from ethanoic acid and sodium ethanoate resists changes in pH when small amounts of acid or base are added.", 10, "10-marker", "A"),
    q("4", "Calculate the pH of: (a) 0.1 mol/dm³ HCl, (b) 0.05 mol/dm³ NaOH, (c) a buffer made from 0.1 mol/dm³ ethanoic acid and 0.15 mol/dm³ sodium ethanoate. Ka = 1.74 × 10⁻⁵.", 12, "12-marker", "A"),
    q("5", "A student sets up an electrochemical cell using zinc and copper half-cells. Draw a labelled diagram. State which electrode is positive and explain why. Calculate the cell EMF. (E° Zn²⁺/Zn = -0.76V, E° Cu²⁺/Cu = +0.34V)", 8, "8-marker", "A"),
    q("6", "Describe the reactions of the Period 3 elements Na to Ar with water and with oxygen. Write balanced equations and state the oxidation states.", 25, "25-marker", "A"),
    q("7", "Discuss the factors affecting electrode potentials and the limitations of using standard electrode potentials to predict whether reactions will occur.", 25, "25-marker", "A"),
  ],
};

// AQA Psychology P2 2023 + P1 2022
const AQA_PSYCH_P2_2023: PaperDef = {
  exam_board: "AQA", subject: "Psychology", paper_number: 2, year: 2023, total_marks: 96, time_limit_minutes: 120,
  paper_name: "AQA Psychology Paper 2: Psychology in Context (June 2023)",
  product_slug: "aqa-psychology",
  sections: [
    { id: "A", name: "Section A: Approaches in Psychology", questions: ["1","2","3"] },
    { id: "B", name: "Section B: Biopsychology", questions: ["4","5","6"] },
    { id: "C", name: "Section C: Research Methods", questions: ["7","8","9","10","11","12"] },
  ],
  questions: [
    mcq("1", "Which approach in psychology emphasises the role of the unconscious mind?", "A", ["Behaviourist", "Cognitive", "Psychodynamic", "Humanistic"]),
    q("2", "Outline two assumptions of the cognitive approach.", 4, "4-marker", "A"),
    q("3", "Discuss the behaviourist approach in psychology. Compare it with the social learning theory approach. Refer to evidence.", 16, "16-marker", "A"),
    mcq("4", "The part of the nervous system responsible for the 'fight or flight' response is the:", "B", ["Parasympathetic nervous system", "Sympathetic nervous system", "Somatic nervous system", "Central nervous system"]),
    q("5", "Outline the structure and function of the synapse. Explain how drugs can affect synaptic transmission.", 6, "6-marker", "B"),
    q("6", "Discuss the localisation of function in the brain. Evaluate the evidence for and against localisation. Refer to research studies.", 16, "16-marker", "B"),
    mcq("7", "A correlation coefficient of -0.85 indicates:", "C", ["A strong positive correlation", "A weak negative correlation", "A strong negative correlation", "No correlation"]),
    q("8", "Explain the difference between a Type I and Type II error. State which is more likely when using a significance level of p < 0.01.", 4, "4-marker", "C"),
    q("9", "A researcher wants to investigate whether sleep affects exam performance. Design a study to test this. Include: hypothesis, variables, sampling method, procedure, and one ethical consideration.", 10, "10-marker", "C"),
    q("10", "Explain two advantages and two disadvantages of using a questionnaire as a research method.", 6, "6-marker", "C"),
    q("11", "A researcher records the number of errors made by participants on a memory task under three conditions: no distraction, music, and conversation. What statistical test would be appropriate? Justify your choice.", 4, "4-marker", "C"),
    q("12", "Discuss the scientific status of psychology. Evaluate whether psychology should be considered a science. Refer to the features of science and research evidence.", 16, "16-marker", "C"),
  ],
};

const AQA_PSYCH_P1_2022: PaperDef = {
  exam_board: "AQA", subject: "Psychology", paper_number: 1, year: 2022, total_marks: 96, time_limit_minutes: 120,
  paper_name: "AQA Psychology Paper 1: Introductory Topics in Psychology (June 2022)",
  product_slug: "aqa-psychology",
  sections: [
    { id: "A", name: "Section A: Social Influence", questions: ["1","2","3","4"] },
    { id: "B", name: "Section B: Memory", questions: ["5","6","7","8"] },
    { id: "C", name: "Section C: Attachment", questions: ["9","10","11","12"] },
    { id: "D", name: "Section D: Psychopathology", questions: ["13","14","15","16"] },
  ],
  questions: [
    mcq("1", "Normative social influence is most associated with:", "A", ["Compliance", "Internalisation", "Identification", "Obedience"]),
    q("2", "Outline two situational variables that Milgram identified as affecting obedience.", 4, "4-marker", "A"),
    q("3", "Describe Zimbardo's Stanford Prison Experiment. Outline two ethical issues with this study.", 8, "8-marker", "A"),
    q("4", "Discuss explanations of resistance to social influence. Refer to research evidence in your answer.", 16, "16-marker", "A"),
    mcq("5", "In the multi-store model, the capacity of short-term memory is approximately:", "B", ["2 items", "7 ± 2 items", "Unlimited", "20 items"]),
    q("6", "Outline the working memory model. Explain how it differs from the multi-store model.", 6, "6-marker", "B"),
    q("7", "Explain two factors that affect the accuracy of eyewitness testimony.", 6, "6-marker", "B"),
    q("8", "Evaluate the multi-store model of memory. Refer to research evidence and alternative models.", 16, "16-marker", "B"),
    mcq("9", "According to Bowlby, the critical period for attachment formation is:", "C", ["0-6 months", "0-2.5 years", "3-5 years", "Birth to 1 year"]),
    q("10", "Outline Schaffer and Emerson's stages of attachment.", 6, "6-marker", "C"),
    q("11", "Explain two effects of institutionalisation as identified by Rutter's Romanian orphan studies.", 6, "6-marker", "C"),
    q("12", "Discuss cultural variations in attachment. Evaluate the use of the Strange Situation in cross-cultural research.", 16, "16-marker", "C"),
    mcq("13", "Which of the following is a cognitive characteristic of depression?", "D", ["Reduced appetite", "Low self-esteem", "Social withdrawal", "Insomnia"]),
    q("14", "Outline two characteristics of obsessive-compulsive disorder (OCD).", 4, "4-marker", "D"),
    q("15", "Explain how the two-process model (classical + operant conditioning) explains the maintenance of phobias.", 6, "6-marker", "D"),
    q("16", "Discuss biological explanations of OCD. Evaluate the effectiveness of drug therapy as a treatment for OCD.", 16, "16-marker", "D"),
  ],
};

// Edexcel Maths P2 2023 + P1 2022
const EDEXCEL_MATHS_P2_2023: PaperDef = {
  exam_board: "Edexcel", subject: "Mathematics", paper_number: 2, year: 2023, total_marks: 100, time_limit_minutes: 120,
  paper_name: "Edexcel Mathematics Paper 2: Pure Mathematics 2 (June 2023)",
  product_slug: "edexcel-mathematics",
  sections: [{ id: "A", name: "Full Paper", questions: ["1","2","3","4","5","6","7","8","9","10","11"] }],
  questions: [
    q("1", "Express (2 + 3√5)² in the form a + b√5 where a and b are integers.", 3, "3-marker", "A"),
    q("2", "Solve the simultaneous equations: y = 2x + 1 and x² + y² = 25.", 6, "6-marker", "A"),
    q("3", "A circle has centre (3, -2) and passes through (7, 1). Find the equation of the circle.", 5, "5-marker", "A"),
    q("4", "Given that log₃x = a, express log₃(9x³) in terms of a.", 4, "4-marker", "A"),
    q("5", "Differentiate with respect to x: (a) y = sin(3x²), (b) y = e²ˣ·ln(x), (c) y = x³/(2x+1).", 10, "10-marker", "A"),
    q("6", "The curve y = f(x) passes through (2, 5) and f'(x) = 6x² - 4x + 1. Find f(x).", 5, "5-marker", "A"),
    q("7", "Prove that the sum of the first n terms of the series 1 + 3 + 5 + ... + (2n-1) is n².", 4, "4-marker", "A"),
    q("8", "A curve has parametric equations x = 3cos(t), y = 2sin(t). (a) Find dy/dx in terms of t. (b) Find the equation of the tangent at t = π/4. (c) Show the curve is an ellipse.", 12, "12-marker", "A"),
    q("9", "Using the trapezium rule with 5 strips, estimate ∫₀¹ e^(x²) dx. Give your answer to 4 decimal places. State whether the trapezium rule gives an overestimate or underestimate.", 8, "8-marker", "A"),
    q("10", "Solve the differential equation dy/dx = 2xy, given that y = 3 when x = 0.", 6, "6-marker", "A"),
    q("11", "A particle moves along a straight line. At time t, the displacement from O is s = t³ - 6t² + 9t. (a) Find the velocity and acceleration at time t. (b) Find when the particle is at rest. (c) Find the total distance travelled in the first 4 seconds.", 12, "12-marker", "A"),
  ],
};

const EDEXCEL_MATHS_P1_2022: PaperDef = {
  exam_board: "Edexcel", subject: "Mathematics", paper_number: 1, year: 2022, total_marks: 100, time_limit_minutes: 120,
  paper_name: "Edexcel Mathematics Paper 1: Pure Mathematics 1 (June 2022)",
  product_slug: "edexcel-mathematics",
  sections: [{ id: "A", name: "Full Paper", questions: ["1","2","3","4","5","6","7","8","9","10"] }],
  questions: [
    q("1", "Factorise completely: 2x³ - 8x.", 2, "2-marker", "A"),
    q("2", "Find the set of values of x for which 3x - 7 > 2x + 1 AND x² - 4x - 5 < 0.", 6, "6-marker", "A"),
    q("3", "A sequence is defined by u₁ = 3, uₙ₊₁ = 2uₙ - 1. Find u₂, u₃, and u₄.", 4, "4-marker", "A"),
    q("4", "The line y = 2x + k is tangent to the curve y = x² + 3. Find the value(s) of k.", 5, "5-marker", "A"),
    q("5", "Show that (sinθ + cosθ)² ≡ 1 + 2sinθcosθ. Hence solve (sinθ + cosθ)² = 1.5 for 0 ≤ θ ≤ 2π.", 8, "8-marker", "A"),
    q("6", "Find ∫(3x² + 2x⁻³) dx. Evaluate ∫₁⁴ (3x² + 2x⁻³) dx.", 6, "6-marker", "A"),
    q("7", "The curve y = 4x - x² and the line y = 3 intersect at two points. Find the area enclosed between the curve and the line.", 10, "10-marker", "A"),
    q("8", "The function f(x) = 2x³ - 3x² - 12x + 5 is defined for all real x. (a) Find f'(x). (b) Find the coordinates of the stationary points. (c) Determine the nature of each. (d) Sketch y = f(x).", 14, "14-marker", "A"),
    q("9", "Given that y = x²eˣ, (a) find dy/dx, (b) find d²y/dx², (c) show that d²y/dx² = (x² + 4x + 2)eˣ.", 10, "10-marker", "A"),
    q("10", "Prove by induction that Σᵣ₌₁ⁿ r(r+1) = n(n+1)(n+2)/3 for all positive integers n.", 8, "8-marker", "A"),
  ],
};

// CIE Economics 2022
const CIE_ECON_P1_2022: PaperDef = {
  exam_board: "CIE", subject: "Economics", paper_number: 1, year: 2022, total_marks: 30, time_limit_minutes: 60,
  paper_name: "CIE Economics Paper 1: Multiple Choice (AS) (June 2022)",
  product_slug: "cie-economics",
  sections: [{ id: "A", name: "Multiple Choice (30 questions)", questions: Array.from({length:30},(_,i)=>`mc${i+1}`) }],
  questions: [
    mcq("mc1", "The opportunity cost of producing more military equipment is:", "A", ["The money spent on defence", "The civilian goods that could have been produced instead", "The profit from arms exports", "The cost of raw materials"]),
    mcq("mc2", "A movement along a demand curve is caused by:", "A", ["A change in income", "A change in the price of the good", "A change in tastes", "A change in population"]),
    mcq("mc3", "When PED is greater than 1, demand is:", "A", ["Price inelastic", "Price elastic", "Unit elastic", "Perfectly inelastic"]),
    mcq("mc4", "A subsidy shifts the:", "A", ["Demand curve left", "Supply curve right", "Supply curve left", "Demand curve right"]),
    mcq("mc5", "Consumer surplus is largest when:", "A", ["Price is high", "Price equals the maximum a consumer would pay", "Price is well below the maximum willingness to pay", "Demand is perfectly inelastic"]),
    mcq("mc6", "A demerit good is:", "A", ["Non-rival", "Over-consumed in a free market", "Under-consumed in a free market", "A public good"]),
    mcq("mc7", "The condition for profit maximisation is:", "A", ["TR = TC", "MR = MC", "AR = AC", "P = MC"]),
    mcq("mc8", "In perfect competition in the long run, firms earn:", "A", ["Supernormal profit", "Normal profit", "Losses", "Zero revenue"]),
    mcq("mc9", "A natural monopoly exists when:", "A", ["There is one firm in the market", "LRAC falls continuously over the relevant range of output", "The firm owns all the resources", "The government grants a licence"]),
    mcq("mc10", "Price discrimination requires:", "A", ["Perfect competition", "Different elasticities in separate markets that can be kept apart", "Identical consumers", "Government regulation"]),
    mcq("mc11", "GDP measures:", "A", ["Total wealth in the economy", "The total value of output produced in a year", "Government spending only", "Only the production of goods"]),
    mcq("mc12", "An injection into the circular flow is:", "A", ["Savings", "Taxation", "Investment", "Imports"]),
    mcq("mc13", "If the MPC is 0.8, the multiplier is:", "A", ["0.8", "4", "5", "1.25"]),
    mcq("mc14", "Cost-push inflation is caused by:", "A", ["Excess demand", "Rising production costs", "Low unemployment", "High consumer confidence"]),
    mcq("mc15", "Cyclical unemployment is caused by:", "A", ["Structural change", "A fall in aggregate demand", "Seasonal factors", "Workers between jobs"]),
    mcq("mc16", "A current account deficit means:", "A", ["More capital inflows than outflows", "More spent on imports of goods and services than earned from exports", "Government spending exceeds tax revenue", "The exchange rate is falling"]),
    mcq("mc17", "Comparative advantage is based on:", "A", ["Absolute cost differences", "Differences in opportunity cost", "Exchange rates", "Labour productivity"]),
    mcq("mc18", "A tariff is:", "A", ["A limit on the quantity of imports", "A tax on imports", "A subsidy on exports", "A quota on exports"]),
    mcq("mc19", "An expansionary monetary policy involves:", "A", ["Raising taxes", "Cutting interest rates", "Reducing government spending", "Increasing the exchange rate"]),
    mcq("mc20", "The Human Development Index includes:", "A", ["GDP only", "Life expectancy, education, and income per capita", "Trade balance and inflation", "Only economic indicators"]),
    mcq("mc21", "A supply-side policy is:", "A", ["Cutting interest rates", "Increasing income tax", "Deregulation of industries", "Increasing government borrowing"]),
    mcq("mc22", "The law of diminishing marginal returns states that:", "A", ["Total output always falls", "Adding more variable factor to a fixed factor eventually reduces marginal output", "Average costs always rise", "Profits always fall"]),
    mcq("mc23", "Positive externalities lead to:", "A", ["Overproduction", "Underproduction", "Efficient allocation", "No market failure"]),
    mcq("mc24", "A regressive tax takes a:", "A", ["Higher proportion from the rich", "Same proportion from everyone", "Higher proportion from the poor", "Same amount from everyone"]),
    mcq("mc25", "The terms of trade are calculated as:", "A", ["Export volume ÷ import volume", "Export price index ÷ import price index × 100", "Total trade ÷ GDP", "Exchange rate × trade balance"]),
    mcq("mc26", "Fiscal policy involves:", "A", ["Interest rate changes", "Money supply changes", "Government spending and taxation changes", "Exchange rate intervention"]),
    mcq("mc27", "The infant industry argument justifies:", "A", ["Free trade", "Permanent protection", "Temporary protection for new industries", "Banning imports"]),
    mcq("mc28", "A floating exchange rate is determined by:", "A", ["Government decree", "Market forces of supply and demand", "International agreement", "Central bank intervention only"]),
    mcq("mc29", "Economic development differs from economic growth because it includes:", "A", ["Only GDP increases", "Improvements in living standards, health, and education", "Only industrial output", "Military spending"]),
    mcq("mc30", "Market failure occurs when:", "A", ["Firms make losses", "Resources are not allocated efficiently", "The government intervenes", "There is perfect competition"]),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL PAPERS
// ═══════════════════════════════════════════════════════════════════════════

export const ALL_MOCK_PAPERS: PaperDef[] = [
  // Edexcel Economics (7 papers)
  EDEXCEL_ECON_P1_2023, EDEXCEL_ECON_P2_2023, EDEXCEL_ECON_P3_2023,
  EDEXCEL_ECON_P1_2022, EDEXCEL_ECON_P2_2022, EDEXCEL_ECON_P3_2022,
  // AQA Economics (6 papers)
  AQA_ECON_P1_2023, AQA_ECON_P2_2023, AQA_ECON_P3_2023,
  AQA_ECON_P1_2022, AQA_ECON_P2_2022, AQA_ECON_P3_2022,
  // CIE Economics (3 papers)
  CIE_ECON_P1_2023, CIE_ECON_P4_2023, CIE_ECON_P1_2022,
  // OCR Computer Science (3 papers)
  OCR_CS_P1_2023, OCR_CS_P2_2023, OCR_CS_P1_2022,
  // OCR Physics (3 papers)
  OCR_PHYSICS_P1_2023, OCR_PHYSICS_P2_2023, OCR_PHYSICS_P1_2022,
  // AQA Chemistry (4 papers)
  AQA_CHEM_P1_2023, AQA_CHEM_P2_2023, AQA_CHEM_P3_2023, AQA_CHEM_P1_2022,
  // AQA Psychology (3 papers)
  AQA_PSYCH_P1_2023, AQA_PSYCH_P2_2023, AQA_PSYCH_P1_2022,
  // Edexcel Mathematics (4 papers)
  EDEXCEL_MATHS_P1_2023, EDEXCEL_MATHS_P2_2023, EDEXCEL_MATHS_P3_2023,
  EDEXCEL_MATHS_P1_2022,
];
