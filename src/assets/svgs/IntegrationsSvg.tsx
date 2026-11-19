import React from "react";

interface IconProps {
  isActive?: boolean;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

export const IntegrationsIcon: React.FC<IconProps> = ({
  isActive = false,
  onClick,
}) => {
  const fillColor = isActive ? "var(--pmu-primary)" : "#292D32";
  const fillOpacity = isActive ? "1" : "0.5";

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <rect
        opacity="0.4"
        x="2"
        y="2"
        width="12.5"
        height="12.5"
        rx="3.5"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
      <rect
        x="9.5"
        y="9.5"
        width="12.5"
        height="12.5"
        rx="3.5"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
    </svg>
  );
};

interface LogoProps {
  size?: number;
}

export const CalendlyLogo: React.FC<LogoProps> = ({ size = 56 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Calendly"
    >
      <rect width="24" height="24" rx="4" fill="#006BFF" />
      <path
        d="M15.9 8.6a5.2 5.2 0 1 0 0 6.8"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const SquarespaceLogo: React.FC<LogoProps> = ({ size = 56 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Squarespace"
    >
      <rect width="24" height="24" rx="4" fill="#000000" />
      <rect
        x="4.5"
        y="9.6"
        width="11"
        height="4.8"
        rx="2.4"
        transform="rotate(-45 10 12)"
        stroke="#FFFFFF"
        strokeWidth="1.6"
      />
      <rect
        x="8.5"
        y="9.6"
        width="11"
        height="4.8"
        rx="2.4"
        transform="rotate(-45 14 12)"
        stroke="#FFFFFF"
        strokeWidth="1.6"
      />
    </svg>
  );
};

export const CalLogo: React.FC<LogoProps> = ({ size = 56 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Cal.com"
    >
      <rect width="24" height="24" rx="4" fill="#292929" />
      <text
        x="12"
        y="15.2"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="700"
        fill="#FFFFFF"
      >
        Cal
      </text>
    </svg>
  );
};

export const SquareLogo: React.FC<LogoProps> = ({ size = 56 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Square"
    >
      <path
        fill="#000000"
        d="M4.01 0A4.01 4.01 0 0 0 0 4.01v15.98c0 2.21 1.8 4 4.01 4.01h15.98C22.2 24 24 22.2 24 19.99V4A4.01 4.01 0 0 0 19.99 0H4zm1.62 4.36h12.74c.7 0 1.26.57 1.26 1.27v12.74c0 .7-.56 1.27-1.26 1.27H5.63c-.7 0-1.26-.57-1.26-1.27V5.63a1.27 1.27 0 0 1 1.26-1.27zm3.83 4.35a.73.73 0 0 0-.73.73v5.09c0 .4.32.72.72.72h5.1a.73.73 0 0 0 .73-.72V9.44a.73.73 0 0 0-.73-.73h-5.1z"
      />
    </svg>
  );
};
