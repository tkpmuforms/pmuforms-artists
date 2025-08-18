import { Form } from "../redux/types";

export const generateColor = (name: string): string => {
  const colors = [
    "#e879f9",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#f97316",
  ];

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

export const formatLastUpdated = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return "Updated 1 day ago";
  } else if (diffDays < 7) {
    return `Updated ${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "Updated 1 week ago" : `Updated ${weeks} weeks ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return months === 1
      ? "Updated 1 month ago"
      : `Updated ${months} months ago`;
  }
};

export const formatUsedFor = (services: number[]): string => {
  const count = services.length;
  return count === 1 ? "Used for 1 Service" : `Used for ${count} Services`;
};

export const transformFormData = (apiForm: any): Form => {
  return {
    id: apiForm.id || apiForm._id,
    title: apiForm.title,
    lastUpdated: formatLastUpdated(apiForm.updatedAt),
    usedFor: formatUsedFor(apiForm.services || []),
    type: apiForm.type as "consent" | "care",
    services: apiForm.services || [],
    createdAt: apiForm.createdAt,
    updatedAt: apiForm.updatedAt,
  };
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
