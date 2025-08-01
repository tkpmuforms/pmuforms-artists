export const generateColor = (name: string): string => {
  const colors = [
    "#e879f9", // purple
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // yellow
    "#ef4444", // red
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#f97316", // orange
  ];

  // Use name length and first character to determine color
  const index = (name.length + name.charCodeAt(0)) % colors.length;
  return colors[index];
};

export const generateInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
};

export const formatAppointmentTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};
