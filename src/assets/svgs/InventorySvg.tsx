import React from "react";

interface IconProps {
  isActive?: boolean;
}

/** A box, in the same two-tone style as the other sidebar icons. */
export const InventoryIcon: React.FC<IconProps> = ({ isActive = false }) => {
  const color = isActive ? "var(--pmu-primary)" : "#292D32";
  const opacity = isActive ? "1" : "0.5";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        opacity="0.4"
        d="M3.2 7.3 12 12.4l8.8-5.1M12 21.5v-9.1"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 2.6 4.6 5.6C3.4 6.3 2.4 8 2.4 9.4v5.2c0 1.4 1 3.1 2.2 3.8l5.4 3c1.1.6 2.9.6 4 0l5.4-3c1.2-.7 2.2-2.4 2.2-3.8V9.4c0-1.4-1-3.1-2.2-3.8L14 2.6c-1.1-.6-2.9-.6-4 0Z"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
