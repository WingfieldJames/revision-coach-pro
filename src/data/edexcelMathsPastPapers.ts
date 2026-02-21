export interface EdexcelMathsSpecPoint {
  code: string;
  name: string;
  topic: number;
  keywords: string[];
}

export interface EdexcelMathsPastPaperQuestion {
  paper: string;
  year: number;
  section: string;
  number: string;
  question: string;
  marks: number;
  specCodes: string[];
  extract?: string;
}

export const EDEXCEL_MATHS_SPEC_POINTS: EdexcelMathsSpecPoint[] = [
  // Topic 1: Proof
  { code: "1.1", name: "Proof: Deduction, Exhaustion, Counterexample and Contradiction", topic: 1, keywords: ["proof", "deduction", "exhaustion", "counterexample", "contradiction", "irrational", "sqrt 2", "infinity of primes", "prove", "show that", "disproof"] },

  // Topic 2: Algebra and functions
  { code: "2.1", name: "Laws of Indices for Rational Exponents", topic: 2, keywords: ["indices", "index laws", "rational exponents", "powers", "fractional powers", "negative indices"] },
  { code: "2.2", name: "Surds and Rationalising the Denominator", topic: 2, keywords: ["surds", "rationalise", "rationalising", "denominator", "simplify surds", "irrational"] },
  { code: "2.3", name: "Quadratic Functions: Discriminant, Completing the Square, Solving", topic: 2, keywords: ["quadratic", "discriminant", "completing the square", "quadratic formula", "factorisation", "roots", "real roots", "repeated roots", "parabola"] },
  { code: "2.4", name: "Simultaneous Equations: Linear and Quadratic", topic: 2, keywords: ["simultaneous equations", "elimination", "substitution", "linear", "quadratic", "intersection"] },
  { code: "2.5", name: "Linear and Quadratic Inequalities", topic: 2, keywords: ["inequality", "inequalities", "set notation", "number line", "quadratic inequality", "linear inequality", "graphical"] },
  { code: "2.6", name: "Polynomials: Expansion, Factorisation, Algebraic Division, Factor Theorem", topic: 2, keywords: ["polynomial", "algebraic division", "factor theorem", "remainder", "factorisation", "expansion", "cubic", "long division"] },
  { code: "2.7", name: "Graphs of Functions and Simple Transformations", topic: 2, keywords: ["graph", "sketch", "curve", "polynomial graph", "modulus", "reciprocal", "transformation", "translation", "stretch", "reflection", "y = 1/x"] },
  { code: "2.8", name: "Composite and Inverse Functions", topic: 2, keywords: ["composite function", "inverse function", "fg", "gf", "f inverse", "domain", "range", "one-to-one"] },
  { code: "2.9", name: "Combined Transformations of Graphs, Modulus Functions", topic: 2, keywords: ["transformation", "combined transformation", "modulus function", "y = |f(x)|", "y = f(|x|)", "reflection", "stretch"] },
  { code: "2.10", name: "Partial Fractions", topic: 2, keywords: ["partial fractions", "decompose", "rational function", "repeated linear factor", "quadratic factor", "algebraic fractions"] },
  { code: "2.11", name: "Functions in Modelling", topic: 2, keywords: ["modelling", "model", "functions", "limitations", "refinement", "real-world"] },

  // Topic 3: Coordinate geometry
  { code: "3.1", name: "Equation of a Straight Line; Parallel and Perpendicular Lines", topic: 3, keywords: ["straight line", "gradient", "y = mx + c", "parallel", "perpendicular", "equation of line", "midpoint", "distance"] },
  { code: "3.2", name: "Coordinate Geometry of the Circle", topic: 3, keywords: ["circle", "equation of circle", "centre", "radius", "tangent", "chord", "completing the square", "perpendicular bisector", "semicircle"] },
  { code: "3.3", name: "Parametric Equations of Curves", topic: 3, keywords: ["parametric", "parameter", "cartesian", "convert", "parametric equations", "eliminate parameter"] },
  { code: "3.4", name: "Parametric Equations in Modelling", topic: 3, keywords: ["parametric modelling", "parametric model", "projectile", "motion", "path"] },

  // Topic 4: Sequences and series
  { code: "4.1", name: "Binomial Expansion", topic: 4, keywords: ["binomial", "binomial expansion", "binomial theorem", "nCr", "factorial", "pascal", "rational n", "approximation", "validity"] },
  { code: "4.2", name: "Sequences: nth Term and Recurrence Relations", topic: 4, keywords: ["sequence", "nth term", "recurrence relation", "recurrence", "u(n+1)", "iterative"] },
  { code: "4.3", name: "Sigma Notation for Sums of Series", topic: 4, keywords: ["sigma", "sigma notation", "sum", "series", "summation"] },
  { code: "4.4", name: "Arithmetic Sequences and Series", topic: 4, keywords: ["arithmetic", "arithmetic sequence", "arithmetic series", "common difference", "sum to n terms", "nth term", "Sn"] },
  { code: "4.5", name: "Geometric Sequences and Series; Sum to Infinity", topic: 4, keywords: ["geometric", "geometric sequence", "geometric series", "common ratio", "sum to infinity", "convergent", "|r| < 1", "Sn"] },
  { code: "4.6", name: "Sequences and Series in Modelling", topic: 4, keywords: ["sequences modelling", "series modelling", "compound interest", "depreciation", "population"] },

  // Topic 5: Trigonometry
  { code: "5.1", name: "Sine, Cosine, Tangent; Sine and Cosine Rules; Radians", topic: 5, keywords: ["sine", "cosine", "tangent", "sine rule", "cosine rule", "area of triangle", "radians", "arc length", "sector area", "trig"] },
  { code: "5.2", name: "Small Angle Approximations", topic: 5, keywords: ["small angle", "approximation", "sin theta", "cos theta", "tan theta", "radians"] },
  { code: "5.3", name: "Trigonometric Graphs and Exact Values", topic: 5, keywords: ["trig graph", "sine graph", "cosine graph", "tangent graph", "periodicity", "exact values", "asymptote", "symmetry"] },
  { code: "5.4", name: "Inverse Trigonometric Functions; Sec, Cosec, Cot", topic: 5, keywords: ["arcsin", "arccos", "arctan", "inverse trig", "secant", "cosecant", "cotangent", "sec", "cosec", "cot"] },
  { code: "5.5", name: "Trigonometric Identities: sec², cosec², cot²", topic: 5, keywords: ["sec squared", "cosec squared", "cot squared", "trig identity", "identity", "pythagorean identity"] },
  { code: "5.6", name: "Double Angle and Addition Formulae; R formula", topic: 5, keywords: ["double angle", "addition formula", "compound angle", "sin(A+B)", "cos(A+B)", "R cos", "R sin", "harmonic form"] },
  { code: "5.7", name: "Solving Trigonometric Equations", topic: 5, keywords: ["trig equation", "solve", "interval", "quadratic trig", "trigonometric equation", "general solution"] },
  { code: "5.8", name: "Trigonometric Modelling", topic: 5, keywords: ["trig modelling", "trigonometric model", "oscillation", "wave", "periodic"] },

  // Topic 6: Exponentials and logarithms
  { code: "6.1", name: "Exponential Function e^x and Natural Logarithm ln x", topic: 6, keywords: ["exponential", "e^x", "ln", "natural logarithm", "inverse", "exp"] },
  { code: "6.2", name: "Laws of Logarithms", topic: 6, keywords: ["logarithm", "log laws", "log rules", "log", "addition law", "subtraction law", "power law"] },
  { code: "6.3", name: "Solving Exponential Equations a^x = b", topic: 6, keywords: ["exponential equation", "a^x = b", "solve", "logarithm", "take logs"] },
  { code: "6.4", name: "Exponential Growth and Decay; Change of Base", topic: 6, keywords: ["exponential growth", "exponential decay", "growth", "decay", "change of base", "modelling", "half-life"] },

  // Topic 7: Differentiation
  { code: "7.1", name: "Derivative as Gradient and Limit; First Principles", topic: 7, keywords: ["derivative", "gradient", "limit", "first principles", "differentiation from first principles", "tangent", "rate of change", "second derivative"] },
  { code: "7.2", name: "Differentiating x^n, e^kx, sin kx, cos kx, tan kx, ln x", topic: 7, keywords: ["differentiate", "x^n", "e^kx", "sin kx", "cos kx", "tan kx", "ln x", "a^kx", "derivative"] },
  { code: "7.3", name: "Applications: Tangents, Normals, Stationary Points, Inflection", topic: 7, keywords: ["tangent", "normal", "stationary point", "maximum", "minimum", "inflection", "increasing", "decreasing", "kinematics", "optimisation"] },
  { code: "7.4", name: "Product Rule, Quotient Rule, Chain Rule", topic: 7, keywords: ["product rule", "quotient rule", "chain rule", "differentiation rules", "cosec", "sec", "cot", "inverse function differentiation"] },
  { code: "7.5", name: "Implicit and Parametric Differentiation", topic: 7, keywords: ["implicit", "parametric differentiation", "dy/dx", "implicit differentiation", "related rates"] },
  { code: "7.6", name: "Differential Equations: Setting Up and Modelling", topic: 7, keywords: ["differential equation", "model", "formulate", "first-order", "rate of change", "dy/dx"] },

  // Topic 8: Integration
  { code: "8.1", name: "Fundamental Theorem of Calculus; Integrating x^n", topic: 8, keywords: ["integration", "integrate", "x^n", "fundamental theorem", "antiderivative", "indefinite integral"] },
  { code: "8.2", name: "Integrating e^kx, 1/x, sin kx, cos kx; Trig Identities", topic: 8, keywords: ["integrate", "e^kx", "1/x", "sin kx", "cos kx", "trig identity", "trigonometric integration"] },
  { code: "8.3", name: "Definite Integrals; Area Under and Between Curves", topic: 8, keywords: ["definite integral", "area under curve", "area between curves", "evaluate", "bounded region"] },
  { code: "8.4", name: "Integration as the Limit of a Sum", topic: 8, keywords: ["limit of sum", "Riemann", "sum", "integration", "area approximation"] },
  { code: "8.5", name: "Integration by Substitution, by Parts, and Partial Fractions", topic: 8, keywords: ["substitution", "integration by parts", "partial fractions", "u-substitution", "by parts"] },
  { code: "8.6", name: "Solving First Order Differential Equations (Separable)", topic: 8, keywords: ["separable", "differential equation", "separation of variables", "dy/dx = f(x)g(y)", "solve"] },
  { code: "8.7", name: "Differential Equations in Modelling", topic: 8, keywords: ["differential equation modelling", "boundary condition", "initial condition", "particular solution", "general solution"] },

  // Topic 9: Numerical methods
  { code: "9.1", name: "Locating Roots by Change of Sign", topic: 9, keywords: ["change of sign", "root", "locate", "interval", "continuous", "f(a)f(b) < 0"] },
  { code: "9.2", name: "Iterative Methods for Finding Roots", topic: 9, keywords: ["iterative", "iteration", "x(n+1) = g(x_n)", "convergence", "staircase", "cobweb", "diverge"] },
  { code: "9.3", name: "Newton-Raphson Method", topic: 9, keywords: ["newton-raphson", "newton raphson", "tangent", "root finding", "x(n+1) = x_n - f(x_n)/f'(x_n)"] },
  { code: "9.4", name: "Numerical Integration: Trapezium Rule", topic: 9, keywords: ["trapezium rule", "numerical integration", "approximate", "area", "strip", "interval width"] },
  { code: "9.5", name: "Numerical Methods in Context", topic: 9, keywords: ["numerical methods", "context", "problem solving", "approximation", "accuracy"] },

  // Topic 10: Vectors
  { code: "10.1", name: "Vectors in Two and Three Dimensions", topic: 10, keywords: ["vector", "2D", "3D", "column vector", "component", "i j k"] },
  { code: "10.2", name: "Magnitude, Unit Vectors, Position Vectors", topic: 10, keywords: ["magnitude", "unit vector", "position vector", "modulus", "length", "direction"] },
  { code: "10.3", name: "Vector Addition, Subtraction and Scalar Multiplication", topic: 10, keywords: ["vector addition", "vector subtraction", "scalar multiplication", "resultant", "parallel"] },
  { code: "10.4", name: "Vectors in Modelling and Problem Solving", topic: 10, keywords: ["vector modelling", "forces", "velocity", "displacement", "vector problem", "geometric proof"] },
];

// Past paper questions will be added as data becomes available
export const EDEXCEL_MATHS_PAST_QUESTIONS: EdexcelMathsPastPaperQuestion[] = [];
