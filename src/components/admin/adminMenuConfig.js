import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  ClipboardCheck,
  ClipboardList,
  BarChart3,
  Award,
  Bell,
  MessageSquare,
  Bot,
  Settings,
  Shield,
  User,
  LogOut,
  Megaphone,
  TrendingUp,
  Lightbulb,
  BarChart,
  FileBarChart,
  BookMarked,
  FolderOpen,
  Target,
  Trophy,
  Headphones,
  Brain,
  Sparkles,
  PieChart,
  ScrollText,
  Calendar,
  Code2,
} from "lucide-react";

// =====================================================
// ADMIN SIDEBAR NAVIGATION CONFIGURATION
// =====================================================
// All features are now connected to working pages.

const adminMenuItems = [
  {
    section: "MAIN",
    items: [
      {
        label: "Dashboard",
        path: "/admin",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        label: "Analytics",
        path: "/admin/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    section: "USER MANAGEMENT",
    items: [
      {
        label: "Students",
        path: "/admin/students",
        icon: Users,
      },
      {
        label: "Instructors",
        path: "/admin/teachers",
        icon: GraduationCap,
      },
      {
        label: "Roles & Permissions",
        path: "/admin/roles",
        icon: Shield,
      },
    ],
  },
  {
    section: "ACADEMIC",
    items: [
      {
        label: "Courses",
        path: "/admin/courses",
        icon: BookOpen,
      },
      {
        label: "Semesters",
        path: "/admin/semesters",
        icon: Calendar,
      },
      {
        label: "Subjects",
        path: "/admin/subjects",
        icon: BookMarked,
      },
      {
        label: "Lessons",
        path: "/admin/lessons",
        icon: FileText,
      },
      {
        label: "Categories",
        path: "/admin/categories",
        icon: FolderOpen,
      },
      {
        label: "Resources",
        path: "/admin/resources",
        icon: FolderOpen,
      },
    ],
  },
  {
    section: "ASSESSMENTS",
    items: [
      {
        label: "Quizzes",
        path: "/admin/quizzes",
        icon: ClipboardCheck,
      },
      {
        label: "Exams",
        path: "/admin/exams",
        icon: ClipboardList,
      },
      {
        label: "Assignments",
        path: "/admin/assignments",
        icon: Target,
      },
      {
        label: "Coding Arena",
        path: "/admin/coding",
        icon: Code2,
      },
      {
        label: "Results",
        path: "/admin/results",
        icon: PieChart,
      },
    ],
  },
  {
    section: "STUDENT TRACKING",
    items: [
      {
        label: "Progress",
        path: "/admin/progress",
        icon: TrendingUp,
      },
      {
        label: "Certificates",
        path: "/admin/certificates",
        icon: Award,
      },
      {
        label: "Leaderboard",
        path: "/admin/leaderboard",
        icon: Trophy,
      },
    ],
  },
  {
    section: "COMMUNICATION",
    items: [
      {
        label: "Announcements",
        path: "/admin/announcements",
        icon: Megaphone,
      },
      {
        label: "Discussions",
        path: "/admin/discussions",
        icon: MessageSquare,
      },
    ],
  },
  {
    section: "AI FEATURES",
    items: [
      {
        label: "AI Assistant",
        path: "/admin/ai-assistant",
        icon: Bot,
      },
      {
        label: "AI Analytics",
        path: "/admin/ai-analytics",
        icon: Brain,
      },
      {
        label: "AI Insights",
        path: "/admin/ai-insights",
        icon: Sparkles,
      },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      {
        label: "Reports",
        path: "/admin/reports",
        icon: FileBarChart,
      },
      {
        label: "Settings",
        path: "/admin/settings",
        icon: Settings,
      },
      {
        label: "Audit Logs",
        path: "/admin/audit-logs",
        icon: ScrollText,
      },
    ],
  },
];

export default adminMenuItems;
