import React, { useState, useMemo } from "react";
import InstructorPage from "./InstructorPage";
import { api } from "../../api";

const AI_TOOLS = [
  {
    id: "assistant",
    icon: "🤖",
    title: "AI Teaching Assistant",
    desc: "Get help with lesson planning, student queries, and teaching strategies",
    color: "#3b82f6",
  },
  {
    id: "questions",
    icon: "❓",
    title: "AI Question Generator",
    desc: "Automatically generate quiz and exam questions from your course content",
    color: "#10b981",
  },
  {
    id: "recommendations",
    icon: "💡",
    title: "AI Recommendations",
    desc: "Get personalized recommendations for improving course content",
    color: "#f59e0b",
  },
  {
    id: "planner",
    icon: "📋",
    title: "Lesson Planner",
    desc: "AI-powered lesson planning with curriculum alignment",
    color: "#8b5cf6",
  },
  {
    id: "content",
    icon: "📝",
    title: "Content Suggestions",
    desc: "Get suggestions for supplementary materials and resources",
    color: "#ec4899",
  },
];

const QUESTION_TYPES = [
  { id: "mcq", label: "MCQ", icon: "🔘", desc: "Multiple Choice Questions" },
  { id: "1liner", label: "1 Liner", icon: "✏️", desc: "One-line short answers" },
  { id: "2marker", label: "2 Marker", icon: "📝", desc: "2-mark questions" },
  { id: "3marker", label: "3 Marker", icon: "📄", desc: "3-mark questions" },
  { id: "5marker", label: "5 Marker", icon: "📑", desc: "5-mark long answer questions" },
  { id: "mixed", label: "Mixed", icon: "🔀", desc: "Mix of MCQs, 1 Liners and marker questions" },
  { id: "questionpaper", label: "Question Paper Format", icon: "📄", desc: "Complete exam paper structure with sections" },
];

const QUESTION_COUNTS = [5, 10, 25, 50, 100];

