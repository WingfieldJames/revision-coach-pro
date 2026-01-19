export interface Diagram {
  id: string;
  title: string;
  keywords: string[];
  imagePath: string;
}

export const diagrams: Diagram[] = [
  {
    id: 'ppf',
    title: 'Production Possibility Frontier (PPF)',
    keywords: ['PPF', 'production possibility frontier', 'production possibilities curve', 'PPC', 'opportunity cost', 'trade-off', 'scarcity', 'capital goods', 'consumer goods', 'economic efficiency', 'productive efficiency'],
    imagePath: '/diagrams/ppf.jpg'
  },
  {
    id: 'ppf-shift',
    title: 'Shift of PPF',
    keywords: ['PPF shift', 'production possibility frontier shift', 'economic growth', 'outward shift', 'inward shift', 'increase in productive capacity', 'technological progress', 'capital accumulation'],
    imagePath: '/diagrams/ppf-shift.jpg'
  },
  {
    id: 'supply-demand-equilibrium',
    title: 'Supply and Demand Equilibrium',
    keywords: ['supply', 'demand', 'equilibrium', 'market equilibrium', 'price equilibrium', 'quantity equilibrium', 'market clearing', 'Pe', 'Qe', 'equilibrium price', 'equilibrium quantity'],
    imagePath: '/diagrams/supply-demand-equilibrium.jpg'
  },
  {
    id: 'demand-shift-right',
    title: 'Demand Shifts Right (Increase in Demand)',
    keywords: ['demand increase', 'demand shift right', 'rise in demand', 'demand curve shift right', 'rightward shift demand', 'increase in quantity demanded', 'higher demand', 'D1 to D2'],
    imagePath: '/diagrams/demand-shift-right.jpg'
  },
  {
    id: 'demand-shift-left',
    title: 'Demand Shifts Left (Decrease in Demand)',
    keywords: ['demand decrease', 'demand shift left', 'fall in demand', 'demand curve shift left', 'leftward shift demand', 'decrease in quantity demanded', 'lower demand', 'D2 to D1'],
    imagePath: '/diagrams/demand-shift-left.jpg'
  },
  {
    id: 'supply-shift-right',
    title: 'Supply Shifts Right (Increase in Supply)',
    keywords: ['supply increase', 'supply shift right', 'rise in supply', 'supply curve shift right', 'rightward shift supply', 'increase in quantity supplied', 'higher supply', 'S1 to S2'],
    imagePath: '/diagrams/supply-shift-right.jpg'
  },
  {
    id: 'supply-shift-left',
    title: 'Supply Shifts Left (Decrease in Supply)',
    keywords: ['supply decrease', 'supply shift left', 'fall in supply', 'supply curve shift left', 'leftward shift supply', 'decrease in quantity supplied', 'lower supply', 'S2 to S1'],
    imagePath: '/diagrams/supply-shift-left.jpg'
  },
  {
    id: 'producer-consumer-surplus',
    title: 'Producer and Consumer Surplus',
    keywords: ['producer surplus', 'consumer surplus', 'welfare', 'economic welfare', 'total surplus', 'market surplus', 'surplus triangle', 'deadweight loss', 'allocative efficiency'],
    imagePath: '/diagrams/producer-consumer-surplus.jpg'
  },
  {
    id: 'specific-tax',
    title: 'Specific Tax (Per Unit Tax)',
    keywords: ['specific tax', 'per unit tax', 'indirect tax', 'tax incidence', 'consumer incidence', 'producer incidence', 'tax burden', 'excise tax', 'unit tax'],
    imagePath: '/diagrams/specific-tax.jpg'
  },
  {
    id: 'ad-valorem-tax',
    title: 'Ad-Valorem Tax',
    keywords: ['ad valorem tax', 'percentage tax', 'VAT', 'value added tax', 'proportional tax', 'tax on value', 'government revenue', 'pivoting supply curve'],
    imagePath: '/diagrams/ad-valorem-tax.jpg'
  },
  {
    id: 'subsidy',
    title: 'Subsidy',
    keywords: ['subsidy', 'government subsidy', 'producer benefit', 'consumer benefit', 'cost to government', 'subsidy diagram', 'supply shift subsidy', 'government spending'],
    imagePath: '/diagrams/subsidy.jpg'
  },
  {
    id: 'minimum-price',
    title: 'Minimum Price (Price Floor)',
    keywords: ['minimum price', 'price floor', 'excess supply', 'surplus', 'guaranteed minimum price', 'buffer stock', 'agricultural support', 'Pmin', 'price support'],
    imagePath: '/diagrams/minimum-price.jpg'
  },
  {
    id: 'maximum-price',
    title: 'Maximum Price (Price Ceiling)',
    keywords: ['maximum price', 'price ceiling', 'excess demand', 'shortage', 'price cap', 'rent control', 'Pmax', 'price control', 'rationing'],
    imagePath: '/diagrams/maximum-price.jpg'
  },
  {
    id: 'negative-externality-production',
    title: 'Negative Externality of Production',
    keywords: ['negative externality', 'externality of production', 'MSC', 'MPC', 'marginal social cost', 'marginal private cost', 'pollution', 'market failure', 'welfare loss', 'overproduction', 'deadweight loss'],
    imagePath: '/diagrams/negative-externality-production.jpg'
  },
  {
    id: 'positive-externality-consumption',
    title: 'Positive Externality of Consumption',
    keywords: ['positive externality', 'externality of consumption', 'MSB', 'MPB', 'marginal social benefit', 'marginal private benefit', 'merit good', 'underconsumption', 'welfare gain', 'education', 'healthcare'],
    imagePath: '/diagrams/positive-externality-consumption.jpg'
  },
  {
    id: 'ad-sras-ad-shifts-right',
    title: 'AD-SRAS (AD Shifts Right)',
    keywords: ['AD shifts right', 'aggregate demand increase', 'AD increase', 'rightward shift AD', 'expansionary', 'fiscal policy', 'monetary policy', 'consumption increase', 'investment increase', 'government spending increase', 'exports increase', 'AD1 to AD2', 'SRAS AD model'],
    imagePath: '/diagrams/ad-sras-ad-shifts-right.jpg'
  },
  {
    id: 'demand-pull-inflation',
    title: 'Demand Pull Inflation',
    keywords: ['demand pull inflation', 'demand-pull', 'inflation caused by demand', 'excess demand', 'AD increase inflation', 'too much money chasing too few goods', 'overheating economy', 'inflationary gap', 'price level increase demand'],
    imagePath: '/diagrams/demand-pull-inflation.jpg'
  },
  {
    id: 'ad-sras-ad-shifts-left',
    title: 'AD-SRAS (AD Shifts Left)',
    keywords: ['AD shifts left', 'aggregate demand decrease', 'AD decrease', 'leftward shift AD', 'contractionary', 'recession', 'consumption fall', 'investment fall', 'government spending cut', 'exports fall', 'AD2 to AD1', 'deflationary'],
    imagePath: '/diagrams/ad-sras-ad-shifts-left.jpg'
  },
  {
    id: 'ad-sras-sras-shifts-right',
    title: 'AD-SRAS (SRAS Shifts Right)',
    keywords: ['SRAS shifts right', 'short run aggregate supply increase', 'SRAS increase', 'rightward shift SRAS', 'lower production costs', 'productivity increase', 'wage decrease', 'raw material cost decrease', 'SRAS1 to SRAS2', 'supply side improvement'],
    imagePath: '/diagrams/ad-sras-sras-shifts-right.jpg'
  },
  {
    id: 'ad-sras-sras-shifts-left',
    title: 'AD-SRAS (SRAS Shifts Left)',
    keywords: ['SRAS shifts left', 'short run aggregate supply decrease', 'SRAS decrease', 'leftward shift SRAS', 'higher production costs', 'wage increase', 'raw material cost increase', 'oil price shock', 'supply shock', 'SRAS2 to SRAS1'],
    imagePath: '/diagrams/ad-sras-sras-shifts-left.jpg'
  },
  {
    id: 'cost-push-inflation',
    title: 'Cost Push Inflation',
    keywords: ['cost push inflation', 'cost-push', 'inflation caused by supply', 'supply side inflation', 'SRAS decrease inflation', 'wage push inflation', 'oil price inflation', 'raw material costs', 'stagflation', 'price level increase supply'],
    imagePath: '/diagrams/cost-push-inflation.jpg'
  },
  {
    id: 'circular-flow-of-income',
    title: 'Circular Flow of Income',
    keywords: ['circular flow', 'circular flow of income', 'households', 'firms', 'factor market', 'goods market', 'injections', 'withdrawals', 'leakages', 'savings', 'taxation', 'imports', 'investment', 'government spending', 'exports', 'national income'],
    imagePath: '/diagrams/circular-flow-of-income.jpg'
  },
  {
    id: 'keynesian-lras',
    title: 'Keynesian Long Run AS',
    keywords: ['Keynesian', 'Keynesian LRAS', 'Keynesian long run aggregate supply', 'L-shaped AS', 'horizontal AS', 'spare capacity', 'unemployment', 'full employment', 'classical vs keynesian', 'backward bending AS'],
    imagePath: '/diagrams/keynesian-lras.jpg'
  },
  {
    id: 'classical-positive-output-gap',
    title: 'Classical Positive Output Gap',
    keywords: ['positive output gap', 'inflationary gap', 'actual GDP above potential', 'overheating', 'above full employment', 'classical LRAS', 'Y greater than Yfe', 'boom', 'excess demand economy'],
    imagePath: '/diagrams/classical-positive-output-gap.jpg'
  },
  {
    id: 'classical-negative-output-gap',
    title: 'Classical Negative Output Gap',
    keywords: ['negative output gap', 'deflationary gap', 'recessionary gap', 'actual GDP below potential', 'below full employment', 'classical LRAS', 'Y less than Yfe', 'recession', 'spare capacity', 'unemployment gap'],
    imagePath: '/diagrams/classical-negative-output-gap.jpg'
  },
  {
    id: 'keynesian-negative-output-gap',
    title: 'Keynesian Negative Output Gap',
    keywords: ['keynesian negative output gap', 'keynesian deflationary gap', 'keynesian recessionary gap', 'keynesian below full employment', 'spare capacity keynesian', 'Y1 below Yfe keynesian', 'unemployment keynesian model'],
    imagePath: '/diagrams/keynesian-negative-output-gap.jpg'
  },
  {
    id: 'keynesian-economic-growth',
    title: 'Keynesian Economic Growth (LRAS Shifts Right)',
    keywords: ['keynesian economic growth', 'keynesian LRAS shift right', 'long run growth keynesian', 'potential output increase keynesian', 'productive capacity keynesian', 'LRAS1 to LRAS2 keynesian', 'supply side policies keynesian'],
    imagePath: '/diagrams/keynesian-economic-growth.jpg'
  },
  {
    id: 'trade-cycle',
    title: 'Trade Cycle (Business Cycle)',
    keywords: ['trade cycle', 'business cycle', 'economic cycle', 'boom', 'recession', 'slump', 'recovery', 'expansion', 'contraction', 'peak', 'trough', 'trend growth', 'actual growth', 'GDP fluctuations', 'cyclical fluctuations'],
    imagePath: '/diagrams/trade-cycle.jpg'
  },
  {
    id: 'short-run-phillips-curve',
    title: 'Short Run Phillips Curve',
    keywords: ['phillips curve', 'short run phillips curve', 'SRPC', 'inflation unemployment trade-off', 'inverse relationship inflation unemployment', 'demand side policies phillips', 'expectations augmented', 'natural rate of unemployment'],
    imagePath: '/diagrams/short-run-phillips-curve.jpg'
  }
];
