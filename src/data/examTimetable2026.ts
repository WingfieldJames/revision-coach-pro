export interface ExamEntry {
  date: string;
  board: string;
  level: string;
  subject: string;
  paper: string;
  code: string;
  start_time: string;
  duration: string;
}

export const EXAM_TIMETABLE_2026: ExamEntry[] = [
  // AQA A-LEVEL
  { date: "2026-05-22", board: "AQA", level: "A-level", subject: "Accounting", paper: "Paper 1: Financial Accounting", code: "7127/1", start_time: "09:00", duration: "3h" },
  { date: "2026-06-01", board: "AQA", level: "A-level", subject: "Accounting", paper: "Paper 2: Accounting for analysis and decision-making", code: "7127/2", start_time: "09:00", duration: "3h" },
  { date: "2026-06-04", board: "AQA", level: "A-level", subject: "Biology", paper: "Paper 1", code: "7402/1", start_time: "13:30", duration: "2h" },
  { date: "2026-06-12", board: "AQA", level: "A-level", subject: "Biology", paper: "Paper 2", code: "7402/2", start_time: "09:00", duration: "2h" },
  { date: "2026-06-16", board: "AQA", level: "A-level", subject: "Biology", paper: "Paper 3", code: "7402/3", start_time: "09:00", duration: "2h" },
  { date: "2026-05-13", board: "AQA", level: "A-level", subject: "Business", paper: "Business 1", code: "7132/1", start_time: "13:30", duration: "2h" },
  { date: "2026-05-19", board: "AQA", level: "A-level", subject: "Business", paper: "Business 2", code: "7132/2", start_time: "09:00", duration: "2h" },
  { date: "2026-06-09", board: "AQA", level: "A-level", subject: "Business", paper: "Business 3", code: "7132/3", start_time: "13:30", duration: "2h" },
  { date: "2026-06-02", board: "AQA", level: "A-level", subject: "Chemistry", paper: "Paper 1: Inorganic and Physical Chemistry", code: "7405/1", start_time: "09:00", duration: "2h" },
  { date: "2026-06-09", board: "AQA", level: "A-level", subject: "Chemistry", paper: "Paper 2: Organic and Physical Chemistry", code: "7405/2", start_time: "09:00", duration: "2h" },
  { date: "2026-06-15", board: "AQA", level: "A-level", subject: "Chemistry", paper: "Paper 3", code: "7405/3", start_time: "09:00", duration: "2h" },
  { date: "2026-06-10", board: "AQA", level: "A-level", subject: "Computer Science", paper: "Paper 1 (on screen)", code: "7517/1", start_time: "13:30", duration: "2h 30m" },
  { date: "2026-06-17", board: "AQA", level: "A-level", subject: "Computer Science", paper: "Paper 2", code: "7517/2", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-05-11", board: "AQA", level: "A-level", subject: "Economics", paper: "Paper 1: Markets and market failure", code: "7136/1", start_time: "09:00", duration: "2h" },
  { date: "2026-05-18", board: "AQA", level: "A-level", subject: "Economics", paper: "Paper 2: National and international economy", code: "7136/2", start_time: "13:30", duration: "2h" },
  { date: "2026-06-04", board: "AQA", level: "A-level", subject: "Economics", paper: "Paper 3: Economic principles and issues", code: "7136/3", start_time: "09:00", duration: "2h" },
  { date: "2026-05-11", board: "AQA", level: "A-level", subject: "English Language", paper: "Paper 1: Language, the individual and society", code: "7702/1", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-05-22", board: "AQA", level: "A-level", subject: "English Language", paper: "Paper 2: Language diversity and change", code: "7702/2", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-05-13", board: "AQA", level: "A-level", subject: "English Literature A", paper: "Paper 1: Love through the ages", code: "7712/1", start_time: "09:00", duration: "3h" },
  { date: "2026-06-01", board: "AQA", level: "A-level", subject: "English Literature A", paper: "Paper 2: Texts in shared contexts", code: "7712/2", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-05-13", board: "AQA", level: "A-level", subject: "English Literature B", paper: "Paper 1: Literary genres", code: "7717/1", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-06-01", board: "AQA", level: "A-level", subject: "English Literature B", paper: "Paper 2: Texts and genres", code: "7717/2", start_time: "09:00", duration: "3h" },
  { date: "2026-06-08", board: "AQA", level: "A-level", subject: "French", paper: "Paper 1: Listening, reading and writing", code: "7652/1", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-06-17", board: "AQA", level: "A-level", subject: "French", paper: "Paper 2: Writing", code: "7652/2", start_time: "09:00", duration: "2h" },
  { date: "2026-05-12", board: "AQA", level: "A-level", subject: "Geography", paper: "Paper 1: Physical geography", code: "7037/1", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-05-21", board: "AQA", level: "A-level", subject: "Geography", paper: "Paper 2: Human geography", code: "7037/2", start_time: "13:30", duration: "2h 30m" },
  { date: "2026-05-19", board: "AQA", level: "A-level", subject: "German", paper: "Paper 1: Listening, reading and writing", code: "7662/1", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-06-02", board: "AQA", level: "A-level", subject: "German", paper: "Paper 2: Writing", code: "7662/2", start_time: "09:00", duration: "2h" },
  { date: "2026-05-19", board: "AQA", level: "A-level", subject: "History", paper: "Paper 1 (options A–L)", code: "7042/1", start_time: "13:30", duration: "2h 30m" },
  { date: "2026-06-02", board: "AQA", level: "A-level", subject: "History", paper: "Paper 2 (options A–T)", code: "7042/2", start_time: "13:30", duration: "2h 30m" },
  { date: "2026-06-03", board: "AQA", level: "A-level", subject: "Mathematics", paper: "Paper 1", code: "7357/1", start_time: "13:30", duration: "2h" },
  { date: "2026-06-11", board: "AQA", level: "A-level", subject: "Mathematics", paper: "Paper 2", code: "7357/2", start_time: "13:30", duration: "2h" },
  { date: "2026-06-18", board: "AQA", level: "A-level", subject: "Mathematics", paper: "Paper 3", code: "7357/3", start_time: "13:30", duration: "2h" },
  { date: "2026-05-11", board: "AQA", level: "A-level", subject: "Further Mathematics", paper: "Paper 1", code: "7367/1", start_time: "13:30", duration: "2h" },
  { date: "2026-05-15", board: "AQA", level: "A-level", subject: "Further Mathematics", paper: "Paper 2", code: "7367/2", start_time: "13:30", duration: "2h" },
  { date: "2026-06-05", board: "AQA", level: "A-level", subject: "Further Mathematics", paper: "Paper 3", code: "7367/3", start_time: "13:30", duration: "2h" },
  { date: "2026-05-20", board: "AQA", level: "A-level", subject: "Physics", paper: "Paper 1", code: "7408/1", start_time: "13:30", duration: "2h" },
  { date: "2026-06-01", board: "AQA", level: "A-level", subject: "Physics", paper: "Paper 2", code: "7408/2", start_time: "09:00", duration: "2h" },
  { date: "2026-06-08", board: "AQA", level: "A-level", subject: "Physics", paper: "Paper 3", code: "7408/3", start_time: "09:00", duration: "2h" },
  { date: "2026-05-21", board: "AQA", level: "A-level", subject: "Politics", paper: "Paper 1", code: "7152/1", start_time: "09:00", duration: "2h" },
  { date: "2026-06-08", board: "AQA", level: "A-level", subject: "Politics", paper: "Paper 2", code: "7152/2", start_time: "09:00", duration: "2h" },
  { date: "2026-06-16", board: "AQA", level: "A-level", subject: "Politics", paper: "Paper 3", code: "7152/3", start_time: "13:30", duration: "2h" },
  { date: "2026-05-15", board: "AQA", level: "A-level", subject: "Psychology", paper: "Paper 1", code: "7182/1", start_time: "09:00", duration: "2h" },
  { date: "2026-05-20", board: "AQA", level: "A-level", subject: "Psychology", paper: "Paper 2", code: "7182/2", start_time: "09:00", duration: "2h" },
  { date: "2026-06-05", board: "AQA", level: "A-level", subject: "Psychology", paper: "Paper 3", code: "7182/3", start_time: "09:00", duration: "2h" },
  { date: "2026-05-18", board: "AQA", level: "A-level", subject: "Sociology", paper: "Paper 1", code: "7192/1", start_time: "09:00", duration: "2h" },
  { date: "2026-06-03", board: "AQA", level: "A-level", subject: "Sociology", paper: "Paper 2", code: "7192/2", start_time: "09:00", duration: "2h" },
  { date: "2026-06-12", board: "AQA", level: "A-level", subject: "Sociology", paper: "Paper 3", code: "7192/3", start_time: "13:30", duration: "2h" },
  { date: "2026-06-04", board: "AQA", level: "A-level", subject: "Spanish", paper: "Paper 1: Listening, reading and writing", code: "7692/1", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-06-12", board: "AQA", level: "A-level", subject: "Spanish", paper: "Paper 2: Writing", code: "7692/2", start_time: "13:30", duration: "2h" },

  // EDEXCEL A-LEVEL
  { date: "2026-05-11", board: "Edexcel", level: "A-level", subject: "Biology A (Salters Nuffield)", paper: "Paper 1: Lifestyle, Transport, Genes and Health", code: "9BN0 01", start_time: "09:00", duration: "2h" },
  { date: "2026-06-04", board: "Edexcel", level: "A-level", subject: "Biology A (Salters Nuffield)", paper: "Paper 1: The Natural Environment and Species Survival", code: "9BN0 01", start_time: "13:30", duration: "2h" },
  { date: "2026-06-12", board: "Edexcel", level: "A-level", subject: "Biology A (Salters Nuffield)", paper: "Paper 2: Energy, Exercise and Co-ordination", code: "9BN0 02", start_time: "09:00", duration: "2h" },
  { date: "2026-06-16", board: "Edexcel", level: "A-level", subject: "Biology A (Salters Nuffield)", paper: "Paper 3: General and Practical Applications", code: "9BN0 03", start_time: "09:00", duration: "2h" },
  { date: "2026-05-11", board: "Edexcel", level: "A-level", subject: "Biology B", paper: "Paper 1: Core Cellular Biology and Microbiology", code: "9BI0 01", start_time: "09:00", duration: "1h 45m" },
  { date: "2026-06-04", board: "Edexcel", level: "A-level", subject: "Biology B", paper: "Paper 1: Advanced Biochemistry, Microbiology and Genetics", code: "9BI0 01", start_time: "13:30", duration: "1h 45m" },
  { date: "2026-06-12", board: "Edexcel", level: "A-level", subject: "Biology B", paper: "Paper 2: Advanced Physiology, Evolution and Ecology", code: "9BI0 02", start_time: "09:00", duration: "1h 45m" },
  { date: "2026-06-16", board: "Edexcel", level: "A-level", subject: "Biology B", paper: "Paper 3: General and Practical Principles in Biology", code: "9BI0 03", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-05-13", board: "Edexcel", level: "A-level", subject: "Business", paper: "Paper 1: Marketing, people and global businesses", code: "9BS0 01", start_time: "13:30", duration: "2h" },
  { date: "2026-05-19", board: "Edexcel", level: "A-level", subject: "Business", paper: "Paper 2: Business activities, decisions and strategy", code: "9BS0 02", start_time: "09:00", duration: "2h" },
  { date: "2026-06-09", board: "Edexcel", level: "A-level", subject: "Business", paper: "Paper 3: Investigating business in a competitive environment", code: "9BS0 03", start_time: "13:30", duration: "2h" },
  { date: "2026-06-02", board: "Edexcel", level: "A-level", subject: "Chemistry", paper: "Paper 1: Advanced Inorganic and Physical Chemistry", code: "9CH0 01", start_time: "09:00", duration: "1h 45m" },
  { date: "2026-06-09", board: "Edexcel", level: "A-level", subject: "Chemistry", paper: "Paper 2: Advanced Organic and Physical Chemistry", code: "9CH0 02", start_time: "09:00", duration: "1h 45m" },
  { date: "2026-06-15", board: "Edexcel", level: "A-level", subject: "Chemistry", paper: "Paper 3: General and Practical Principles in Chemistry", code: "9CH0 03", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-05-11", board: "Edexcel", level: "A-level", subject: "Economics A", paper: "Paper 1: Markets and Business Behaviour", code: "9EC0 01", start_time: "09:00", duration: "2h" },
  { date: "2026-05-18", board: "Edexcel", level: "A-level", subject: "Economics A", paper: "Paper 2: The National and Global Economy", code: "9EC0 02", start_time: "13:30", duration: "2h" },
  { date: "2026-06-04", board: "Edexcel", level: "A-level", subject: "Economics A", paper: "Paper 3: Microeconomics and Macroeconomics", code: "9EC0 03", start_time: "09:00", duration: "2h" },
  { date: "2026-05-11", board: "Edexcel", level: "A-level", subject: "Economics B", paper: "Paper 1: Markets and how they work", code: "9EB0 01", start_time: "09:00", duration: "2h" },
  { date: "2026-05-18", board: "Edexcel", level: "A-level", subject: "Economics B", paper: "Paper 2: Competing in the global economy", code: "9EB0 02", start_time: "13:30", duration: "2h" },
  { date: "2026-06-04", board: "Edexcel", level: "A-level", subject: "Economics B", paper: "Paper 3: The economic environment and business", code: "9EB0 03", start_time: "09:00", duration: "2h" },
  { date: "2026-05-11", board: "Edexcel", level: "A-level", subject: "English Language", paper: "Paper 1: Language Variation", code: "9EN0 01", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-05-22", board: "Edexcel", level: "A-level", subject: "English Language", paper: "Paper 2: Child Language", code: "9EN0 02", start_time: "09:00", duration: "1h 15m" },
  { date: "2026-06-03", board: "Edexcel", level: "A-level", subject: "English Language", paper: "Paper 3: Investigating Language", code: "9EN0 03", start_time: "13:30", duration: "1h 45m" },
  { date: "2026-05-13", board: "Edexcel", level: "A-level", subject: "English Literature", paper: "Paper 1: Drama", code: "9ET0 01", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-01", board: "Edexcel", level: "A-level", subject: "English Literature", paper: "Paper 2: Prose", code: "9ET0 02", start_time: "09:00", duration: "1h 15m" },
  { date: "2026-06-10", board: "Edexcel", level: "A-level", subject: "English Literature", paper: "Paper 3: Poetry", code: "9ET0 03", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-08", board: "Edexcel", level: "A-level", subject: "French", paper: "Paper 1: Listening, reading and translation", code: "9FR0 01", start_time: "09:00", duration: "2h" },
  { date: "2026-06-17", board: "Edexcel", level: "A-level", subject: "French", paper: "Paper 2: Written response to works and translation", code: "9FR0 02", start_time: "09:00", duration: "2h 40m" },
  { date: "2026-05-14", board: "Edexcel", level: "A-level", subject: "Further Mathematics", paper: "Paper 1: Core Pure Mathematics 1", code: "9FM0 01", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-05-21", board: "Edexcel", level: "A-level", subject: "Further Mathematics", paper: "Paper 2: Core Pure Mathematics 2", code: "9FM0 02", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-06-05", board: "Edexcel", level: "A-level", subject: "Further Mathematics", paper: "Paper 3C: Further Mechanics 1", code: "9FM0 3C", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-06-12", board: "Edexcel", level: "A-level", subject: "Further Mathematics", paper: "Paper 3B: Further Statistics 1", code: "9FM0 3B", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-06-16", board: "Edexcel", level: "A-level", subject: "Further Mathematics", paper: "Paper 3D: Decision Mathematics 1", code: "9FM0 3D", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-06-19", board: "Edexcel", level: "A-level", subject: "Further Mathematics", paper: "Paper 3A: Further Pure Mathematics 1", code: "9FM0 3A", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-06-22", board: "Edexcel", level: "A-level", subject: "Further Mathematics", paper: "Paper 4 (options A–D)", code: "9FM0 4", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-05-12", board: "Edexcel", level: "A-level", subject: "Geography", paper: "Paper 1", code: "9GE0 01", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-05-21", board: "Edexcel", level: "A-level", subject: "Geography", paper: "Paper 2", code: "9GE0 02", start_time: "13:30", duration: "2h 15m" },
  { date: "2026-06-08", board: "Edexcel", level: "A-level", subject: "Geography", paper: "Paper 3", code: "9GE0 03", start_time: "13:30", duration: "2h 15m" },
  { date: "2026-05-19", board: "Edexcel", level: "A-level", subject: "German", paper: "Paper 1: Listening, reading and translation", code: "9GN0 01", start_time: "09:00", duration: "2h" },
  { date: "2026-06-02", board: "Edexcel", level: "A-level", subject: "German", paper: "Paper 2: Written response to works and translation", code: "9GN0 02", start_time: "09:00", duration: "2h 40m" },
  { date: "2026-05-19", board: "Edexcel", level: "A-level", subject: "History", paper: "Paper 1: Breadth study with interpretations", code: "9HI0 1", start_time: "13:30", duration: "2h 15m" },
  { date: "2026-06-02", board: "Edexcel", level: "A-level", subject: "History", paper: "Paper 2: Depth Study", code: "9HI0 2", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-06-11", board: "Edexcel", level: "A-level", subject: "History", paper: "Paper 3: Themes in breadth with aspects in depth", code: "9HI0 3", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-03", board: "Edexcel", level: "A-level", subject: "Mathematics", paper: "Paper 1: Pure Mathematics 1", code: "9MA0 01", start_time: "13:30", duration: "2h" },
  { date: "2026-06-11", board: "Edexcel", level: "A-level", subject: "Mathematics", paper: "Paper 2: Pure Mathematics 2", code: "9MA0 02", start_time: "13:30", duration: "2h" },
  { date: "2026-06-18", board: "Edexcel", level: "A-level", subject: "Mathematics", paper: "Paper 3: Statistics & Mechanics", code: "9MA0 03", start_time: "13:30", duration: "2h" },
  { date: "2026-05-20", board: "Edexcel", level: "A-level", subject: "Physics", paper: "Paper 1: Advanced Physics I", code: "9PH0 01", start_time: "13:30", duration: "1h 45m" },
  { date: "2026-06-01", board: "Edexcel", level: "A-level", subject: "Physics", paper: "Paper 2: Advanced Physics II", code: "9PH0 02", start_time: "09:00", duration: "1h 45m" },
  { date: "2026-06-08", board: "Edexcel", level: "A-level", subject: "Physics", paper: "Paper 3: General and Practical Principles in Physics", code: "9PH0 03", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-05-21", board: "Edexcel", level: "A-level", subject: "Politics", paper: "Paper 1: UK Politics and Core Political Ideas", code: "9PL0 01", start_time: "09:00", duration: "2h" },
  { date: "2026-06-08", board: "Edexcel", level: "A-level", subject: "Politics", paper: "Paper 2: UK Government and Non-core Political Ideas", code: "9PL0 02", start_time: "09:00", duration: "2h" },
  { date: "2026-06-16", board: "Edexcel", level: "A-level", subject: "Politics", paper: "Paper 3A: Comparative Politics – USA", code: "9PL0 3A", start_time: "13:30", duration: "2h" },
  { date: "2026-06-16", board: "Edexcel", level: "A-level", subject: "Politics", paper: "Paper 3B: Comparative Politics – Global Politics", code: "9PL0 3B", start_time: "13:30", duration: "2h" },
  { date: "2026-05-15", board: "Edexcel", level: "A-level", subject: "Psychology", paper: "Paper 1: Foundations in Psychology", code: "9PS0 01", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-05-20", board: "Edexcel", level: "A-level", subject: "Psychology", paper: "Paper 2: Applications of Psychology", code: "9PS0 02", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-05", board: "Edexcel", level: "A-level", subject: "Psychology", paper: "Paper 3: Psychological Skills", code: "9PS0 03", start_time: "09:00", duration: "2h" },
  { date: "2026-06-04", board: "Edexcel", level: "A-level", subject: "Spanish", paper: "Paper 1: Listening, reading and translation", code: "9SP0 01", start_time: "09:00", duration: "2h" },
  { date: "2026-06-12", board: "Edexcel", level: "A-level", subject: "Spanish", paper: "Paper 2: Written response to works and translation", code: "9SP0 02", start_time: "13:30", duration: "2h 40m" },
  { date: "2026-06-04", board: "Edexcel", level: "A-level", subject: "Statistics", paper: "Paper 1: Data and Probability", code: "9ST0 01", start_time: "13:30", duration: "2h" },
  { date: "2026-06-09", board: "Edexcel", level: "A-level", subject: "Statistics", paper: "Paper 2: Statistical Inference", code: "9ST0 02", start_time: "13:30", duration: "2h" },
  { date: "2026-06-17", board: "Edexcel", level: "A-level", subject: "Statistics", paper: "Paper 3: Statistics in Practice", code: "9ST0 03", start_time: "13:30", duration: "2h" },

  // OCR A-LEVEL
  { date: "2026-06-04", board: "OCR", level: "A-level", subject: "Biology A", paper: "Biological processes", code: "H420/01", start_time: "13:30", duration: "2h 15m" },
  { date: "2026-06-12", board: "OCR", level: "A-level", subject: "Biology A", paper: "Biological diversity", code: "H420/02", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-16", board: "OCR", level: "A-level", subject: "Biology A", paper: "Unified biology", code: "H420/03", start_time: "09:00", duration: "1h 30m" },
  { date: "2026-06-04", board: "OCR", level: "A-level", subject: "Biology B (Advancing Biology)", paper: "Fundamentals of biology", code: "H422/01", start_time: "13:30", duration: "2h 15m" },
  { date: "2026-06-12", board: "OCR", level: "A-level", subject: "Biology B (Advancing Biology)", paper: "Scientific literacy in biology", code: "H422/02", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-16", board: "OCR", level: "A-level", subject: "Biology B (Advancing Biology)", paper: "Practical skills in biology", code: "H422/03", start_time: "09:00", duration: "1h 30m" },
  { date: "2026-05-13", board: "OCR", level: "A-level", subject: "Business", paper: "Operating in a local business environment", code: "H431/01", start_time: "09:00", duration: "2h" },
  { date: "2026-05-19", board: "OCR", level: "A-level", subject: "Business", paper: "The UK business environment", code: "H431/02", start_time: "09:00", duration: "2h" },
  { date: "2026-06-09", board: "OCR", level: "A-level", subject: "Business", paper: "The global business environment", code: "H431/03", start_time: "13:30", duration: "2h" },
  { date: "2026-06-02", board: "OCR", level: "A-level", subject: "Chemistry A", paper: "Periodic table, elements and physical chemistry", code: "H432/01", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-09", board: "OCR", level: "A-level", subject: "Chemistry A", paper: "Synthesis and analytical techniques", code: "H432/02", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-15", board: "OCR", level: "A-level", subject: "Chemistry A", paper: "Unified chemistry", code: "H432/03", start_time: "09:00", duration: "1h 30m" },
  { date: "2026-06-02", board: "OCR", level: "A-level", subject: "Chemistry B (Salters)", paper: "Fundamentals of chemistry", code: "H433/01", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-09", board: "OCR", level: "A-level", subject: "Chemistry B (Salters)", paper: "Scientific literacy in chemistry", code: "H433/02", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-15", board: "OCR", level: "A-level", subject: "Chemistry B (Salters)", paper: "Practical skills in chemistry", code: "H433/03", start_time: "09:00", duration: "1h 30m" },
  { date: "2026-06-10", board: "OCR", level: "A-level", subject: "Computer Science", paper: "Computer systems", code: "H446/01", start_time: "13:30", duration: "2h 30m" },
  { date: "2026-06-17", board: "OCR", level: "A-level", subject: "Computer Science", paper: "Algorithms and programming", code: "H446/02", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-05-11", board: "OCR", level: "A-level", subject: "Economics", paper: "Microeconomics", code: "H460/01", start_time: "09:00", duration: "2h" },
  { date: "2026-05-18", board: "OCR", level: "A-level", subject: "Economics", paper: "Macroeconomics", code: "H460/02", start_time: "13:30", duration: "2h" },
  { date: "2026-06-04", board: "OCR", level: "A-level", subject: "Economics", paper: "Themes in economics", code: "H460/03", start_time: "09:00", duration: "2h" },
  { date: "2026-05-11", board: "OCR", level: "A-level", subject: "English Language", paper: "Exploring language", code: "H470/01", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-05-22", board: "OCR", level: "A-level", subject: "English Language", paper: "Dimensions of linguistic variation", code: "H470/02", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-05-13", board: "OCR", level: "A-level", subject: "English Literature", paper: "Drama and poetry pre-1900", code: "H472/01", start_time: "13:30", duration: "2h 30m" },
  { date: "2026-06-01", board: "OCR", level: "A-level", subject: "English Literature", paper: "Comparative and contextual study", code: "H472/02", start_time: "09:00", duration: "2h 30m" },
  { date: "2026-05-14", board: "OCR", level: "A-level", subject: "Further Mathematics A", paper: "Pure core 1", code: "Y540", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-05-21", board: "OCR", level: "A-level", subject: "Further Mathematics A", paper: "Pure core 2", code: "Y541", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-06-05", board: "OCR", level: "A-level", subject: "Further Mathematics A", paper: "Statistics", code: "Y542", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-06-12", board: "OCR", level: "A-level", subject: "Further Mathematics A", paper: "Mechanics", code: "Y543", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-06-16", board: "OCR", level: "A-level", subject: "Further Mathematics A", paper: "Discrete mathematics", code: "Y544", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-06-19", board: "OCR", level: "A-level", subject: "Further Mathematics A", paper: "Additional pure mathematics", code: "Y545", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-05-12", board: "OCR", level: "A-level", subject: "Geography", paper: "Physical systems", code: "H481/01", start_time: "09:00", duration: "1h 30m" },
  { date: "2026-05-21", board: "OCR", level: "A-level", subject: "Geography", paper: "Human interactions", code: "H481/02", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-06-08", board: "OCR", level: "A-level", subject: "Geography", paper: "Geographical debates", code: "H481/03", start_time: "13:30", duration: "2h 30m" },
  { date: "2026-05-19", board: "OCR", level: "A-level", subject: "History A", paper: "Thematic study and historical interpretations (unit group 3)", code: "Y301-Y321", start_time: "13:30", duration: "2h 30m" },
  { date: "2026-06-02", board: "OCR", level: "A-level", subject: "History A", paper: "British period study and enquiry (unit group 1)", code: "Y101-Y113", start_time: "13:30", duration: "1h 30m" },
  { date: "2026-06-11", board: "OCR", level: "A-level", subject: "History A", paper: "Non-British period study (unit group 2)", code: "Y201-Y224", start_time: "09:00", duration: "1h" },
  { date: "2026-06-03", board: "OCR", level: "A-level", subject: "Mathematics A", paper: "Pure mathematics", code: "H240/01", start_time: "13:30", duration: "2h" },
  { date: "2026-06-11", board: "OCR", level: "A-level", subject: "Mathematics A", paper: "Pure mathematics and statistics", code: "H240/02", start_time: "13:30", duration: "2h" },
  { date: "2026-06-18", board: "OCR", level: "A-level", subject: "Mathematics A", paper: "Pure mathematics and mechanics", code: "H240/03", start_time: "13:30", duration: "2h" },
  { date: "2026-06-03", board: "OCR", level: "A-level", subject: "Mathematics B (MEI)", paper: "Pure mathematics and mechanics", code: "H640/01", start_time: "13:30", duration: "2h" },
  { date: "2026-06-11", board: "OCR", level: "A-level", subject: "Mathematics B (MEI)", paper: "Pure mathematics and statistics", code: "H640/02", start_time: "13:30", duration: "2h" },
  { date: "2026-06-18", board: "OCR", level: "A-level", subject: "Mathematics B (MEI)", paper: "Pure mathematics and comprehension", code: "H640/03", start_time: "13:30", duration: "2h" },
  { date: "2026-05-20", board: "OCR", level: "A-level", subject: "Physics A", paper: "Modelling physics", code: "H556/01", start_time: "13:30", duration: "2h 15m" },
  { date: "2026-06-01", board: "OCR", level: "A-level", subject: "Physics A", paper: "Exploring physics", code: "H556/02", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-08", board: "OCR", level: "A-level", subject: "Physics A", paper: "Unified physics", code: "H556/03", start_time: "09:00", duration: "1h 30m" },
  { date: "2026-05-20", board: "OCR", level: "A-level", subject: "Physics B (Advancing Physics)", paper: "Fundamentals of physics", code: "H557/01", start_time: "13:30", duration: "2h 15m" },
  { date: "2026-06-01", board: "OCR", level: "A-level", subject: "Physics B (Advancing Physics)", paper: "Scientific literacy in physics", code: "H557/02", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-08", board: "OCR", level: "A-level", subject: "Physics B (Advancing Physics)", paper: "Practical skills in physics", code: "H557/03", start_time: "09:00", duration: "1h 30m" },
  { date: "2026-05-15", board: "OCR", level: "A-level", subject: "Psychology", paper: "Research methods", code: "H567/01", start_time: "09:00", duration: "2h" },
  { date: "2026-05-20", board: "OCR", level: "A-level", subject: "Psychology", paper: "Psychological themes through core studies", code: "H567/02", start_time: "09:00", duration: "2h" },
  { date: "2026-06-05", board: "OCR", level: "A-level", subject: "Psychology", paper: "Applied psychology", code: "H567/03", start_time: "09:00", duration: "2h" },
  { date: "2026-05-18", board: "OCR", level: "A-level", subject: "Sociology", paper: "Socialisation, culture and identity", code: "H580/01", start_time: "09:00", duration: "1h 30m" },
  { date: "2026-06-03", board: "OCR", level: "A-level", subject: "Sociology", paper: "Researching and understanding social inequalities", code: "H580/02", start_time: "09:00", duration: "2h 15m" },
  { date: "2026-06-12", board: "OCR", level: "A-level", subject: "Sociology", paper: "Debates in contemporary society", code: "H580/03", start_time: "13:30", duration: "2h 15m" },

  // CONTINGENCY
  { date: "2026-06-24", board: "All", level: "All", subject: "CONTINGENCY DAY", paper: "Reserved by JCQ — all boards", code: "", start_time: "", duration: "" },
];

/** Get unique subject+board combinations for dropdowns */
export function getAvailableSubjects(): { subject: string; board: string }[] {
  const seen = new Set<string>();
  const result: { subject: string; board: string }[] = [];
  for (const e of EXAM_TIMETABLE_2026) {
    if (e.subject === 'CONTINGENCY DAY') continue;
    const key = `${e.board}|${e.subject}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ subject: e.subject, board: e.board });
    }
  }
  return result.sort((a, b) => a.subject.localeCompare(b.subject) || a.board.localeCompare(b.board));
}

/** Get unique boards */
export function getAvailableBoards(): string[] {
  const boards = new Set(EXAM_TIMETABLE_2026.map(e => e.board).filter(b => b !== 'All'));
  return Array.from(boards).sort();
}

/** Get subjects for a given board */
export function getSubjectsForBoard(board: string): string[] {
  const subjects = new Set(
    EXAM_TIMETABLE_2026.filter(e => e.board === board && e.subject !== 'CONTINGENCY DAY').map(e => e.subject)
  );
  return Array.from(subjects).sort();
}

/** Get exams for specific subject+board combinations */
export function getExamsForSelections(selections: { subject: string; board: string }[]): ExamEntry[] {
  return EXAM_TIMETABLE_2026.filter(e =>
    selections.some(s => s.subject === e.subject && s.board === e.board)
  ).sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
}
