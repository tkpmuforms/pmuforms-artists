import React from "react";

interface IconProps {
  isActive?: boolean;
}

/** A calendar, in the same two-tone style as the other sidebar icons. */
export const AppointmentsIcon: React.FC<IconProps> = ({ isActive = false }) => {
  const color = isActive ? "var(--pmu-primary)" : "#292D32";
  const opacity = isActive ? "1" : "0.5";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 2v3M16 2v3"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        opacity="0.4"
        d="M3.5 9.1h17M11.995 13.7h.01M8.294 13.7h.01M8.294 16.7h.01M11.995 16.7h.01M15.695 13.7h.01"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 8.5V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5Z"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
