import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "A* AI <hello@astarai.co.uk>";
const APP_URL = "https://astarai.co.uk";
const LOGO_URL = "https://astarai.co.uk/logo.png";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[WEEKLY-PROGRESS] ${step}${detailsStr}`);
};

// Simple keyword-based topic extraction from message content
const TOPIC_KEYWORDS: Record<string, string[]> = {
  "Organic Chemistry": ["alkane", "alkene", "alcohol", "ester", "polymer", "organic", "hydrocarbon", "functional group", "isomer"],
  "Inorganic Chemistry": ["ionic", "metallic", "bonding", "electronegativity", "periodicity", "transition metal", "inorganic", "halogen"],
  "Physical Chemistry": ["enthalpy", "entropy", "equilibrium", "kinetics", "rate", "thermodynamics", "hess", "bond energy"],
  "Mechanics": ["force", "momentum", "velocity", "acceleration", "newton", "projectile", "friction", "torque"],
  "Electricity": ["circuit", "resistance", "voltage", "current", "ohm", "capacitor", "resistor", "potential difference"],
  "Waves & Optics": ["wave", "frequency", "wavelength", "diffraction", "interference", "refraction", "standing wave", "electromagnetic"],
  "Nuclear Physics": ["radioactive", "decay", "half-life", "nuclear", "fission", "fusion", "alpha", "beta", "gamma"],
  "Algebra": ["equation", "quadratic", "simultaneous", "inequality", "polynomial", "factori", "expression", "solve"],
  "Calculus": ["differentiat", "integrat", "derivative", "gradient", "tangent", "area under", "chain rule", "product rule"],
  "Statistics": ["probability", "distribution", "standard deviation", "mean", "median", "variance", "hypothesis", "binomial", "normal distribution"],
  "Trigonometry": ["sin", "cos", "tan", "trigonometr", "radian", "identit"],
  "Biology - Cells": ["cell", "mitosis", "meiosis", "organelle", "membrane", "nucleus", "cytoplasm"],
  "Biology - Genetics": ["dna", "gene", "allele", "genotype", "phenotype", "mutation", "inheritance", "chromosome"],
  "Biology - Ecology": ["ecosystem", "food chain", "biodiversity", "population", "habitat", "photosynthesis", "respiration"],
  "Essay Writing": ["essay", "paragraph", "argument", "thesis", "conclusion", "introduction", "evaluate", "discuss", "analyse"],
  "Exam Technique": ["mark scheme", "exam", "marks", "command word", "how many marks", "past paper", "revision"],
};

// Mini-quiz question bank per topic for the weakest topic challenge
const TOPIC_QUIZ_BANK: Record<string, { q: string; options: string[]; answer: string }[]> = {
  "Organic Chemistry": [
    { q: "What type of reaction converts an alkene to an alcohol?", options: ["Hydration", "Dehydration", "Oxidation", "Substitution"], answer: "Hydration" },
    { q: "Which functional group is present in carboxylic acids?", options: ["-COOH", "-CHO", "-OH", "-NH2"], answer: "-COOH" },
    { q: "What is the general formula for alkanes?", options: ["CnH2n+2", "CnH2n", "CnH2n-2", "CnHn"], answer: "CnH2n+2" },
    { q: "What catalyst is used in the hydrogenation of alkenes?", options: ["Nickel", "Iron", "Copper", "Zinc"], answer: "Nickel" },
  ],
  "Inorganic Chemistry": [
    { q: "Which type of bonding exists in sodium chloride?", options: ["Ionic", "Covalent", "Metallic", "Van der Waals"], answer: "Ionic" },
    { q: "What happens to electronegativity across a period?", options: ["Increases", "Decreases", "Stays the same", "Fluctuates"], answer: "Increases" },
    { q: "Which group in the periodic table are the halogens?", options: ["Group 7", "Group 1", "Group 2", "Group 0"], answer: "Group 7" },
    { q: "What colour is the flame test for potassium?", options: ["Lilac", "Yellow", "Red", "Green"], answer: "Lilac" },
  ],
  "Physical Chemistry": [
    { q: "What does a negative enthalpy change indicate?", options: ["Exothermic reaction", "Endothermic reaction", "No energy change", "Equilibrium"], answer: "Exothermic reaction" },
    { q: "What does Le Chatelier's principle predict?", options: ["How equilibrium shifts when conditions change", "Reaction rate", "Bond energy", "Activation energy"], answer: "How equilibrium shifts when conditions change" },
    { q: "What unit is enthalpy change measured in?", options: ["kJ/mol", "J/kg", "Pa", "mol/dm3"], answer: "kJ/mol" },
    { q: "Increasing temperature generally does what to reaction rate?", options: ["Increases it", "Decreases it", "No effect", "Halves it"], answer: "Increases it" },
  ],
  "Mechanics": [
    { q: "What is the SI unit of force?", options: ["Newton", "Joule", "Watt", "Pascal"], answer: "Newton" },
    { q: "What is Newton's second law of motion?", options: ["F = ma", "F = mv", "F = mg", "F = ms"], answer: "F = ma" },
    { q: "What quantity is conserved in all collisions?", options: ["Momentum", "Kinetic energy", "Speed", "Velocity"], answer: "Momentum" },
    { q: "What is the acceleration due to gravity on Earth (approx)?", options: ["9.81 m/s\u00B2", "10.5 m/s\u00B2", "8.5 m/s\u00B2", "11 m/s\u00B2"], answer: "9.81 m/s\u00B2" },
  ],
  "Electricity": [
    { q: "What is Ohm's Law?", options: ["V = IR", "P = IV", "Q = It", "E = Pt"], answer: "V = IR" },
    { q: "In a series circuit, what is constant?", options: ["Current", "Voltage", "Resistance", "Power"], answer: "Current" },
    { q: "What does a resistor do in a circuit?", options: ["Opposes current flow", "Stores charge", "Amplifies current", "Generates voltage"], answer: "Opposes current flow" },
    { q: "What is the unit of electrical resistance?", options: ["Ohm", "Ampere", "Volt", "Farad"], answer: "Ohm" },
  ],
  "Waves & Optics": [
    { q: "What is the speed of light in a vacuum?", options: ["3 \u00D7 10\u2078 m/s", "3 \u00D7 10\u2076 m/s", "3 \u00D7 10\u00B9\u2070 m/s", "3 \u00D7 10\u2074 m/s"], answer: "3 \u00D7 10\u2078 m/s" },
    { q: "What type of wave is sound?", options: ["Longitudinal", "Transverse", "Electromagnetic", "Standing"], answer: "Longitudinal" },
    { q: "What happens when light enters a denser medium?", options: ["It slows down and bends towards the normal", "It speeds up", "It stays the same", "It reflects"], answer: "It slows down and bends towards the normal" },
    { q: "What is diffraction?", options: ["Spreading of waves through a gap", "Reflection of waves", "Absorption of waves", "Polarisation"], answer: "Spreading of waves through a gap" },
  ],
  "Nuclear Physics": [
    { q: "What is an alpha particle?", options: ["2 protons + 2 neutrons", "An electron", "A photon", "A neutron"], answer: "2 protons + 2 neutrons" },
    { q: "What does half-life measure?", options: ["Time for half the nuclei to decay", "Total decay time", "Energy released", "Radiation dose"], answer: "Time for half the nuclei to decay" },
    { q: "Which radiation is most penetrating?", options: ["Gamma", "Beta", "Alpha", "Neutron"], answer: "Gamma" },
    { q: "What is nuclear fission?", options: ["Splitting a heavy nucleus", "Joining light nuclei", "Radioactive decay", "Neutron capture"], answer: "Splitting a heavy nucleus" },
  ],
  "Algebra": [
    { q: "What is the quadratic formula?", options: ["x = (-b \u00B1 \u221A(b\u00B2-4ac)) / 2a", "x = -b/2a", "x = b\u00B2 - 4ac", "x = a + b + c"], answer: "x = (-b \u00B1 \u221A(b\u00B2-4ac)) / 2a" },
    { q: "How many solutions can a quadratic equation have?", options: ["0, 1, or 2", "Always 2", "Always 1", "Infinite"], answer: "0, 1, or 2" },
    { q: "What does 'factorise' mean?", options: ["Express as a product of factors", "Expand brackets", "Simplify", "Differentiate"], answer: "Express as a product of factors" },
    { q: "What is the discriminant of a quadratic?", options: ["b\u00B2 - 4ac", "b + 4ac", "2a", "-b/a"], answer: "b\u00B2 - 4ac" },
  ],
  "Calculus": [
    { q: "What is the derivative of x\u00B2?", options: ["2x", "x", "x\u00B3", "2"], answer: "2x" },
    { q: "What does integration find?", options: ["Area under a curve", "Gradient", "Turning point", "Intercept"], answer: "Area under a curve" },
    { q: "What is the chain rule used for?", options: ["Differentiating composite functions", "Integrating by parts", "Finding limits", "Solving equations"], answer: "Differentiating composite functions" },
    { q: "What is the integral of 1/x?", options: ["ln|x| + C", "x\u00B2 + C", "1/x\u00B2 + C", "e\u02E3 + C"], answer: "ln|x| + C" },
  ],
  "Statistics": [
    { q: "What is the mean of 2, 4, 6, 8?", options: ["5", "4", "6", "3"], answer: "5" },
    { q: "What does standard deviation measure?", options: ["Spread of data from the mean", "Average value", "Most common value", "Range"], answer: "Spread of data from the mean" },
    { q: "In a normal distribution, what % of data is within 1 SD of the mean?", options: ["68%", "95%", "50%", "99%"], answer: "68%" },
    { q: "What is a null hypothesis?", options: ["A statement of no effect or difference", "The desired outcome", "A proven theory", "An alternative explanation"], answer: "A statement of no effect or difference" },
  ],
  "Trigonometry": [
    { q: "What is sin(90\u00B0)?", options: ["1", "0", "-1", "0.5"], answer: "1" },
    { q: "How many radians are in 180\u00B0?", options: ["\u03C0", "2\u03C0", "\u03C0/2", "\u03C0/4"], answer: "\u03C0" },
    { q: "What is the identity sin\u00B2x + cos\u00B2x equal to?", options: ["1", "0", "tan\u00B2x", "2"], answer: "1" },
    { q: "What is tan(x) in terms of sin and cos?", options: ["sin(x)/cos(x)", "cos(x)/sin(x)", "sin(x)\u00D7cos(x)", "1/sin(x)"], answer: "sin(x)/cos(x)" },
  ],
  "Biology - Cells": [
    { q: "What is the powerhouse of the cell?", options: ["Mitochondria", "Nucleus", "Ribosome", "Golgi apparatus"], answer: "Mitochondria" },
    { q: "What type of cell division produces identical cells?", options: ["Mitosis", "Meiosis", "Binary fission", "Budding"], answer: "Mitosis" },
    { q: "What controls what enters and exits a cell?", options: ["Cell membrane", "Cell wall", "Nucleus", "Cytoplasm"], answer: "Cell membrane" },
    { q: "Where does protein synthesis occur?", options: ["Ribosomes", "Mitochondria", "Nucleus", "Golgi apparatus"], answer: "Ribosomes" },
  ],
  "Biology - Genetics": [
    { q: "What is the shape of DNA?", options: ["Double helix", "Single strand", "Triple helix", "Circular"], answer: "Double helix" },
    { q: "What are the base pairs in DNA?", options: ["A-T and G-C", "A-G and T-C", "A-C and G-T", "A-U and G-C"], answer: "A-T and G-C" },
    { q: "What is a genotype?", options: ["The genetic makeup of an organism", "The physical appearance", "A type of gene", "A chromosome"], answer: "The genetic makeup of an organism" },
    { q: "What is a dominant allele?", options: ["One that is expressed even when heterozygous", "One that is always recessive", "One that skips generations", "A mutant allele"], answer: "One that is expressed even when heterozygous" },
  ],
  "Biology - Ecology": [
    { q: "What is biodiversity?", options: ["Variety of life in an ecosystem", "Number of species", "Population size", "Food chain length"], answer: "Variety of life in an ecosystem" },
    { q: "What is the word equation for photosynthesis?", options: ["CO2 + H2O \u2192 glucose + O2", "Glucose + O2 \u2192 CO2 + H2O", "N2 + H2 \u2192 NH3", "None of these"], answer: "CO2 + H2O \u2192 glucose + O2" },
    { q: "What is a trophic level?", options: ["A feeding level in a food chain", "A habitat type", "A population measure", "An energy source"], answer: "A feeding level in a food chain" },
    { q: "What do decomposers do?", options: ["Break down dead organic matter", "Produce food", "Eat herbivores", "Create habitats"], answer: "Break down dead organic matter" },
  ],
  "Essay Writing": [
    { q: "What should a strong essay introduction contain?", options: ["Thesis statement and context", "All your evidence", "A conclusion", "Personal opinions only"], answer: "Thesis statement and context" },
    { q: "What does the command word 'evaluate' require?", options: ["Weigh up arguments and reach a judgement", "Simply describe", "List facts", "Define key terms"], answer: "Weigh up arguments and reach a judgement" },
    { q: "What makes a strong paragraph?", options: ["Point, evidence, explanation", "Just facts", "Only opinions", "Quotes only"], answer: "Point, evidence, explanation" },
    { q: "What should you avoid in academic writing?", options: ["Informal language and slang", "Evidence", "Counter-arguments", "Technical terms"], answer: "Informal language and slang" },
  ],
  "Exam Technique": [
    { q: "What should you do before answering a question?", options: ["Read the command word carefully", "Start writing immediately", "Skip to the next question", "Copy the question"], answer: "Read the command word carefully" },
    { q: "How should you allocate time in an exam?", options: ["Roughly 1 minute per mark", "Equal time per question", "Most time on first question", "Skip timing"], answer: "Roughly 1 minute per mark" },
    { q: "What does a 'discuss' question require?", options: ["Arguments for and against with a conclusion", "A simple definition", "A list of facts", "One-sided argument"], answer: "Arguments for and against with a conclusion" },
    { q: "Why should you plan extended answers?", options: ["To structure arguments logically", "To waste time", "Because it's required", "To copy from notes"], answer: "To structure arguments logically" },
  ],
};

interface TopicScore {
  topic: string;
  count: number;
}

function extractTopicsWithScores(messages: string[]): TopicScore[] {
  const combined = messages.join(" ").toLowerCase();
  const found: TopicScore[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let count = 0;
    for (const kw of keywords) {
      if (combined.includes(kw)) count++;
    }
    if (count > 0) found.push({ topic, count });
  }

  found.sort((a, b) => b.count - a.count);
  return found;
}

function getQuizQuestions(weakestTopic: string): { q: string; options: string[]; answer: string }[] {
  const bank = TOPIC_QUIZ_BANK[weakestTopic];
  if (!bank || bank.length === 0) return [];

  // Shuffle and pick 3
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    logStep("ERROR: RESEND_API_KEY not configured");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      logStep("ERROR: Failed to send email", { to, error });
      return false;
    }

    logStep("Email sent successfully", { to });
    return true;
  } catch (error) {
    logStep("ERROR: Exception sending email", { to, error: (error as Error).message });
    return false;
  }
}

interface UserStats {
  messageCount: number;
  topicsDiscussed: string[];
  topicCount: number;
  strongestTopic: string;
  weakestTopic: string;
  mostActiveSubject: string;
  currentStreak: number;
  dueReviews: number;
  quizQuestions: { q: string; options: string[]; answer: string }[];
}

function buildEmailHtml(firstName: string, stats: UserStats): string {
  const streakEmoji = stats.currentStreak > 0 ? " \uD83D\uDD25" : "";
  const topicsList = stats.topicsDiscussed.length > 0
    ? stats.topicsDiscussed.map((t) => `<span style="display:inline-block;background:#f0ecfb;color:#4f36b3;padding:4px 12px;border-radius:16px;font-size:13px;margin:2px 4px 2px 0;">${t}</span>`).join("")
    : '<span style="color:#6b7280;font-size:14px;">No specific topics detected</span>';

  const reviewSection = stats.dueReviews > 0
    ? `
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#92400e;">\u23F0 Questions to Review</p>
                    <p style="margin:0 0 12px;font-size:14px;color:#a16207;">${stats.dueReviews} question${stats.dueReviews === 1 ? "" : "s"} due for review</p>
                    <a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#4f36b3 0%,#7c5ce7 100%);color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:600;font-size:14px;">Start Reviewing</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  // Strongest & weakest topic section
  const strengthSection = (stats.strongestTopic && stats.weakestTopic && stats.strongestTopic !== stats.weakestTopic)
    ? `
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-right:6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border-radius:12px;">
                      <tr>
                        <td style="padding:16px;">
                          <p style="margin:0 0 2px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Strongest Topic \uD83C\uDFC6</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#065f46;">${stats.strongestTopic}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding-left:6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:12px;">
                      <tr>
                        <td style="padding:16px;">
                          <p style="margin:0 0 2px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Needs Work \uD83C\uDFAF</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#991b1b;">${stats.weakestTopic}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  // Mini quiz section on weakest topic
  let quizSection = "";
  if (stats.quizQuestions.length > 0 && stats.weakestTopic) {
    const quizRows = stats.quizQuestions.map((quiz, i) => {
      const optionsHtml = quiz.options.map((opt) =>
        `<span style="display:inline-block;background:#f9fafb;border:1px solid #e5e7eb;color:#374151;padding:6px 14px;border-radius:8px;font-size:13px;margin:3px 4px 3px 0;">${opt}</span>`
      ).join("");

      return `
            <tr>
              <td style="padding:12px 0 ${i < stats.quizQuestions.length - 1 ? "16px" : "4px"};${i < stats.quizQuestions.length - 1 ? "border-bottom:1px solid #e5e7eb;" : ""}">
                <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#1f2937;">${i + 1}. ${quiz.q}</p>
                <div>${optionsHtml}</div>
              </td>
            </tr>`;
    }).join("");

    quizSection = `
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#4f36b3;">\uD83E\uDDE0 Quick Quiz: ${stats.weakestTopic}</p>
                    <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">3 questions to sharpen your weakest area. Tap a question to reveal the answer in the app.</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${quizRows}
                    </table>
                    <div style="margin-top:16px;text-align:center;">
                      <a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#4f36b3 0%,#7c5ce7 100%);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">Practice ${stats.weakestTopic} \u2192</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f36b3 0%,#7c5ce7 100%);padding:32px 32px 24px;text-align:center;">
              <img src="${LOGO_URL}" alt="A* AI" height="36" style="height:36px;width:auto;margin-bottom:16px;" />
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Your Weekly Revision Recap</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">Here's what you accomplished this week</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0;font-size:16px;color:#374151;">Hi ${firstName},</p>
              <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">Here's your weekly study breakdown from A* AI.</p>
            </td>
          </tr>

          <!-- Stats Row -->
          <tr>
            <td style="padding:16px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" align="center" style="padding:12px 4px;background:#f9fafb;border-radius:12px 0 0 12px;">
                    <p style="margin:0;font-size:28px;font-weight:700;color:#4f36b3;">${stats.messageCount}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Questions</p>
                  </td>
                  <td width="34%" align="center" style="padding:12px 4px;background:#f9fafb;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:28px;font-weight:700;color:#4f36b3;">${stats.topicCount}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Topics</p>
                  </td>
                  <td width="33%" align="center" style="padding:12px 4px;background:#f9fafb;border-radius:0 12px 12px 0;">
                    <p style="margin:0;font-size:28px;font-weight:700;color:#4f36b3;">${stats.currentStreak}${streakEmoji}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Day Streak</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Most Active Subject -->
          <tr>
            <td style="padding:0 32px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0ecfb;border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 2px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Most Active Subject</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#4f36b3;">${stats.mostActiveSubject}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Strongest & Weakest Topics -->
          ${strengthSection}

          <!-- Topics Covered -->
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Topics Covered</p>
              ${topicsList}
            </td>
          </tr>

          <!-- Due Reviews -->
          ${reviewSection}

          <!-- Mini Quiz -->
          ${quizSection}

          <!-- Motivational CTA -->
          <tr>
            <td style="padding:0 32px 24px;text-align:center;">
              <p style="margin:0 0 16px;font-size:15px;color:#374151;font-weight:500;">Keep it up! Consistency is the key to exam success.</p>
              <a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#4f36b3 0%,#7c5ce7 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:600;font-size:15px;">Continue Studying</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">The A* AI Team</p>
              <a href="${APP_URL}/profile?unsubscribe=true" style="font-size:11px;color:#a1a1aa;text-decoration:underline;">Unsubscribe from weekly emails</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Starting weekly progress email job");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  let usersEmailed = 0;
  let usersSkipped = 0;
  let errors = 0;

  try {
    // 1. Find users who sent at least 1 chat message in the last 7 days
    logStep("Querying active users from last 7 days");

    const { data: activeConversations, error: convError } = await supabase
      .from("chat_messages")
      .select("conversation_id, content, created_at, chat_conversations!inner(user_id)")
      .eq("role", "user")
      .gte("created_at", sevenDaysAgoISO);

    if (convError) {
      logStep("ERROR: Failed to query chat messages", { error: convError.message });
      return new Response(
        JSON.stringify({ success: false, error: convError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group messages by user_id
    const userMessages: Record<string, { messages: string[]; conversationIds: Set<string> }> = {};
    for (const msg of activeConversations || []) {
      const userId = (msg as any).chat_conversations.user_id as string;
      if (!userMessages[userId]) {
        userMessages[userId] = { messages: [], conversationIds: new Set() };
      }
      userMessages[userId].messages.push(msg.content);
      userMessages[userId].conversationIds.add(msg.conversation_id);
    }

    const activeUserIds = Object.keys(userMessages);
    logStep("Found active users", { count: activeUserIds.length });

    if (activeUserIds.length === 0) {
      logStep("No active users found, exiting");
      return new Response(
        JSON.stringify({ users_emailed: 0, users_skipped: 0, errors: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Filter out users who have unsubscribed from weekly recap
    const { data: optedOut, error: prefError } = await supabase
      .from("email_preferences")
      .select("user_id")
      .eq("weekly_recap", false)
      .in("user_id", activeUserIds);

    if (prefError) {
      logStep("WARNING: Failed to query email preferences, proceeding anyway", { error: prefError.message });
    }

    const optedOutIds = new Set((optedOut || []).map((r: any) => r.user_id));

    // 3. Process each active user
    for (const userId of activeUserIds) {
      if (optedOutIds.has(userId)) {
        logStep("User opted out of weekly recap", { userId });
        usersSkipped++;
        continue;
      }

      try {
        // Get user email
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        if (userError || !userData.user?.email) {
          logStep("ERROR: Failed to get user email", { userId });
          errors++;
          continue;
        }

        const email = userData.user.email;
        const firstName = userData.user.user_metadata?.first_name ||
          userData.user.user_metadata?.name?.split(" ")[0] ||
          "there";

        // Message count
        const messageCount = userMessages[userId].messages.length;

        // Topics with scores for strongest/weakest calculation
        const topicScores = extractTopicsWithScores(userMessages[userId].messages);
        const topicsDiscussed = topicScores.slice(0, 5).map((t) => t.topic);

        // Strongest = most keyword hits (most engaged), Weakest = fewest keyword hits (least confident)
        const strongestTopic = topicScores.length > 0 ? topicScores[0].topic : "General";
        const weakestTopic = topicScores.length > 1 ? topicScores[topicScores.length - 1].topic : (topicScores.length === 1 ? topicScores[0].topic : "General");

        // Get quiz questions for weakest topic
        const quizQuestions = getQuizQuestions(weakestTopic);

        // Get products/subjects for conversations
        const conversationIds = Array.from(userMessages[userId].conversationIds);
        const { data: convProducts } = await supabase
          .from("chat_conversations")
          .select("product_id, products(name, subject)")
          .in("id", conversationIds);

        const subjectCounts: Record<string, number> = {};
        for (const cp of convProducts || []) {
          const subjectName = (cp as any).products?.subject || (cp as any).products?.name || "General";
          subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;
        }

        const mostActiveSubject =
          Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "General";

        // Get current streak
        const { data: streakData } = await supabase
          .from("user_streaks")
          .select("current_streak")
          .eq("user_id", userId)
          .maybeSingle();

        const currentStreak = streakData?.current_streak || 0;

        // Get due reviews count
        const { count: dueReviews } = await supabase
          .from("user_mistakes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("mastered", false)
          .lte("next_review_at", now.toISOString());

        const stats: UserStats = {
          messageCount,
          topicsDiscussed,
          topicCount: topicsDiscussed.length,
          strongestTopic,
          weakestTopic,
          mostActiveSubject,
          currentStreak,
          dueReviews: dueReviews || 0,
          quizQuestions,
        };

        const html = buildEmailHtml(firstName, stats);
        const subject = `Your weekly revision recap \u2014 ${firstName}`;
        const success = await sendEmail(email, subject, html);

        if (success) {
          usersEmailed++;
        } else {
          errors++;
        }

        // Rate limit: 600ms between sends
        await sleep(600);
      } catch (userErr) {
        logStep("ERROR: Exception processing user", { userId, error: (userErr as Error).message });
        errors++;
      }
    }

    const summary = { users_emailed: usersEmailed, users_skipped: usersSkipped, errors };
    logStep("Weekly progress email job completed", summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logStep("ERROR: Unexpected error", { error: (error as Error).message });
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
