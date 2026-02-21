export interface EdexcelMathsAppliedSpecPoint {
  code: string;
  name: string;
  section: 'statistics' | 'mechanics';
  keywords: string[];
}

export interface EdexcelMathsAppliedPastPaperQuestion {
  paper: string;
  year: number;
  section: string;
  number: string;
  question: string;
  marks: number;
  specCodes: string[];
  extract?: string;
}

export const EDEXCEL_MATHS_APPLIED_SPEC_POINTS: EdexcelMathsAppliedSpecPoint[] = [
  // Statistics
  { code: "1.1", name: "Statistical Sampling", section: "statistics", keywords: ["sampling", "population", "sample", "random sampling", "opportunity sampling", "stratified", "systematic", "quota", "census", "bias"] },
  { code: "2.1", name: "Interpreting Diagrams for Single-Variable Data", section: "statistics", keywords: ["histogram", "frequency polygon", "box plot", "box and whisker", "cumulative frequency", "area", "frequency", "diagram", "single variable"] },
  { code: "2.2", name: "Scatter Diagrams and Regression Lines", section: "statistics", keywords: ["scatter diagram", "regression", "correlation", "bivariate", "interpolation", "extrapolation", "explanatory variable", "response variable", "line of best fit", "causation"] },
  { code: "2.3", name: "Measures of Central Tendency and Variation", section: "statistics", keywords: ["mean", "median", "mode", "variance", "standard deviation", "range", "interquartile range", "IQR", "coding", "Sxx", "central tendency", "variation", "percentile"] },
  { code: "2.4", name: "Outliers and Data Cleaning", section: "statistics", keywords: ["outlier", "outliers", "data cleaning", "missing data", "errors", "IQR", "box plot", "anomaly", "Q1", "Q3"] },
  { code: "3.1", name: "Mutually Exclusive and Independent Events", section: "statistics", keywords: ["mutually exclusive", "independent", "probability", "Venn diagram", "tree diagram", "P(A ∩ B)", "P(A ∪ B)", "intersection", "union"] },
  { code: "3.2", name: "Conditional Probability", section: "statistics", keywords: ["conditional probability", "P(A|B)", "given that", "two-way table", "Venn diagram", "tree diagram", "Bayes"] },
  { code: "3.3", name: "Modelling with Probability", section: "statistics", keywords: ["probability model", "modelling", "assumption", "fair", "bias", "criticise", "appropriateness"] },
  { code: "4.1", name: "Binomial Distribution", section: "statistics", keywords: ["binomial", "B(n,p)", "discrete", "probability distribution", "trials", "success", "failure", "cumulative", "uniform"] },
  { code: "4.2", name: "Normal Distribution", section: "statistics", keywords: ["normal distribution", "N(µ,σ²)", "bell curve", "z-value", "standardise", "continuity correction", "points of inflection", "symmetry", "approximation"] },
  { code: "4.3", name: "Selecting an Appropriate Distribution", section: "statistics", keywords: ["appropriate distribution", "binomial or normal", "model", "conditions", "suitability", "context"] },
  { code: "5.1", name: "Language of Hypothesis Testing and Correlation Coefficients", section: "statistics", keywords: ["hypothesis test", "null hypothesis", "alternative hypothesis", "significance level", "critical value", "critical region", "p-value", "test statistic", "correlation coefficient", "PMCC", "1-tail", "2-tail"] },
  { code: "5.2", name: "Hypothesis Testing for a Binomial Proportion", section: "statistics", keywords: ["binomial test", "proportion", "hypothesis", "significance", "reject", "accept", "population parameter", "p"] },
  { code: "5.3", name: "Hypothesis Testing for a Normal Mean", section: "statistics", keywords: ["normal test", "mean", "hypothesis", "z-test", "X̄", "σ/√n", "population mean", "µ", "sample mean"] },

  // Mechanics
  { code: "6.1", name: "Quantities and Units in Mechanics", section: "mechanics", keywords: ["SI units", "mass", "length", "time", "velocity", "acceleration", "force", "weight", "moment", "units", "convert"] },
  { code: "7.1", name: "Language of Kinematics", section: "mechanics", keywords: ["kinematics", "position", "displacement", "distance", "velocity", "speed", "acceleration", "scalar", "vector"] },
  { code: "7.2", name: "Kinematics Graphs", section: "mechanics", keywords: ["displacement-time", "velocity-time", "gradient", "area under graph", "kinematics graph", "acceleration", "distance"] },
  { code: "7.3", name: "Constant Acceleration (SUVAT)", section: "mechanics", keywords: ["suvat", "constant acceleration", "equations of motion", "u", "v", "a", "s", "t", "uniform acceleration", "2D vectors"] },
  { code: "7.4", name: "Calculus in Kinematics", section: "mechanics", keywords: ["calculus", "differentiate", "integrate", "v = dr/dt", "a = dv/dt", "velocity", "acceleration", "displacement", "vector calculus"] },
  { code: "7.5", name: "Projectiles", section: "mechanics", keywords: ["projectile", "projectile motion", "time of flight", "range", "greatest height", "trajectory", "equation of path", "vertical plane", "gravity"] },
  { code: "8.1", name: "Forces and Newton's First Law", section: "mechanics", keywords: ["force", "Newton's first law", "equilibrium", "inertia", "normal reaction", "tension", "thrust", "compression", "resistance"] },
  { code: "8.2", name: "Newton's Second Law", section: "mechanics", keywords: ["Newton's second law", "F = ma", "resultant force", "acceleration", "resolve", "inclined plane", "i-j", "component", "perpendicular"] },
  { code: "8.3", name: "Weight and Motion Under Gravity", section: "mechanics", keywords: ["weight", "gravity", "g", "9.8", "gravitational acceleration", "free fall", "vertical motion"] },
  { code: "8.4", name: "Newton's Third Law and Connected Particles", section: "mechanics", keywords: ["Newton's third law", "connected particles", "pulley", "string", "tension", "lift", "contact force", "reaction", "inclined"] },
  { code: "8.5", name: "Resultant Forces and Dynamics in a Plane", section: "mechanics", keywords: ["resultant", "resolve", "component", "vector diagram", "magnitude", "direction", "dynamics", "plane", "2D"] },
  { code: "8.6", name: "Friction", section: "mechanics", keywords: ["friction", "coefficient of friction", "µ", "rough surface", "limiting friction", "F ≤ µR", "statics", "motion", "smooth"] },
  { code: "9.1", name: "Moments", section: "mechanics", keywords: ["moment", "torque", "equilibrium", "rigid body", "pivot", "ladder", "parallel forces", "non-parallel", "coplanar"] },
];

// Past paper questions will be added as data becomes available
export const EDEXCEL_MATHS_APPLIED_PAST_QUESTIONS: EdexcelMathsAppliedPastPaperQuestion[] = [];
