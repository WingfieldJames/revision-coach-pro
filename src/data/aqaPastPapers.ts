export interface AQASpecPoint {
  code: string;
  name: string;
  part: 1 | 2; // Part 1 = Micro, Part 2 = Macro
  keywords: string[];
}

export interface AQAPastPaperQuestion {
  paper: string;
  year: number;
  section: string;
  number: string;
  question: string;
  marks: number;
  specCodes: string[];
  extract?: string;
}

// ===== AQA A-Level Economics Specification Points =====
export const AQA_SPEC_POINTS: AQASpecPoint[] = [
  // Part 1: 4.1 Individuals, firms, markets and market failure (Microeconomics)
  // 4.1.1 Economic methodology and the economic problem
  { code: "4.1.1.1", name: "Economic methodology", part: 1, keywords: ["methodology", "positive", "normative", "ceteris paribus", "economic models"] },
  { code: "4.1.1.2", name: "The nature and purpose of economic activity", part: 1, keywords: ["economic activity", "needs", "wants", "utility", "welfare"] },
  { code: "4.1.1.3", name: "Economic resources", part: 1, keywords: ["economic resources", "factors of production", "land", "labour", "capital", "enterprise", "renewable", "non-renewable"] },
  { code: "4.1.1.4", name: "Scarcity, choice and the allocation of resources", part: 1, keywords: ["scarcity", "choice", "allocation", "opportunity cost", "economic problem"] },
  { code: "4.1.1.5", name: "Production possibility diagrams", part: 1, keywords: ["ppf", "ppd", "production possibility", "frontier", "diagram", "trade-off", "opportunity cost"] },

  // 4.1.2 Individual economic decision making
  { code: "4.1.2.1", name: "Consumer behaviour (Rationality)", part: 1, keywords: ["consumer behaviour", "rationality", "rational", "utility maximisation", "marginal utility"] },
  { code: "4.1.2.2", name: "Imperfect information", part: 1, keywords: ["imperfect information", "asymmetric information", "information failure", "information gaps"] },
  { code: "4.1.2.3", name: "Aspects of behavioural economic theory", part: 1, keywords: ["behavioural economics", "bounded rationality", "bounded self-control", "anchoring", "framing", "availability bias", "heuristics"] },
  { code: "4.1.2.4", name: "Behavioural economics and economic policy (Nudges)", part: 1, keywords: ["nudge", "nudges", "choice architecture", "default", "libertarian paternalism", "behavioural policy"] },

  // 4.1.3 Price determination in a competitive market
  { code: "4.1.3.1", name: "The determinants of the demand for goods and services", part: 1, keywords: ["demand", "determinants of demand", "demand curve", "shifts", "income", "substitutes", "complements"] },
  { code: "4.1.3.2", name: "Price, income and cross-price elasticities of demand", part: 1, keywords: ["ped", "yed", "xed", "elasticity", "price elasticity", "income elasticity", "cross elasticity", "elastic", "inelastic"] },
  { code: "4.1.3.3", name: "The determinants of the supply of goods and services", part: 1, keywords: ["supply", "determinants of supply", "supply curve", "shifts in supply", "costs of production"] },
  { code: "4.1.3.4", name: "Price elasticity of supply", part: 1, keywords: ["pes", "price elasticity of supply", "supply elasticity", "time period"] },
  { code: "4.1.3.5", name: "The determination of equilibrium price and quantity", part: 1, keywords: ["equilibrium", "equilibrium price", "equilibrium quantity", "market equilibrium", "excess demand", "excess supply"] },
  { code: "4.1.3.6", name: "The interrelationship between markets", part: 1, keywords: ["interrelationship", "joint supply", "composite demand", "derived demand", "substitutes", "complements"] },

  // 4.1.4 Production, costs and revenue
  { code: "4.1.4.1", name: "Production and productivity", part: 1, keywords: ["production", "productivity", "output", "labour productivity"] },
  { code: "4.1.4.2", name: "Specialisation, division of labour and exchange", part: 1, keywords: ["specialisation", "division of labour", "exchange", "money", "barter"] },
  { code: "4.1.4.3", name: "Law of diminishing returns and returns to scale", part: 1, keywords: ["diminishing returns", "returns to scale", "increasing returns", "decreasing returns", "constant returns", "short run", "long run"] },
  { code: "4.1.4.4", name: "Costs of production", part: 1, keywords: ["costs", "fixed costs", "variable costs", "total cost", "average cost", "marginal cost", "afc", "avc", "atc", "mc"] },
  { code: "4.1.4.5", name: "Economies and diseconomies of scale", part: 1, keywords: ["economies of scale", "diseconomies of scale", "internal", "external", "minimum efficient scale", "lrac"] },
  { code: "4.1.4.6", name: "Marginal, average and total revenue", part: 1, keywords: ["marginal revenue", "average revenue", "total revenue", "mr", "ar", "tr", "revenue curves"] },
  { code: "4.1.4.7", name: "Profit (Normal, Supernormal and Loss)", part: 1, keywords: ["profit", "normal profit", "supernormal profit", "abnormal profit", "loss", "subnormal profit"] },

  // 4.1.5 Perfect competition, imperfectly competitive markets and monopoly
  { code: "4.1.5.1", name: "Market structures", part: 1, keywords: ["market structure", "number of firms", "barriers to entry", "product differentiation", "market power"] },
  { code: "4.1.5.2", name: "The objectives of firms", part: 1, keywords: ["objectives", "profit maximisation", "revenue maximisation", "sales maximisation", "satisficing", "mc=mr"] },
  { code: "4.1.5.3", name: "Perfect competition", part: 1, keywords: ["perfect competition", "price taker", "homogeneous", "many firms", "free entry", "free exit", "normal profit"] },
  { code: "4.1.5.4", name: "Monopolistic competition", part: 1, keywords: ["monopolistic competition", "product differentiation", "many firms", "low barriers", "non-price competition"] },
  { code: "4.1.5.5", name: "Oligopoly (Game theory, Concentration ratios, Collusion)", part: 1, keywords: ["oligopoly", "game theory", "concentration ratio", "collusion", "cartel", "interdependence", "kinked demand", "prisoners dilemma", "nash equilibrium"] },
  { code: "4.1.5.6", name: "Monopoly and monopoly power", part: 1, keywords: ["monopoly", "monopoly power", "barriers to entry", "price maker", "supernormal profit", "natural monopoly"] },
  { code: "4.1.5.7", name: "Price discrimination", part: 1, keywords: ["price discrimination", "first degree", "second degree", "third degree", "consumer surplus", "conditions"] },
  { code: "4.1.5.8", name: "The dynamics of competition and market structure (Contestability)", part: 1, keywords: ["contestability", "contestable market", "hit and run", "sunk costs", "barriers to entry", "barriers to exit", "creative destruction"] },
  { code: "4.1.5.9", name: "Consumer and producer surplus", part: 1, keywords: ["consumer surplus", "producer surplus", "welfare", "deadweight loss", "total surplus"] },

  // 4.1.6 The labour market
  { code: "4.1.6.1", name: "The demand for labour, marginal revenue product", part: 1, keywords: ["demand for labour", "mrp", "marginal revenue product", "derived demand", "wage rate"] },
  { code: "4.1.6.2", name: "The supply of labour", part: 1, keywords: ["supply of labour", "labour supply", "backward bending", "participation rate", "migration", "net migration"] },
  { code: "4.1.6.3", name: "Wage determination in competitive and non-competitive markets", part: 1, keywords: ["wage determination", "competitive labour market", "monopsony", "bilateral monopoly", "wage differential"] },
  { code: "4.1.6.4", name: "Trade union power and National Minimum Wage", part: 1, keywords: ["trade union", "national minimum wage", "nmw", "living wage", "collective bargaining", "industrial action", "strikes"] },

  // 4.1.7 The distribution of income and wealth
  { code: "4.1.7.1", name: "Distribution of income and wealth (Lorenz curve, Gini coefficient)", part: 1, keywords: ["income distribution", "wealth distribution", "lorenz curve", "gini coefficient", "inequality", "income inequality"] },
  { code: "4.1.7.2", name: "Poverty (Absolute vs Relative)", part: 1, keywords: ["poverty", "absolute poverty", "relative poverty", "in-work poverty", "poverty trap", "poverty line"] },

  // 4.1.8 The market mechanism, market failure and government intervention
  { code: "4.1.8.1", name: "How markets and prices allocate resources", part: 1, keywords: ["price mechanism", "market mechanism", "rationing", "signalling", "incentive"] },
  { code: "4.1.8.2", name: "Externalities (Negative and Positive)", part: 1, keywords: ["externalities", "negative externality", "positive externality", "external cost", "external benefit", "msc", "mpc", "msb", "mpb", "social cost", "private cost"] },
  { code: "4.1.8.3", name: "Public goods, private goods and quasi-public goods", part: 1, keywords: ["public good", "private good", "quasi-public good", "non-excludable", "non-rivalrous", "free rider"] },
  { code: "4.1.8.4", name: "Information gaps (Asymmetric information)", part: 1, keywords: ["information gaps", "asymmetric information", "moral hazard", "adverse selection", "principal-agent"] },
  { code: "4.1.8.5", name: "Merit and demerit goods", part: 1, keywords: ["merit good", "demerit good", "under-consumption", "over-consumption", "paternalism"] },
  { code: "4.1.8.6", name: "Market failure in the financial sector", part: 1, keywords: ["financial sector", "market failure", "moral hazard", "speculation", "systemic risk", "financial crisis", "too big to fail"] },
  { code: "4.1.8.7", name: "Government intervention in markets (Taxes, subsidies, price caps)", part: 1, keywords: ["government intervention", "indirect tax", "subsidy", "maximum price", "minimum price", "price cap", "regulation", "tradable permits", "buffer stock"] },
  { code: "4.1.8.8", name: "Government failure", part: 1, keywords: ["government failure", "unintended consequences", "information failure", "distortion", "administrative cost", "regulatory capture"] },
  { code: "4.1.8.9", name: "Competition policy", part: 1, keywords: ["competition policy", "cma", "competition and markets authority", "merger regulation", "anti-competitive", "cartel"] },
  { code: "4.1.8.10", name: "Public ownership, privatisation, regulation and deregulation", part: 1, keywords: ["public ownership", "privatisation", "regulation", "deregulation", "nationalisation", "natural monopoly"] },

  // Part 2: 4.2 The national and international economy (Macroeconomics)
  // 4.2.1 The measurement of macroeconomic performance
  { code: "4.2.1.1", name: "The objectives of government economic policy", part: 2, keywords: ["macroeconomic objectives", "economic growth", "low inflation", "full employment", "balance of payments", "policy objectives"] },
  { code: "4.2.1.2", name: "National income indicators (GDP, GNI)", part: 2, keywords: ["gdp", "gni", "gnp", "national income", "real gdp", "nominal gdp", "per capita", "ppp"] },
  { code: "4.2.1.3", name: "Index numbers", part: 2, keywords: ["index numbers", "base year", "cpi", "rpi", "price index", "weighted index"] },
  { code: "4.2.1.4", name: "Uses of national income data", part: 2, keywords: ["national income data", "standard of living", "limitations of gdp", "comparison", "international comparisons"] },

  // 4.2.2 How the macroeconomy works
  { code: "4.2.2.1", name: "The circular flow of income", part: 2, keywords: ["circular flow", "injections", "withdrawals", "leakages", "savings", "taxation", "imports"] },
  { code: "4.2.2.2", name: "Aggregate demand (AD)", part: 2, keywords: ["aggregate demand", "ad", "ad curve", "shifts in ad", "components of ad"] },
  { code: "4.2.2.3", name: "Consumption (C)", part: 2, keywords: ["consumption", "consumer spending", "savings ratio", "wealth effect", "consumer confidence", "mpc", "apc"] },
  { code: "4.2.2.4", name: "Investment (I) - The accelerator", part: 2, keywords: ["investment", "accelerator", "capital investment", "interest rates", "animal spirits", "business confidence"] },
  { code: "4.2.2.5", name: "Government spending (G)", part: 2, keywords: ["government spending", "government expenditure", "public spending", "current spending", "capital spending"] },
  { code: "4.2.2.6", name: "Net trade (X-M)", part: 2, keywords: ["net trade", "exports", "imports", "trade balance", "exchange rate effect"] },
  { code: "4.2.2.7", name: "Aggregate supply (AS) - SRAS and LRAS", part: 2, keywords: ["aggregate supply", "sras", "lras", "short run aggregate supply", "long run aggregate supply", "classical", "keynesian"] },
  { code: "4.2.2.8", name: "The determination of national income (AD/AS equilibrium)", part: 2, keywords: ["national income determination", "ad/as", "equilibrium", "macroeconomic equilibrium", "real output", "price level"] },
  { code: "4.2.2.9", name: "The multiplier effect", part: 2, keywords: ["multiplier", "multiplier effect", "fiscal multiplier", "mpc", "mps", "injections"] },

  // 4.2.3 Economic performance
  { code: "4.2.3.1", name: "Economic growth and the economic cycle", part: 2, keywords: ["economic growth", "economic cycle", "business cycle", "trade cycle", "boom", "recession", "recovery", "slump", "output gap"] },
  { code: "4.2.3.2", name: "Employment and unemployment", part: 2, keywords: ["employment", "unemployment", "claimant count", "ilo", "cyclical", "structural", "frictional", "seasonal", "natural rate"] },
  { code: "4.2.3.3", name: "Inflation and deflation (CPI, RPI)", part: 2, keywords: ["inflation", "deflation", "cpi", "rpi", "demand-pull", "cost-push", "hyperinflation", "disinflation", "price level"] },
  { code: "4.2.3.4", name: "Possible conflicts between policy objectives (Phillips Curve)", part: 2, keywords: ["phillips curve", "policy conflict", "trade-off", "inflation unemployment", "short run phillips curve", "long run phillips curve"] },

  // 4.2.4 Financial markets and monetary policy
  { code: "4.2.4.1", name: "The structure of financial markets", part: 2, keywords: ["financial markets", "money market", "capital market", "bond market", "stock market", "forex"] },
  { code: "4.2.4.2", name: "The role of central banks", part: 2, keywords: ["central bank", "bank of england", "monetary policy", "interest rate", "base rate", "quantitative easing", "qe", "mpc"] },
  { code: "4.2.4.3", name: "The regulation of the financial system", part: 2, keywords: ["financial regulation", "prudential regulation", "fca", "pra", "capital requirements", "liquidity", "systemic risk"] },

  // 4.2.5 Fiscal policy and supply-side policies
  { code: "4.2.5.1", name: "Fiscal policy (Deficits, national debt)", part: 2, keywords: ["fiscal policy", "budget deficit", "budget surplus", "national debt", "government borrowing", "taxation", "progressive tax", "regressive tax", "automatic stabilisers"] },
  { code: "4.2.5.2", name: "Supply-side policies", part: 2, keywords: ["supply-side policies", "education", "training", "deregulation", "privatisation", "infrastructure", "market-based", "interventionist", "lras"] },

  // 4.2.6 The international economy
  { code: "4.2.6.1", name: "Globalisation", part: 2, keywords: ["globalisation", "globalisation", "mnc", "multinational", "fdi", "foreign direct investment", "trade liberalisation"] },
  { code: "4.2.6.2", name: "Trade (Absolute/Comparative advantage)", part: 2, keywords: ["trade", "comparative advantage", "absolute advantage", "specialisation", "free trade", "protectionism", "tariff", "quota"] },
  { code: "4.2.6.3", name: "The balance of payments (Current account)", part: 2, keywords: ["balance of payments", "current account", "trade deficit", "trade surplus", "capital account", "financial account"] },
  { code: "4.2.6.4", name: "Exchange rate systems", part: 2, keywords: ["exchange rate", "fixed exchange rate", "floating exchange rate", "managed float", "depreciation", "appreciation", "devaluation"] },
  { code: "4.2.6.5", name: "Economic growth and development (HDI)", part: 2, keywords: ["economic development", "hdi", "human development index", "developing economies", "aid", "debt relief", "sustainable development"] },
];

