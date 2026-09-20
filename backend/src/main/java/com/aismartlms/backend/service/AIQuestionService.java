package com.aismartlms.backend.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AIQuestionService {

    public List<Map<String, Object>> generateQuestions(String topicInput, int requestedCount) {
        if (topicInput == null || topicInput.trim().isEmpty()) {
            topicInput = "Object Oriented Programming";
        }
        final String topic = topicInput.trim();
        int count = requestedCount > 0 ? requestedCount : 100;
        if (count > 200) count = 200; // safety ceiling

        List<Map<String, Object>> generatedList = new ArrayList<>();
        String normalized = topic.toLowerCase();

        // 1. Fetch domain-specific curated question bank if matched
        List<QuestionItem> bank = getCuratedBankForTopic(normalized, topic);

        // Add curated questions
        Set<String> seenQuestions = new HashSet<>();
        for (QuestionItem q : bank) {
            if (generatedList.size() >= count) break;
            if (seenQuestions.add(q.question)) {
                generatedList.add(q.toMap(generatedList.size() + 1));
            }
        }

        // 2. If more questions are needed to reach requested count (e.g. 100), dynamically generate them
        if (generatedList.size() < count) {
            List<QuestionItem> dynamicQuestions = generateAlgorithmicQuestions(topic, count - generatedList.size(), generatedList.size() + 1);
            for (QuestionItem q : dynamicQuestions) {
                if (generatedList.size() >= count) break;
                if (seenQuestions.add(q.question)) {
                    generatedList.add(q.toMap(generatedList.size() + 1));
                }
            }
        }

        // Shuffle options slightly or ensure randomized correct answers
        return generatedList;
    }

    public static class QuestionItem {
        public String question;
        public String optionA;
        public String optionB;
        public String optionC;
        public String optionD;
        public String correctAnswer;
        public String explanation;
        public String difficulty;
        public String subTopic;

        public QuestionItem(String question, String a, String b, String c, String d, String correct, String explanation, String difficulty, String subTopic) {
            this.question = question;
            this.optionA = a;
            this.optionB = b;
            this.optionC = c;
            this.optionD = d;
            this.correctAnswer = correct;
            this.explanation = explanation;
            this.difficulty = difficulty;
            this.subTopic = subTopic;
        }

        public Map<String, Object> toMap(int index) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", index);
            map.put("question", this.question);
            map.put("optionA", this.optionA);
            map.put("optionB", this.optionB);
            map.put("optionC", this.optionC);
            map.put("optionD", this.optionD);
            map.put("correctAnswer", this.correctAnswer);
            map.put("explanation", this.explanation);
            map.put("difficulty", this.difficulty != null ? this.difficulty : "Medium");
            map.put("topic", this.subTopic != null ? this.subTopic : "General");
            map.put("marks", 1);
            map.put("generatedBy", "AI-Smart-LMS-Engine");
            return map;
        }
    }

    private List<QuestionItem> getCuratedBankForTopic(String normalized, String originalTopic) {
        List<QuestionItem> list = new ArrayList<>();

        boolean isOOP = normalized.contains("oop") || normalized.contains("object") || normalized.contains("class") ||
                normalized.contains("inherit") || normalized.contains("polymorph") || normalized.contains("encapsul");

        boolean isJava = normalized.contains("java") && !normalized.contains("script");
        boolean isPython = normalized.contains("python");
        boolean isDBMS = normalized.contains("dbms") || normalized.contains("sql") || normalized.contains("database");
        boolean isDSA = normalized.contains("data struct") || normalized.contains("dsa") || normalized.contains("algorithm") || normalized.contains("tree") || normalized.contains("graph");
        boolean isNetwork = normalized.contains("network") || normalized.contains("osi") || normalized.contains("tcp") || normalized.contains("ip");
        boolean isOS = normalized.contains("operating system") || normalized.contains("os") || normalized.contains("process") || normalized.contains("thread");
        boolean isWeb = normalized.contains("web") || normalized.contains("html") || normalized.contains("css") || normalized.contains("react") || normalized.contains("javascript") || normalized.contains("js");

        if (isOOP || isJava) {
            populateOOPQuestions(list);
        }
        if (isJava) {
            populateJavaQuestions(list);
        }
        if (isPython) {
            populatePythonQuestions(list);
        }
        if (isDBMS) {
            populateDBMSQuestions(list);
        }
        if (isDSA) {
            populateDSAQuestions(list);
        }
        if (isNetwork) {
            populateNetworkQuestions(list);
        }
        if (isOS) {
            populateOSQuestions(list);
        }
        if (isWeb) {
            populateWebQuestions(list);
        }

        return list;
    }

    private void populateOOPQuestions(List<QuestionItem> list) {
        list.add(new QuestionItem(
                "Which of the following is NOT one of the four primary pillars of Object-Oriented Programming (OOP)?",
                "Encapsulation", "Polymorphism", "Compilation", "Inheritance",
                "C", "The four fundamental pillars of OOP are Encapsulation, Abstraction, Inheritance, and Polymorphism. Compilation is a build-time process, not an OOP pillar.", "Easy", "OOP Fundamentals"
        ));
        list.add(new QuestionItem(
                "What is the primary purpose of Encapsulation in OOP?",
                "To execute code faster",
                "To bind data and methods operating on that data into a single unit while restricting direct access to internal state",
                "To allow a class to inherit from multiple parent classes",
                "To convert high-level code into bytecode",
                "B", "Encapsulation wraps data (fields) and methods into a single unit (class) and hides direct modification using private access specifiers with getters/setters.", "Easy", "Encapsulation"
        ));
        list.add(new QuestionItem(
                "Which OOP concept enables a single interface or method name to perform different underlying operations based on the calling object?",
                "Encapsulation", "Polymorphism", "Data Hiding", "Composition",
                "B", "Polymorphism (meaning 'many forms') allows methods to have different behaviors at runtime (method overriding) or compile-time (method overloading).", "Easy", "Polymorphism"
        ));
        list.add(new QuestionItem(
                "What is the difference between Method Overloading and Method Overriding?",
                "Overloading occurs at compile-time in the same class; Overriding occurs at runtime between a subclass and superclass",
                "Overloading is runtime polymorphism; Overriding is compile-time polymorphism",
                "Overloading requires the 'override' keyword in all languages; Overriding does not",
                "There is no difference; both terms are interchangeable",
                "A", "Method overloading happens within the same class with different parameter signatures (static/compile-time). Method overriding occurs in inheritance hierarchies with the exact same signature (dynamic/runtime).", "Medium", "Polymorphism"
        ));
        list.add(new QuestionItem(
                "What is Abstraction in Object-Oriented Programming?",
                "Hiding implementation details and showing only the essential features to the user",
                "Combining two dissimilar classes into one",
                "Deleting unused object references automatically",
                "Converting an object into a byte stream",
                "A", "Abstraction focuses on showing WHAT an object does rather than HOW it does it, reducing code complexity through abstract classes and interfaces.", "Easy", "Abstraction"
        ));
        list.add(new QuestionItem(
                "Which of the following correctly describes an Abstract Class?",
                "A class that cannot be instantiated and may contain both abstract and concrete methods",
                "A class with only static variables and no methods",
                "A class that can only be instantiated once using the singleton pattern",
                "A class that must have private constructors only",
                "A", "An abstract class serves as a base template. It cannot be directly instantiated with the 'new' keyword and can contain both abstract (unimplemented) and concrete methods.", "Medium", "Abstraction"
        ));
        list.add(new QuestionItem(
                "What is an Interface in OOP?",
                "A graphical user interface component for button clicks",
                "A contract or blueprint that specifies a set of abstract methods a class must implement",
                "A special database table used for caching objects",
                "A memory pointer linking two heap allocations",
                "B", "An interface defines a contract of behavior without providing implementation (in traditional OOP), guaranteeing that any implementing class satisfies that contract.", "Easy", "Interfaces"
        ));
        list.add(new QuestionItem(
                "What is the 'Diamond Problem' in object-oriented inheritance?",
                "A memory leak caused by recursive object allocation",
                "Ambiguity arising when a subclass inherits from two superclasses that both share a common ancestor",
                "An algorithm for sorting four-sided data structures",
                "An encryption scheme for private member variables",
                "B", "The diamond problem occurs in multiple inheritance when a class inherits from two parent classes that both override a method from a single grandparent class, causing ambiguity.", "Hard", "Inheritance"
        ));
        list.add(new QuestionItem(
                "Why does Java disallow multiple inheritance for classes?",
                "To optimize CPU cache alignment",
                "To avoid the ambiguity and complexities of the Diamond Problem",
                "Because Java does not support interfaces",
                "To prevent circular dependency in the JVM compiler",
                "B", "Java avoids multiple inheritance of state/classes to eliminate Diamond Problem ambiguities, using interfaces to achieve multiple inheritance of type instead.", "Medium", "Inheritance"
        ));
        list.add(new QuestionItem(
                "What is the relationship described by Composition in OOP?",
                "'is-a' relationship",
                "'has-a' relationship with strong lifecycle dependency (part-whole)",
                "'uses-a' temporary association",
                "'knows-about' loose reference",
                "B", "Composition represents a strong 'has-a' relationship where the contained object cannot exist independently of the owner (e.g. A House has Rooms).", "Medium", "Object Relationships"
        ));
        list.add(new QuestionItem(
                "What is the difference between Aggregation and Composition?",
                "In aggregation, the child can exist independently of the parent; in composition, the child's lifecycle is bound to the parent",
                "Aggregation uses inheritance while composition uses pointers",
                "Composition is compile-time while aggregation is runtime",
                "There is no distinction in modern software engineering",
                "A", "Aggregation is weak 'has-a' (e.g. Department and Teacher - teacher exists even if department dissolves), while Composition is strong 'has-a' (e.g. Car and Engine).", "Hard", "Object Relationships"
        ));
        list.add(new QuestionItem(
                "What is the role of a Constructor in an object-oriented language?",
                "To destroy an object and free its memory heap",
                "To initialize the state of a newly created object instance",
                "To compile the source code into binary format",
                "To enforce abstract class inheritance",
                "B", "A constructor is a special method automatically invoked when an object is instantiated using 'new', primarily used to assign initial values to instance variables.", "Easy", "Constructors"
        ));
        list.add(new QuestionItem(
                "Which access modifier provides the most restrictive visibility to a member variable?",
                "public", "protected", "private", "default (package-private)",
                "C", "'private' restricts visibility strictly to within the declaring class itself.", "Easy", "Encapsulation"
        ));
        list.add(new QuestionItem(
                "What does the 'protected' access specifier permit in OOP?",
                "Access from any class in the entire application",
                "Access within the same package and by subclasses in other packages",
                "Access strictly within the declaring class only",
                "Access exclusively by static methods",
                "B", "'protected' allows access within the same package and by derived/child classes even if they reside in different packages.", "Medium", "Encapsulation"
        ));
        list.add(new QuestionItem(
                "What is the 'this' keyword used for in object-oriented programming?",
                "To reference the superclass methods",
                "To refer to the current object instance within an instance method or constructor",
                "To declare a new static constant",
                "To terminate the current thread execution",
                "B", "'this' refers to the current executing instance of the class, commonly used to eliminate shadowing ambiguity between parameters and fields.", "Easy", "OOP Keywords"
        ));
        list.add(new QuestionItem(
                "What is the 'super' keyword used for in Java and similar OOP languages?",
                "To access superclass constructors, methods, and variables from a subclass",
                "To grant administrator privileges to a process",
                "To declare a class as non-inheritable",
                "To create a supercomputer parallel execution thread",
                "A", "'super' refers to the immediate parent class, enabling explicit invocation of superclass constructors or overridden methods.", "Easy", "OOP Keywords"
        ));
        list.add(new QuestionItem(
                "What happens when a method is declared as 'final' in Java?",
                "It cannot be called more than once",
                "It cannot be overridden by any subclass",
                "It must be abstract",
                "It automatically executes on application startup",
                "B", "Declaring a method as 'final' prevents subclasses from overriding it, ensuring its implementation remains immutable.", "Medium", "OOP Keywords"
        ));
        list.add(new QuestionItem(
                "What is Dynamic Method Dispatch in OOP?",
                "Resolving an overridden method call at runtime based on the actual object type",
                "Compiling source code dynamically into machine language",
                "Allocating RAM on demand during garbage collection",
                "Sending asynchronous HTTP requests across web sockets",
                "A", "Dynamic Method Dispatch (Runtime Polymorphism) is the mechanism where the JVM determines which overridden method to execute at runtime based on the actual object instance.", "Hard", "Polymorphism"
        ));
        list.add(new QuestionItem(
                "What is the Single Responsibility Principle (SRP) in SOLID OOP design?",
                "A class should only have one instance running in memory",
                "A class should have one, and only one, reason to change (focused on a single concern)",
                "All methods must return a single primitive value",
                "Inheritance hierarchies must only be single-level deep",
                "B", "SRP states that every module or class should be responsible for a single part of the system's functionality and have only one reason to change.", "Medium", "SOLID Principles"
        ));
        list.add(new QuestionItem(
                "What is the Open/Closed Principle (OCP) in OOP?",
                "Software entities should be open for extension, but closed for modification",
                "Files must be opened before writing and closed immediately after",
                "All classes should be publicly open with no closed/private fields",
                "Database connections should remain open permanently",
                "A", "The Open/Closed Principle states that you should be able to extend a class's behavior (via inheritance, polymorphism, or strategies) without modifying its source code.", "Medium", "SOLID Principles"
        ));
        list.add(new QuestionItem(
                "What does Liskov Substitution Principle (LSP) require?",
                "Subclasses must be substitutable for their base classes without altering program correctness",
                "Every interface must be substituted with an abstract class",
                "Memory pointers must be replaced by direct object references",
                "Variables should always use dynamic typing instead of static typing",
                "A", "LSP guarantees that objects of a superclass can be replaced with objects of a subclass without breaking application behavior or violating expectations.", "Hard", "SOLID Principles"
        ));
        list.add(new QuestionItem(
                "What is Interface Segregation Principle (ISP)?",
                "Clients should not be forced to depend on interfaces they do not use (prefer small, role-specific interfaces)",
                "All interfaces must be kept in a separate isolated namespace",
                "An interface can never inherit from another interface",
                "Only one interface is allowed per project",
                "A", "ISP encourages creating fine-grained, client-specific interfaces rather than large, monolithic 'fat' interfaces.", "Medium", "SOLID Principles"
        ));
        list.add(new QuestionItem(
                "What is Dependency Inversion Principle (DIP)?",
                "High-level modules should not depend on low-level modules; both should depend on abstractions",
                "Parent classes must depend on their subclasses for implementation details",
                "Database queries should be inverted for indexing performance",
                "Libraries must be loaded in reverse chronological order",
                "A", "DIP decouples software modules by having high-level business logic depend on abstractions (interfaces) rather than concrete implementations.", "Hard", "SOLID Principles"
        ));
        list.add(new QuestionItem(
                "What is a Copy Constructor?",
                "A constructor that creates a new object as a copy of an existing object",
                "A tool that copies class files to another directory",
                "A constructor that duplicates bytecode during class loading",
                "A static method that duplicates database rows",
                "A", "A copy constructor initializes a new object using the values of another object of the same class (e.g., Complex(const Complex &c)).", "Medium", "Constructors"
        ));
        list.add(new QuestionItem(
                "What is the difference between Shallow Copy and Deep Copy?",
                "Shallow copy copies reference addresses; Deep copy creates duplicates of both the object and all nested dynamically allocated objects",
                "Shallow copy works on primitives; Deep copy only works on strings",
                "Deep copy is performed at compile-time; Shallow copy is performed at runtime",
                "There is no difference in garbage-collected languages",
                "A", "Shallow copy duplicates top-level fields only (sharing nested references), whereas Deep copy recursively clones all referenced objects, preventing shared state side effects.", "Hard", "Memory & Objects"
        ));
    }

    private void populateJavaQuestions(List<QuestionItem> list) {
        list.add(new QuestionItem(
                "Which memory area in JVM stores class metadata, static variables, and method bytecode?",
                "Heap Memory", "Stack Memory", "Metaspace / Method Area", "Program Counter Register",
                "C", "In Java 8+, Metaspace (part of native memory, replacing PermGen) stores class definitions, bytecode, constant pool, and static variables.", "Medium", "JVM Architecture"
        ));
        list.add(new QuestionItem(
                "What is the difference between '==' and '.equals()' when comparing objects in Java?",
                "'==' compares reference memory addresses, while '.equals()' compares value equality based on implementation",
                "'==' checks value equality while '.equals()' checks object types",
                "Both are identical for all reference types",
                "'.equals()' only works with primitive numbers",
                "A", "'==' checks if two references point to the exact same memory location, whereas '.equals()' is a method that can be overridden (e.g. in String) to compare logical contents.", "Easy", "Java Fundamentals"
        ));
        list.add(new QuestionItem(
                "Why is the String class immutable in Java?",
                "For security, thread safety, String Pool caching, and hash code caching",
                "Because Java does not support character arrays",
                "To prevent JVM garbage collection from cleaning up strings",
                "Because strings are stored in CPU registers only",
                "A", "String immutability ensures security in network/database connections, enables String Pool optimization, guarantees thread safety without synchronization, and caches hashCode.", "Medium", "Java Core"
        ));
        list.add(new QuestionItem(
                "Which collection class in Java is synchronized and thread-safe by default?",
                "ArrayList", "Vector", "HashSet", "HashMap",
                "B", "Vector (and Hashtable) has synchronized methods making it thread-safe by default, whereas ArrayList is unsynchronized for higher single-threaded performance.", "Medium", "Collections"
        ));
        list.add(new QuestionItem(
                "What is the time complexity of retrieving an element by key in an ideal HashMap?",
                "O(1)", "O(log n)", "O(n)", "O(n²)",
                "A", "A HashMap provides average O(1) constant time lookup via hash calculation and bucket indexing.", "Easy", "Collections"
        ));
    }

    private void populateDBMSQuestions(List<QuestionItem> list) {
        list.add(new QuestionItem(
                "What does ACID stand for in Database Management Systems?",
                "Atomicity, Consistency, Isolation, Durability",
                "Accuracy, Concurrency, Integrity, Distribution",
                "Access, Control, Indexing, Deletion",
                "Allocation, Clustering, Isolation, Data",
                "A", "ACID properties (Atomicity, Consistency, Isolation, Durability) guarantee that database transactions are processed reliably.", "Easy", "DBMS Transactions"
        ));
        list.add(new QuestionItem(
                "Which Normal Form eliminates transitive functional dependencies?",
                "1NF (First Normal Form)", "2NF (Second Normal Form)", "3NF (Third Normal Form)", "BCNF",
                "C", "3NF requires the table to be in 2NF and have no non-prime attribute transitively dependent on the primary key.", "Medium", "Normalization"
        ));
        list.add(new QuestionItem(
                "What is the difference between DELETE and TRUNCATE in SQL?",
                "DELETE is DML, can be filtered with WHERE and rolled back; TRUNCATE is DDL, removes all rows rapidly and cannot be filtered",
                "TRUNCATE deletes the table schema definition completely",
                "DELETE cannot be logged in transaction logs",
                "There is no difference in MySQL",
                "A", "DELETE is a DML statement with row-by-row logging and WHERE filtering. TRUNCATE is a DDL operation that deallocates table pages and resets auto-increment counters.", "Medium", "SQL Operations"
        ));
        list.add(new QuestionItem(
                "What type of JOIN returns all records from the left table and matched records from the right table?",
                "INNER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "FULL OUTER JOIN",
                "B", "LEFT JOIN (or LEFT OUTER JOIN) returns all records from the left table, and the matched records from the right table (with NULLs for unmatched rows).", "Easy", "SQL Joins"
        ));
        list.add(new QuestionItem(
                "What is a Primary Key constraint in relational databases?",
                "A column or combination of columns that uniquely identifies each record and does NOT allow NULL values",
                "A foreign reference to an external table",
                "A clustered index allowing duplicate values",
                "A field holding encrypted password hashes only",
                "A", "A primary key uniquely identifies each entity tuple and strictly disallows duplicate values and NULLs.", "Easy", "DBMS Constraints"
        ));
    }

    private void populateDSAQuestions(List<QuestionItem> list) {
        list.add(new QuestionItem(
                "What is the worst-case time complexity of QuickSort?",
                "O(n log n)", "O(n²)", "O(n)", "O(log n)",
                "B", "QuickSort degrades to O(n²) when the pivot selection is unbalanced (e.g. already sorted array with first/last element chosen as pivot).", "Medium", "Sorting Algorithms"
        ));
        list.add(new QuestionItem(
                "Which data structure follows the LIFO (Last In First Out) principle?",
                "Queue", "Stack", "Linked List", "Binary Heap",
                "B", "A Stack operates on LIFO (Last-In, First-Out), supporting push and pop operations.", "Easy", "Data Structures"
        ));
        list.add(new QuestionItem(
                "What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?",
                "O(1)", "O(log n)", "O(n)", "O(n log n)",
                "B", "In a balanced BST (like AVL or Red-Black Tree), search time is proportional to height: O(log n).", "Easy", "Trees"
        ));
        list.add(new QuestionItem(
                "Which graph traversal algorithm uses a Queue data structure?",
                "Depth First Search (DFS)", "Breadth First Search (BFS)", "Dijkstra with Array", "Kruskal Algorithm",
                "B", "BFS explores nodes level-by-level using a FIFO Queue.", "Easy", "Graph Algorithms"
        ));
        list.add(new QuestionItem(
                "What is the primary advantage of a Doubly Linked List over a Singly Linked List?",
                "Lower memory usage per node",
                "Ability to traverse in both forward and backward directions with O(1) deletion of known node",
                "Automatic sorting on insertion",
                "Random O(1) index access",
                "B", "Doubly linked lists store both 'next' and 'prev' pointers, allowing bidirectional traversal and constant-time node removal when pointer is given.", "Medium", "Linked Lists"
        ));
    }

    private void populateNetworkQuestions(List<QuestionItem> list) {
        list.add(new QuestionItem(
                "Which layer of the OSI model is responsible for end-to-end reliable transmission, flow control, and error recovery?",
                "Network Layer (Layer 3)", "Transport Layer (Layer 4)", "Data Link Layer (Layer 2)", "Session Layer (Layer 5)",
                "B", "The Transport Layer (Layer 4, e.g. TCP/UDP) provides end-to-end communication, segmentation, flow control, and reliability.", "Easy", "OSI Model"
        ));
        list.add(new QuestionItem(
                "What is the main difference between TCP and UDP?",
                "TCP is connection-oriented, reliable, and uses 3-way handshake; UDP is connectionless, fast, and does not guarantee delivery",
                "UDP is encrypted while TCP is plain text",
                "TCP operates at Layer 7 while UDP operates at Layer 2",
                "There is no difference in modern internet routers",
                "A", "TCP guarantees ordered, reliable delivery via acknowledgments and handshakes; UDP prioritizes low latency without delivery confirmation.", "Easy", "Protocols"
        ));
        list.add(new QuestionItem(
                "What is the default port number for HTTPS (HTTP Secure)?",
                "80", "8080", "443", "22",
                "C", "HTTPS standard secure port is 443; HTTP uses port 80; SSH uses port 22.", "Easy", "Networking Ports"
        ));
    }

    private void populateOSQuestions(List<QuestionItem> list) {
        list.add(new QuestionItem(
                "What are the four Coffman conditions necessary for a Deadlock to occur in an Operating System?",
                "Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait",
                "Paging, Segmentation, Swapping, Fragmentation",
                "CPU Scheduling, Memory Allocation, I/O Polling, Interrupts",
                "Atomicity, Consistency, Isolation, Durability",
                "A", "Deadlock requires all four Coffman conditions: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.", "Hard", "Deadlocks"
        ));
        list.add(new QuestionItem(
                "What is the primary difference between a Process and a Thread?",
                "A process has its own independent address space; threads within the same process share the same memory space",
                "A process is created by the CPU hardware while a thread is software only",
                "A thread has higher priority than any process",
                "Threads cannot run concurrently on multi-core processors",
                "A", "A process is an executing program with isolated memory. Threads are lightweight execution units within a process sharing heap memory and resources.", "Medium", "Processes & Threads"
        ));
    }

    private void populatePythonQuestions(List<QuestionItem> list) {
        list.add(new QuestionItem(
                "In Python, what is the purpose of the '__init__' method?",
                "It serves as the class constructor to initialize a newly created instance",
                "It deletes an object from memory",
                "It converts a string to an integer",
                "It imports external modules dynamically",
                "A", "'__init__' is the constructor method in Python classes, called automatically when creating an object.", "Easy", "Python OOP"
        ));
        list.add(new QuestionItem(
                "What is the difference between a Python List and a Tuple?",
                "Lists are mutable (can be changed); Tuples are immutable (cannot be changed after creation)",
                "Tuples can only store numbers while lists store all types",
                "Lists are declared with parentheses () while tuples use brackets []",
                "Lists are sorted automatically",
                "A", "Lists in Python are mutable [] while Tuples are immutable () and consume less memory.", "Easy", "Python Data Types"
        ));
    }

    private void populateWebQuestions(List<QuestionItem> list) {
        list.add(new QuestionItem(
                "In React, what is the primary purpose of the 'useEffect' hook?",
                "To manage side effects like data fetching, subscriptions, and DOM updates",
                "To store persistent global state across sessions",
                "To compile JSX into HTML strings",
                "To replace standard CSS stylesheets",
                "A", "'useEffect' handles component lifecycle side-effects in functional components (mounting, updating, unmounting).", "Easy", "React"
        ));
        list.add(new QuestionItem(
                "What does the HTTP 401 status code indicate?",
                "Bad Request", "Unauthorized (Authentication is required or invalid)", "Forbidden", "Internal Server Error",
                "B", "401 Unauthorized indicates the request requires user authentication or provided credentials were invalid.", "Easy", "REST API"
        ));
    }

    /**
     * Algorithmic generator that dynamically synthesizes unique, realistic questions
     * across different concept patterns to ensure at least 100+ questions for ANY topic.
     */
    private List<QuestionItem> generateAlgorithmicQuestions(String topic, int neededCount, int startIdx) {
        List<QuestionItem> list = new ArrayList<>();

        String[] subdimensions = new String[]{
                "Core Concepts & Architecture",
                "Syntax, Rules & Execution",
                "Best Practices & Design Patterns",
                "Performance & Optimization",
                "Exception Handling & Robustness",
                "Lifecycle & Memory Management",
                "Security & Access Control",
                "Practical Implementation Scenarios",
                "Debugging & Troubleshooting",
                "Scalability & Concurrency"
        };

        String[][] templates = new String[][]{
                // Template 1
                {
                        "When applying %s in enterprise software architecture, what is the primary design benefit?",
                        "Improved modularity, maintainability, and code reusability across components",
                        "Guaranteed zero memory footprint during runtime execution",
                        "Elimination of all need for unit testing and automated QA",
                        "Converting synchronous network calls to hardware registers",
                        "A",
                        "Applying %s establishes structured separation of concerns, higher modularity, and easier code maintainability.",
                        "Medium"
                },
                // Template 2
                {
                        "Which of the following represents a common anti-pattern when working with %s?",
                        "Tightly coupling unrelated business modules and violating single responsibility",
                        "Writing clear automated unit tests with high assertion coverage",
                        "Using well-defined interfaces and dependency injection",
                        "Documenting method signatures and expected error states",
                        "A",
                        "Tight coupling and monolithic responsibility violate good engineering design when implementing %s.",
                        "Medium"
                },
                // Template 3
                {
                        "In modern systems engineering, how does %s contribute to system scalability?",
                        "By enabling decoupled components that can scale and evolve independently",
                        "By forcing all operations to run on a single CPU core",
                        "By preventing concurrent database reads",
                        "By hardcoding configuration parameters directly into source files",
                        "A",
                        "Decoupling and modular abstractions in %s allow individual services or modules to scale independently.",
                        "Hard"
                },
                // Template 4
                {
                        "What is a critical consideration for thread safety and concurrency in %s?",
                        "Preventing race conditions on shared mutable state using synchronization or immutability",
                        "Disallowing multi-core processors from accessing memory",
                        "Running all background processes with root permissions",
                        "Increasing network bandwidth instead of checking locks",
                        "A",
                        "Managing shared mutable state via proper synchronization, locks, or immutable structures ensures thread safety in %s.",
                        "Hard"
                },
                // Template 5
                {
                        "How should exceptions and unexpected errors be handled when designing %s solutions?",
                        "Catch specific exceptions, log meaningful context, and fail gracefully or recover cleanly",
                        "Silently swallow all exceptions in an empty catch block",
                        "Terminate the entire operating system on the first caught warning",
                        "Ignore error boundaries and assume all network packets arrive uncorrupted",
                        "A",
                        "Graceful recovery, meaningful logging, and structured error boundaries are essential best practices in %s.",
                        "Easy"
                },
                // Template 6
                {
                        "Which principle is fundamental when designing clean interfaces and abstractions in %s?",
                        "Exposing minimal, intuitive public APIs while hiding complex internal mechanics",
                        "Making all private variables globally accessible from any package",
                        "Writing all application code inside a single monolithic class",
                        "Renaming variables to single arbitrary letters to save file size",
                        "A",
                        "Clean API design and encapsulation in %s ensure users interact with simple contracts while internals remain protected.",
                        "Easy"
                },
                // Template 7
                {
                        "What is the expected behavior when performance bottlenecks occur in %s workloads?",
                        "Profiling memory allocation and CPU cycles to optimize hotspot algorithms and indexing",
                        "Ignoring metrics and restarting the server every 10 minutes",
                        "Deleting database constraints to make inserts faster",
                        "Disabling encryption on all client-server communication",
                        "A",
                        "Systematic profiling, benchmarking, and identifying algorithmic bottlenecks optimize performance in %s.",
                        "Medium"
                },
                // Template 8
                {
                        "In unit testing %s components, what is the primary purpose of Mocking and Stubbing?",
                        "To isolate the unit under test by simulating external dependencies and predicting outputs",
                        "To slow down the test execution time for accurate simulation",
                        "To replace the compiler with runtime interpreter bytecode",
                        "To bypass authentication security checks in production",
                        "A",
                        "Mocking isolates specific business units in %s, verifying logic independently of external databases or APIs.",
                        "Medium"
                },
                // Template 9
                {
                        "Which security practice is most critical when processing user inputs within %s applications?",
                        "Strict validation, sanitization, and parameterized execution to prevent injection attacks",
                        "Directly concatenating untrusted raw input into executable queries",
                        "Storing sensitive keys and plain-text passwords in public repositories",
                        "Disabling HTTPS and using unencrypted plaintext HTTP headers",
                        "A",
                        "Input sanitization, parameterized queries, and defensive programming prevent security vulnerabilities in %s.",
                        "Medium"
                },
                // Template 10
                {
                        "Why is loose coupling preferred over tight coupling when implementing %s architectures?",
                        "Changes to one module do not unexpectedly break dependent modules, simplifying refactoring",
                        "Tight coupling makes code compile 100 times faster",
                        "Loose coupling prevents any class from ever being garbage collected",
                        "Loose coupling removes the need for object constructors",
                        "A",
                        "Loose coupling isolates component changes and minimizes side effects during refactoring in %s.",
                        "Easy"
                }
        };

        // Generate dynamic variations
        int index = 1;
        while (list.size() < neededCount && list.size() < 250) {
            for (int t = 0; t < templates.length; t++) {
                if (list.size() >= neededCount) break;

                String sub = subdimensions[(index - 1) % subdimensions.length];
                String[] template = templates[t];

                String qText = String.format(template[0], topic + " (" + sub + " Part " + ((index / 10) + 1) + ")");
                String optA = template[1];
                String optB = String.format(template[2], topic);
                String optC = String.format(template[3], topic);
                String optD = String.format(template[4], topic);
                String explanation = String.format(template[6], topic);
                String diff = template[7];

                // Randomize option order so correct answer isn't always 'A'
                String[] options = new String[]{optA, optB, optC, optD};
                int targetCorrectIndex = (index % 4); // 0=A, 1=B, 2=C, 3=D

                // Swap option 0 (correct answer) with targetCorrectIndex
                if (targetCorrectIndex != 0) {
                    String temp = options[targetCorrectIndex];
                    options[targetCorrectIndex] = options[0];
                    options[0] = temp;
                }

                String correctLetter = targetCorrectIndex == 0 ? "A" : targetCorrectIndex == 1 ? "B" : targetCorrectIndex == 2 ? "C" : "D";

                list.add(new QuestionItem(
                        qText,
                        options[0],
                        options[1],
                        options[2],
                        options[3],
                        correctLetter,
                        explanation,
                        diff,
                        sub
                ));

                index++;
            }
        }

        return list;
    }
}
