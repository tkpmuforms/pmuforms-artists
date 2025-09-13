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