// ===== AQA Past Paper Questions (2023-2024) =====
export const AQA_PAST_QUESTIONS: AQAPastPaperQuestion[] = [
  // ===== PAPER 1 JUNE 2024 =====
  // Section A: Data response (Student accommodation)
  { paper: "Paper 1", year: 2024, section: "A", number: "01", marks: 2, specCodes: ["4.2.1.3"],
    question: "Calculate the percentage increase in average university rent, in real terms, between 2015 and 2021.",
    extract: "Inflation: £100 in 2015 = £112 in 2021. Average weekly university rent: £121.16 (2015) to £169.35 (2021)." },
  { paper: "Paper 1", year: 2024, section: "A", number: "02", marks: 4, specCodes: ["4.1.3.3", "4.1.3.4"],
    question: "Explain how the data show that the supply of university and private rental accommodation has failed to match the increase in student numbers between 2015 and 2021.",
    extract: "Students increased from ~1.7m to ~2.1m. University rental supply flat (~330k), private rental up slightly." },
  { paper: "Paper 1", year: 2024, section: "A", number: "03", marks: 9, specCodes: ["4.1.3.5", "4.1.3.4", "4.1.3.1"],
    question: "With the help of a diagram, explain the impact of the increase in the number of students attending university on the market for student accommodation.",
    extract: "Rising student numbers (demand) and highly inelastic supply of accommodation." },
  { paper: "Paper 1", year: 2024, section: "A", number: "04", marks: 25, specCodes: ["4.1.8.7", "4.1.8.8", "4.1.5.9"],
    question: "Discuss the advantages and disadvantages of policies the government might introduce to improve the market for student accommodation.",
    extract: "Rent controls, subsidies to builders, relaxing planning restrictions discussed." },

  // Section B: Data response (Labour markets)
  { paper: "Paper 1", year: 2024, section: "B", number: "05", marks: 2, specCodes: ["4.1.6.4"],
    question: "Calculate the difference between the mean percentage trade union membership in the private sector and the mean percentage trade union membership in the public sector over the period 2001-2021.",
    extract: "Trade union membership percentages for Private and Public sectors for years 2001-2021." },
  { paper: "Paper 1", year: 2024, section: "B", number: "06", marks: 4, specCodes: ["4.1.6.3", "4.1.7.1"],
    question: "Explain how the data show that, since 2015, living standards of people working in the private sector are likely to have increased compared to those working in the public sector.",
    extract: "Private sector pay growth is generally higher than public sector pay growth since 2015." },
  { paper: "Paper 1", year: 2024, section: "B", number: "07", marks: 9, specCodes: ["4.1.6.1", "4.1.6.2", "4.1.6.3"],
    question: "With the help of a diagram, explain how and to what extent a shortage of labour is likely to affect the wage in a competitive labour market.",
    extract: "13.3% of businesses reported experiencing a shortage of workers leading to upward pressure on wages." },
  { paper: "Paper 1", year: 2024, section: "B", number: "08", marks: 25, specCodes: ["4.1.6.4", "4.1.6.3"],
    question: "Evaluate the view that trade unions improve the operation of labour markets by protecting the interests of workers.",
    extract: "Collective pay bargaining, strikes, training, minimum wage campaigns discussed." },

  // Section C: Essay questions
  { paper: "Paper 1", year: 2024, section: "C", number: "09", marks: 15, specCodes: ["4.1.2.2", "4.1.2.3", "4.1.8.4"],
    question: "Explain why imperfect and asymmetric information may lead to market failure in the market for food.",
    extract: "Obesity rates, taxes on sugary drinks, behavioural economics." },
  { paper: "Paper 1", year: 2024, section: "C", number: "10", marks: 25, specCodes: ["4.1.8.7", "4.1.8.8", "4.1.8.2"],
    question: "Evaluate policies the government could use to reduce the consumption of food and drink which have negative effects on health." },
  { paper: "Paper 1", year: 2024, section: "C", number: "11", marks: 15, specCodes: ["4.1.5.5", "4.1.5.6"],
    question: "Explain how the behaviour of firms is likely to differ between an oligopolistic market and a monopoly." },
  { paper: "Paper 1", year: 2024, section: "C", number: "12", marks: 25, specCodes: ["4.1.5.8", "4.1.8.9", "4.1.8.10"],
    question: "Evaluate the view that increased market contestability always benefits consumers." },

  // ===== PAPER 2 JUNE 2024 =====
  // Section A: Data response (Productivity and living standards)
  { paper: "Paper 2", year: 2024, section: "A", number: "01", marks: 2, specCodes: ["4.2.1.2"],
    question: "Calculate the ratio of the UK's GDP per hour worked to $1 of GDP per hour worked in Hungary.",
    extract: "Productivity (GDP per hour worked) data for Estonia, Hungary, and UK." },
  { paper: "Paper 2", year: 2024, section: "A", number: "02", marks: 4, specCodes: ["4.2.1.2", "4.2.1.4"],
    question: "Explain how the data show that higher productivity may result in higher living standards.",
    extract: "Table showing Productivity, Life expectancy, Gini coefficient, Expected years of schooling, CO2 emissions." },
  { paper: "Paper 2", year: 2024, section: "A", number: "03", marks: 9, specCodes: ["4.2.6.4", "4.2.3.3"],
    question: "With the help of a diagram, explain how a depreciation of the pound may cause inflation.",
    extract: "Energy and food bills had risen dramatically due to labour shortages and depreciation of the pound." },
  { paper: "Paper 2", year: 2024, section: "A", number: "04", marks: 25, specCodes: ["4.2.5.2", "4.2.3.1", "4.2.1.4"],
    question: "Assess the view that the government should make raising productivity a priority in order to improve living standards in the UK.",
    extract: "UK's productivity puzzle and methods to raise productivity discussed." },

  // Section B: Data response (Vietnam and globalisation)
  { paper: "Paper 2", year: 2024, section: "B", number: "05", marks: 2, specCodes: ["4.2.1.2"],
    question: "Calculate the percentage change in Vietnam's GDP per capita between the years 2010 and 2021.",
    extract: "GDP per capita for Malaysia, Thailand, and Vietnam (2010 and 2021)." },
  { paper: "Paper 2", year: 2024, section: "B", number: "06", marks: 4, specCodes: ["4.2.3.1", "4.2.1.4"],
    question: "Explain how the data show that Vietnam may have outperformed the other selected Southeast Asian economies between 2010 and 2021.",
    extract: "Macroeconomic indicators for Malaysia, Thailand, and Vietnam." },
  { paper: "Paper 2", year: 2024, section: "B", number: "07", marks: 9, specCodes: ["4.2.5.1", "4.2.3.1", "4.2.2.7"],
    question: "With the help of a diagram, explain how a low rate of corporation tax may cause short-run and long-run economic growth.",
    extract: "Vietnam's low corporation tax has contributed to both short-run and long-run economic growth." },
  { paper: "Paper 2", year: 2024, section: "B", number: "08", marks: 25, specCodes: ["4.2.6.1", "4.2.6.2", "4.2.6.5"],
    question: "Discuss the view that a slowing, or reversal, of globalisation would be harmful to developing economies such as Vietnam.",
    extract: "Deglobalisation, protectionism, and the impact of trade wars on Vietnam." },

  // Section C: Essay questions
  { paper: "Paper 2", year: 2024, section: "C", number: "09", marks: 15, specCodes: ["4.2.3.1", "4.2.2.2", "4.2.2.7"],
    question: "Explain possible reasons why a country may enter a recession." },
  { paper: "Paper 2", year: 2024, section: "C", number: "10", marks: 25, specCodes: ["4.2.5.1", "4.2.5.2", "4.2.3.4"],
    question: "Evaluate the view that fiscal policy is the most effective policy to promote economic growth." },
  { paper: "Paper 2", year: 2024, section: "C", number: "11", marks: 15, specCodes: ["4.2.6.3", "4.2.6.4"],
    question: "Explain how exchange rate changes may affect a country's current account balance." },
  { paper: "Paper 2", year: 2024, section: "C", number: "12", marks: 25, specCodes: ["4.2.6.1", "4.2.6.2", "4.2.6.5"],
    question: "Evaluate the view that globalisation has benefited developing countries more than developed countries." },

  // ===== PAPER 1 JUNE 2023 =====
  // Section A: Data response (Car market and batteries)
  { paper: "Paper 1", year: 2023, section: "A", number: "01", marks: 2, specCodes: ["4.2.1.3"],
    question: "Calculate the index of total car sales in 2021 if, in the base year, total car sales were 1.25 million.",
    extract: "Table 1: Sales of cars by fuel type in the UK, 2020 and 2021. Total car sales 2021: 1.647m." },
  { paper: "Paper 1", year: 2023, section: "A", number: "02", marks: 4, specCodes: ["4.1.3.6", "4.1.3.1"],
    question: "Explain how the data show that developments in the car market are the main reason for the changing demand for lithium-ion batteries in the UK.",
    extract: "UK demand for lithium-ion batteries rising with electric vehicle sales." },
  { paper: "Paper 1", year: 2023, section: "A", number: "03", marks: 9, specCodes: ["4.1.8.2"],
    question: "With the help of a diagram, explain why the production and sale of lithium-ion batteries might lead to market failure.",
    extract: "Environmental impact of battery production, cobalt mining issues, recycling efforts." },
  { paper: "Paper 1", year: 2023, section: "A", number: "04", marks: 25, specCodes: ["4.1.8.7", "4.1.8.8", "4.1.8.2"],
    question: "Evaluate policies that could be used to reduce the environmental impact of all types of car.",
    extract: "Electric vehicle revolution, government bans on petrol cars, subsidies, taxation." },

  // Section B: Data response (In-work poverty)
  { paper: "Paper 1", year: 2023, section: "B", number: "05", marks: 2, specCodes: ["4.1.7.1"],
    question: "Calculate the difference between the mean and median rate of growth of working households' real pre-tax earnings, over the period 1994-2017.",
    extract: "Growth in real pre-tax earnings for working households by percentile (1994-2017)." },
  { paper: "Paper 1", year: 2023, section: "B", number: "06", marks: 4, specCodes: ["4.1.7.2"],
    question: "Explain how the data show that employment is an increasingly ineffective protection against poverty.",
    extract: "In-work poverty rate by selected UK region, 2003/04 to 2019/20." },
  { paper: "Paper 1", year: 2023, section: "B", number: "07", marks: 9, specCodes: ["4.1.6.3", "4.1.6.4"],
    question: "With the help of a diagram, explain the likely impact of the introduction of the National Living Wage on the market for low-paid workers.",
    extract: "Mentions National Living Wage, monopsony, and competitive labour markets." },
  { paper: "Paper 1", year: 2023, section: "B", number: "08", marks: 25, specCodes: ["4.1.7.2", "4.1.6.4", "4.1.8.7"],
    question: "Evaluate policies that could be used to reduce in-work poverty in the UK.",
    extract: "Minimum wage, living wage, universal credit, charity support discussed." },

  // Section C: Essay questions
  { paper: "Paper 1", year: 2023, section: "C", number: "09", marks: 15, specCodes: ["4.1.4.5", "4.1.4.3"],
    question: "Explain the likely impact of economies and diseconomies of scale on a firm as it increases in size." },
  { paper: "Paper 1", year: 2023, section: "C", number: "10", marks: 25, specCodes: ["4.1.5.6", "4.1.5.2", "4.1.5.9"],
    question: "Evaluate the view that monopoly is always against the public interest." },
  { paper: "Paper 1", year: 2023, section: "C", number: "11", marks: 15, specCodes: ["4.1.6.3", "4.1.6.1"],
    question: "Explain the likely impact of monopsony power in a labour market." },
  { paper: "Paper 1", year: 2023, section: "C", number: "12", marks: 25, specCodes: ["4.1.6.3", "4.1.6.4"],
    question: "Evaluate the view that labour markets work best when strong monopsony power is balanced by trade union power." },
  { paper: "Paper 1", year: 2023, section: "C", number: "13", marks: 15, specCodes: ["4.1.5.8"],
    question: "Explain how market contestability affects the performance of an industry." },
  { paper: "Paper 1", year: 2023, section: "C", number: "14", marks: 25, specCodes: ["4.1.8.9", "4.1.8.10", "4.1.5.6"],
    question: "Evaluate the view that regulation is the most effective method of making a monopoly act in the public interest." },

  // ===== PAPER 2 JUNE 2023 =====
  // Section A: Data response (Ireland and corporation tax)
  { paper: "Paper 2", year: 2023, section: "A", number: "01", marks: 2, specCodes: ["4.2.5.1"],
    question: "Calculate the difference between Ireland's corporation tax rate and the mean corporation tax rate of the other five European nations.",
    extract: "Corporation tax rates: France (26.5%), Germany (29.7%), Ireland (12.5%), Italy (27.9%), Spain (25%), UK (19%)." },
  { paper: "Paper 2", year: 2023, section: "A", number: "02", marks: 4, specCodes: ["4.2.1.2", "4.2.1.4"],
    question: "Explain how the data show that Ireland's economy performed better than the economies of France and Spain in 2021.",
    extract: "GDP, Exports, Inflation, Unemployment, and Labour force data for France, Ireland, and Spain." },
  { paper: "Paper 2", year: 2023, section: "A", number: "03", marks: 9, specCodes: ["4.2.3.1", "4.2.5.1"],
    question: "With the help of a diagram, explain how high economic growth could help to create a budget surplus.",
    extract: "Ireland's high economic growth rates allowed it to run budget surpluses in 2018 and 2019." },
  { paper: "Paper 2", year: 2023, section: "A", number: "04", marks: 25, specCodes: ["4.2.5.1", "4.2.6.1", "4.2.2.4"],
    question: "Assess the view that a rise in Ireland's corporation tax rate is likely to have a damaging effect on its macroeconomic performance.",
    extract: "Ireland dropped its low-tax policy, global minimum tax of 15% introduced." },

  // Section B: Data response (Quantitative easing)
  { paper: "Paper 2", year: 2023, section: "B", number: "05", marks: 2, specCodes: ["4.2.4.2"],
    question: "Calculate the value of bonds that had been purchased by November 2020 for every £1 worth of bonds purchased by November 2009.",
    extract: "Bank of England QE purchases: Nov 2009: £200bn; Nov 2020: £895bn." },
  { paper: "Paper 2", year: 2023, section: "B", number: "06", marks: 4, specCodes: ["4.2.4.2", "4.2.1.1"],
    question: "Explain how the data show that the growth in quantitative easing may have been successful in helping the UK achieve its macroeconomic objectives since 2009.",
    extract: "UK macro indicators (Growth, Inflation, Unemployment, Current Account) averaged over periods 2006-21." },
  { paper: "Paper 2", year: 2023, section: "B", number: "07", marks: 9, specCodes: ["4.2.4.2", "4.2.2.2", "4.2.3.3"],
    question: "With the help of a diagram, explain how quantitative easing may cause a change in the rate of inflation.",
    extract: "Quantitative easing increased money supply, inflation concerns." },
  { paper: "Paper 2", year: 2023, section: "B", number: "08", marks: 25, specCodes: ["4.2.4.2", "4.2.5.1", "4.2.3.4"],
    question: "Evaluate the view that monetary policy is more effective than fiscal policy to achieve macroeconomic objectives.",
    extract: "QE, interest rate adjustments, fiscal austerity vs stimulus compared." },

  // Section C: Essay questions
  { paper: "Paper 2", year: 2023, section: "C", number: "09", marks: 15, specCodes: ["4.2.6.4", "4.2.6.3"],
    question: "Explain how changes in a floating exchange rate may affect the macroeconomic performance of a country." },
  { paper: "Paper 2", year: 2023, section: "C", number: "10", marks: 25, specCodes: ["4.2.6.2", "4.2.6.1"],
    question: "Evaluate the view that protectionism is always harmful to a country's economic performance." },
  { paper: "Paper 2", year: 2023, section: "C", number: "11", marks: 15, specCodes: ["4.2.2.9"],
    question: "Explain possible reasons why the value of the multiplier may differ between countries." },
  { paper: "Paper 2", year: 2023, section: "C", number: "12", marks: 25, specCodes: ["4.2.5.2", "4.2.3.1"],
    question: "Evaluate the effectiveness of supply-side policies in promoting long-run economic growth." },
  { paper: "Paper 2", year: 2023, section: "C", number: "13", marks: 15, specCodes: ["4.2.3.1"],
    question: "Explain possible causes of economic growth." },
  { paper: "Paper 2", year: 2023, section: "C", number: "14", marks: 25, specCodes: ["4.2.3.1", "4.2.1.4", "4.2.6.5"],
    question: "Evaluate the view that economic growth usually leads to an improvement in living standards." },
];
