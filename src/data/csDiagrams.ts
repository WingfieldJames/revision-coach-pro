export interface CSDiagram {
  id: string;
  title: string;
  keywords: string[];
  imagePath: string;
}

export const csDiagrams: CSDiagram[] = [
  {
    id: 'von-neumann-architecture',
    title: 'Von Neumann Architecture',
    keywords: ['von neumann', 'cpu', 'processor', 'RAM', 'memory', 'bus', 'data bus', 'address bus', 'control bus', 'ALU', 'arithmetic logic unit', 'control unit', 'CU', 'registers', 'MAR', 'MDR', 'PC', 'program counter', 'CIR', 'current instruction register', 'accumulator', 'ACC', 'fetch decode execute', 'FDE cycle', 'stored program concept', 'general purpose registers'],
    imagePath: '/diagrams/cs/von-neumann-architecture.jpg'
  },
  {
    id: 'and-gate',
    title: 'AND Gate',
    keywords: ['AND gate', 'AND logic gate', 'logic gate', 'boolean AND', 'conjunction', 'A AND B', 'A.B', 'A∧B', 'truth table AND', 'both inputs high', 'logic circuit', 'digital logic', 'binary AND'],
    imagePath: '/diagrams/cs/and-gate.jpg'
  },
  {
    id: 'or-gate',
    title: 'OR Gate',
    keywords: ['OR gate', 'OR logic gate', 'logic gate', 'boolean OR', 'disjunction', 'A OR B', 'A+B', 'A∨B', 'truth table OR', 'either input high', 'logic circuit', 'digital logic', 'binary OR', 'inclusive OR'],
    imagePath: '/diagrams/cs/or-gate.jpg'
  },
  {
    id: 'xor-gate',
    title: 'XOR Gate',
    keywords: ['XOR gate', 'XOR logic gate', 'exclusive OR', 'logic gate', 'boolean XOR', 'A XOR B', 'A⊕B', 'truth table XOR', 'different inputs', 'logic circuit', 'digital logic', 'binary XOR', 'exclusive disjunction'],
    imagePath: '/diagrams/cs/xor-gate.jpg'
  },
  {
    id: 'not-gate',
    title: 'NOT Gate',
    keywords: ['NOT gate', 'NOT logic gate', 'inverter', 'logic gate', 'boolean NOT', 'negation', 'A NOT', '¬A', 'Ā', 'truth table NOT', 'invert', 'logic circuit', 'digital logic', 'binary NOT', 'complement'],
    imagePath: '/diagrams/cs/not-gate.jpg'
  },
  {
    id: 'half-adder',
    title: 'Half Adder',
    keywords: ['half adder', 'adder circuit', 'binary addition', 'sum bit', 'carry bit', 'XOR AND combination', 'half-adder', 'logic circuit', 'arithmetic circuit', 'binary arithmetic', 'S and C outputs', 'adding two bits'],
    imagePath: '/diagrams/cs/half-adder.jpg'
  },
  {
    id: 'full-adder',
    title: 'Full Adder',
    keywords: ['full adder', 'adder circuit', 'binary addition', 'sum bit', 'carry in', 'carry out', 'Cin', 'Cout', 'full-adder', 'logic circuit', 'arithmetic circuit', 'binary arithmetic', 'three input adder', 'cascading adders', 'ripple carry'],
    imagePath: '/diagrams/cs/full-adder.jpg'
  },
  {
    id: 'd-flip-flop',
    title: 'D Flip-Flop (Clock)',
    keywords: ['D flip-flop', 'D flip flop', 'flip-flop', 'flip flop', 'latch', 'clock', 'clock signal', 'edge triggered', 'data input', 'Q output', 'not Q', 'memory element', 'sequential circuit', 'register', 'storage element', 'synchronous', 'clock pulse'],
    imagePath: '/diagrams/cs/d-flip-flop.jpg'
  },
  {
    id: 'array',
    title: 'Array',
    keywords: ['array', 'arrays', 'data structure', 'index', 'indexing', 'element', 'first element', 'array length', 'zero indexed', '0 indexed', 'contiguous memory', 'fixed size', 'random access', 'subscript', 'array notation', 'array[0]', 'array elements'],
    imagePath: '/diagrams/cs/array.jpg'
  },
  {
    id: 'stack',
    title: 'Stack',
    keywords: ['stack', 'stacks', 'push', 'pop', 'LIFO', 'last in first out', 'top pointer', 'top counter', 'stack pointer', 'data structure', 'call stack', 'stack overflow', 'stack underflow', 'peek', 'isEmpty', 'isFull'],
    imagePath: '/diagrams/cs/stack.jpg'
  },
  {
    id: 'queue',
    title: 'Queue',
    keywords: ['queue', 'queues', 'enqueue', 'dequeue', 'FIFO', 'first in first out', 'front pointer', 'rear pointer', 'head', 'tail', 'data structure', 'circular queue', 'priority queue', 'linear queue', 'isEmpty', 'isFull'],
    imagePath: '/diagrams/cs/queue.jpg'
  },
  {
    id: 'graph',
    title: 'Graph',
    keywords: ['graph', 'graphs', 'node', 'nodes', 'vertex', 'vertices', 'edge', 'edges', 'adjacency', 'adjacency list', 'adjacency matrix', 'weighted graph', 'unweighted graph', 'directed graph', 'undirected graph', 'connected', 'path', 'cycle', 'data structure'],
    imagePath: '/diagrams/cs/graph.jpg'
  },
  {
    id: 'tree',
    title: 'Tree',
    keywords: ['tree', 'trees', 'root', 'root node', 'parent', 'parent node', 'child', 'child node', 'leaf', 'leaf node', 'branch', 'subtree', 'hierarchical', 'data structure', 'node', 'nodes', 'depth', 'height', 'level'],
    imagePath: '/diagrams/cs/tree.jpg'
  },
  {
    id: 'binary-search-tree',
    title: 'Binary Search Tree',
    keywords: ['binary search tree', 'BST', 'binary tree', 'left subtree', 'right subtree', 'root', 'node', 'leaf', 'ordered tree', 'sorted tree', 'search tree', 'balanced tree', 'unbalanced tree', 'insert', 'delete', 'search', 'traversal', 'in-order', 'data structure'],
    imagePath: '/diagrams/cs/binary-search-tree.jpg'
  },
  {
    id: 'post-order-traversal',
    title: 'Post Order Traversal',
    keywords: ['post order', 'post-order', 'postorder', 'tree traversal', 'traversal', 'left right root', 'LRN', 'depth first', 'DFS', 'binary tree traversal', 'visiting nodes', 'recursive traversal', 'in order', 'pre order', 'tree walk'],
    imagePath: '/diagrams/cs/post-order-traversal.jpg'
  }
];
