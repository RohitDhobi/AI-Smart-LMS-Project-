/**
 * Seed sample lessons for the Java Programming course.
 *
 * Usage:
 *   node seed-lessons.js
 *
 * Requires the backend server running at http://localhost:8080
 */

const BASE = "http://localhost:8080/api";

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...opts.headers };
  const { headers: _, ...rest } = opts;
  const res = await fetch(`${BASE}${path}`, { ...rest, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

// ---- Login as admin ----

async function loginAsAdmin() {
  // Try to login first
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "seedadmin@test.com",
        password: "seed1234",
      }),
    });
    if (data.token) return data.token;
  } catch {}

  // If login fails, register a new admin
  const data = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Seed Admin",
      email: "seedadmin@test.com",
      password: "seed1234",
      role: "ADMIN",
    }),
  });
  return data.token;
}

// ---- Find Java Programming course ----

async function findJavaCourse(token) {
  const courses = await api("/courses", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return courses.find(
    (c) =>
      c.title?.toLowerCase().includes("java") ||
      c.courseName?.toLowerCase().includes("java") ||
      c.courseCode?.toLowerCase() === "java"
  );
}

// ---- Sample lessons for Java Programming ----

const JAVA_LESSONS = [
  {
    title: "Introduction to Java",
    description:
      "Learn what Java is, its history, and why it's one of the most popular programming languages.",
    content: `# Introduction to Java

## What is Java?

Java is a high-level, object-oriented programming language developed by Sun Microsystems (now Oracle) in 1995. It is designed to be platform-independent, following the principle of "Write Once, Run Anywhere" (WORA).

## Key Features of Java

- **Platform Independent**: Java code can run on any device that has a Java Virtual Machine (JVM).
- **Object-Oriented**: Java follows OOP principles like encapsulation, inheritance, and polymorphism.
- **Robust**: Java has strong memory management and exception handling.
- **Secure**: Java provides built-in security features like bytecode verification.
- **Multi-threaded**: Java supports concurrent execution of threads.

## Setting Up Java Development Environment

1. Download and install the JDK (Java Development Kit) from Oracle or OpenJDK.
2. Set up JAVA_HOME environment variable.
3. Install an IDE like IntelliJ IDEA, Eclipse, or VS Code.

## Your First Java Program

\`\`\`java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`

## How Java Programs Work

1. You write source code in a \`.java\` file.
2. The compiler (\`javac\`) converts it to bytecode (\`.class\` file).
3. The JVM executes the bytecode on any platform.`,
    lessonOrder: 1,
    durationMinutes: 30,
  },
  {
    title: "Variables and Data Types",
    description:
      "Understand Java variables, primitive data types, and type casting.",
    content: `# Variables and Data Types

## What is a Variable?

A variable is a named storage location in memory that holds a value. In Java, every variable has a type.

## Declaring Variables

\`\`\`java
int age = 25;
double salary = 50000.50;
String name = "Rohit";
boolean isActive = true;
char grade = 'A';
\`\`\`

## Primitive Data Types

| Type    | Size   | Default | Example          |
|---------|--------|---------|------------------|
| byte    | 1 byte | 0       | \`byte b = 100;\`  |
| short   | 2 bytes| 0       | \`short s = 3000;\`|
| int     | 4 bytes| 0       | \`int i = 100000;\`|
| long    | 8 bytes| 0L      | \`long l = 99999L;\`|
| float   | 4 bytes| 0.0f    | \`float f = 3.14f;\`|
| double  | 8 bytes| 0.0     | \`double d = 3.14;\`|
| char    | 2 bytes| '\\u0000'| \`char c = 'A';\`  |
| boolean | 1 bit  | false   | \`boolean b = true;\`|

## Type Casting

### Widening (Automatic)
\`\`\`java
int num = 100;
double result = num;  // int → double (automatic)
\`\`\`

### Narrowing (Manual)
\`\`\`java
double num = 100.99;
int result = (int) num;  // double → int (manual, loses decimal)
\`\`\`

## Constants

\`\`\`java
final double PI = 3.14159;
\`\`\`

Use \`final\` keyword to make a variable constant (cannot be changed).`,
    lessonOrder: 2,
    durationMinutes: 35,
  },
  {
    title: "Operators in Java",
    description:
      "Master arithmetic, relational, logical, and assignment operators.",
    content: `# Operators in Java

## Arithmetic Operators

| Operator | Description | Example           |
|----------|-------------|-------------------|
| +        | Addition    | \`5 + 3 = 8\`       |
| -        | Subtraction | \`5 - 3 = 2\`       |
| *        | Multiplication | \`5 * 3 = 15\`  |
| /        | Division    | \`6 / 3 = 2\`       |
| %        | Modulus     | \`7 % 3 = 1\`       |

## Relational Operators

| Operator | Description         | Example           |
|----------|---------------------|-------------------|
| ==       | Equal to            | \`5 == 5\` → true  |
| !=       | Not equal to        | \`5 != 3\` → true  |
| >        | Greater than        | \`5 > 3\` → true   |
| <        | Less than           | \`5 < 3\` → false  |
| >=       | Greater than or equal | \`5 >= 5\` → true|
| <=       | Less than or equal  | \`5 <= 3\` → false |

## Logical Operators

| Operator | Description | Example                      |
|----------|-------------|------------------------------|
| &&       | Logical AND | \`true && false\` → false     |
| \\|\\|     | Logical OR  | \`true \\|\\| false\` → true     |
| !        | Logical NOT | \`!true\` → false             |

## Assignment Operators

\`\`\`java
int x = 10;
x += 5;   // x = x + 5 → 15
x -= 3;   // x = x - 3 → 12
x *= 2;   // x = x * 2 → 24
x /= 4;   // x = x / 4 → 6
x %= 4;   // x = x % 4 → 2
\`\`\`

## Ternary Operator

\`\`\`java
int max = (a > b) ? a : b;
\`\`\``,
    lessonOrder: 3,
    durationMinutes: 25,
  },
  {
    title: "Control Flow - If/Else and Switch",
    description:
      "Learn conditional statements to control program execution flow.",
    content: `# Control Flow - If/Else and Switch

## if Statement

\`\`\`java
int age = 20;

if (age >= 18) {
    System.out.println("You are an adult.");
}
\`\`\`

## if-else Statement

\`\`\`java
int marks = 75;

if (marks >= 60) {
    System.out.println("Passed!");
} else {
    System.out.println("Failed.");
}
\`\`\`

## if-else if-else Ladder

\`\`\`java
int marks = 85;

if (marks >= 90) {
    System.out.println("Grade: A+");
} else if (marks >= 80) {
    System.out.println("Grade: A");
} else if (marks >= 70) {
    System.out.println("Grade: B");
} else if (marks >= 60) {
    System.out.println("Grade: C");
} else {
    System.out.println("Grade: F");
}
\`\`\`

## Nested if

\`\`\`java
if (age >= 18) {
    if (hasID) {
        System.out.println("Welcome!");
    } else {
        System.out.println("Please show your ID.");
    }
}
\`\`\`

## switch Statement

\`\`\`java
int day = 3;

switch (day) {
    case 1:
        System.out.println("Monday");
        break;
    case 2:
        System.out.println("Tuesday");
        break;
    case 3:
        System.out.println("Wednesday");
        break;
    default:
        System.out.println("Other day");
        break;
}
\`\`\`

## Switch with Strings (Java 7+)

\`\`\`java
String fruit = "apple";

switch (fruit) {
    case "apple":
        System.out.println("Red fruit");
        break;
    case "banana":
        System.out.println("Yellow fruit");
        break;
    default:
        System.out.println("Unknown fruit");
}
\`\`\``,
    lessonOrder: 4,
    durationMinutes: 30,
  },
  {
    title: "Loops - For, While, Do-While",
    description:
      "Master different types of loops for repetitive tasks.",
    content: `# Loops - For, While, Do-While

## for Loop

\`\`\`java
for (int i = 1; i <= 10; i++) {
    System.out.println("Number: " + i);
}
\`\`\`

### Parts of for loop:
1. **Initialization**: \`int i = 1\` (runs once)
2. **Condition**: \`i <= 10\` (checked before each iteration)
3. **Increment**: \`i++\` (runs after each iteration)

## Enhanced for Loop (for-each)

\`\`\`java
int[] numbers = {10, 20, 30, 40, 50};

for (int num : numbers) {
    System.out.println(num);
}
\`\`\`

## while Loop

\`\`\`java
int count = 1;

while (count <= 5) {
    System.out.println("Count: " + count);
    count++;
}
\`\`\`

## do-while Loop

\`\`\`java
int num = 1;

do {
    System.out.println("Number: " + num);
    num++;
} while (num <= 5);
\`\`\`

**Key difference**: do-while executes at least once, even if the condition is false.

## break and continue

### break - Exit the loop
\`\`\`java
for (int i = 1; i <= 10; i++) {
    if (i == 5) break;
    System.out.println(i);
}
// Output: 1 2 3 4
\`\`\`

### continue - Skip current iteration
\`\`\`java
for (int i = 1; i <= 10; i++) {
    if (i % 2 == 0) continue;
    System.out.println(i);
}
// Output: 1 3 5 7 9
\`\`\`

## Nested Loops

\`\`\`java
for (int i = 1; i <= 3; i++) {
    for (int j = 1; j <= 3; j++) {
        System.out.print(i * j + "\\t");
    }
    System.out.println();
}
\`\`\``,
    lessonOrder: 5,
    durationMinutes: 35,
  },
  {
    title: "Arrays in Java",
    description:
      "Learn how to create, access, and manipulate arrays in Java.",
    content: `# Arrays in Java

## What is an Array?

An array is a collection of elements of the same type stored in contiguous memory locations.

## Declaring and Initializing Arrays

\`\`\`java
// Method 1: Declare and allocate
int[] numbers = new int[5];

// Method 2: Declare and initialize
int[] numbers = {10, 20, 30, 40, 50};

// Method 3: Separate declaration and initialization
int[] numbers;
numbers = new int[]{10, 20, 30};
\`\`\`

## Accessing Array Elements

\`\`\`java
int[] arr = {10, 20, 30, 40, 50};

System.out.println(arr[0]);  // 10 (first element)
System.out.println(arr[4]);  // 50 (last element)
System.out.println(arr.length); // 5 (array size)
\`\`\`

## Modifying Array Elements

\`\`\`java
int[] arr = {10, 20, 30};
arr[1] = 25;  // arr is now {10, 25, 30}
\`\`\`

## Iterating Through Arrays

### Using for loop
\`\`\`java
for (int i = 0; i < arr.length; i++) {
    System.out.println(arr[i]);
}
\`\`\`

### Using for-each loop
\`\`\`java
for (int num : arr) {
    System.out.println(num);
}
\`\`\`

## Common Array Operations

### Find Maximum
\`\`\`java
int max = arr[0];
for (int num : arr) {
    if (num > max) max = num;
}
\`\`\`

### Sum of Elements
\`\`\`java
int sum = 0;
for (int num : arr) {
    sum += num;
}
\`\`\`

### Reverse an Array
\`\`\`java
for (int i = 0; i < arr.length / 2; i++) {
    int temp = arr[i];
    arr[i] = arr[arr.length - 1 - i];
    arr[arr.length - 1 - i] = temp;
}
\`\`\`

## Multi-dimensional Arrays

\`\`\`java
int[][] matrix = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};

System.out.println(matrix[1][2]); // 6
\`\`\``,
    lessonOrder: 6,
    durationMinutes: 40,
  },
  {
    title: "Methods (Functions) in Java",
    description:
      "Understand how to define and call methods, parameters, and return types.",
    content: `# Methods (Functions) in Java

## What is a Method?

A method is a block of code that performs a specific task. It belongs to a class and can be called to execute its code.

## Method Syntax

\`\`\`java
accessModifier returnType methodName(parameters) {
    // method body
    return value; // if returnType is not void
}
\`\`\`

## Method with No Parameters and No Return

\`\`\`java
public void greet() {
    System.out.println("Hello, World!");
}
\`\`\`

## Method with Parameters

\`\`\`java
public void greet(String name) {
    System.out.println("Hello, " + name + "!");
}
\`\`\`

## Method with Return Value

\`\`\`java
public int add(int a, int b) {
    return a + b;
}

// Usage
int result = add(5, 3); // result = 8
\`\`\`

## Method Overloading

Same method name but different parameters:

\`\`\`java
public int add(int a, int b) {
    return a + b;
}

public double add(double a, double b) {
    return a + b;
}

public int add(int a, int b, int c) {
    return a + b + c;
}
\`\`\`

## static Methods

Called without creating an object:

\`\`\`java
public class Calculator {
    public static int add(int a, int b) {
        return a + b;
    }
}

// Usage
int result = Calculator.add(5, 3);
\`\`\`

## Pass by Value

Java is always pass-by-value:
- **Primitives**: Copy of the value is passed
- **Objects**: Copy of the reference is passed

\`\`\`java
public void changeValue(int num) {
    num = 100;  // Does NOT affect original
}
\`\`\`

## Recursion

A method that calls itself:

\`\`\`java
public int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
\`\`\``,
    lessonOrder: 7,
    durationMinutes: 35,
  },
  {
    title: "Object-Oriented Programming Basics",
    description:
      "Learn the fundamentals of OOP - classes, objects, constructors, and methods.",
    content: `# Object-Oriented Programming Basics

## What is OOP?

Object-Oriented Programming is a paradigm based on the concept of "objects" that contain data (attributes) and code (methods).

## Class and Object

### Class (Blueprint)
\`\`\`java
public class Student {
    // Attributes (instance variables)
    String name;
    int age;
    double gpa;

    // Method
    void displayInfo() {
        System.out.println(name + " - Age: " + age + " - GPA: " + gpa);
    }
}
\`\`\`

### Object (Instance)
\`\`\`java
Student s1 = new Student();
s1.name = "Rohit";
s1.age = 20;
s1.gpa = 8.5;
s1.displayInfo();
\`\`\`

## Constructors

A special method called when creating an object:

\`\`\`java
public class Student {
    String name;
    int age;

    // Default constructor
    public Student() {
        name = "Unknown";
        age = 0;
    }

    // Parameterized constructor
    public Student(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

Student s1 = new Student("Rohit", 20);
\`\`\`

## this Keyword

Refers to the current object:

\`\`\`java
public class Student {
    String name;

    public Student(String name) {
        this.name = name;  // 'this' distinguishes instance var from parameter
    }
}
\`\`\`

## Getters and Setters

\`\`\`java
public class Student {
    private String name;
    private int age;

    // Getter
    public String getName() {
        return name;
    }

    // Setter
    public void setName(String name) {
        this.name = name;
    }
}
\`\`\`

## Encapsulation

Making fields private and providing public getters/setters:

\`\`\`java
public class BankAccount {
    private double balance;

    public double getBalance() {
        return balance;
    }

    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        }
    }
}
\`\`\`

## static Members

Shared across all objects:

\`\`\`java
public class Student {
    static int totalStudents = 0;
    String name;

    public Student(String name) {
        this.name = name;
        totalStudents++;
    }
}

Student s1 = new Student("Rohit");
Student s2 = new Student("Priya");
System.out.println(Student.totalStudents); // 2
\`\`\``,
    lessonOrder: 8,
    durationMinutes: 45,
  },
];

// ---- Main ----

async function main() {
  console.log("🔑 Logging in as admin...");
  const token = await loginAsAdmin();
  console.log("✅ Logged in successfully!\n");

  console.log("🔍 Finding Java Programming course...");
  const course = await findJavaCourse(token);
  if (!course) {
    console.error("❌ Java Programming course not found!");
    process.exit(1);
  }
  console.log(`✅ Found course: ${course.title} (ID: ${course.id})\n`);

  console.log("📚 Creating lessons...\n");

  for (const lesson of JAVA_LESSONS) {
    try {
      const created = await api(`/lessons/course/${course.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(lesson),
      });
      console.log(
        `  ✅ Lesson ${created.lessonOrder}: ${created.title} (ID: ${created.id})`
      );
    } catch (err) {
      console.error(
        `  ❌ Failed to create "${lesson.title}": ${err.message}`
      );
    }
  }

  console.log("\n🎉 Done! Check the Student Learning page to see the lessons.");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
