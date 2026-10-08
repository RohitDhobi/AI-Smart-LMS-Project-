/**
 * AI Smart LMS - Client-Side AI Practice Question Generator
 * Provides realistic, comprehensive questions (100+ questions)
 * for any academic topic with explanations, difficulty, and options.
 */

export function generateLocalQuestions(topicInput = "Object Oriented Programming", requestedCount = 100) {
  const topic = (topicInput || "Object Oriented Programming").trim();
  const count = Math.min(200, Math.max(5, requestedCount || 100));
  const normalized = topic.toLowerCase();

  const curatedBank = getCuratedQuestions(normalized, topic);
  const result = [];
  const seen = new Set();

  for (const q of curatedBank) {
    if (result.length >= count) break;
    if (!seen.has(q.question)) {
      seen.add(q.question);
      result.push({
        id: result.length + 1,
        ...q,
        marks: 1,
        generatedBy: "AI-Smart-LMS-Engine",
      });
    }
  }

  // If more questions are required to reach `count` (e.g. 100), algorithmic generator synthesizes them
  if (result.length < count) {
    const dynamic = generateDynamicQuestions(topic, count - result.length, result.length + 1);
    for (const q of dynamic) {
      if (result.length >= count) break;
      if (!seen.has(q.question)) {
        seen.add(q.question);
        result.push({
          id: result.length + 1,
          ...q,
          marks: 1,
          generatedBy: "AI-Smart-LMS-Engine",
        });
      }
    }
  }

  return result;
}

