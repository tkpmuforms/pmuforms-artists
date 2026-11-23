import React from "react";

interface IconProps {
  isActive?: boolean;
}

/** A gift box, in the same two-tone style as the other sidebar icons. */
export const ReferIcon: React.FC<IconProps> = ({ isActive = false }) => {
  const color = isActive ? "var(--pmu-primary)" : "#292D32";
  const opacity = isActive ? "1" : "0.5";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        opacity="0.4"
        d="M12 7.5v14M12 7.5H8.4a2.4 2.4 0 1 1 0-4.8C11 2.7 12 7.5 12 7.5Zm0 0h3.6a2.4 2.4 0 1 0 0-4.8C13 2.7 12 7.5 12 7.5Z"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 12v7.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V12M3 7.5h18V12H3V7.5Z"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
