import {
  LayoutDashboard,
  BookOpen,
  Bot,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  Award,
  Users,
  Calendar,
  User,
  Settings,
  Trophy,
  Heart,
  MessageSquare,
  FileQuestion,
  Map,
  PieChart,
  Medal,
  BookOpenCheck,
  Presentation,
  Code2,
} from "lucide-react";

const studentMenuItems = [
  {
    section: "MAIN",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    section: "LEARNING",
    items: [
      {
        label: "My Courses",
        path: "/courses",
        icon: BookOpen,
      },
      {
        label: "Coding Practice",
        path: "/coding",
        icon: Code2,
        badge: "New",
      },
      {
        label: "AI Tutor",
        path: "/ai-assistant",
        icon: Bot,
        badge: "New",
      },
      {
        label: "Assignments",
        path: "/assignments",
        icon: ClipboardCheck,
      },
      {
        label: "Quizzes",
        path: "/quizzes",
        icon: FileQuestion,
      },
      {
        label: "Exams",
        path: "/exams",
        icon: GraduationCap,
      },
      {
        label: "Progress",
        path: "/analytics",
        icon: BarChart3,
      },
      {
        label: "Wishlist",
        path: "/wishlist",
        icon: Heart,
      },
    ],
  },
  {
    section: "ACHIEVEMENTS",
    items: [
      {
        label: "Certificates",
        path: "/certificates",
        icon: Award,
      },
      {
        label: "Leaderboard",
        path: "/leaderboard",
        icon: Trophy,
      },
    ],
  },
  {
    section: "COMMUNITY",
    items: [
      {
        label: "Discussions",
        path: "/discussions",
        icon: MessageSquare,
      },
      {
        label: "Calendar",
        path: "/notifications",
        icon: Calendar,
      },
      {
        label: "Campus Tour",
        path: "/campus-tour",
        icon: Map,
        badge: "3D",
      },
      {
        label: "3D Stats",
        path: "/3d-stats",
        icon: PieChart,
        badge: "3D",
      },
      {
        label: "3D Badges",
        path: "/3d-badges",
        icon: Medal,
        badge: "3D",
      },
      {
        label: "3D Courses",
        path: "/3d-courses",
        icon: BookOpenCheck,
        badge: "3D",
      },
      {
        label: "3D Classroom",
        path: "/3d-classroom",
        icon: Presentation,
        badge: "3D",
      },
    ],
  },
  {
    section: "ACCOUNT",
    items: [
      {
        label: "Profile",
        path: "/profile",
        icon: User,
      },
      {
        label: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ],
  },
];

export default studentMenuItems;