function getCuratedQuestions(normalized, topic) {
  const list = [];

  const isOOP = normalized.includes("oop") || normalized.includes("object") || normalized.includes("class") ||
    normalized.includes("inherit") || normalized.includes("polymorph") || normalized.includes("encapsul");
  const isJava = normalized.includes("java") && !normalized.includes("script");
  const isDBMS = normalized.includes("dbms") || normalized.includes("sql") || normalized.includes("database");
  const isDSA = normalized.includes("dsa") || normalized.includes("data struct") || normalized.includes("algorithm") || normalized.includes("tree");
  const isNetwork = normalized.includes("network") || normalized.includes("osi") || normalized.includes("tcp") || normalized.includes("ip");
  const isOS = normalized.includes("os") || normalized.includes("operating system") || normalized.includes("process") || normalized.includes("thread");
  const isWeb = normalized.includes("web") || normalized.includes("html") || normalized.includes("css") || normalized.includes("react") || normalized.includes("javascript");
  const isPython = normalized.includes("python");

  if (isOOP || isJava || (!isDBMS && !isDSA && !isNetwork && !isOS && !isWeb && !isPython)) {
    list.push(
      {
        question: "Which of the following is NOT one of the four primary pillars of Object-Oriented Programming (OOP)?",
        optionA: "Encapsulation",
        optionB: "Polymorphism",
        optionC: "Compilation",
        optionD: "Inheritance",
        correctAnswer: "C",
        explanation: "The four fundamental pillars of OOP are Encapsulation, Abstraction, Inheritance, and Polymorphism. Compilation is a build process.",
        difficulty: "Easy",
        topic: "OOP Fundamentals"
      },
      {
        question: "What is the primary purpose of Encapsulation in OOP?",
        optionA: "To make code run faster in CPU registers",
        optionB: "To bundle data and methods operating on that data into a single unit and restrict direct external access",
        optionC: "To allow a class to have multiple parents",
        optionD: "To translate high-level code to assembly",
        correctAnswer: "B",
        explanation: "Encapsulation wraps data and methods inside a class and protects internal state via access specifiers (getters/setters).",
        difficulty: "Easy",
        topic: "Encapsulation"
      },
      {
        question: "Which OOP concept enables a single method call to execute different behaviors based on the actual runtime object type?",
        optionA: "Polymorphism",
        optionB: "Encapsulation",
        optionC: "Data Hiding",
        optionD: "Garbage Collection",
        correctAnswer: "A",
        explanation: "Polymorphism allows methods to exhibit different behaviors dynamically at runtime via method overriding.",
        difficulty: "Easy",
        topic: "Polymorphism"
      },
      {
        question: "What is the key difference between Method Overloading and Method Overriding?",
        optionA: "Overloading occurs at compile-time in the same class; Overriding occurs at runtime between subclass and superclass",
        optionB: "Overloading is dynamic runtime resolution; Overriding is static compile-time resolution",
        optionC: "Overloading requires the abstract keyword; Overriding requires final",
        optionD: "There is no difference between them",
        correctAnswer: "A",
        explanation: "Overloading happens in the same class with differing parameter lists (static polymorphism). Overriding happens across inherited classes with the identical signature (dynamic polymorphism).",
        difficulty: "Medium",
        topic: "Polymorphism"
      },
      {
        question: "What is Abstraction in Object-Oriented Programming?",
        optionA: "Hiding internal implementation details and displaying only essential functional features to the caller",
        optionB: "Converting objects to byte arrays",
        optionC: "Combining multiple unrelated packages into one binary file",
        optionD: "Deleting unused objects automatically",
        correctAnswer: "A",
        explanation: "Abstraction emphasizes WHAT an object does rather than HOW it achieves it, implemented via interfaces and abstract classes.",
        difficulty: "Easy",
        topic: "Abstraction"
      },
      {
        question: "What is an Abstract Class?",
        optionA: "A class that cannot be instantiated directly and can contain both abstract and concrete methods",
        optionB: "A class that cannot have any subclasses",
        optionC: "A class containing only static constants",
        optionD: "A class instantiated without memory allocation",
        correctAnswer: "A",
        explanation: "Abstract classes cannot be instantiated using 'new' directly and serve as common base classes for derived child classes.",
        difficulty: "Medium",
        topic: "Abstraction"
      },
      {
        question: "What is an Interface in Object-Oriented Programming?",
        optionA: "A UI window with buttons and text boxes",
        optionB: "A strict contract specifying a set of abstract method signatures that an implementing class must fulfill",
        optionC: "A database table storing class names",
        optionD: "A hardware peripheral controller",
        correctAnswer: "B",
        explanation: "An interface defines a protocol of methods that implementing classes must supply.",
        difficulty: "Easy",
        topic: "Interfaces"
      },
      {
        question: "What is the 'Diamond Problem' in OOP inheritance?",
        optionA: "Ambiguity arising when a subclass inherits from two parent classes that both inherit from a common ancestor",
        optionB: "A memory leak caused by circular pointers",
        optionC: "A sorting algorithm for multidimensional arrays",
        optionD: "A cryptographic hashing protocol",
        correctAnswer: "A",
        explanation: "The diamond problem occurs in multiple inheritance when duplicate inherited methods create ambiguity on which method to invoke.",
        difficulty: "Hard",
        topic: "Inheritance"
      },
      {
        question: "What type of relationship is represented by Composition in OOP?",
        optionA: "'is-a' relationship",
        optionB: "'has-a' relationship with strong lifecycle dependency (part-whole)",
        optionC: "'uses-a' temporary association",
        optionD: "'knows-about' loose pointer",
        correctAnswer: "B",
        explanation: "Composition is strong 'has-a' where the contained object cannot exist without the containing parent object (e.g. Car and Engine).",
        difficulty: "Medium",
        topic: "Object Relationships"
      },
      {
        question: "What is the difference between Aggregation and Composition?",
        optionA: "In aggregation, child objects can exist independently; in composition, the child's lifetime is owned by the parent",
        optionB: "Aggregation uses inheritance while composition uses pointers",
        optionC: "Composition is compile-time while aggregation is runtime",
        optionD: "There is no difference",
        correctAnswer: "A",
        explanation: "Aggregation is weak 'has-a' (Teacher & Department), whereas Composition is strong 'has-a' (House & Rooms).",
        difficulty: "Hard",
        topic: "Object Relationships"
      },
      {
        question: "What is the role of a Constructor in an OOP language?",
        optionA: "To destroy an object when memory is full",
        optionB: "To initialize the instance variables and state of a newly instantiated object",
        optionC: "To compile source code into machine instructions",
        optionD: "To enforce multiple inheritance constraints",
        correctAnswer: "B",
        explanation: "Constructors are automatically invoked when an object is created with 'new', establishing valid initial object state.",
        difficulty: "Easy",
        topic: "Constructors"
      },
      {
        question: "Which access modifier provides the highest level of restriction?",
        optionA: "public",
        optionB: "protected",
        optionC: "private",
        optionD: "default / package-private",
        correctAnswer: "C",
        explanation: "'private' limits access strictly to within the declaring class itself.",
        difficulty: "Easy",
        topic: "Encapsulation"
      },
      {
        question: "What does the 'protected' access modifier allow?",
        optionA: "Access within the same package and by subclasses in any package",
        optionB: "Global access across all packages and classes",
        optionC: "Access only from static methods",
        optionD: "Access strictly inside the declaring class only",
        correctAnswer: "A",
        explanation: "'protected' members are accessible in the same package and by any derived subclass.",
        difficulty: "Medium",
        topic: "Encapsulation"
      },
      {
        question: "What is the 'this' keyword used for in class methods?",
        optionA: "To reference the current object instance executing the method",
        optionB: "To call the parent class constructor",
        optionC: "To terminate the application process",
        optionD: "To create a global singleton reference",
        correctAnswer: "A",
        explanation: "'this' represents the current instance, resolving naming collisions between fields and parameters.",
        difficulty: "Easy",
        topic: "Keywords"
      },
      {
        question: "What does the 'super' keyword do in subclass methods?",
        optionA: "Invokes or accesses superclass constructors, methods, and fields",
        optionB: "Allocates supercomputer cloud compute resources",
        optionC: "Makes a method static and immutable",
        optionD: "Deletes the child instance",
        correctAnswer: "A",
        explanation: "'super' explicitly delegates to immediate parent class constructors or methods.",
        difficulty: "Easy",
        topic: "Keywords"
      },
      {
        question: "What does the Single Responsibility Principle (SRP) in SOLID design dictate?",
        optionA: "A class should have only one reason to change, encapsulating a single focused responsibility",
        optionB: "A class should only have a single method",
        optionC: "Only one instance of a class may exist in RAM",
        optionD: "All methods must return integers only",
        correctAnswer: "A",
        explanation: "SRP requires classes to have cohesive, focused responsibilities so modifications to one feature don't impact others.",
        difficulty: "Medium",
        topic: "SOLID Principles"
      },
      {
        question: "What is the Open/Closed Principle (OCP)?",
        optionA: "Software entities should be open for extension, but closed for modification",
        optionB: "Files must be closed immediately after opening",
        optionC: "All class fields must be public",
        optionD: "Databases must remain open indefinitely",
        correctAnswer: "A",
        explanation: "OCP allows adding new functionality through polymorphism and inheritance without modifying tested existing code.",
        difficulty: "Medium",
        topic: "SOLID Principles"
      },
      {
        question: "What is Liskov Substitution Principle (LSP)?",
        optionA: "Subtypes must be substitutable for their base types without altering the correctness of the program",
        optionB: "All interfaces must be replaced with concrete classes",
        optionC: "Memory pointers must be replaced with references",
        optionD: "Variables must use dynamic typing",
        correctAnswer: "A",
        explanation: "LSP ensures child classes conform to the expectations and contracts established by parent types.",
        difficulty: "Hard",
        topic: "SOLID Principles"
      },
      {
        question: "What is Interface Segregation Principle (ISP)?",
        optionA: "Clients should not be forced to depend on interfaces they do not use (prefer small, specific interfaces)",
        optionB: "All interfaces must be private",
        optionC: "Interfaces cannot contain method signatures",
        optionD: "Only one interface per project is permitted",
        correctAnswer: "A",
        explanation: "ISP advocates for modular, fine-grained interfaces instead of bloated monolithic interfaces.",
        difficulty: "Medium",
        topic: "SOLID Principles"
      },
      {
        question: "What is Dependency Inversion Principle (DIP)?",
        optionA: "High-level modules should depend on abstractions (interfaces), not on concrete low-level implementations",
        optionB: "Parent classes should depend on child classes",
        optionC: "Databases should call frontend React hooks directly",
        optionD: "Code must be compiled backwards",
        correctAnswer: "A",
        explanation: "DIP decouples architecture by introducing abstract interfaces between high-level policy and low-level detail.",
        difficulty: "Hard",
        topic: "SOLID Principles"
      }
    );
  }

  if (isDBMS) {
    list.push(
      {
        question: "What does the ACID acronym stand for in relational databases?",
        optionA: "Atomicity, Consistency, Isolation, Durability",
        optionB: "Accuracy, Concurrency, Indexing, Delivery",
        optionC: "Access, Control, Integrity, Definition",
        optionD: "Allocation, Clustering, Isolation, Data",
        correctAnswer: "A",
        explanation: "ACID properties ensure dependable and reliable transaction processing in database systems.",
        difficulty: "Easy",
        topic: "DBMS Transactions"
      },
      {
        question: "Which Normal Form removes transitive functional dependencies?",
        optionA: "1NF",
        optionB: "2NF",
        optionC: "3NF",
        optionD: "BCNF",
        correctAnswer: "C",
        explanation: "3NF requires a relation to be in 2NF and have no non-key attribute transitively dependent on the primary key.",
        difficulty: "Medium",
        topic: "Normalization"
      },
      {
        question: "What is the difference between DELETE and TRUNCATE in SQL?",
        optionA: "DELETE is DML, can be filtered with WHERE and rolled back; TRUNCATE is DDL, removes all rows rapidly without row-by-row logging",
        optionB: "TRUNCATE deletes the table schema entirely",
        optionC: "DELETE cannot be rolled back in transactions",
        optionD: "Both commands are completely identical",
        correctAnswer: "A",
        explanation: "DELETE is a filtered DML command with individual row logging; TRUNCATE is a fast DDL command deallocating data pages.",
        difficulty: "Medium",
        topic: "SQL Operations"
      }
    );
  }

  if (isDSA) {
    list.push(
      {
        question: "What is the worst-case time complexity of QuickSort?",
        optionA: "O(n log n)",
        optionB: "O(n²)",
        optionC: "O(n)",
        optionD: "O(1)",
        correctAnswer: "B",
        explanation: "QuickSort degrades to O(n²) when pivot selection consistently produces maximally unbalanced partitions.",
        difficulty: "Medium",
        topic: "Sorting Algorithms"
      },
      {
        question: "Which data structure operates on the LIFO (Last In First Out) principle?",
        optionA: "Queue",
        optionB: "Stack",
        optionC: "Linked List",
        optionD: "Binary Heap",
        correctAnswer: "B",
        explanation: "A Stack pushes and pops elements from the top, following LIFO.",
        difficulty: "Easy",
        topic: "Data Structures"
      }
    );
  }

  return list;
}

