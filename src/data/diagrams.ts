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
  }
];
