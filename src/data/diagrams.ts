export interface Diagram {
  id: string;
  title: string;
  keywords: string[];
  imagePath: string;
}

export const diagrams: Diagram[] = [
  {
    id: 'ad-as-basic',
    title: 'Aggregate Demand and Aggregate Supply',
    keywords: ['AD', 'AS', 'aggregate demand', 'aggregate supply', 'macroeconomic equilibrium', 'price level', 'real GDP', 'LRAS', 'SRAS'],
    imagePath: '/diagrams/ad-as-basic.png'
  },
  {
    id: 'perfect-competition',
    title: 'Perfect Competition',
    keywords: ['perfect competition', 'perfectly competitive', 'price taker', 'MC=MR', 'normal profit', 'supernormal profit', 'long run equilibrium'],
    imagePath: '/diagrams/perfect-competition.png'
  },
  {
    id: 'demand-shift-left',
    title: 'Demand Shifting Left',
    keywords: ['demand decrease', 'demand shift left', 'fall in demand', 'demand curve shift', 'leftward shift demand', 'decrease in quantity demanded'],
    imagePath: '/diagrams/demand-shift-left.png'
  },
  {
    id: 'kuznets-curve',
    title: 'Kuznets Curve',
    keywords: ['kuznets', 'inequality', 'income inequality', 'economic development', 'inverted U', 'simon kuznets'],
    imagePath: '/diagrams/kuznets-curve.png'
  },
  {
    id: 'supply-demand-equilibrium',
    title: 'Supply and Demand Equilibrium',
    keywords: ['supply', 'demand', 'equilibrium', 'market equilibrium', 'price equilibrium', 'quantity equilibrium', 'market clearing'],
    imagePath: '/diagrams/supply-demand-equilibrium.png'
  },
  {
    id: 'monopoly',
    title: 'Monopoly Price and Output',
    keywords: ['monopoly', 'monopolist', 'price maker', 'MR=MC', 'supernormal profit', 'deadweight loss', 'allocative inefficiency'],
    imagePath: '/diagrams/monopoly.png'
  },
  {
    id: 'supply-shift-right',
    title: 'Supply Shifting Right',
    keywords: ['supply increase', 'supply shift right', 'rise in supply', 'supply curve shift', 'rightward shift supply'],
    imagePath: '/diagrams/supply-shift-right.png'
  },
  {
    id: 'phillips-curve',
    title: 'Phillips Curve',
    keywords: ['phillips curve', 'inflation', 'unemployment', 'trade-off', 'stagflation', 'NAIRU'],
    imagePath: '/diagrams/phillips-curve.png'
  }
];