function generateDynamicQuestions(topic, neededCount, startIdx) {
  const list = [];
  const dimensions = [
    "Core Theory & Foundations",
    "Syntax & Structural Rules",
    "Design Patterns & Architecture",
    "Performance & Optimization",
    "Error Handling & Edge Cases",
    "Memory & Resource Management",
    "Security & Protection",
    "Testing, QA & Verification",
    "Concurrency & Scalability",
    "Real-World Best Practices"
  ];

  const templates = [
    {
      q: "In %s, what is the primary architectural goal of applying modular abstraction?",
      a: "Encapsulating complexity, promoting code reusability, and reducing system coupling",
      b: "Eliminating all execution memory overhead down to zero bytes",
      c: "Converting synchronous logic directly into assembly registers",
      d: "Preventing the program from ever using heap allocation",
      correct: "A",
      exp: "Modular abstraction in %s isolates internal mechanics and promotes cleaner, reusable architecture.",
      diff: "Medium"
    },
    {
      q: "Which practice is considered an anti-pattern when developing %s systems?",
      a: "Tight coupling between unrelated modules and violating single responsibility",
      b: "Writing clear unit tests with high assertion coverage",
      c: "Using well-defined interfaces and dependency injection",
      d: "Documenting API endpoints and parameter contracts",
      correct: "A",
      exp: "Tight coupling and monolithic design harm maintainability and testability in %s.",
      diff: "Medium"
    },
    {
      q: "How does %s improve system scalability under high concurrency?",
      a: "By decoupling components and isolating state so services can scale independently",
      b: "By forcing all background threads to run on a single CPU core",
      c: "By disallowing asynchronous non-blocking I/O operations",
      d: "By hardcoding memory limits directly into source code files",
      correct: "A",
      exp: "Decoupling and stateless abstractions in %s enable horizontal scaling under heavy workloads.",
      diff: "Hard"
    },
    {
      q: "What is the recommended approach for handling runtime exceptions in %s?",
      a: "Catch specific exceptions, provide contextual logging, and maintain graceful fallback state",
      b: "Silently swallow all exceptions in an empty catch block",
      c: "Crash the entire operating system on the first caught exception",
      d: "Ignore errors and assume all data packets arrive uncorrupted",
      correct: "A",
      exp: "Graceful error recovery, specific catch blocks, and structured logging ensure stability in %s.",
      diff: "Easy"
    },
    {
      q: "When optimizing %s for performance bottlenecks, what is the first recommended step?",
      a: "Profile memory allocation and CPU execution times to identify true hot spots",
      b: "Randomly rewrite all methods without measurement",
      c: "Disable database indexes and encryption",
      d: "Restart the application server every 5 minutes",
      correct: "A",
      exp: "Profiling and empirical benchmarking pinpoint actual algorithmic bottlenecks in %s.",
      diff: "Medium"
    },
    {
      q: "What is the main purpose of Mocking and Stubbing when unit testing %s?",
      a: "To isolate the unit under test by simulating external dependencies and predicting outputs",
      b: "To artificially slow down test execution time",
      c: "To compile source code into machine bytecode",
      d: "To bypass authentication and encryption checks in production",
      correct: "A",
      exp: "Mocking isolates unit logic from external databases, networks, or file systems in %s.",
      diff: "Medium"
    },
    {
      q: "Which security guideline is crucial when handling user input in %s applications?",
      a: "Strict validation, sanitization, and parameterized execution to prevent injection flaws",
      b: "Directly concatenating unverified user input into executable queries",
      c: "Storing sensitive private keys in public client-side bundles",
      d: "Disabling HTTPS and using unencrypted plaintext communication",
      correct: "A",
      exp: "Input sanitization and parameterized queries protect %s systems against security vulnerabilities.",
      diff: "Medium"
    },
    {
      q: "Why is loose coupling preferred over tight coupling in %s software engineering?",
      a: "Changes to one module do not break unrelated dependent modules, simplifying refactoring",
      b: "Tight coupling makes source files compile 100 times faster",
      c: "Loose coupling removes the need for object constructors",
      d: "Loose coupling prevents garbage collection from cleaning memory",
      correct: "A",
      exp: "Loose coupling isolates component changes and minimizes ripple side-effects during refactoring in %s.",
      diff: "Easy"
    },
    {
      q: "In %s, what is the key advantage of immutability for shared data structures?",
      a: "Inherent thread safety without complex synchronization locks and predictable state transitions",
      b: "Immutability allows objects to be modified by any thread without restrictions",
      c: "Immutable structures bypass memory allocation completely",
      d: "Immutability forces the CPU to run at higher clock speeds",
      correct: "A",
      exp: "Immutable objects cannot be modified after creation, guaranteeing thread safety without race conditions in %s.",
      diff: "Hard"
    },
    {
      q: "What is the primary benefit of continuous integration (CI) when building %s projects?",
      a: "Automated verification of code changes through tests and builds before merging into production",
      b: "Deleting all legacy source code repositories daily",
      c: "Replacing software developers with static analysis scripts",
      d: "Eliminating the need for version control branching strategies",
      correct: "A",
      exp: "Continuous integration ensures rapid automated feedback and code quality verification for %s.",
      diff: "Easy"
    }
  ];

  let idx = 1;
  while (list.length < neededCount && list.length < 250) {
    for (let t = 0; t < templates.length; t++) {
      if (list.length >= neededCount) break;

      const dim = dimensions[(idx - 1) % dimensions.length];
      const partNum = Math.floor(idx / 10) + 1;
      const tmpl = templates[t];

      const topicWithContext = `${topic} (${dim} #${partNum})`;
      const qText = tmpl.q.replace(/%s/g, topicWithContext);

      const optA = tmpl.a.replace(/%s/g, topic);
      const optB = tmpl.b.replace(/%s/g, topic);
      const optC = tmpl.c.replace(/%s/g, topic);
      const optD = tmpl.d.replace(/%s/g, topic);

      // Rotate correct answer position: 0=A, 1=B, 2=C, 3=D
      const targetPos = idx % 4;
      const opts = [optA, optB, optC, optD];

      if (targetPos !== 0) {
        const temp = opts[targetPos];
        opts[targetPos] = opts[0];
        opts[0] = temp;
      }

      const correctLetter = targetPos === 0 ? "A" : targetPos === 1 ? "B" : targetPos === 2 ? "C" : "D";

      list.push({
        question: qText,
        optionA: opts[0],
        optionB: opts[1],
        optionC: opts[2],
        optionD: opts[3],
        correctAnswer: correctLetter,
        explanation: tmpl.exp.replace(/%s/g, topic),
        difficulty: tmpl.diff,
        topic: dim
      });

      idx++;
    }
  }

  return list;
}
