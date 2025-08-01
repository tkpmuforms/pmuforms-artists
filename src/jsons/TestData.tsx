import { Calendar, Clock, Send, User } from "lucide-react";
import {
  FormsSavedIcon,
  PendingSubmissionsIcon,
  PeopleIcon,
  TodaysScheduleIcon,
} from "../assets/svgs/DashboardSvg";

// export const quickActionsCLientDetails = [
//   {
//     icon: <Calendar size={20} />,
//     title: "View Appointment",
//     onClick: () => setShowPreviewAppointment(true),
//   },
//   {
//     icon: <Send size={20} />,
//     title: "Send Consent Form",
//     onClick: () => setShowSendConsentForm(true),
//   },
//   {
//     icon: <Clock size={20} />,
//     title: "Set Reminders",
//     onClick: () => console.log("Set Reminders"),
//   },
//   {
//     icon: <User size={20} />,
//     title: "View Notes",
//     onClick: () => console.log("View Notes"),
//   },
// ];

export const metricsData = [
  {
    title: "Total Clients",
    value: "32",
    icon: PeopleIcon,
    color: "var(--pmu-primary)",
  },
  {
    title: "Forms Shared",
    value: "12",
    icon: FormsSavedIcon,
    color: "#560056",
  },
  {
    title: "Pending Submissions",
    value: "04",
    icon: PendingSubmissionsIcon,
    color: "#f59e0b",
  },
  {
    title: "Today's Schedule",
    value: "07",
    icon: TodaysScheduleIcon,
    color: "#ef4444",
  },
];

export const quickActions = [
  {
    title: "Add New Client",
    icon: "👤",
    color: "var(--pmu-primary)",
    onClick: (navigate) => navigate("/clients"),
  },
  {
    title: "Create Form",
    icon: "📋",
    color: "#f59e0b",
    onClick: (navigate) => navigate("/forms"),
  },
  {
    title: "Send Form",
    icon: "📤",
    color: "#10b981",
    onClick: () => console.log("Send form"),
  },
];

export const appointments = [
  {
    name: "Evelyn Carter",
    avatar: "/api/placeholder/40/40",
    time: "9:00 AM",
    service: "Microblading",
  },
  {
    name: "Ava Montgomery",
    avatar: "/api/placeholder/40/40",
    time: "11:00 AM",
    service: "Lash Extensions",
  },
  {
    name: "Sophie Bennett",
    avatar: "/api/placeholder/40/40",
    time: "2:00 PM",
    service: "Lash Extensions",
  },
  {
    name: "Maya Sinclair",
    avatar: "/api/placeholder/40/40",
    time: "4:00 PM",
    service: "Lash Extensions",
  },
];
