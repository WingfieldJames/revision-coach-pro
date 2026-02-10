export interface OCRCSSpecPoint {
  code: string;
  name: string;
  component: 1 | 2; // 1 = Computer Systems, 2 = Algorithms & Programming
  keywords: string[];
}

export interface OCRCSPastPaperQuestion {
  paper: string;
  year: number;
  section: string;
  number: string;
  question: string;
  marks: number;
  specCodes: string[];
  extract?: string;
}

// ===== OCR A-Level Computer Science H446 Specification Points =====
export const OCR_CS_SPEC_POINTS: OCRCSSpecPoint[] = [
  // Component 01: Computer Systems
  // 1.1 Structure and function of the processor
  { code: "1.1.1.a", name: "ALU, Control Unit and Registers (PC, ACC, MAR, MDR, CIR)", component: 1, keywords: ["alu", "control unit", "registers", "program counter", "accumulator", "mar", "mdr", "cir", "arithmetic logic unit"] },
  { code: "1.1.1.b", name: "Buses: data, address and control", component: 1, keywords: ["bus", "data bus", "address bus", "control bus", "system bus"] },
  { code: "1.1.1.c", name: "Fetch-Decode-Execute Cycle", component: 1, keywords: ["fetch", "decode", "execute", "fde", "fetch decode execute", "instruction cycle"] },
  { code: "1.1.1.d", name: "Factors affecting CPU performance", component: 1, keywords: ["clock speed", "cores", "cache", "cpu performance", "processor speed"] },
  { code: "1.1.1.e", name: "Pipelining in a processor", component: 1, keywords: ["pipelining", "pipeline", "instruction pipeline"] },
  { code: "1.1.1.f", name: "Von Neumann, Harvard and contemporary architecture", component: 1, keywords: ["von neumann", "harvard", "architecture", "contemporary", "stored program"] },
  { code: "1.1.2.a", name: "RISC and CISC processors", component: 1, keywords: ["risc", "cisc", "reduced instruction", "complex instruction", "processor type"] },
  { code: "1.1.2.b", name: "Multicore and Parallel systems", component: 1, keywords: ["multicore", "parallel", "multi-core", "parallel processing", "parallel systems"] },
  { code: "1.1.2.c", name: "GPUs and their uses", component: 1, keywords: ["gpu", "graphics processing unit", "graphics card", "cuda", "parallel computation"] },
  { code: "1.1.3.a", name: "Input, output and storage devices", component: 1, keywords: ["input", "output", "storage", "devices", "peripherals"] },
  { code: "1.1.3.b", name: "Magnetic, flash and optical storage", component: 1, keywords: ["magnetic", "flash", "optical", "hdd", "ssd", "cd", "dvd", "blu-ray", "storage media"] },
  { code: "1.1.3.c", name: "RAM and ROM", component: 1, keywords: ["ram", "rom", "random access memory", "read only memory", "volatile", "non-volatile"] },
  { code: "1.1.3.d", name: "Virtual storage", component: 1, keywords: ["virtual storage", "cloud storage", "network storage"] },

  // 1.2 Software and software development
  { code: "1.2.1.a", name: "Purpose and function of operating systems", component: 1, keywords: ["operating system", "os", "function", "purpose", "resource management"] },
  { code: "1.2.1.b", name: "Memory Management: Paging, segmentation, virtual memory", component: 1, keywords: ["memory management", "paging", "segmentation", "virtual memory", "page table"] },
  { code: "1.2.1.c", name: "Interrupts and ISR", component: 1, keywords: ["interrupt", "isr", "interrupt service routine", "interrupt handler"] },
  { code: "1.2.1.d", name: "Scheduling algorithms", component: 1, keywords: ["scheduling", "round robin", "fcfs", "first come first served", "shortest job first", "sjf", "multi-level feedback"] },
  { code: "1.2.1.e", name: "Types of operating systems", component: 1, keywords: ["distributed", "embedded", "multi-tasking", "multi-user", "real-time", "operating system types"] },
  { code: "1.2.1.f", name: "BIOS, Device drivers and Virtual machines", component: 1, keywords: ["bios", "device driver", "virtual machine", "vm", "boot"] },
  { code: "1.2.2.a", name: "Applications: open source vs closed source", component: 1, keywords: ["open source", "closed source", "proprietary", "application software"] },
  { code: "1.2.2.b", name: "Interpreters, compilers and assemblers", component: 1, keywords: ["interpreter", "compiler", "assembler", "translation", "translator"] },
  { code: "1.2.2.c", name: "Stages of compilation", component: 1, keywords: ["lexical analysis", "syntax analysis", "code generation", "optimisation", "compilation stages"] },
  { code: "1.2.2.d", name: "Linkers, loaders and libraries", component: 1, keywords: ["linker", "loader", "library", "dynamic linking", "static linking"] },
  { code: "1.2.3.a", name: "Software development methodologies", component: 1, keywords: ["waterfall", "agile", "extreme programming", "spiral", "rad", "methodology", "sdlc"] },
  { code: "1.2.4.a", name: "Procedural/Object-oriented paradigms", component: 1, keywords: ["procedural", "object-oriented", "oop", "paradigm", "programming paradigm"] },
  { code: "1.2.4.b", name: "Assembly language (Little Man Computer)", component: 1, keywords: ["assembly", "lmc", "little man computer", "mnemonic", "low-level"] },
  { code: "1.2.4.c", name: "Modes of addressing", component: 1, keywords: ["addressing", "immediate", "direct", "indirect", "indexed", "addressing mode"] },
  { code: "1.2.4.d", name: "OOP: classes, objects, inheritance, encapsulation, polymorphism", component: 1, keywords: ["class", "object", "inheritance", "encapsulation", "polymorphism", "method", "constructor", "abstraction"] },

  // 1.3 Exchanging data
  { code: "1.3.1.a", name: "Lossy vs Lossless compression", component: 1, keywords: ["lossy", "lossless", "compression", "data compression"] },
  { code: "1.3.1.b", name: "Run length encoding and dictionary coding", component: 1, keywords: ["run length encoding", "rle", "dictionary coding", "lzw", "compression algorithm"] },
  { code: "1.3.1.c", name: "Symmetric and asymmetric encryption", component: 1, keywords: ["symmetric", "asymmetric", "encryption", "public key", "private key", "aes", "rsa"] },
  { code: "1.3.1.d", name: "Hashing and its uses", component: 1, keywords: ["hashing", "hash function", "hash table", "collision", "password hashing"] },
  { code: "1.3.2.a", name: "Relational databases and keys", component: 1, keywords: ["relational database", "primary key", "foreign key", "secondary key", "flat file", "table"] },
  { code: "1.3.2.b", name: "Entity relationship modelling", component: 1, keywords: ["entity relationship", "er diagram", "erd", "one to many", "many to many", "relationship"] },
  { code: "1.3.2.c", name: "Normalisation to 3NF", component: 1, keywords: ["normalisation", "normalization", "1nf", "2nf", "3nf", "normal form", "redundancy"] },
  { code: "1.3.2.d", name: "SQL: SELECT, UPDATE, INSERT, DELETE, JOIN", component: 1, keywords: ["sql", "select", "update", "insert", "delete", "join", "query", "database query"] },
  { code: "1.3.2.e", name: "Defining tables (DDL)", component: 1, keywords: ["ddl", "create table", "data definition", "schema"] },
  { code: "1.3.2.f", name: "Transaction processing, ACID", component: 1, keywords: ["transaction", "acid", "atomicity", "consistency", "isolation", "durability", "record locking"] },
  { code: "1.3.3.a", name: "Characteristics of LANs and WANs", component: 1, keywords: ["lan", "wan", "local area network", "wide area network", "network type"] },
  { code: "1.3.3.b", name: "Client-server and peer-to-peer", component: 1, keywords: ["client-server", "peer-to-peer", "p2p", "client server", "network model"] },
  { code: "1.3.3.c", name: "Packets and packet/circuit switching", component: 1, keywords: ["packet", "packet switching", "circuit switching", "routing"] },
  { code: "1.3.3.d", name: "Network hardware", component: 1, keywords: ["router", "switch", "hub", "nic", "network interface", "wireless access point", "network hardware"] },
  { code: "1.3.3.e", name: "TCP/IP Stack, DNS, Protocol layering", component: 1, keywords: ["tcp", "ip", "tcp/ip", "dns", "protocol", "layering", "application layer", "transport layer"] },
  { code: "1.3.3.f", name: "Network security: Firewalls, proxies, encryption", component: 1, keywords: ["firewall", "proxy", "network security", "encryption", "ssl", "tls"] },
  { code: "1.3.3.g", name: "Network standards and protocols", component: 1, keywords: ["protocol", "standard", "ieee", "http", "ftp", "smtp", "pop", "imap"] },
  { code: "1.3.4.a", name: "HTML, CSS and JavaScript", component: 1, keywords: ["html", "css", "javascript", "web", "web development", "markup"] },
  { code: "1.3.4.b", name: "Search engine indexing", component: 1, keywords: ["search engine", "indexing", "web crawler", "spider", "seo"] },
  { code: "1.3.4.c", name: "PageRank algorithm", component: 1, keywords: ["pagerank", "page rank", "google", "link analysis", "ranking"] },
  { code: "1.3.4.d", name: "Server-side and client-side processing", component: 1, keywords: ["server-side", "client-side", "server side", "client side", "backend", "frontend"] },

  // 1.4 Data types, data structures and algorithms
  { code: "1.4.1.a", name: "Primitive data types", component: 1, keywords: ["integer", "real", "character", "string", "boolean", "data type", "primitive"] },
  { code: "1.4.1.b", name: "Binary (unsigned/signed - Two's complement)", component: 1, keywords: ["binary", "unsigned", "signed", "twos complement", "two's complement", "binary number"] },
  { code: "1.4.1.c", name: "Hexadecimal", component: 1, keywords: ["hexadecimal", "hex", "base 16", "conversion"] },
  { code: "1.4.1.d", name: "Floating point binary (normalisation)", component: 1, keywords: ["floating point", "mantissa", "exponent", "normalisation", "float", "real number"] },
  { code: "1.4.1.e", name: "Bitwise manipulation", component: 1, keywords: ["bitwise", "shift", "and", "or", "xor", "mask", "bit manipulation"] },
  { code: "1.4.1.f", name: "Character sets (ASCII, Unicode)", component: 1, keywords: ["ascii", "unicode", "character set", "utf", "encoding"] },
  { code: "1.4.2.a", name: "Arrays, records, lists, tuples", component: 1, keywords: ["array", "record", "list", "tuple", "data structure"] },
  { code: "1.4.2.b", name: "Stacks and queues", component: 1, keywords: ["stack", "queue", "push", "pop", "enqueue", "dequeue", "lifo", "fifo"] },
  { code: "1.4.3.a", name: "Logic gates", component: 1, keywords: ["logic gate", "and", "or", "not", "nand", "nor", "xor", "truth table"] },
  { code: "1.4.3.b", name: "Boolean algebra and simplification", component: 1, keywords: ["boolean", "karnaugh", "de morgan", "simplification", "boolean algebra", "k-map"] },

  // 1.5 Legal, moral, cultural and ethical issues
  { code: "1.5.1.a", name: "Data Protection Act / GDPR", component: 1, keywords: ["data protection", "gdpr", "dpa", "privacy", "personal data"] },
  { code: "1.5.1.b", name: "Computer Misuse Act 1990", component: 1, keywords: ["computer misuse", "hacking", "unauthorised access", "malware", "cyber crime"] },
  { code: "1.5.1.c", name: "Copyright Design and Patents Act 1988", component: 1, keywords: ["copyright", "patents", "intellectual property", "software licensing"] },
  { code: "1.5.1.d", name: "Regulation of Investigatory Powers Act 2000", component: 1, keywords: ["ripa", "investigatory powers", "surveillance", "interception"] },
  { code: "1.5.2.a", name: "Moral and ethical issues in computing", component: 1, keywords: ["ethics", "moral", "privacy", "censorship", "surveillance", "environmental", "ai ethics"] },

  // Component 02: Algorithms and Programming
  // 2.1 Elements of computational thinking
  { code: "2.1.1.a", name: "Nature of abstraction", component: 2, keywords: ["abstraction", "abstract", "representation", "model"] },
  { code: "2.1.1.b", name: "Need for abstraction", component: 2, keywords: ["abstraction", "complexity", "simplification"] },
  { code: "2.1.1.c", name: "Abstraction vs reality", component: 2, keywords: ["abstraction", "reality", "representation gap"] },
  { code: "2.1.2.a", name: "Inputs and outputs", component: 2, keywords: ["input", "output", "precondition", "thinking ahead"] },
  { code: "2.1.2.b", name: "Preconditions", component: 2, keywords: ["precondition", "prerequisite", "assumption"] },
  { code: "2.1.2.c", name: "Caching", component: 2, keywords: ["cache", "caching", "prefetching", "performance"] },
  { code: "2.1.3.a", name: "Decomposition", component: 2, keywords: ["decomposition", "sub-problem", "modular", "break down"] },
  { code: "2.1.4.a", name: "Identifying decision points", component: 2, keywords: ["decision", "condition", "logical thinking", "branching"] },
  { code: "2.1.5.a", name: "Concurrent processing", component: 2, keywords: ["concurrent", "concurrency", "parallel", "thread", "process"] },

  // 2.2 Problem solving and programming
  { code: "2.2.1.a", name: "Variables, constants, assignment, I/O", component: 2, keywords: ["variable", "constant", "assignment", "input", "output", "declaration"] },
  { code: "2.2.1.b", name: "Sequence, selection, iteration", component: 2, keywords: ["sequence", "selection", "iteration", "loop", "if", "while", "for", "repeat"] },
  { code: "2.2.1.c", name: "Arithmetic, relational and boolean operators", component: 2, keywords: ["operator", "arithmetic", "relational", "boolean", "and", "or", "not", "comparison"] },
  { code: "2.2.1.d", name: "Subroutines (parameters/return values)", component: 2, keywords: ["subroutine", "function", "procedure", "parameter", "return", "argument"] },
  { code: "2.2.1.e", name: "Scope: Local and Global variables", component: 2, keywords: ["scope", "local", "global", "variable scope"] },
  { code: "2.2.1.f", name: "Recursion", component: 2, keywords: ["recursion", "recursive", "base case", "stack overflow", "call stack"] },
  { code: "2.2.1.g", name: "IDE features", component: 2, keywords: ["ide", "debugger", "breakpoint", "integrated development environment", "syntax highlighting"] },
  { code: "2.2.2.a", name: "Features of algorithms", component: 2, keywords: ["algorithm", "correctness", "efficiency", "termination"] },
  { code: "2.2.2.b", name: "Backtracking, Data mining, Heuristics, Performance modelling, Pipelining, Visualisation", component: 2, keywords: ["backtracking", "data mining", "heuristic", "performance modelling", "pipelining", "visualisation"] },

  // 2.3 Algorithms
  { code: "2.3.1.a", name: "Big O: time and space complexity", component: 2, keywords: ["big o", "time complexity", "space complexity", "o(n)", "o(1)", "o(log n)", "efficiency", "algorithm analysis"] },
  { code: "2.3.1.b", name: "Linear and Binary search", component: 2, keywords: ["linear search", "binary search", "search algorithm", "sequential search"] },
  { code: "2.3.1.c", name: "Bubble, Insertion, Merge, Quick sort", component: 2, keywords: ["bubble sort", "insertion sort", "merge sort", "quick sort", "sorting", "sort algorithm"] },
  { code: "2.3.1.d", name: "Data Structures: Queues, Stacks, Lists, Graphs, Trees, Hash Tables", component: 2, keywords: ["queue", "stack", "list", "graph", "tree", "hash table", "data structure", "linked list"] },
  { code: "2.3.1.e", name: "Traversal: BFS, DFS (Pre, In, Post order)", component: 2, keywords: ["traversal", "breadth-first", "depth-first", "bfs", "dfs", "pre-order", "in-order", "post-order", "tree traversal"] },
  { code: "2.3.1.f", name: "Dijkstra's and A* algorithm", component: 2, keywords: ["dijkstra", "a star", "a*", "shortest path", "pathfinding", "weighted graph"] },
  { code: "2.3.1.g", name: "Implementation/Programming of algorithms", component: 2, keywords: ["implementation", "programming", "pseudocode", "code", "algorithm implementation"] },
];

// ===== OCR CS Past Paper Questions =====
// NOTE: No past paper questions have been uploaded yet. This array will be populated
// once OCR CS past papers are ingested into the training data.
export const OCR_CS_PAST_QUESTIONS: OCRCSPastPaperQuestion[] = [];