export default function InstructorAITools() {
  const [activeTool, setActiveTool] = useState(null);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionType, setQuestionType] = useState("mcq");
  const [questionCount, setQuestionCount] = useState(10);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [generatedTopic, setGeneratedTopic] = useState("");
  const PAPER_SECTION_TYPES = [
    { id: "mcq", label: "MCQ", defaultMarks: 1 },
    { id: "1liner", label: "1 Liner", defaultMarks: 1 },
    { id: "2marker", label: "2 Marker", defaultMarks: 2 },
    { id: "3marker", label: "3 Marker", defaultMarks: 3 },
    { id: "5marker", label: "5 Marker", defaultMarks: 5 },
  ];

  let _groupIdCounter = 0;
  const defaultGroup = (type = 'mcq') => {
    const defaultM = PAPER_SECTION_TYPES.find(t => t.id === type);
    return { id: ++_groupIdCounter, questionType: type, numberOfQuestions: 10, marksPerQuestion: defaultM ? defaultM.defaultMarks : 1 };
  };
  const defaultSection = (name, groups) => ({
    name,
    instructions: "",
    orChoice: false,
    questionGroups: groups || [defaultGroup('mcq')],
  });

  const [paperConfig, setPaperConfig] = useState({
    title: "",
    subject: "",
    duration: "3 Hours",
    maxMarks: 100,
    difficulty: "Medium",
    sections: [
      defaultSection("Section A"),
      defaultSection("Section B"),
      defaultSection("Section C", [defaultGroup('2marker')]),
      defaultSection("Section D", [defaultGroup('3marker')]),
    ],
  });
  const [paperGenerated, setPaperGenerated] = useState(false);
  const [paperData, setPaperData] = useState(null);
  const [uploadingPaper, setUploadingPaper] = useState(false);
  const [paperUploaded, setPaperUploaded] = useState(false);
  const [questionsPerPage, setQuestionsPerPage] = useState(10);

  // Question Bank: unified store for AI + instructor questions
  const [questionBank, setQuestionBank] = useState([]);
  const [bankFilter, setBankFilter] = useState('all'); // 'all' | 'AI' | 'INSTRUCTOR'
  const [bankTypeFilter, setBankTypeFilter] = useState('all');
  const [bankSearch, setBankSearch] = useState('');

  // Manual Question Form
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [manualForm, setManualForm] = useState({
    type: 'mcq',
    text: '',
    marks: 1,
    options: ['', '', '', ''],
    correctAnswer: 'A',
  });

  // Section question assignments (bank question IDs assigned to each section)
  const [sectionAssignments, setSectionAssignments] = useState({});
  // { sectionIdx: [questionId, ...] }
  const [showSectionPicker, setShowSectionPicker] = useState(null); // sectionIdx or null
  const [pickerTypeFilter, setPickerTypeFilter] = useState('all');
  const [pickerSearch, setPickerSearch] = useState('');

  // Manual question form inside section
  const [showSectionManualForm, setShowSectionManualForm] = useState(null); // sectionIdx or null
  const [sectionManualForm, setSectionManualForm] = useState({
    type: 'mcq', text: '', marks: 1, options: ['', '', '', ''], correctAnswer: 'A',
  });

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResponse("");

    const selectedType = QUESTION_TYPES.find(t => t.id === questionType);
    const typeLabel = selectedType ? selectedType.label : "Mixed";
    const count = questionCount;
    const topic = input.trim();

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1500));

    function generateQuestions(topic, type, n) {
      // Helper: shuffle array
      function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }

      // MCQ templates — each has a question function and the correct answer letter
      const mcqTemplates = [
        { text: (t) => `What is a key feature of ${t}? (A) Encapsulation (B) Inheritance (C) Polymorphism (D) All of the above`, answer: "D" },
        { text: (t) => `Which of the following best describes ${t}? (A) A programming language (B) A software design principle (C) A data structure (D) An operating system`, answer: "A" },
        { text: (t) => `What is the primary benefit of using ${t}? (A) Faster execution (B) Better readability (C) Improved maintainability (D) All of the above`, answer: "D" },
        { text: (t) => `In ${t}, which approach is commonly used? (A) Top-down (B) Bottom-up (C) Both A and B (D) Neither A nor B`, answer: "C" },
        { text: (t) => `What is the time complexity of a typical ${t} operation? (A) O(1) (B) O(log n) (C) O(n) (D) O(n²)`, answer: "C" },
        { text: (t) => `Which principle is fundamental to ${t}? (A) Abstraction (B) Encapsulation (C) Modularity (D) All of the above`, answer: "D" },
        { text: (t) => `What does ${t} primarily focus on? (A) Data storage (B) Problem solving (C) User interface (D) Network security`, answer: "B" },
        { text: (t) => `Which of the following is NOT related to ${t}? (A) Algorithms (B) Data structures (C) Compiler design (D) All are related`, answer: "C" },
        { text: (t) => `How is ${t} typically implemented? (A) Procedurally (B) Object-oriented (C) Functionally (D) All of the above`, answer: "D" },
        { text: (t) => `What is the main advantage of ${t}? (A) Speed (B) Scalability (C) Simplicity (D) All of the above`, answer: "D" },
        { text: (t) => `In the context of ${t}, what does OOP stand for? (A) Object Oriented Programming (B) Object Organization Protocol (C) Optimal Operation Process (D) None of the above`, answer: "A" },
        { text: (t) => `Which keyword is commonly associated with ${t}? (A) class (B) struct (C) def (D) func`, answer: "A" },
        { text: (t) => `What is the default value of a boolean in ${t}? (A) true (B) false (C) null (D) 0`, answer: "B" },
        { text: (t) => `Which data structure is most efficient for ${t}? (A) Array (B) Linked List (C) Hash Map (D) It depends on the use case`, answer: "D" },
        { text: (t) => `What is the scope of variables in ${t}? (A) Local (B) Global (C) Class-level (D) All of the above`, answer: "D" },
        { text: (t) => `Which of the following is a benefit of ${t}? (A) Portability (B) Platform independence (C) Memory safety (D) All of the above`, answer: "D" },
        { text: (t) => `What type of language paradigm does ${t} follow? (A) Imperative (B) Declarative (C) Functional (D) It depends on implementation`, answer: "D" },
        { text: (t) => `How does ${t} handle errors? (A) Exceptions (B) Error codes (C) Both A and B (D) None of the above`, answer: "C" },
        { text: (t) => `What is the role of the compiler in ${t}? (A) Debugging (B) Translation (C) Memory allocation (D) File management`, answer: "B" },
        { text: (t) => `Which design pattern is commonly used in ${t}? (A) Singleton (B) Factory (C) Observer (D) All of the above`, answer: "D" },
        { text: (t) => `What is garbage collection in ${t}? (A) Manual memory cleanup (B) Automatic memory management (C) File deletion (D) Process termination`, answer: "B" },
        { text: (t) => `Which access modifier provides the widest visibility in ${t}? (A) private (B) protected (C) public (D) default`, answer: "C" },
        { text: (t) => `What is inheritance in ${t}? (A) Code reuse mechanism (B) Memory allocation (C) Error handling (D) File system`, answer: "A" },
        { text: (t) => `Which of the following is an OOP concept in ${t}? (A) Abstraction (B) Encapsulation (C) Inheritance (D) All of the above`, answer: "D" },
        { text: (t) => `What is polymorphism in ${t}? (A) Many forms of data (B) Same interface, different implementations (C) Multiple inheritance (D) Runtime errors`, answer: "B" },
        { text: (t) => `How is data encapsulated in ${t}? (A) Using classes (B) Using functions (C) Using pointers (D) Using macros`, answer: "A" },
        { text: (t) => `What is the purpose of a constructor in ${t}? (A) Initialize objects (B) Destroy objects (C) Allocate memory (D) Compile code`, answer: "A" },
        { text: (t) => `What is method overloading in ${t}? (A) Same name, different parameters (B) Different names, same parameters (C) Same class (D) Same return type`, answer: "A" },
        { text: (t) => `What is a package/module in ${t}? (A) A file organizer (B) A code library (C) A database (D) An operating system`, answer: "B" },
        { text: (t) => `Which loop structure is available in ${t}? (A) for (B) while (C) do-while (D) All of the above`, answer: "D" },
        { text: (t) => `What is an interface in ${t}? (A) Abstract class with only method signatures (B) User interface (C) Hardware component (D) File format`, answer: "A" },
        { text: (t) => `What is the difference between == and === in ${t}? (A) Type checking (B) Value checking (C) Both A and B (D) None`, answer: "C" },
        { text: (t) => `What is a thread in ${t}? (A) Lightweight process (B) Heavy process (C) File (D) Database`, answer: "A" },
        { text: (t) => `What is recursion in ${t}? (A) Function calling itself (B) Loop iteration (C) Memory allocation (D) File reading`, answer: "A" },
        { text: (t) => `Which sorting algorithm is most efficient for large ${t} datasets? (A) Bubble sort (B) Quick sort (C) Selection sort (D) Insertion sort`, answer: "B" },
        { text: (t) => `What is a hash table used for in ${t}? (A) Fast lookup (B) Sorting (C) Memory allocation (D) File I/O`, answer: "A" },
        { text: (t) => `What is the purpose of a try-catch block in ${t}? (A) Error handling (B) Loop control (C) Variable declaration (D) File operations`, answer: "A" },
        { text: (t) => `What is an array in ${t}? (A) Collection of same-type elements (B) Collection of different-type elements (C) Single variable (D) Function`, answer: "A" },
        { text: (t) => `What is a linked list in ${t}? (A) Linear data structure with pointers (B) Array (C) Tree (D) Graph`, answer: "A" },
        { text: (t) => `What is a stack in ${t}? (A) LIFO data structure (B) FIFO data structure (C) Tree (D) Graph`, answer: "A" },
        { text: (t) => `What is a queue in ${t}? (A) FIFO data structure (B) LIFO data structure (C) Tree (D) Graph`, answer: "A" },
        { text: (t) => `What is a tree data structure in ${t}? (A) Hierarchical structure (B) Linear structure (C) Flat structure (D) Circular structure`, answer: "A" },
        { text: (t) => `What is a graph in ${t}? (A) Nodes and edges (B) Rows and columns (C) Files and folders (D) Classes and objects`, answer: "A" },
        { text: (t) => `What is dynamic programming in ${t}? (A) Optimization technique (B) Programming language (C) IDE (D) Database`, answer: "A" },
        { text: (t) => `What is a binary search in ${t}? (A) Divide and conquer search (B) Linear search (C) Random search (D) Hash search`, answer: "A" },
        { text: (t) => `What is a pointer in ${t}? (A) Variable storing memory address (B) Data type (C) Loop (D) Function`, answer: "A" },
        { text: (t) => `What is a string in ${t}? (A) Sequence of characters (B) Number (C) Boolean (D) Array of integers`, answer: "A" },
        { text: (t) => `What is type casting in ${t}? (A) Converting one type to another (B) Creating new types (C) Deleting types (D) Hiding types`, answer: "A" },
        { text: (t) => `What is a constant in ${t}? (A) Unchangeable value (B) Changeable value (C) Function (D) Class`, answer: "A" },
        { text: (t) => `What is a variable in ${t}? (A) Named storage location (B) Constant value (C) Function (D) File`, answer: "A" },
        { text: (t) => `What is the main() function in ${t}? (A) Entry point (B) Exit point (C) Library function (D) Built-in variable`, answer: "A" },
        { text: (t) => `What is a class in ${t}? (A) Blueprint for objects (B) Instance of object (C) Function (D) Variable`, answer: "A" },
        { text: (t) => `What is an object in ${t}? (A) Instance of a class (B) Blueprint (C) Function (D) Variable`, answer: "A" },
        { text: (t) => `What is encapsulation in ${t}? (A) Bundling data and methods (B) Hiding data only (C) Showing data (D) Deleting data`, answer: "A" },
        { text: (t) => `What is abstraction in ${t}? (A) Hiding implementation details (B) Showing all details (C) Compiling code (D) Running code`, answer: "A" },
        { text: (t) => `What is a compiler in ${t}? (A) Source to machine code translator (B) Interpreter (C) Editor (D) Debugger`, answer: "A" },
        { text: (t) => `What is an interpreter in ${t}? (A) Line-by-line code executor (B) Compiler (C) Editor (D) Debugger`, answer: "A" },
        { text: (t) => `What is debugging in ${t}? (A) Finding and fixing errors (B) Writing code (C) Compiling code (D) Running code`, answer: "A" },
        { text: (t) => `What is an algorithm in ${t}? (A) Step-by-step procedure (B) Programming language (C) Data structure (D) Operating system`, answer: "A" },
        { text: (t) => `What is Big O notation in ${t}? (A) Algorithm complexity measure (B) Variable type (C) Function name (D) Class name`, answer: "A" },
        { text: (t) => `What is a API in ${t}? (A) Application Programming Interface (B) Application Process Integration (C) Advanced Program Input (D) Auto Program Interface`, answer: "A" },
        { text: (t) => `What is dependency injection in ${t}? (A) Providing dependencies from outside (B) Creating dependencies inside (C) Deleting dependencies (D) Hiding dependencies`, answer: "A" },
        { text: (t) => `What is a callback in ${t}? (A) Function passed as argument (B) Variable (C) Class (D) File`, answer: "A" },
        { text: (t) => `What is a closure in ${t}? (A) Function with remembered scope (B) File closer (C) Loop (D) Variable`, answer: "A" },
        { text: (t) => `What is a promise in ${t}? (A) Object representing future value (B) Contract (C) Variable (D) Function`, answer: "A" },
        { text: (t) => `What is async/await in ${t}? (A) Asynchronous code handling (B) Loop (C) Variable type (D) Class`, answer: "A" },
        { text: (t) => `What is event-driven programming in ${t}? (A) Code responding to events (B) Sequential code (C) Parallel code (D) Recursive code`, answer: "A" },
        { text: (t) => `What is a framework in ${t}? (A) Pre-built code structure (B) Programming language (C) Operating system (D) Database`, answer: "A" },
        { text: (t) => `What is version control in ${t}? (A) Tracking code changes (B) Compiling code (C) Running code (D) Testing code`, answer: "A" },
        { text: (t) => `What is unit testing in ${t}? (A) Testing individual components (B) Testing entire system (C) Compiling code (D) Running code`, answer: "A" },
        { text: (t) => `What is a database in ${t}? (A) Organized data collection (B) File system (C) Programming language (D) Operating system`, answer: "A" },
        { text: (t) => `What is SQL in ${t}? (A) Structured Query Language (B) Simple Query Language (C) System Query Logic (D) Standard Query Language`, answer: "A" },
        { text: (t) => `What is normalization in ${t}? (A) Organizing database tables (B) Sorting arrays (C) Compiling code (D) Running programs`, answer: "A" },
        { text: (t) => `What is indexing in ${t}? (A) Fast data retrieval technique (B) Array creation (C) File writing (D) Code compilation`, answer: "A" },
        { text: (t) => `What is CRUD in ${t}? (A) Create Read Update Delete (B) Compile Run Update Debug (C) Create Run Upload Deploy (D) Check Run Update Delete`, answer: "A" },
        { text: (t) => `What is REST in ${t}? (A) Representational State Transfer (B) Real Estate System Transfer (C) Runtime Execution Standard Tool (D) Remote System Transfer`, answer: "A" },
        { text: (t) => `What is a microservice in ${t}? (A) Small independent service (B) Large monolithic app (C) Database table (D) UI component`, answer: "A" },
        { text: (t) => `What is containerization in ${t}? (A) Packaging apps with dependencies (B) Database management (C) File compression (D) Code compilation`, answer: "A" },
        { text: (t) => `What is CI/CD in ${t}? (A) Continuous Integration/Delivery (B) Computer Interface/Code Design (C) Create Input/Compile Debug (D) Central Index/Code Database`, answer: "A" },
        { text: (t) => `What is a virtual machine in ${t}? (A) Emulated computer system (B) Physical computer (C) Database (D) Network`, answer: "A" },
        { text: (t) => `What is cloud computing in ${t}? (A) Remote server-based services (B) Local computing (C) Desktop apps (D) File storage only`, answer: "A" },
        { text: (t) => `What is scalability in ${t}? (A) Ability to handle growing load (B) Code readability (C) Memory usage (D) File size`, answer: "A" },
        { text: (t) => `What is load balancing in ${t}? (A) Distributing traffic across servers (B) Sorting data (C) Compiling code (D) Testing`, answer: "A" },
        { text: (t) => `What is caching in ${t}? (A) Storing frequently accessed data (B) Deleting data (C) Creating databases (D) Writing files`, answer: "A" },
        { text: (t) => `What is a middleware in ${t}? (A) Software between client and server (B) Database (C) Frontend (D) Compiler`, answer: "A" },
        { text: (t) => `What is serialization in ${t}? (A) Converting object to storable format (B) Sorting objects (C) Creating objects (D) Deleting objects`, answer: "A" },
        { text: (t) => `What is a webhook in ${t}? (A) Automated HTTP callback (B) User interface (C) Database trigger (D) File watcher`, answer: "A" },
        { text: (t) => `What is authentication in ${t}? (A) Verifying user identity (B) Encrypting data (C) Sorting data (D) Compiling code`, answer: "A" },
        { text: (t) => `What is authorization in ${t}? (A) Granting access permissions (B) User login (C) Data encryption (D) Code compilation`, answer: "A" },
        { text: (t) => `What is OAuth in ${t}? (A) Open authorization protocol (B) Operating system (C) Database (D) Programming language`, answer: "A" },
        { text: (t) => `What is JWT in ${t}? (A) JSON Web Token for authentication (B) Java Web Tool (C) JavaScript Wrapper Type (D) JSON Writing Tool`, answer: "A" },
        { text: (t) => `What is encryption in ${t}? (A) Converting data to secure format (B) Deleting data (C) Sorting data (D) Displaying data`, answer: "A" },
        { text: (t) => `What is hashing in ${t}? (A) Fixed-size output from input data (B) Sorting data (C) Encrypting passwords only (D) File compression`, answer: "A" },
        { text: (t) => `What is an IDE in ${t}? (A) Integrated Development Environment (B) Internal Data Engine (C) Input Design Editor (D) Index Database Engine`, answer: "A" },
        { text: (t) => `What is refactoring in ${t}? (A) Improving code without changing behavior (B) Writing new code (C) Deleting old code (D) Testing code`, answer: "A" },
        { text: (t) => `What is code review in ${t}? (A) Examining code by peers (B) Auto-generating code (C) Compiling code (D) Running tests`, answer: "A" },
        { text: (t) => `What is technical debt in ${t}? (A) Cost of quick fixes in code (B) Money spent on software (C) Hardware cost (D) Database cost`, answer: "A" },
        { text: (t) => `What is SOLID in ${t}? (A) Five OOP design principles (B) Programming language (C) Database (D) Framework`, answer: "A" },
        { text: (t) => `What is the Single Responsibility Principle in ${t}? (A) One class, one purpose (B) One class, many purposes (C) Many classes, one purpose (D) No responsibilities`, answer: "A" },
        { text: (t) => `What is DRY in ${t}? (A) Don't Repeat Yourself (B) Data Retrieve Yourself (C) Design Review Yourself (D) Debug Ready Yourself`, answer: "A" },
        { text: (t) => `What is KISS in ${t}? (A) Keep It Simple, Stupid (B) Keep Including Source Scripts (C) Key Input System Setup (D) Knowledge Into Simple Syntax`, answer: "A" },
        { text: (t) => `What is YAGNI in ${t}? (A) You Ain't Gonna Need It (B) Your Application Gets No Input (C) Yet Another Generic Node Interface (D) Your Algorithm Generates New Input`, answer: "A" },
        { text: (t) => `What is coupling in ${t}? (A) Degree of dependency between modules (B) Code compilation (C) Data sorting (D) File management`, answer: "A" },
        { text: (t) => `What is cohesion in ${t}? (A) How related elements within a module are (B) Code splitting (C) Data merging (D) File reading`, answer: "A" },
        { text: (t) => `What is a design pattern in ${t}? (A) Reusable solution to common problems (B) UI layout (C) Database schema (D) File format`, answer: "A" },
      ];

      const linerTemplates = [
        (t) => `Define ${t} in one sentence.`,
        (t) => `What is the main purpose of ${t}?`,
        (t) => `Name one real-world application of ${t}.`,
        (t) => `What does ${t} stand for?`,
        (t) => `List one advantage of ${t}.`,
        (t) => `What is the time complexity of ${t} operations?`,
        (t) => `Name the creator of ${t}.`,
        (t) => `What is the difference between ${t} and traditional approaches?`,
        (t) => `How does ${t} improve efficiency?`,
        (t) => `What is the input/output model of ${t}?`,
        (t) => `Which language supports ${t} natively?`,
        (t) => `What is the memory model used in ${t}?`,
        (t) => `Name one design pattern used with ${t}.`,
        (t) => `What is the return type of ${t} methods?`,
        (t) => `How is ${t} tested?`,
        (t) => `What is the latest version of ${t}?`,
        (t) => `Name one IDE commonly used for ${t}.`,
        (t) => `What is the build tool used in ${t}?`,
        (t) => `What is the runtime environment for ${t}?`,
        (t) => `Name one testing framework for ${t}.`,
        (t) => `What is the file extension for ${t} source files?`,
        (t) => `What is the compilation process of ${t}?`,
        (t) => `Name one framework built on top of ${t}.`,
        (t) => `What is the standard library of ${t} called?`,
        (t) => `How is memory managed in ${t}?`,
        (t) => `What is the type system of ${t}?`,
        (t) => `Name one code editor for ${t}.`,
        (t) => `What is the deployment model of ${t}?`,
        (t) => `How does ${t} handle concurrency?`,
        (t) => `What is the error handling mechanism in ${t}?`,
        (t) => `Name one book to learn ${t}.`,
        (t) => `What is the syntax style of ${t}?`,
        (t) => `How is security handled in ${t}?`,
        (t) => `What is the database support in ${t}?`,
        (t) => `Name one community resource for ${t}.`,
        (t) => `What is the package manager for ${t}?`,
        (t) => `How does ${t} handle internationalization?`,
        (t) => `What is the documentation tool for ${t}?`,
        (t) => `Name one company using ${t} in production.`,
        (t) => `What is the license type of ${t}?`,
        (t) => `How is logging done in ${t}?`,
        (t) => `What is the benchmark tool for ${t}?`,
        (t) => `Name one CI/CD tool compatible with ${t}.`,
        (t) => `What is the virtual machine for ${t}?`,
        (t) => `How does ${t} handle dependency management?`,
        (t) => `What is the web server used with ${t}?`,
        (t) => `Name one mobile framework using ${t}.`,
        (t) => `What is the serialization format in ${t}?`,
        (t) => `How is configuration managed in ${t}?`,
        (t) => `What is the code style guide for ${t}?`,
        (t) => `Name one REST API tool for ${t}.`,
        (t) => `What is the database ORM for ${t}?`,
        (t) => `How is versioning handled in ${t}?`,
        (t) => `What is the template engine for ${t}?`,
        (t) => `Name one performance monitoring tool for ${t}.`,
        (t) => `What is the build automation tool for ${t}?`,
        (t) => `How does ${t} handle data validation?`,
        (t) => `What is the authentication library for ${t}?`,
        (t) => `Name one open-source project built with ${t}.`,
        (t) => `What is the API specification used in ${t}?`,
        (t) => `How is localization done in ${t}?`,
        (t) => `What is the debugging tool for ${t}?`,
        (t) => `Name one cloud platform supporting ${t}.`,
        (t) => `What is the message queue used with ${t}?`,
        (t) => `How does ${t} handle background jobs?`,
        (t) => `What is the GraphQL library for ${t}?`,
        (t) => `Name one chatbot framework using ${t}.`,
        (t) => `What is the real-time communication in ${t}?`,
        (t) => `How is rate limiting implemented in ${t}?`,
        (t) => `What is the email service for ${t}?`,
        (t) => `Name one testing approach for ${t}.`,
        (t) => `What is the continuous deployment tool for ${t}?`,
        (t) => `How does ${t} handle migration?`,
        (t) => `What is the logging framework for ${t}?`,
        (t) => `Name one monitoring tool for ${t}.`,
        (t) => `What is the security framework for ${t}?`,
        (t) => `How is file handling done in ${t}?`,
        (t) => `What is the compression library for ${t}?`,
        (t) => `Name one video tutorial series for ${t}.`,
        (t) => `What is the web scraping tool for ${t}?`,
        (t) => `How does ${t} handle image processing?`,
        (t) => `What is the machine learning library for ${t}?`,
        (t) => `Name one game engine using ${t}.`,
        (t) => `What is the desktop application framework for ${t}?`,
        (t) => `How is session management done in ${t}?`,
        (t) => `What is the ORM used with ${t}?`,
        (t) => `Name one e-commerce platform built with ${t}.`,
        (t) => `What is the CMS framework for ${t}?`,
        (t) => `How does ${t} handle WebSocket connections?`,
        (t) => `What is the PDF generation library for ${t}?`,
        (t) => `Name one chart/graph library for ${t}.`,
        (t) => `What is the form validation library for ${t}?`,
        (t) => `How is state management done in ${t}?`,
        (t) => `What is the routing library for ${t}?`,
        (t) => `Name one static site generator using ${t}.`,
        (t) => `What is the code formatting tool for ${t}?`,
        (t) => `How does ${t} handle internationalization (i18n)?`,
        (t) => `What is the component library for ${t}?`,
        (t) => `Name one data visualization library for ${t}.`,
      ];

      const shortTemplates = [
        (t) => `Explain the concept of ${t} with a suitable example. (2 marks)`,
        (t) => `Differentiate between two main approaches in ${t}. (2 marks)`,
        (t) => `Write a short note on the history of ${t}. (2 marks)`,
        (t) => `What are the prerequisites for learning ${t}? (2 marks)`,
        (t) => `Describe the basic structure used in ${t}. (2 marks)`,
        (t) => `List and explain two features of ${t}. (2 marks)`,
        (t) => `How is ${t} different from its alternative? (2 marks)`,
        (t) => `What are the basic components of ${t}? (2 marks)`,
        (t) => `Explain the lifecycle of ${t} with a diagram. (2 marks)`,
        (t) => `What are the naming conventions used in ${t}? (2 marks)`,
        (t) => `Describe the memory allocation process in ${t}. (2 marks)`,
        (t) => `How does error handling work in ${t}? (2 marks)`,
        (t) => `What is the role of interfaces in ${t}? (2 marks)`,
        (t) => `Explain method overriding in the context of ${t}. (2 marks)`,
        (t) => `What are access modifiers in ${t}? (2 marks)`,
        (t) => `Explain the difference between heap and stack memory in ${t}. (2 marks)`,
        (t) => `What are the four pillars of OOP in ${t}? (2 marks)`,
        (t) => `How does ${t} handle null values? (2 marks)`,
        (t) => `Write a short note on the compilation process of ${t}. (2 marks)`,
        (t) => `What are the advantages of using ${t} over alternatives? (2 marks)`,
        (t) => `Explain the concept of immutability in ${t}. (2 marks)`,
        (t) => `What is the difference between a class and an object in ${t}? (2 marks)`,
        (t) => `How is string manipulation done in ${t}? (2 marks)`,
        (t) => `What are the built-in data types in ${t}? (2 marks)`,
        (t) => `Explain the concept of exception propagation in ${t}. (2 marks)`,
        (t) => `What is the difference between shallow and deep copy in ${t}? (2 marks)`,
        (t) => `How does ${t} handle file I/O operations? (2 marks)`,
        (t) => `What are the types of inheritance supported in ${t}? (2 marks)`,
        (t) => `Explain the concept of polymorphism in ${t}. (2 marks)`,
        (t) => `What is the role of a constructor in ${t}? (2 marks)`,
        (t) => `How is memory deallocation handled in ${t}? (2 marks)`,
        (t) => `What are the different types of variables in ${t}? (2 marks)`,
        (t) => `Explain the difference between pass-by-value and pass-by-reference in ${t}. (2 marks)`,
        (t) => `What is the purpose of the this keyword in ${t}? (2 marks)`,
        (t) => `How are arrays different from linked lists in ${t}? (2 marks)`,
        (t) => `What is the concept of multithreading in ${t}? (2 marks)`,
        (t) => `Explain the MVC pattern as applied in ${t}. (2 marks)`,
        (t) => `What are the common operators used in ${t}? (2 marks)`,
        (t) => `How does ${t} handle type inference? (2 marks)`,
        (t) => `What is the role of a destructor in ${t}? (2 marks)`,
        (t) => `Explain the concept of closures in ${t}. (2 marks)`,
        (t) => `What are the different types of loops in ${t}? (2 marks)`,
        (t) => `How is string interpolation done in ${t}? (2 marks)`,
        (t) => `What is the difference between final and finally in ${t}? (2 marks)`,
        (t) => `Explain the concept of lazy evaluation in ${t}. (2 marks)`,
        (t) => `What are the features of the latest version of ${t}? (2 marks)`,
        (t) => `How does ${t} handle concurrency issues? (2 marks)`,
        (t) => `What is the difference between an abstract class and an interface in ${t}? (2 marks)`,
        (t) => `Explain the concept of generics in ${t}. (2 marks)`,
        (t) => `What are the different access levels in ${t}? (2 marks)`,
        (t) => `How is error logging done in ${t}? (2 marks)`,
        (t) => `What is the purpose of a package in ${t}? (2 marks)`,
        (t) => `Explain the difference between == and equals() in ${t}. (2 marks)`,
        (t) => `What are the common design smells in ${t}? (2 marks)`,
        (t) => `How does ${t} support functional programming? (2 marks)`,
        (t) => `What is the concept of boxing and unboxing in ${t}? (2 marks)`,
        (t) => `Explain the concept of thread safety in ${t}. (2 marks)`,
        (t) => `What are the different types of exceptions in ${t}? (2 marks)`,
        (t) => `How is the ternary operator used in ${t}? (2 marks)`,
        (t) => `What is the difference between overloading and overriding in ${t}? (2 marks)`,
        (t) => `Explain the concept of annotations in ${t}. (2 marks)`,
        (t) => `What is the role of the main method in ${t}? (2 marks)`,
        (t) => `How are enums used in ${t}? (2 marks)`,
        (t) => `What is the difference between compile-time and runtime in ${t}? (2 marks)`,
        (t) => `Explain the concept of inner classes in ${t}. (2 marks)`,
        (t) => `What are the common string methods in ${t}? (2 marks)`,
        (t) => `How is data validation performed in ${t}? (2 marks)`,
        (t) => `What is the role of a static keyword in ${t}? (2 marks)`,
        (t) => `Explain the concept of volatile in ${t}. (2 marks)`,
        (t) => `What is the difference between a primitive and reference type in ${t}? (2 marks)`,
        (t) => `How does ${t} handle memory leaks? (2 marks)`,
        (t) => `What are the different types of operators in ${t}? (2 marks)`,
        (t) => `Explain the concept of diamond problem in ${t}. (2 marks)`,
        (t) => `What is the purpose of a finally block in ${t}? (2 marks)`,
        (t) => `How are arrays initialized in ${t}? (2 marks)`,
        (t) => `What is the concept of shadowing in ${t}? (2 marks)`,
        (t) => `Explain the difference between static and dynamic binding in ${t}. (2 marks)`,
        (t) => `What is the role of an iterator in ${t}? (2 marks)`,
        (t) => `How is logging configured in ${t}? (2 marks)`,
        (t) => `What are the common mathematical operations in ${t}? (2 marks)`,
        (t) => `Explain the concept of a singleton pattern in ${t}. (2 marks)`,
        (t) => `What is the purpose of a switch statement in ${t}? (2 marks)`,
        (t) => `How does ${t} support parallel processing? (2 marks)`,
        (t) => `What is the difference between a process and a thread in ${t}? (2 marks)`,
        (t) => `Explain the concept of a factory pattern in ${t}. (2 marks)`,
        (t) => `What is the role of interfaces in polymorphism in ${t}? (2 marks)`,
        (t) => `How is type safety ensured in ${t}? (2 marks)`,
        (t) => `What are the different types of collections in ${t}? (2 marks)`,
        (t) => `Explain the concept of dependency injection in ${t}. (2 marks)`,
        (t) => `What is the difference between a stack and a queue in ${t}? (2 marks)`,
        (t) => `How is recursion implemented in ${t}? (2 marks)`,
        (t) => `What is the purpose of a lambda expression in ${t}? (2 marks)`,
        (t) => `Explain the concept of stream processing in ${t}. (2 marks)`,
        (t) => `What are the differences between arrays and ArrayLists in ${t}? (2 marks)`,
        (t) => `How is the diamond operator used in ${t}? (2 marks)`,
      ];

      const mediumTemplates = [
        (t) => `Explain the core principles of ${t} with examples. (3 marks)`,
        (t) => `Compare and contrast the key features of ${t}. (3 marks)`,
        (t) => `Describe the architecture of ${t} with a neat diagram. (3 marks)`,
        (t) => `What are the advantages and disadvantages of ${t}? Explain with examples. (3 marks)`,
        (t) => `Explain the working mechanism of ${t} step by step. (3 marks)`,
        (t) => `Discuss the real-world applications of ${t}. (3 marks)`,
        (t) => `How does ${t} handle memory management? Explain. (3 marks)`,
        (t) => `Write the syntax and explain each part of ${t}. (3 marks)`,
        (t) => `Explain exception handling in ${t} with examples. (3 marks)`,
        (t) => `Discuss the different types of ${t} with suitable examples. (3 marks)`,
        (t) => `How is ${t} used in enterprise applications? (3 marks)`,
        (t) => `Explain the concept of threading in ${t}. (3 marks)`,
        (t) => `What are the SOLID principles and how do they relate to ${t}? (3 marks)`,
        (t) => `Discuss the role of ${t} in modern software development. (3 marks)`,
        (t) => `Explain garbage collection in ${t} with examples. (3 marks)`,
        (t) => `How does ${t} support multiple inheritance through interfaces? (3 marks)`,
        (t) => `Discuss the various data structures available in ${t} and their use cases. (3 marks)`,
        (t) => `Explain the concept of generics and type erasure in ${t}. (3 marks)`,
        (t) => `How does ${t} handle concurrent programming? Explain with examples. (3 marks)`,
        (t) => `Discuss the MVC architecture pattern in the context of ${t}. (3 marks)`,
        (t) => `Explain the differences between ${t} and its predecessor versions. (3 marks)`,
        (t) => `How is unit testing practiced in ${t}? Explain with a framework. (3 marks)`,
        (t) => `Discuss the role of design patterns in ${t} development. (3 marks)`,
        (t) => `Explain the concept of functional programming in ${t}. (3 marks)`,
        (t) => `How does ${t} handle database connectivity? Explain. (3 marks)`,
        (t) => `Discuss the security features built into ${t}. (3 marks)`,
        (t) => `Explain the concept of reflection in ${t} with examples. (3 marks)`,
        (t) => `How does ${t} manage class loading and initialization? (3 marks)`,
        (t) => `Discuss the differences between supervised and unsupervised learning in ${t}. (3 marks)`,
        (t) => `Explain the concept of microservices and how ${t} supports them. (3 marks)`,
        (t) => `How is logging and monitoring implemented in ${t} applications? (3 marks)`,
        (t) => `Discuss the various testing methodologies applicable to ${t}. (3 marks)`,
        (t) => `Explain the concept of dependency management in ${t}. (3 marks)`,
        (t) => `How does ${t} handle internationalization and localization? (3 marks)`,
        (t) => `Discuss the role of APIs in ${t} development. (3 marks)`,
        (t) => `Explain the concept of streams and pipelines in ${t}. (3 marks)`,
        (t) => `How does ${t} handle resource management? Explain with try-with-resources. (3 marks)`,
        (t) => `Discuss the concept of metaprogramming in ${t}. (3 marks)`,
        (t) => `Explain how ${t} supports asynchronous programming. (3 marks)`,
        (t) => `Discuss the evolution of ${t} over the years. (3 marks)`,
        (t) => `Explain the concept of modules and modularization in ${t}. (3 marks)`,
        (t) => `How does ${t} handle string processing and manipulation? (3 marks)`,
        (t) => `Discuss the role of immutable objects in ${t}. (3 marks)`,
        (t) => `Explain the concept of event-driven programming in ${t}. (3 marks)`,
        (t) => `How does ${t} support reactive programming? (3 marks)`,
        (t) => `Discuss the concept of serialization and deserialization in ${t}. (3 marks)`,
        (t) => `Explain how ${t} handles configuration management. (3 marks)`,
        (t) => `Discuss the various design principles followed in ${t}. (3 marks)`,
        (t) => `Explain the concept of lazy loading and eager loading in ${t}. (3 marks)`,
        (t) => `How does ${t} support RESTful web services? (3 marks)`,
        (t) => `Discuss the role of annotations/meta-programming in ${t}. (3 marks)`,
        (t) => `Explain the concept of class loaders in ${t}. (3 marks)`,
        (t) => `How does ${t} handle transactions? Explain. (3 marks)`,
        (t) => `Discuss the concept of aspect-oriented programming in ${t}. (3 marks)`,
        (t) => `Explain the differences between ${t} and Python. (3 marks)`,
        (t) => `How is connection pooling implemented in ${t}? (3 marks)`,
        (t) => `Discuss the concept of code generation in ${t}. (3 marks)`,
        (t) => `Explain the role of the classpath/modulepath in ${t}. (3 marks)`,
        (t) => `How does ${t} handle XML and JSON processing? (3 marks)`,
        (t) => `Discuss the concept of profiling and optimization in ${t}. (3 marks)`,
        (t) => `Explain the concept of functional interfaces in ${t}. (3 marks)`,
        (t) => `How does ${t} support networking? Explain with examples. (3 marks)`,
        (t) => `Discuss the concept of reactive streams in ${t}. (3 marks)`,
        (t) => `Explain the concept of virtual threads in ${t}. (3 marks)`,
        (t) => `How is memory profiling done in ${t}? (3 marks)`,
        (t) => `Discuss the role of ${t} in cloud-native development. (3 marks)`,
        (t) => `Explain the concept of structured concurrency in ${t}. (3 marks)`,
        (t) => `How does ${t} support pattern matching? (3 marks)`,
        (t) => `Discuss the concept of sealed classes in ${t}. (3 marks)`,
        (t) => `Explain how ${t} handles record types. (3 marks)`,
        (t) => `Discuss the evolution of the ${t} ecosystem. (3 marks)`,
        (t) => `Explain the concept of text blocks in ${t}. (3 marks)`,
        (t) => `How does ${t} support dynamic languages? (3 marks)`,
        (t) => `Discuss the concept of GraalVM and ${t}. (3 marks)`,
        (t) => `Explain the concept of strong and weak references in ${t}. (3 marks)`,
        (t) => `How is process management done in ${t}? (3 marks)`,
        (t) => `Discuss the concept of sandboxing in ${t}. (3 marks)`,
        (t) => `Explain the differences between ${t} and C++. (3 marks)`,
        (t) => `How does ${t} support native compilation? (3 marks)`,
        (t) => `Discuss the role of ${t} in IoT applications. (3 marks)`,
        (t) => `Explain the concept of modules in ${t} (JPMS). (3 marks)`,
        (t) => `How is performance tuning done in ${t} applications? (3 marks)`,
        (t) => `Discuss the concept of ahead-of-time compilation in ${t}. (3 marks)`,
        (t) => `Explain the concept of records in ${t}. (3 marks)`,
        (t) => `How does ${t} support multi-platform development? (3 marks)`,
        (t) => `Discuss the concept of value types in ${t}. (3 marks)`,
        (t) => `Explain the differences between ${t} and Go. (3 marks)`,
        (t) => `How is application monitoring done in ${t}? (3 marks)`,
        (t) => `Discuss the concept of observability in ${t} applications. (3 marks)`,
        (t) => `Explain the concept of feature flags in ${t}. (3 marks)`,
        (t) => `How does ${t} support WebSocket communication? (3 marks)`,
        (t) => `Discuss the concept of circuit breakers in ${t}. (3 marks)`,
        (t) => `Explain the concept of data classes in ${t}. (3 marks)`,
        (t) => `How is configuration injection done in ${t}? (3 marks)`,
      ];

      const longTemplates = [
        (t) => `Explain ${t} in detail with its history, features, and applications. (5 marks)`,
        (t) => `Discuss the complete lifecycle of ${t} with diagrams and examples. (5 marks)`,
        (t) => `Compare ${t} with at least two alternatives. Provide detailed analysis. (5 marks)`,
        (t) => `Write a comprehensive essay on the evolution of ${t}. (5 marks)`,
        (t) => `Explain the internal architecture of ${t} with a detailed diagram. (5 marks)`,
        (t) => `Discuss the best practices and design patterns used in ${t}. (5 marks)`,
        (t) => `How does ${t} handle concurrency? Explain with detailed examples. (5 marks)`,
        (t) => `Explain the complete memory model of ${t} with diagrams. (5 marks)`,
        (t) => `Discuss the future trends and developments in ${t}. (5 marks)`,
        (t) => `Write a detailed comparison of ${t} across different programming languages. (5 marks)`,
        (t) => `Explain the role of ${t} in building scalable applications. (5 marks)`,
        (t) => `Discuss security considerations and best practices in ${t}. (5 marks)`,
        (t) => `How is ${t} used in industry? Discuss with case studies. (5 marks)`,
        (t) => `Explain the testing strategies for ${t}-based applications. (5 marks)`,
        (t) => `Discuss the impact of ${t} on modern software engineering. (5 marks)`,
        (t) => `Explain the complete OOP implementation in ${t} with real-world examples. (5 marks)`,
        (t) => `How does ${t} handle error recovery and resilience? Provide a detailed essay. (5 marks)`,
        (t) => `Discuss the complete networking stack in ${t} with examples. (5 marks)`,
        (t) => `Explain the database integration capabilities of ${t} in detail. (5 marks)`,
        (t) => `How does ${t} support enterprise-level application development? Discuss. (5 marks)`,
        (t) => `Write a detailed analysis of performance optimization techniques in ${t}. (5 marks)`,
        (t) => `Discuss the complete CI/CD pipeline setup for ${t} applications. (5 marks)`,
        (t) => `Explain the microservices architecture implementation in ${t}. (5 marks)`,
        (t) => `How does ${t} handle big data processing? Discuss with frameworks. (5 marks)`,
        (t) => `Write a comprehensive guide to deployment strategies for ${t}. (5 marks)`,
        (t) => `Discuss the complete ecosystem of tools and libraries around ${t}. (5 marks)`,
        (t) => `Explain the concept of reactive programming in ${t} in detail. (5 marks)`,
        (t) => `How does ${t} support machine learning integration? Discuss. (5 marks)`,
        (t) => `Write a detailed essay on ${t} for web application development. (5 marks)`,
        (t) => `Discuss the complete authentication and authorization system in ${t}. (5 marks)`,
        (t) => `Explain the event-driven architecture in ${t} with detailed examples. (5 marks)`,
        (t) => `How does ${t} handle internationalization at scale? Discuss. (5 marks)`,
        (t) => `Write a detailed comparison of ${t} frameworks and their use cases. (5 marks)`,
        (t) => `Discuss the complete build and dependency management system in ${t}. (5 marks)`,
        (t) => `Explain the role of ${t} in distributed systems. (5 marks)`,
        (t) => `How does ${t} handle real-time data processing? Discuss. (5 marks)`,
        (t) => `Write a detailed analysis of ${t}'s garbage collection algorithms. (5 marks)`,
        (t) => `Discuss the complete security framework for ${t} applications. (5 marks)`,
        (t) => `Explain the concept of zero-downtime deployment in ${t}. (5 marks)`,
        (t) => `How does ${t} support containerization and orchestration? Discuss. (5 marks)`,
        (t) => `Write a comprehensive essay on ${t} performance monitoring tools. (5 marks)`,
        (t) => `Discuss the complete API design patterns in ${t}. (5 marks)`,
        (t) => `Explain the migration strategies from legacy systems to ${t}. (5 marks)`,
        (t) => `How does ${t} handle multi-tenancy? Discuss with architecture. (5 marks)`,
        (t) => `Write a detailed essay on ${t} code quality and maintenance. (5 marks)`,
        (t) => `Discuss the complete caching strategies for ${t} applications. (5 marks)`,
        (t) => `Explain the concept of domain-driven design in ${t}. (5 marks)`,
        (t) => `How does ${t} support event sourcing and CQRS? Discuss. (5 marks)`,
        (t) => `Write a detailed analysis of ${t} memory management internals. (5 marks)`,
        (t) => `Discuss the complete logging and tracing strategy for ${t}. (5 marks)`,
        (t) => `Explain the concept of chaos engineering in ${t} systems. (5 marks)`,
        (t) => `How does ${t} handle GraphQL integration? Discuss with examples. (5 marks)`,
        (t) => `Write a comprehensive guide to ${t} for mobile development. (5 marks)`,
        (t) => `Discuss the complete DevOps practices for ${t} projects. (5 marks)`,
        (t) => `Explain the concept of server-side rendering in ${t}. (5 marks)`,
        (t) => `How does ${t} support edge computing? Discuss. (5 marks)`,
        (t) => `Write a detailed essay on ${t} in the context of digital transformation. (5 marks)`,
        (t) => `Discuss the complete data pipeline architecture in ${t}. (5 marks)`,
        (t) => `Explain the role of ${t} in artificial intelligence applications. (5 marks)`,
        (t) => `How does ${t} handle multi-region deployment? Discuss. (5 marks)`,
        (t) => `Write a detailed analysis of ${t} startup time optimization. (5 marks)`,
        (t) => `Discuss the complete monitoring and alerting setup for ${t}. (5 marks)`,
        (t) => `Explain the concept of blue-green deployment in ${t}. (5 marks)`,
        (t) => `How does ${t} support progressive web applications? Discuss. (5 marks)`,
        (t) => `Write a comprehensive essay on ${t} for financial technology. (5 marks)`,
        (t) => `Discuss the complete data migration strategies for ${t}. (5 marks)`,
        (t) => `Explain the role of ${t} in blockchain integration. (5 marks)`,
        (t) => `How does ${t} handle canary releases? Discuss with architecture. (5 marks)`,
        (t) => `Write a detailed analysis of ${t} thread pool management. (5 marks)`,
        (t) => `Discuss the complete backup and disaster recovery plan for ${t}. (5 marks)`,
        (t) => `Explain the concept of feature toggles in ${t} development. (5 marks)`,
        (t) => `How does ${t} support edge rendering? Discuss. (5 marks)`,
        (t) => `Write a comprehensive guide to ${t} for educational technology. (5 marks)`,
        (t) => `Discuss the complete rate limiting implementation in ${t}. (5 marks)`,
        (t) => `Explain the role of ${t} in healthcare software. (5 marks)`,
        (t) => `How does ${t} handle A/B testing? Discuss with examples. (5 marks)`,
        (t) => `Write a detailed essay on ${t} scalability patterns. (5 marks)`,
        (t) => `Discuss the complete versioning strategy for ${t} APIs. (5 marks)`,
        (t) => `Explain the concept of sidecar pattern in ${t}. (5 marks)`,
        (t) => `How does ${t} support progressive enhancement? Discuss. (5 marks)`,
        (t) => `Write a comprehensive analysis of ${t} in space technology. (5 marks)`,
        (t) => `Discuss the complete audit logging system for ${t} applications. (5 marks)`,
        (t) => `Explain the role of ${t} in game server development. (5 marks)`,
        (t) => `How does ${t} handle blue-green database migrations? Discuss. (5 marks)`,
        (t) => `Write a detailed essay on ${t} for enterprise integration. (5 marks)`,
        (t) => `Discuss the complete performance benchmarking methodology for ${t}. (5 marks)`,
        (t) => `Explain the concept of cell-based architecture in ${t}. (5 marks)`,
      ];

      // MCQ templates return { text, answer } objects; others return strings
      function buildMCQPool(templates) {
        return templates.map(t => ({ text: t.text(topic), answer: t.answer }));
      }
      function buildTextPool(templates) {
        return templates.map(fn => fn(topic));
      }

      const mcqPool = buildMCQPool(mcqTemplates);
      const pools = {
        mcq: mcqPool,
        '1liner': buildTextPool(linerTemplates),
        '2marker': buildTextPool(shortTemplates),
        '3marker': buildTextPool(mediumTemplates),
        '5marker': buildTextPool(longTemplates),
        // Mixed items are tagged with their real type so parsing/badging stays honest
        mixed: [
          ...mcqPool.map(o => ({ ...o, kind: 'mcq' })),
          ...linerTemplates.map(fn => ({ text: fn(topic), kind: '1liner' })),
          ...shortTemplates.map(fn => ({ text: fn(topic), kind: '2marker' })),
          ...mediumTemplates.map(fn => ({ text: fn(topic), kind: '3marker' })),
          ...longTemplates.map(fn => ({ text: fn(topic), kind: '5marker' })),
        ],
      };

      const pool = pools[type] || pools.mixed;
      const shuffled = shuffle(pool);
      // Cycle through the pool if requested count exceeds pool size
      const questions = [];
      for (let i = 0; i < n; i++) {
        questions.push(shuffled[i % shuffled.length]);
      }

      // For MCQ types, return objects with text + answer; for others, return plain strings
      if (type === 'mcq' || type === 'mixed') {
        return questions;
      }
      return questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    }

    const generatedQuestions = generateQuestions(topic, questionType, count);

    // ===== Parsing =====
    const TYPE_MARKS = { '1liner': 1, '2marker': 2, '3marker': 3, '5marker': 5 };

    // Parse a single MCQ line. Options are located by their " (A)".." (D)" markers so
    // option text may itself contain parentheses (e.g. "O(1)", "O(log n)").
    function parseMCQLine(line, templateAnswer, topic, i) {
      const cleaned = String(line || '').replace(/^\d+\.\s*/, '').trim();
      const markers = [...cleaned.matchAll(/\s\(([A-D])\)/g)];
      const options = markers.map((m, mi) => {
        const from = m.index + m[0].length;
        const to = mi + 1 < markers.length ? markers[mi + 1].index : cleaned.length;
        return { letter: m[1], text: cleaned.slice(from, to).trim() };
      });
      let questionText = markers.length > 0 ? cleaned.slice(0, markers[0].index).trim() : cleaned;
      if (!questionText) questionText = cleaned;
      const correctAnswer = templateAnswer || (options.length > 0 ? options[0].letter : 'A');
      return { id: `ai-${Date.now()}-${i}`, question: questionText, options, topic: topic, correctAnswer, source: 'AI', type: 'mcq', marks: 1 };
    }

    function parseMCQQuestions(rawItems, topic) {
      return rawItems.map((item, i) =>
        parseMCQLine(typeof item === 'object' ? item.text : item, typeof item === 'object' ? item.answer : null, topic, i)
      );
    }

    function parseTextItem(line, qType, i) {
      const text = String(line || '').replace(/^\d+\.\s*/, '').trim();
      return {
        id: `ai-${Date.now()}-${i}`,
        text,
        question: text,
        source: 'AI',
        type: qType,
        marks: TYPE_MARKS[qType] || 1,
        options: [],
        correctAnswer: null,
      };
    }

    function parseTextQuestions(raw, qType) {
      return String(raw || '').split('\n').filter(l => l.trim()).map((line, i) => parseTextItem(line, qType, i));
    }

    // Mixed batches carry each item's real type via `kind`
    function parseMixedQuestions(rawItems, topic) {
      return rawItems.map((item, i) => {
        if (typeof item === 'object' && item.kind === 'mcq') return parseMCQLine(item.text, item.answer, topic, i);
        const kind = (item && item.kind) || '1liner';
        return parseTextItem(typeof item === 'object' ? item.text : item, kind, i);
      });
    }

    let parsed = [];
    if (questionType === 'mcq') {
      parsed = parseMCQQuestions(generatedQuestions, topic);
    } else if (questionType === 'mixed') {
      parsed = parseMixedQuestions(generatedQuestions, topic);
    } else {
      parsed = parseTextQuestions(generatedQuestions, questionType);
    }
    setParsedQuestions(parsed);
    // Add generated questions to the Question Bank (deduplicate by question text)
    setQuestionBank(prev => {
      const existingTexts = new Set(prev.map(q => (q.question || q.text || '').toLowerCase().trim()));
      const newQs = parsed.filter(q => {
        const txt = (q.question || q.text || '').toLowerCase().trim();
        return txt && !existingTexts.has(txt);
      });
      return [...prev, ...newQs];
    });
    setCurrentPage(0);
    setAnswers({});
    setShowResult(false);
    setGeneratedTopic(topic);

    // For text response, convert array to readable string
    let questionsText;
    if (Array.isArray(generatedQuestions)) {
      questionsText = generatedQuestions.map((q, i) => `${i + 1}. ${typeof q === 'object' ? q.text : q}`).join('\n');
    } else {
      questionsText = generatedQuestions;
    }

    const responses = {
      assistant: "I can help you with that! Here are some teaching strategies for your topic:\n\n1. **Active Learning**: Incorporate hands-on exercises\n2. **Scaffolding**: Break complex topics into smaller parts\n3. **Real-world Examples**: Connect theory to practical applications\n4. **Peer Learning**: Encourage group discussions and pair programming",
      questions: `Here are **${count}** generated **${typeLabel}** questions for **"${topic}"**:\n\n${questionsText}`,
      recommendations: "Based on your course analytics:\n\n📊 **Content Gaps**: Students struggle with recursion concepts\n✅ **Strength**: High engagement with video content\n💡 **Suggestion**: Add more interactive coding exercises\n📚 **Resource**: Consider adding a section on design patterns",
      planner: "Here's a suggested lesson plan for your topic:\n\n**Duration**: 60 minutes\n\n⏰ 0-10 min: Introduction & Learning Objectives\n⏰ 10-25 min: Core Concepts with Examples\n⏰ 25-40 min: Hands-on Coding Exercise\n⏰ 40-50 min: Q&A and Discussion\n⏰ 50-60 min: Summary & Assignment Brief",
      content: "Suggested supplementary materials:\n\n📖 **Articles**: Best Practices for Clean Code\n🎥 **Videos**: Data Structures Visualized playlist\n🔧 **Tools**: Interactive code playground\n📝 **Worksheets**: Practice problems with solutions\n🎮 **Activities**: Coding challenges and competitions",
    };

    // Handle question paper generation
    if (questionType === 'questionpaper') {
      const cfg = { ...paperConfig, subject: paperConfig.subject || topic };
      const paperTopic = cfg.subject || topic;

      // Question templates by type
      const templatePools = {
        mcq: [
          (t) => ({ question: `What is a key feature of ${t}?`, options: ['Encapsulation', 'Inheritance', 'Polymorphism', 'All of the above'], answer: 'D' }),
          (t) => ({ question: `Which of the following best describes ${t}?`, options: ['A programming language', 'A software design principle', 'A data structure', 'An operating system'], answer: 'A' }),
          (t) => ({ question: `What is the primary benefit of using ${t}?`, options: ['Faster execution', 'Better readability', 'Improved maintainability', 'All of the above'], answer: 'D' }),
          (t) => ({ question: `What does ${t} primarily focus on?`, options: ['Data storage', 'Problem solving', 'User interface', 'Network security'], answer: 'B' }),
          (t) => ({ question: `In ${t}, which approach is commonly used?`, options: ['Top-down', 'Bottom-up', 'Both A and B', 'Neither A nor B'], answer: 'C' }),
          (t) => ({ question: `What is the role of the compiler in ${t}?`, options: ['Debugging', 'Translation', 'Memory allocation', 'File management'], answer: 'B' }),
          (t) => ({ question: `What is garbage collection in ${t}?`, options: ['Manual memory cleanup', 'Automatic memory management', 'File deletion', 'Process termination'], answer: 'B' }),
          (t) => ({ question: `Which access modifier provides the widest visibility in ${t}?`, options: ['private', 'protected', 'public', 'default'], answer: 'C' }),
          (t) => ({ question: `What is inheritance in ${t}?`, options: ['Code reuse mechanism', 'Memory allocation', 'Error handling', 'File system'], answer: 'A' }),
          (t) => ({ question: `What is polymorphism in ${t}?`, options: ['Many forms of data', 'Same interface, different implementations', 'Multiple inheritance', 'Runtime errors'], answer: 'B' }),
          (t) => ({ question: `What is a constructor in ${t}?`, options: ['Initialize objects', 'Destroy objects', 'Allocate memory', 'Compile code'], answer: 'A' }),
          (t) => ({ question: `What is recursion in ${t}?`, options: ['Function calling itself', 'Loop iteration', 'Memory allocation', 'File reading'], answer: 'A' }),
          (t) => ({ question: `What is a pointer in ${t}?`, options: ['Variable storing memory address', 'Data type', 'Loop', 'Function'], answer: 'A' }),
          (t) => ({ question: `What is an array in ${t}?`, options: ['Collection of same-type elements', 'Collection of different-type elements', 'Single variable', 'Function'], answer: 'A' }),
          (t) => ({ question: `What is a stack in ${t}?`, options: ['LIFO data structure', 'FIFO data structure', 'Tree', 'Graph'], answer: 'A' }),
        ],
        '1liner': [
          (t) => `Define ${t} in one sentence.`,
          (t) => `What is the main purpose of ${t}?`,
          (t) => `Name one real-world application of ${t}.`,
          (t) => `What does ${t} stand for?`,
          (t) => `List one advantage of ${t}.`,
          (t) => `What is the time complexity of ${t} operations?`,
          (t) => `Name the creator of ${t}.`,
          (t) => `How does ${t} improve efficiency?`,
          (t) => `What is the input/output model of ${t}?`,
          (t) => `Which language supports ${t} natively?`,
          (t) => `What is the memory model used in ${t}?`,
          (t) => `Name one design pattern used with ${t}.`,
          (t) => `What is the return type of ${t} methods?`,
          (t) => `How is ${t} tested?`,
          (t) => `What is the latest version of ${t}?`,
        ],
        '2marker': [
          (t) => `Explain the concept of ${t} with a suitable example.`,
          (t) => `Differentiate between two main approaches in ${t}.`,
          (t) => `What are the prerequisites for learning ${t}?`,
          (t) => `Describe the basic structure used in ${t}.`,
          (t) => `List and explain two features of ${t}.`,
          (t) => `What is the difference between ${t} and its alternative?`,
          (t) => `Explain method overriding in the context of ${t}.`,
          (t) => `What are access modifiers in ${t}?`,
          (t) => `How does ${t} handle null values?`,
          (t) => `What are the four pillars of OOP in ${t}?`,
          (t) => `How is string manipulation done in ${t}?`,
          (t) => `What are the built-in data types in ${t}?`,
        ],
        '3marker': [
          (t) => `Explain the core principles of ${t} with examples.`,
          (t) => `Compare and contrast the key features of ${t}.`,
          (t) => `Describe the architecture of ${t} with a neat diagram.`,
          (t) => `What are the advantages and disadvantages of ${t}? Explain with examples.`,
          (t) => `Explain the working mechanism of ${t} step by step.`,
          (t) => `Discuss the real-world applications of ${t}.`,
          (t) => `How does ${t} handle memory management? Explain.`,
          (t) => `Explain exception handling in ${t} with examples.`,
          (t) => `What are the SOLID principles and how do they relate to ${t}?`,
          (t) => `Discuss the role of ${t} in modern software development.`,
          (t) => `Explain garbage collection in ${t} with examples.`,
          (t) => `How does ${t} handle concurrent programming? Explain with examples.`,
        ],
        '5marker': [
          (t) => `Explain ${t} in detail with its history, features, and applications.`,
          (t) => `Discuss the complete lifecycle of ${t} with diagrams and examples.`,
          (t) => `Compare ${t} with at least two alternatives. Provide detailed analysis.`,
          (t) => `Explain the internal architecture of ${t} with a detailed diagram.`,
          (t) => `Discuss the best practices and design patterns used in ${t}.`,
          (t) => `How does ${t} handle concurrency? Explain with detailed examples.`,
          (t) => `Explain the complete memory model of ${t} with diagrams.`,
          (t) => `Discuss the future trends and developments in ${t}.`,
          (t) => `Write a detailed comparison of ${t} across different programming languages.`,
          (t) => `Explain the role of ${t} in building scalable applications.`,
          (t) => `Discuss security considerations and best practices in ${t}.`,
          (t) => `How is ${t} used in industry? Discuss with case studies.`,
        ],
      };

      function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }

      // Generate questions for each section based on its questionGroups
      let globalQNum = 0;
      const generatedSections = cfg.sections.map((sec, sIdx) => {
        const allQuestions = [];

        // 1) Add instructor-selected questions from the Question Bank
        const assignedIds = sectionAssignments[sIdx] || [];
        assignedIds.forEach(qId => {
          const q = questionBank.find(bq => bq.id === qId);
          if (q) {
            globalQNum++;
            allQuestions.push({
              num: globalQNum,
              text: q.text || q.question,
              options: q.options && q.options.length ? q.options : null,
              answer: q.correctAnswer || null,
              marks: q.marks,
              type: q.type,
              orChoice: null,
              source: q.source,
            });
          }
        });

        // 2) Generate AI questions to fill remaining slots
        sec.questionGroups.forEach((group) => {
          // Count how many of this type are already assigned from the bank
          const alreadyAssigned = allQuestions.filter(q => q.type === group.questionType).length;
          const remaining = Math.max(0, group.numberOfQuestions - alreadyAssigned);
          const pool = templatePools[group.questionType] || templatePools['1liner'];
          const shuffled = shuffle(pool);
          for (let i = 0; i < remaining; i++) {
            globalQNum++;
            const template = shuffled[i % shuffled.length];
            const raw = template(paperTopic);
            if (group.questionType === 'mcq' && typeof raw === 'object') {
              allQuestions.push({ num: globalQNum, text: raw.question, options: raw.options, answer: raw.answer, marks: group.marksPerQuestion, type: group.questionType, orChoice: null, source: 'AI' });
            } else {
              const text = typeof raw === 'string' ? raw : raw.question;
              let orText = null;
              if (sec.orChoice && i % 3 === 1) {
                const orTemplate = shuffled[(i + 3) % shuffled.length];
                const orRaw = orTemplate(paperTopic);
                orText = typeof orRaw === 'string' ? orRaw : orRaw.question;
              }
              allQuestions.push({ num: globalQNum, text, options: null, answer: null, marks: group.marksPerQuestion, type: group.questionType, orChoice: orText, source: 'AI' });
            }
          }
        });
        const sectionTotal = allQuestions.reduce((s, q) => s + q.marks, 0);
        return {
          name: sec.name,
          instructions: sec.instructions,
          total: sectionTotal,
          questions: allQuestions,
        };
      });

      const totalQuestions = globalQNum;
      const totalMarks = generatedSections.reduce((s, sec) => s + sec.total, 0);

      // Add paper-generated questions to the Question Bank (deduplicate by text)
      const allPaperQs = [];
      generatedSections.forEach(sec => {
        sec.questions.forEach(q => {
          allPaperQs.push({
            id: `paper-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            question: q.text,
            text: q.text,
            type: q.type || 'mcq',
            marks: q.marks,
            source: 'AI',
            options: q.options || [],
            correctAnswer: q.answer || null,
          });
        });
      });
      setQuestionBank(prev => {
        const existingTexts = new Set(prev.map(q => (q.question || q.text || '').toLowerCase().trim()));
        const newQs = allPaperQs.filter(q => {
          const txt = (q.question || q.text || '').toLowerCase().trim();
          return txt && !existingTexts.has(txt);
        });
        return [...prev, ...newQs];
      });

      setPaperData({
        title: cfg.title || 'Examination Paper',
        subject: cfg.subject || paperTopic,
        duration: cfg.duration,
        maxMarks: cfg.maxMarks,
        difficulty: cfg.difficulty,
        totalQuestions,
        totalMarks,
        sections: generatedSections,
      });
      setPaperGenerated(true);
      setLoading(false);
      return;
    }

    setResponse(responses[activeTool.id] || "AI response generated successfully!");
    setLoading(false);
  };

  // Upload the generated question paper to the Exams section
  async function handleUploadToExam() {
    if (!paperData || uploadingPaper || paperUploaded) return;
    try {
      setUploadingPaper(true);
      // Parse duration like "3 Hours" / "90 Minutes" / "180" into minutes
      const durationStr = String(paperData.duration || "");
      const hours = durationStr.match(/([\d.]+)\s*hour/i);
      const mins = durationStr.match(/([\d.]+)\s*min/i);
      let durationMinutes = 60;
      if (hours) durationMinutes = Math.round(parseFloat(hours[1]) * 60);
      else if (mins) durationMinutes = Math.round(parseFloat(mins[1]));
      else {
        const n = parseFloat(durationStr);
        if (Number.isFinite(n)) durationMinutes = n <= 12 ? Math.round(n * 60) : Math.round(n);
      }
      const totalMarks = Number(paperData.totalMarks) || 100;
      await api.instructorCreateExam({
        title: paperData.title || "Examination Paper",
        description: `${paperData.subject ? paperData.subject + " — " : ""}${paperData.totalQuestions} questions, ${totalMarks} marks, Duration: ${paperData.duration}, Difficulty: ${paperData.difficulty}`,
        durationMinutes,
        totalMarks,
        passingMarks: Math.max(1, Math.round(totalMarks * 0.4)),
        questionPaper: JSON.stringify(paperData),
      });
      setPaperUploaded(true);
      alert("✅ Question paper uploaded to the Exams section!");
    } catch (err) {
      alert("Upload failed: " + (err?.message || "Unknown error") + "\n\nMake sure the backend server (port 8080) is running, then try again.");
    } finally {
      setUploadingPaper(false);
    }
  }

  // Quiz derived stats — the quiz now shows ALL generated questions, not just MCQs
  const quizTotal = parsedQuestions.length;
  const quizGraded = parsedQuestions.filter(q => q.options && q.options.length > 0);
  const quizAnswered = parsedQuestions.filter(q => {
    const a = answers[q.id];
    return a !== undefined && String(a).trim() !== '';
  }).length;

  return (
    <InstructorPage icon="🤖" title="AI Tools" subtitle="Leverage AI to enhance your teaching experience">
      <div className="inst-content">
        {!activeTool ? (
          <div className="inst-ai-grid">
            {AI_TOOLS.map((tool) => (
              <div
                key={tool.id}
                className="inst-ai-card"
                onClick={() => setActiveTool(tool)}
              >
                <div className="inst-ai-card-icon" style={{ background: `${tool.color}15`, color: tool.color }}>
                  {tool.icon}
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.desc}</p>
                <span className="inst-ai-card-arrow">→</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="inst-ai-active">
            <div className="inst-ai-active-header">
              <button className="inst-btn inst-btn-outline" onClick={() => { setActiveTool(null); setInput(""); setResponse(""); }}>
                ← Back to Tools
              </button>
              <h3>{activeTool.icon} {activeTool.title}</h3>
            </div>

            <div className="inst-ai-input-area">
              {activeTool.id === "questions" && (
                <>
                  <div className="question-type-selector">
                    <label className="question-type-label">Question Type</label>
                    <div className="question-type-chips">
                      {QUESTION_TYPES.map((type) => (
                        <button
                          key={type.id}
                          className={`question-type-chip ${questionType === type.id ? "active" : ""}`}
                          onClick={() => setQuestionType(type.id)}
                          title={type.desc}
                        >
                          <span className="chip-icon">{type.icon}</span>
                          <span className="chip-label">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {questionType !== 'questionpaper' && (
                    <div className="question-count-selector">
                      <label className="question-type-label">Question Count</label>
                      <div className="question-count-chips">
                        {QUESTION_COUNTS.map((count) => (
                          <button
                            key={count}
                            className={`question-count-chip ${questionCount === count ? "active" : ""}`}
                            onClick={() => setQuestionCount(count)}
                          >
                            {count} Qs
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {questionType === 'questionpaper' ? (
                <div className="paper-config-form">
                  <div className="paper-config-grid">
                    <div className="paper-config-field">
                      <label>Exam Title</label>
                      <input type="text" value={paperConfig.title} onChange={(e) => setPaperConfig(p => ({ ...p, title: e.target.value }))} placeholder="e.g. End Semester Examination" />
                    </div>
                    <div className="paper-config-field">
                      <label>Subject / Topic</label>
                      <input type="text" value={paperConfig.subject} onChange={(e) => setPaperConfig(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Java Programming" />
                    </div>
                    <div className="paper-config-field">
                      <label>Duration</label>
                      <select value={paperConfig.duration} onChange={(e) => setPaperConfig(p => ({ ...p, duration: e.target.value }))}>
                        <option>1 Hour</option><option>1.5 Hours</option><option>2 Hours</option><option>2.5 Hours</option><option>3 Hours</option><option>3.5 Hours</option>
                      </select>
                    </div>
                    <div className="paper-config-field">
                      <label>Maximum Marks</label>
                      <input type="number" min={10} max={500} value={paperConfig.maxMarks} onChange={(e) => setPaperConfig(p => ({ ...p, maxMarks: Number(e.target.value) }))} />
                    </div>
                    <div className="paper-config-field">
                      <label>Difficulty</label>
                      <select value={paperConfig.difficulty} onChange={(e) => setPaperConfig(p => ({ ...p, difficulty: e.target.value }))}>
                        <option>Easy</option><option>Medium</option><option>Hard</option><option>Mixed</option>
                      </select>
                    </div>
                  </div>

                  <div className="paper-sections-header">
                    <span>Sections</span>
                    <button className="paper-add-section-btn" onClick={() => {
                      const names = ['Section A','Section B','Section C','Section D','Section E','Section F','Section G','Section H'];
                      const usedNames = paperConfig.sections.map(s => s.name);
                      const nextName = names.find(n => !usedNames.includes(n)) || `Section ${paperConfig.sections.length + 1}`;
                      setPaperConfig(p => ({ ...p, sections: [...p.sections, defaultSection(nextName)] }));
                    }}>+ Add Section</button>
                  </div>

                  <div className="paper-sections-list">
                    {paperConfig.sections.map((section, idx) => {
                      const sectionTotal = section.questionGroups.reduce((s, g) => s + g.numberOfQuestions * g.marksPerQuestion, 0);
                      const sectionQCount = section.questionGroups.reduce((s, g) => s + g.numberOfQuestions, 0);
                      return (
                        <div key={idx} className="paper-section-card">
                          <div className="paper-section-card-header">
                            <input className="paper-section-name-input" type="text" value={section.name} onChange={(e) => {
                              const secs = [...paperConfig.sections];
                              secs[idx] = { ...secs[idx], name: e.target.value };
                              setPaperConfig(p => ({ ...p, sections: secs }));
                            }} />
                            {paperConfig.sections.length > 1 && (
                              <button className="paper-delete-section-btn" onClick={() => {
                                setPaperConfig(p => ({ ...p, sections: p.sections.filter((_, i) => i !== idx) }));
                              }} title="Delete section">✕</button>
                            )}
                          </div>

                          {/* Question Groups */}
                          <div className="paper-section-groups">
                            {section.questionGroups.map((group, gIdx) => (
                              <div key={group.id} className="paper-section-group-row">
                                <div className="paper-section-card-field">
                                  <label>Question Type</label>
                                  <select value={group.questionType} onChange={(e) => {
                                    const secs = [...paperConfig.sections];
                                    const groups = [...secs[idx].questionGroups];
                                    const newType = e.target.value;
                                    const defaultM = PAPER_SECTION_TYPES.find(t => t.id === newType);
                                    groups[gIdx] = { ...groups[gIdx], questionType: newType, marksPerQuestion: defaultM ? defaultM.defaultMarks : 1 };
                                    secs[idx] = { ...secs[idx], questionGroups: groups };
                                    setPaperConfig(p => ({ ...p, sections: secs }));
                                  }}>
                                    {PAPER_SECTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                  </select>
                                </div>
                                <div className="paper-section-card-field">
                                  <label>Number of Questions</label>
                                  <input type="number" min={1} max={50} value={group.numberOfQuestions} onChange={(e) => {
                                    const secs = [...paperConfig.sections];
                                    const groups = [...secs[idx].questionGroups];
                                    groups[gIdx] = { ...groups[gIdx], numberOfQuestions: Math.max(1, Number(e.target.value)) };
                                    secs[idx] = { ...secs[idx], questionGroups: groups };
                                    setPaperConfig(p => ({ ...p, sections: secs }));
                                  }} />
                                </div>
                                <div className="paper-section-card-field">
                                  <label>Marks per Question</label>
                                  <input type="number" min={1} max={25} value={group.marksPerQuestion} onChange={(e) => {
                                    const secs = [...paperConfig.sections];
                                    const groups = [...secs[idx].questionGroups];
                                    groups[gIdx] = { ...groups[gIdx], marksPerQuestion: Math.max(1, Number(e.target.value)) };
                                    secs[idx] = { ...secs[idx], questionGroups: groups };
                                    setPaperConfig(p => ({ ...p, sections: secs }));
                                  }} />
                                </div>
                                <span className="paper-group-total">{group.numberOfQuestions} × {group.marksPerQuestion} = <strong>{group.numberOfQuestions * group.marksPerQuestion}</strong> marks</span>
                                {section.questionGroups.length > 1 && (
                                  <button className="paper-delete-group-btn" onClick={() => {
                                    const secs = [...paperConfig.sections];
                                    const groups = secs[idx].questionGroups.filter((_, i) => i !== gIdx);
                                    secs[idx] = { ...secs[idx], questionGroups: groups };
                                    setPaperConfig(p => ({ ...p, sections: secs }));
                                  }} title="Remove question type">✕</button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Add Question Type button */}
                          <button className="paper-add-group-btn" onClick={() => {
                            const secs = [...paperConfig.sections];
                            const existingTypes = secs[idx].questionGroups.map(g => g.questionType);
                            const nextType = PAPER_SECTION_TYPES.find(t => !existingTypes.includes(t.id));
                            if (nextType) {
                              secs[idx] = { ...secs[idx], questionGroups: [...secs[idx].questionGroups, defaultGroup(nextType.id)] };
                              setPaperConfig(p => ({ ...p, sections: secs }));
                            }
                          }} disabled={section.questionGroups.length >= PAPER_SECTION_TYPES.length}>+ Add Question Type</button>

                          {/* Section-level fields */}
                          <div className="paper-section-card-fields paper-section-meta-row">
                            <div className="paper-section-card-field paper-section-card-field-wide">
                              <label>Instructions (optional)</label>
                              <input type="text" value={section.instructions} placeholder="e.g. Answer all questions" onChange={(e) => {
                                const secs = [...paperConfig.sections];
                                secs[idx] = { ...secs[idx], instructions: e.target.value };
                                setPaperConfig(p => ({ ...p, sections: secs }));
                              }} />
                            </div>
                            <div className="paper-section-card-field paper-section-card-checkbox">
                              <label>
                                <input type="checkbox" checked={section.orChoice} onChange={(e) => {
                                  const secs = [...paperConfig.sections];
                                  secs[idx] = { ...secs[idx], orChoice: e.target.checked };
                                  setPaperConfig(p => ({ ...p, sections: secs }));
                                }} />
                                Include OR choice
                              </label>
                            </div>
                          </div>

                          <div className="paper-section-card-footer">
                            <span>{sectionQCount} questions = <strong>{sectionTotal} marks</strong></span>
                            <div className="paper-section-card-actions">
                              <button className="qb-select-btn" onClick={() => {
                                // Auto-filter picker by the section's first question group type
                                const firstType = section.questionGroups[0]?.questionType || 'all';
                                setPickerTypeFilter(firstType);
                                setPickerSearch('');
                                setShowSectionPicker(idx);
                              }}>📋 Select Questions</button>
                              <button className="qb-add-btn" onClick={() => {
                                const firstType = section.questionGroups[0]?.questionType || 'mcq';
                                const defaultM = PAPER_SECTION_TYPES.find(t => t.id === firstType);
                                setSectionManualForm({ type: firstType, text: '', marks: defaultM ? defaultM.defaultMarks : 1, options: ['', '', '', ''], correctAnswer: 'A' });
                                setShowSectionManualForm(idx);
                              }}>✍ Add Manual Question</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="paper-total-marks">
                    <span>TOTAL QUESTIONS: {paperConfig.sections.reduce((s, sec) => s + sec.questionGroups.reduce((gs, g) => gs + g.numberOfQuestions, 0), 0)}</span>
                    <span>TOTAL MARKS: {paperConfig.sections.reduce((s, sec) => s + sec.questionGroups.reduce((gs, g) => gs + g.numberOfQuestions * g.marksPerQuestion, 0), 0)}</span>
                    {paperConfig.sections.reduce((s, sec) => s + sec.questionGroups.reduce((gs, g) => gs + g.numberOfQuestions * g.marksPerQuestion, 0), 0) > paperConfig.maxMarks && (
                      <span className="paper-marks-warning"> (exceeds max marks of {paperConfig.maxMarks})</span>
                    )}
                  </div>
                </div>
              ) : (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Enter your prompt for ${activeTool.title}...`}
                  rows={4}
                  className="inst-textarea"
                />
              )}
              <div className="generate-row">
                {questionType === 'questionpaper' ? (
                  <button className="inst-btn inst-btn-primary" onClick={handleGenerate} disabled={loading || (!input.trim() && !paperConfig.subject)}>
                    {loading ? "Generating..." : "📄 Generate Question Paper"}
                  </button>
                ) : (
                  <button className="inst-btn inst-btn-primary" onClick={handleGenerate} disabled={loading || !input.trim()}>
                    {loading ? "Generating..." : activeTool.id === "questions" ? `✨ Generate ${questionCount} Questions` : "✨ Generate"}
                  </button>
                )}
              </div>
            </div>

            {response && activeTool.id === 'questions' && quizTotal > 0 && (questionType === 'mcq' || questionType === 'mixed') && (
              <div className="quiz-container">
                {/* Info Bar */}
                <div className="quiz-info-bar">
                  <span className="quiz-info-item">Topic: <strong>{generatedTopic}</strong></span>
                  <span className="quiz-info-item">Total: <strong>{quizTotal} Questions</strong></span>
                  <span className="quiz-info-item">Progress: <strong>{quizAnswered} / {quizTotal} Answered</strong></span>
                </div>

                {/* Question Navigator */}
                <div className="quiz-navigator">
                  <div className="quiz-navigator-header">
                    <span>Question Navigator ({quizTotal} Questions):</span>
                    <span className="quiz-navigator-hint">Click any number to jump</span>
                  </div>
                  <div className="quiz-navigator-grid">
                    {parsedQuestions.map((q, navIdx) => {
                      const qNum = navIdx + 1;
                      return (
                        <button
                          key={q.id}
                          className={`quiz-nav-btn ${answers[q.id] ? 'answered' : ''} ${currentPage * questionsPerPage + 1 <= qNum && qNum <= (currentPage + 1) * questionsPerPage ? 'active-range' : ''}`}
                          onClick={() => {
                            setCurrentPage(Math.floor(navIdx / questionsPerPage));
                            const el = document.getElementById(`quiz-q-${navIdx}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                        >
                          {qNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search */}
                <div className="quiz-search-row">
                  <input
                    className="quiz-search-input"
                    placeholder="Search questions or options..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="quiz-view-selector">
                    View: (
                      <select
                        value={questionsPerPage}
                        onChange={(e) => {
                          setQuestionsPerPage(Number(e.target.value));
                          setCurrentPage(0);
                        }}
                      >
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={Math.max(1, quizTotal)}>All {quizTotal} questions</option>
                      </select>
                    )
                  </div>
                </div>

                {/* Questions */}
                {(() => {
                  const allQs = parsedQuestions;
                  const filtered = allQs.filter(q => {
                    if (!searchQuery) return true;
                    const s = searchQuery.toLowerCase();
                    if ((q.question || q.text || '').toLowerCase().includes(s)) return true;
                    return (q.options || []).some(o => o.text.toLowerCase().includes(s));
                  });
                  return filtered
                    .slice(currentPage * questionsPerPage, (currentPage + 1) * questionsPerPage)
                    .map((q) => {
                      const globalIdx = allQs.indexOf(q);
                      const qNum = globalIdx + 1;
                      return (
                        <div key={q.id} id={`quiz-q-${globalIdx}`} className="quiz-question-card">
                          <div className="quiz-question-header">
                            <span className="quiz-q-label">Question {qNum} of {allQs.length}</span>
                        {q.topic && <span className="quiz-q-tag">{q.topic}</span>}
                      </div>
                      <p className="quiz-question-text">{q.question || q.text}</p>
                      {q.options && q.options.length > 0 ? (
                      <div className="quiz-options-grid">
                        {q.options.map((opt) => {
                          const isSelected = answers[q.id] === opt.letter;
                          const isCorrect = opt.letter === q.correctAnswer;
                          let optionClass = 'quiz-option-btn';
                          if (isCorrect) {
                            optionClass += ' correct';
                          } else if (isSelected && !isCorrect && showResult) {
                            optionClass += ' incorrect';
                          } else if (isSelected) {
                            optionClass += ' selected';
                          }
                          return (
                            <button
                              key={opt.letter}
                              className={optionClass}
                              onClick={() => !showResult && setAnswers(prev => ({ ...prev, [q.id]: opt.letter }))}
                              disabled={showResult}
                            >
                              <span className="quiz-option-letter">{opt.letter}</span>
                              <span className="quiz-option-text">{opt.text}</span>
                              {isCorrect && <span className="quiz-correct-badge">✓ Correct</span>}
                              {showResult && isSelected && !isCorrect && <span className="quiz-incorrect-badge">✗ Wrong</span>}
                            </button>
                          );
                        })}
                      </div>
                      ) : (
                      <div className="quiz-short-answer">
                        <textarea
                          rows={3}
                          placeholder="Type your answer here..."
                          value={answers[q.id] || ''}
                          onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          disabled={showResult}
                        />
                        <small>Short answer — assess it yourself (not auto-graded).</small>
                      </div>
                      )}
                    </div>
                      );
                    });
                })()}

                {/* Pagination */}
                <div className="quiz-pagination">
                  <button className="quiz-page-btn" disabled={currentPage === 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))}>← Previous</button>
                  <span className="quiz-page-info">Page {currentPage + 1} of {Math.max(1, Math.ceil(quizTotal / questionsPerPage))}</span>
                  <button className="quiz-page-btn" disabled={(currentPage + 1) * questionsPerPage >= quizTotal} onClick={() => setCurrentPage(p => p + 1)}>Next →</button>
                </div>

                {/* Submit */}                  <div className="quiz-submit-row">
                  <button className="quiz-submit-btn" onClick={() => setShowResult(true)}>Submit Quiz</button>
                  {showResult && (
                    <span className="quiz-result-text">
                      You scored <strong>{quizGraded.filter(q => answers[q.id] === q.correctAnswer).length}</strong> out of <strong>{quizGraded.length}</strong> graded questions!
                      ({Math.round((quizGraded.filter(q => answers[q.id] === q.correctAnswer).length / (quizGraded.length || 1)) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            )}



            {/* ===== QUESTION BANK ===== */}
            {activeTool.id === 'questions' && questionBank.length > 0 && (
              <div className="qb-section">
                <div className="qb-header">
                  <h3>📚 Question Bank <span className="qb-count">({questionBank.length} questions)</span></h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="qb-add-btn" onClick={() => {
                      setEditingQuestionId(null);
                      setManualForm({ type: 'mcq', text: '', marks: 1, options: ['', '', '', ''], correctAnswer: 'A' });
                      setShowManualForm(true);
                    }}>✍ Add Manual Question</button>
                    <button className="qb-action-btn qb-delete-btn" onClick={() => {
                      if (window.confirm('Clear all questions from the Question Bank?')) {
                        setQuestionBank([]);
                        setSectionAssignments({});
                      }
                    }} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>🗑 Clear Bank</button>
                  </div>
                </div>
                <div className="qb-filters">
                  <select value={bankFilter} onChange={e => setBankFilter(e.target.value)}>
                    <option value="all">All Sources</option>
                    <option value="AI">🤖 AI Generated</option>
                    <option value="INSTRUCTOR">✍ Instructor Added</option>
                  </select>
                  <select value={bankTypeFilter} onChange={e => setBankTypeFilter(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="mcq">MCQ</option>
                    <option value="1liner">1 Liner</option>
                    <option value="2marker">2 Marker</option>
                    <option value="3marker">3 Marker</option>
                    <option value="5marker">5 Marker</option>
                  </select>
                  <input className="qb-search" placeholder="Search questions..." value={bankSearch} onChange={e => setBankSearch(e.target.value)} />
                </div>
                <div className="qb-list">
                  {questionBank
                    .filter(q => bankFilter === 'all' || q.source === bankFilter)
                    .filter(q => bankTypeFilter === 'all' || q.type === bankTypeFilter)
                    .filter(q => !bankSearch || (q.question || q.text || '').toLowerCase().includes(bankSearch.toLowerCase()))
                    .map((q, idx) => (
                      <div key={q.id} className="qb-card">
                        <div className="qb-card-header">
                          <span className={`qb-badge ${q.source === 'AI' ? 'qb-badge-ai' : 'qb-badge-instructor'}`}>
                            {q.source === 'AI' ? '🤖 AI Generated' : '✍ Instructor Added'}
                          </span>
                          <span className="qb-type-tag">{PAPER_SECTION_TYPES.find(t => t.id === q.type)?.label || q.type}</span>
                          <span className="qb-marks-tag">{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                        </div>
                        <p className="qb-card-text">{q.question || q.text}</p>
                        {q.options && q.options.length > 0 && (
                          <div className="qb-card-options">
                            {q.options.map((opt, oi) => (
                              <span key={oi} className={`qb-option ${String.fromCharCode(65 + oi) === q.correctAnswer ? 'qb-option-correct' : ''}`}>
                                ({String.fromCharCode(65 + oi)}) {opt.text || opt}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="qb-card-actions">
                          <button className="qb-action-btn qb-edit-btn" onClick={() => {
                            setEditingQuestionId(q.id);
                            setManualForm({
                              type: q.type || 'mcq',
                              text: q.question || q.text || '',
                              marks: q.marks || 1,
                              options: q.options ? q.options.map(o => o.text || o) : ['', '', '', ''],
                              correctAnswer: q.correctAnswer || 'A',
                            });
                            setShowManualForm(true);
                          }}>Edit</button>
                          <button className="qb-action-btn qb-delete-btn" onClick={() => {
                            setQuestionBank(prev => prev.filter(bq => bq.id !== q.id));
                          }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  {questionBank.filter(q => (bankFilter === 'all' || q.source === bankFilter) && (bankTypeFilter === 'all' || q.type === bankTypeFilter) && (!bankSearch || (q.question || q.text || '').toLowerCase().includes(bankSearch.toLowerCase()))).length === 0 && (
                    <div className="qb-empty">No questions match your filters.</div>
                  )}
                </div>
              </div>
            )}

            {/* ===== MANUAL QUESTION FORM MODAL ===== */}
            {showManualForm && (
              <div className="qb-modal-overlay" onClick={() => setShowManualForm(false)}>
                <div className="qb-modal" onClick={e => e.stopPropagation()}>
                  <h3>{editingQuestionId ? 'Edit Question' : '✍ Add Manual Question'}</h3>
                  <div className="qb-form">
                    <div className="qb-form-row">
                      <label>Question Type</label>
                      <select value={manualForm.type} onChange={e => {
                        const newType = e.target.value;
                        const defaultM = PAPER_SECTION_TYPES.find(t => t.id === newType);
                        setManualForm(f => ({ ...f, type: newType, marks: defaultM ? defaultM.defaultMarks : 1 }));
                      }}>
                        {PAPER_SECTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="qb-form-row">
                      <label>Question</label>
                      <textarea rows={3} value={manualForm.text} onChange={e => setManualForm(f => ({ ...f, text: e.target.value }))} placeholder="Type your question here..." />
                    </div>
                    <div className="qb-form-row">
                      <label>Marks</label>
                      <input type="number" min={1} max={25} value={manualForm.marks} onChange={e => setManualForm(f => ({ ...f, marks: Math.max(1, Number(e.target.value)) }))} />
                    </div>
                    {manualForm.type === 'mcq' && (
                      <>
                        <div className="qb-form-row"><label>Option A</label><input type="text" value={manualForm.options[0]} onChange={e => { const o = [...manualForm.options]; o[0] = e.target.value; setManualForm(f => ({ ...f, options: o })); }} /></div>
                        <div className="qb-form-row"><label>Option B</label><input type="text" value={manualForm.options[1]} onChange={e => { const o = [...manualForm.options]; o[1] = e.target.value; setManualForm(f => ({ ...f, options: o })); }} /></div>
                        <div className="qb-form-row"><label>Option C</label><input type="text" value={manualForm.options[2]} onChange={e => { const o = [...manualForm.options]; o[2] = e.target.value; setManualForm(f => ({ ...f, options: o })); }} /></div>
                        <div className="qb-form-row"><label>Option D</label><input type="text" value={manualForm.options[3]} onChange={e => { const o = [...manualForm.options]; o[3] = e.target.value; setManualForm(f => ({ ...f, options: o })); }} /></div>
                        <div className="qb-form-row">
                          <label>Correct Answer</label>
                          <select value={manualForm.correctAnswer} onChange={e => setManualForm(f => ({ ...f, correctAnswer: e.target.value }))}>
                            <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="qb-modal-actions">
                    <button className="qb-cancel-btn" onClick={() => setShowManualForm(false)}>Cancel</button>
                    <button className="qb-confirm-btn" onClick={() => {
                      if (!manualForm.text.trim()) return alert('Question text is required');
                      if (manualForm.marks < 1) return alert('Marks must be at least 1');
                      if (manualForm.type === 'mcq') {
                        if (manualForm.options.some(o => !o.trim())) return alert('All 4 options are required for MCQ');
                      }
                      if (editingQuestionId) {
                        setQuestionBank(prev => prev.map(q => q.id === editingQuestionId ? { ...q, text: manualForm.text, question: manualForm.text, type: manualForm.type, marks: manualForm.marks, options: manualForm.type === 'mcq' ? manualForm.options.map((o, i) => ({ letter: String.fromCharCode(65 + i), text: o })) : [], correctAnswer: manualForm.correctAnswer } : q));
                      } else {
                        const newQ = {
                          id: `manual-${Date.now()}`,
                          text: manualForm.text,
                          question: manualForm.text,
                          type: manualForm.type,
                          marks: manualForm.marks,
                          source: 'INSTRUCTOR',
                          options: manualForm.type === 'mcq' ? manualForm.options.map((o, i) => ({ letter: String.fromCharCode(65 + i), text: o })) : [],
                          correctAnswer: manualForm.correctAnswer,
                        };
                        setQuestionBank(prev => [...prev, newQ]);
                      }
                      setShowManualForm(false);
                      setEditingQuestionId(null);
                    }}>{editingQuestionId ? 'Save Changes' : 'Add Question'}</button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== SECTION QUESTION PICKER MODAL ===== */}
            {showSectionPicker !== null && (() => {
              const sec = paperConfig.sections[showSectionPicker];
              const secType = sec?.questionGroups[0]?.questionType || 'all';
              const filteredQs = questionBank
                .filter(q => pickerTypeFilter === 'all' || q.type === pickerTypeFilter)
                .filter(q => !pickerSearch || (q.question || q.text || '').toLowerCase().includes(pickerSearch.toLowerCase()));
              const assigned = sectionAssignments[showSectionPicker] || [];
              const allFilteredIds = filteredQs.map(q => q.id);
              const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => assigned.includes(id));
              return (
                <div className="qb-modal-overlay" onClick={() => setShowSectionPicker(null)}>
                  <div className="qb-modal qb-modal-wide" onClick={e => e.stopPropagation()}>
                    <h3>📋 Select Questions for {sec?.name || 'Section'}</h3>
                    {secType !== 'all' && (
                      <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontSize: 13 }}>
                        Section type: <strong>{PAPER_SECTION_TYPES.find(t => t.id === secType)?.label || secType}</strong> — showing matching questions below
                      </p>
                    )}
                    <div className="qb-filters" style={{ marginBottom: 12 }}>
                      <select value={pickerTypeFilter} onChange={e => setPickerTypeFilter(e.target.value)}>
                        <option value="all">All Types</option>
                        <option value="mcq">MCQ</option>
                        <option value="1liner">1 Liner</option>
                        <option value="2marker">2 Marker</option>
                        <option value="3marker">3 Marker</option>
                        <option value="5marker">5 Marker</option>
                      </select>
                      <input className="qb-search" placeholder="Search questions..." style={{ flex: 1 }} value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{filteredQs.length} found, {assigned.length} selected</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      <button className="qb-action-btn" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => {
                        setSectionAssignments(prev => {
                          const current = prev[showSectionPicker] || [];
                          const toAdd = allFilteredIds.filter(id => !current.includes(id));
                          return { ...prev, [showSectionPicker]: [...current, ...toAdd] };
                        });
                      }}>✅ Select All ({filteredQs.length})</button>
                      <button className="qb-action-btn" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => {
                        setSectionAssignments(prev => {
                          const current = prev[showSectionPicker] || [];
                          const removeSet = new Set(allFilteredIds);
                          return { ...prev, [showSectionPicker]: current.filter(id => !removeSet.has(id)) };
                        });
                      }}>❌ Deselect All</button>
                    </div>
                    <div className="qb-picker-list">
                      {filteredQs.length === 0 && (
                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {questionBank.length === 0 ? 'No questions in the Question Bank yet. Generate questions using AI first.' : 'No questions match your filter.'}
                        </div>
                      )}
                      {filteredQs.map(q => {
                        const isSelected = assigned.includes(q.id);
                        return (
                          <label key={q.id} className={`qb-picker-item ${isSelected ? 'selected' : ''}`}>
                            <input type="checkbox" checked={isSelected} onChange={() => {
                              setSectionAssignments(prev => {
                                const current = prev[showSectionPicker] || [];
                                const next = isSelected ? current.filter(id => id !== q.id) : [...current, q.id];
                                return { ...prev, [showSectionPicker]: next };
                              });
                            }} />
                            <span className={`qb-badge qb-badge-sm ${q.source === 'AI' ? 'qb-badge-ai' : 'qb-badge-instructor'}`}>
                              {q.source === 'AI' ? '🤖' : '✍'}
                            </span>
                            <span className="qb-picker-type">{PAPER_SECTION_TYPES.find(t => t.id === q.type)?.label || q.type}</span>
                            <span className="qb-picker-text">{q.question || q.text}</span>
                            <span className="qb-picker-marks">{q.marks}M</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="qb-modal-actions">
                      <button className="qb-confirm-btn" onClick={() => setShowSectionPicker(null)}>Done — {assigned.length} questions selected</button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ===== SECTION MANUAL QUESTION MODAL ===== */}
            {showSectionManualForm !== null && (
              <div className="qb-modal-overlay" onClick={() => setShowSectionManualForm(null)}>
                <div className="qb-modal" onClick={e => e.stopPropagation()}>
                  <h3>Add Manual Question to {paperConfig.sections[showSectionManualForm]?.name || 'Section'}</h3>
                  <div className="qb-form">
                    <div className="qb-form-row">
                      <label>Question Type</label>
                      <select value={sectionManualForm.type} onChange={e => {
                        const newType = e.target.value;
                        const defaultM = PAPER_SECTION_TYPES.find(t => t.id === newType);
                        setSectionManualForm(f => ({ ...f, type: newType, marks: defaultM ? defaultM.defaultMarks : 1 }));
                      }}>
                        {PAPER_SECTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="qb-form-row">
                      <label>Question</label>
                      <textarea rows={3} value={sectionManualForm.text} onChange={e => setSectionManualForm(f => ({ ...f, text: e.target.value }))} placeholder="Type your question here..." />
                    </div>
                    <div className="qb-form-row">
                      <label>Marks</label>
                      <input type="number" min={1} max={25} value={sectionManualForm.marks} onChange={e => setSectionManualForm(f => ({ ...f, marks: Math.max(1, Number(e.target.value)) }))} />
                    </div>
                    {sectionManualForm.type === 'mcq' && (
                      <>
                        <div className="qb-form-row"><label>Option A</label><input type="text" value={sectionManualForm.options[0]} onChange={e => { const o = [...sectionManualForm.options]; o[0] = e.target.value; setSectionManualForm(f => ({ ...f, options: o })); }} /></div>
                        <div className="qb-form-row"><label>Option B</label><input type="text" value={sectionManualForm.options[1]} onChange={e => { const o = [...sectionManualForm.options]; o[1] = e.target.value; setSectionManualForm(f => ({ ...f, options: o })); }} /></div>
                        <div className="qb-form-row"><label>Option C</label><input type="text" value={sectionManualForm.options[2]} onChange={e => { const o = [...sectionManualForm.options]; o[2] = e.target.value; setSectionManualForm(f => ({ ...f, options: o })); }} /></div>
                        <div className="qb-form-row"><label>Option D</label><input type="text" value={sectionManualForm.options[3]} onChange={e => { const o = [...sectionManualForm.options]; o[3] = e.target.value; setSectionManualForm(f => ({ ...f, options: o })); }} /></div>
                        <div className="qb-form-row">
                          <label>Correct Answer</label>
                          <select value={sectionManualForm.correctAnswer} onChange={e => setSectionManualForm(f => ({ ...f, correctAnswer: e.target.value }))}>
                            <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="qb-modal-actions">
                    <button className="qb-cancel-btn" onClick={() => setShowSectionManualForm(null)}>Cancel</button>
                    <button className="qb-confirm-btn" onClick={() => {
                      if (!sectionManualForm.text.trim()) return alert('Question text is required');
                      if (sectionManualForm.marks < 1) return alert('Marks must be at least 1');
                      const newQ = {
                        id: `manual-${Date.now()}`,
                        text: sectionManualForm.text,
                        question: sectionManualForm.text,
                        type: sectionManualForm.type,
                        marks: sectionManualForm.marks,
                        source: 'INSTRUCTOR',
                        options: sectionManualForm.type === 'mcq' ? sectionManualForm.options.map((o, i) => ({ letter: String.fromCharCode(65 + i), text: o })) : [],
                        correctAnswer: sectionManualForm.correctAnswer,
                      };
                      setQuestionBank(prev => [...prev, newQ]);
                      setSectionAssignments(prev => {
                        const current = prev[showSectionManualForm] || [];
                        return { ...prev, [showSectionManualForm]: [...current, newQ.id] };
                      });
                      setShowSectionManualForm(null);
                    }}>Add to Section</button>
                  </div>
                </div>
              </div>
            )}

            {/* Question Paper Output */}
            {paperGenerated && paperData && questionType === 'questionpaper' && (
              <div className="paper-output-section">
                <div className="paper-action-bar">
                  <button className="inst-btn inst-btn-primary" onClick={() => { setPaperGenerated(false); setPaperData(null); setPaperUploaded(false); }}>← Generate New</button>
                  <div className="paper-action-buttons">
                    <button className="paper-action-btn paper-btn-preview" onClick={() => { const el = document.getElementById('paper-preview-content'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>👁 Preview</button>
                    <button className="paper-action-btn paper-btn-download" onClick={() => { const el = document.getElementById('paper-preview-content'); if (!el) return; const w = window.open('', '_blank'); w.document.write('<html><head><title>' + paperData.title + '</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;color:#000;background:#fff}h1{text-align:center;font-size:22px;margin-bottom:4px}h2{text-align:center;font-size:14px;font-weight:normal;color:#333;margin-top:0}.paper-meta{text-align:center;margin-bottom:20px;border-bottom:2px solid #000;padding-bottom:12px}.paper-meta p{margin:2px 0;font-size:13px}.paper-instructions{border:1px solid #999;padding:12px 16px;margin-bottom:20px;font-size:12.5px}.paper-instructions h3{margin:0 0 6px;font-size:14px}.paper-instructions ul{margin:4px 0;padding-left:20px}.paper-section{margin-bottom:24px}.paper-section h3{font-size:16px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:10px}.paper-q{margin-bottom:12px;font-size:13.5px;line-height:1.6}.paper-q-num{font-weight:bold}.paper-or{color:#666;font-style:italic;margin-left:20px;margin-top:4px;font-size:12.5px}@media print{body{margin:0;padding:20px}}</style></head><body>' + el.innerHTML + '</body></html>'); w.document.close(); setTimeout(() => { w.print(); }, 500); }}>⬇ Download PDF</button>
                    <button className="paper-action-btn paper-btn-print" onClick={() => { const el = document.getElementById('paper-preview-content'); if (!el) return; const w = window.open('', '_blank'); w.document.write('<html><head><title>' + paperData.title + '</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;color:#000;background:#fff}h1{text-align:center;font-size:22px;margin-bottom:4px}h2{text-align:center;font-size:14px;font-weight:normal;color:#333;margin-top:0}.paper-meta{text-align:center;margin-bottom:20px;border-bottom:2px solid #000;padding-bottom:12px}.paper-meta p{margin:2px 0;font-size:13px}.paper-instructions{border:1px solid #999;padding:12px 16px;margin-bottom:20px;font-size:12.5px}.paper-instructions h3{margin:0 0 6px;font-size:14px}.paper-instructions ul{margin:4px 0;padding-left:20px}.paper-section{margin-bottom:24px}.paper-section h3{font-size:16px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:10px}.paper-q{margin-bottom:12px;font-size:13.5px;line-height:1.6}.paper-q-num{font-weight:bold}.paper-or{color:#666;font-style:italic;margin-left:20px;margin-top:4px;font-size:12.5px}@media print{body{margin:0;padding:20px}}</style></head><body>' + el.innerHTML + '</body></html>'); w.document.close(); setTimeout(() => { w.print(); }, 300); }}>🖨 Print</button>
                    <button
                      className={`paper-action-btn paper-btn-upload ${paperUploaded ? "uploaded" : ""}`}
                      onClick={handleUploadToExam}
                      disabled={uploadingPaper || paperUploaded}
                      title="Upload this question paper to the Exams section"
                    >
                      {uploadingPaper ? "⏳ Uploading…" : paperUploaded ? "✅ Uploaded to Exam" : "📤 Upload to Exam"}
                    </button>
                  </div>
                </div>

                <div id="paper-preview-content" className="paper-preview">
                  <h1>{paperData.title}</h1>
                  <h2>{paperData.subject}</h2>
                  <div className="paper-meta">
                    <p><strong>Duration:</strong> {paperData.duration} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Maximum Marks:</strong> {paperData.totalMarks} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Difficulty:</strong> {paperData.difficulty}</p>
                  </div>

                  <div className="paper-instructions">
                    <h3>General Instructions:</h3>
                    <ul>
                      <li>All questions are compulsory unless stated otherwise.</li>
                      <li>Read each question carefully before answering.</li>
                      <li>Where applicable, draw neat diagrams to support your answers.</li>
                      <li>Questions marked with "OR" offer an internal choice — attempt either one.</li>
                      <li>Write neatly and clearly. Marks may be deducted for illegibility.</li>
                    </ul>
                  </div>

                  {/* Dynamic Sections */}
                  {paperData.sections.map((sec) => {
                    // Group questions by type within the section
                    const groupedByType = {};
                    sec.questions.forEach((q) => {
                      const t = q.type || 'unknown';
                      if (!groupedByType[t]) groupedByType[t] = [];
                      groupedByType[t].push(q);
                    });
                    const typeEntries = Object.entries(groupedByType);
                    return (
                      <div key={sec.name} className="paper-section">
                        <h3>{sec.name} &nbsp; <span className="paper-section-marks">({sec.total} marks)</span></h3>
                        {sec.instructions && <p className="paper-section-instructions"><em>{sec.instructions}</em></p>}
                        {typeEntries.map(([type, questions]) => {
                          const typeLabel = PAPER_SECTION_TYPES.find(t => t.id === type)?.label || type;
                          const marksEach = questions[0]?.marks || 1;
                          return (
                            <div key={type} className="paper-section-type-group">
                              <p className="paper-type-subheader"><em>{typeLabel} &nbsp; ({questions.length} × {marksEach} = {questions.length * marksEach} marks)</em></p>
                              {questions.map((q) => (
                                <div key={q.num} className="paper-q">
                                  <span className="paper-q-num">Q{q.num}.</span>
                                  {q.type === 'mcq' && q.options ? (
                                    <span>
                                      {q.text}
                                      <div className="paper-mcq-options">
                                        {q.options.map((opt, oi) => <span key={oi}>({'ABCD'[oi]}) {opt}</span>)}
                                      </div>
                                    </span>
                                  ) : (
                                    <span>{q.text}</span>
                                  )}
                                  {q.orChoice && <div className="paper-or">OR &nbsp; {q.orChoice}</div>}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  <div className="paper-total-footer">
                    <p>TOTAL: {paperData.totalMarks} MARKS &nbsp;&nbsp;|&nbsp;&nbsp; {paperData.totalQuestions} Questions</p>
                  </div>
                  <div className="paper-footer">
                    <p>— End of Question Paper —</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </InstructorPage>
  );
}
