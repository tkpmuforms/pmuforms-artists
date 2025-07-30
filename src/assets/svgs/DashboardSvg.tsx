import React from "react";

interface IconProps {
  isActive?: boolean;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

export const DashboardIcon: React.FC<IconProps> = ({
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
      <path
        opacity="0.4"
        d="M20.0402 6.81994L14.2802 2.78994C12.7102 1.68994 10.3002 1.74994 8.79023 2.91994L3.78023 6.82994C2.78023 7.60994 1.99023 9.20994 1.99023 10.4699V17.3699C1.99023 19.9199 4.06023 21.9999 6.61023 21.9999H17.3902C19.9402 21.9999 22.0102 19.9299 22.0102 17.3799V10.5999C22.0102 9.24994 21.1402 7.58994 20.0402 6.81994Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
      <path
        d="M12 18.75C11.59 18.75 11.25 18.41 11.25 18V15C11.25 14.59 11.59 14.25 12 14.25C12.41 14.25 12.75 14.59 12.75 15V18C12.75 18.41 12.41 18.75 12 18.75Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
    </svg>
  );
};

export const ClientIcon: React.FC<IconProps> = ({
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
      <path
        opacity="0.4"
        d="M17.5291 7.77C17.4591 7.76 17.3891 7.76 17.3191 7.77C15.7691 7.72 14.5391 6.45 14.5391 4.89C14.5391 3.3 15.8291 2 17.4291 2C19.0191 2 20.3191 3.29 20.3191 4.89C20.3091 6.45 19.0791 7.72 17.5291 7.77Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
      <path
        opacity="0.4"
        d="M20.7896 14.6999C19.6696 15.4499 18.0996 15.7299 16.6496 15.5399C17.0296 14.7199 17.2296 13.8099 17.2396 12.8499C17.2396 11.8499 17.0196 10.8999 16.5996 10.0699C18.0796 9.86992 19.6496 10.1499 20.7796 10.8999C22.3596 11.9399 22.3596 13.6499 20.7896 14.6999Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
      <path
        opacity="0.4"
        d="M6.44039 7.77C6.51039 7.76 6.58039 7.76 6.65039 7.77C8.20039 7.72 9.43039 6.45 9.43039 4.89C9.43039 3.3 8.14039 2 6.54039 2C4.95039 2 3.65039 3.29 3.65039 4.89C3.66039 6.45 4.89039 7.72 6.44039 7.77Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
      <path
        opacity="0.4"
        d="M6.54914 12.8501C6.54914 13.8201 6.75914 14.7401 7.13914 15.5701C5.72914 15.7201 4.25914 15.4201 3.17914 14.7101C1.59914 13.6601 1.59914 11.9501 3.17914 10.9001C4.24914 10.1801 5.75914 9.8901 7.17914 10.0501C6.76914 10.8901 6.54914 11.8401 6.54914 12.8501Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
      <path
        d="M12.1208 15.87C12.0408 15.86 11.9508 15.86 11.8608 15.87C10.0208 15.81 8.55078 14.3 8.55078 12.44C8.55078 10.54 10.0808 9 11.9908 9C13.8908 9 15.4308 10.54 15.4308 12.44C15.4308 14.3 13.9708 15.81 12.1208 15.87Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
      <path
        d="M8.87078 17.9399C7.36078 18.9499 7.36078 20.6099 8.87078 21.6099C10.5908 22.7599 13.4108 22.7599 15.1308 21.6099C16.6408 20.5999 16.6408 18.9399 15.1308 17.9399C13.4208 16.7899 10.6008 16.7899 8.87078 17.9399Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
    </svg>
  );
};

export const FormsIcon: React.FC<IconProps> = ({
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
      <path
        opacity="0.4"
        d="M20.5 10.19H17.61C15.24 10.19 13.31 8.26 13.31 5.89V3C13.31 2.45 12.86 2 12.31 2H8.07C4.99 2 2.5 4 2.5 7.57V16.43C2.5 20 4.99 22 8.07 22H15.93C19.01 22 21.5 20 21.5 16.43V11.19C21.5 10.64 21.05 10.19 20.5 10.19Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
      <path
        d="M15.7997 2.20999C15.3897 1.79999 14.6797 2.07999 14.6797 2.64999V6.13999C14.6797 7.59999 15.9197 8.80999 17.4297 8.80999C18.3797 8.81999 19.6997 8.81999 20.8297 8.81999C21.3997 8.81999 21.6997 8.14999 21.2997 7.74999C19.8597 6.29999 17.2797 3.68999 15.7997 2.20999Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
      <path
        d="M13.5 13.75H7.5C7.09 13.75 6.75 13.41 6.75 13C6.75 12.59 7.09 12.25 7.5 12.25H13.5C13.91 12.25 14.25 12.59 14.25 13C14.25 13.41 13.91 13.75 13.5 13.75Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
      <path
        d="M11.5 17.75H7.5C7.09 17.75 6.75 17.41 6.75 17C6.75 16.59 7.09 16.25 7.5 16.25H11.5C11.91 16.25 12.25 16.59 12.25 17C12.25 17.41 11.91 17.75 11.5 17.75Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
    </svg>
  );
};

export const ProfileIcon: React.FC<IconProps> = ({
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
      <path
        opacity="0.4"
        d="M12 22.01C17.5228 22.01 22 17.5329 22 12.01C22 6.48716 17.5228 2.01001 12 2.01001C6.47715 2.01001 2 6.48716 2 12.01C2 17.5329 6.47715 22.01 12 22.01Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
      <path
        d="M12 6.93994C9.93 6.93994 8.25 8.61994 8.25 10.6899C8.25 12.7199 9.84 14.3699 11.95 14.4299C11.98 14.4299 12.02 14.4299 12.04 14.4299C12.06 14.4299 12.09 14.4299 12.11 14.4299C12.12 14.4299 12.13 14.4299 12.13 14.4299C14.15 14.3599 15.74 12.7199 15.75 10.6899C15.75 8.61994 14.07 6.93994 12 6.93994Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
      <path
        d="M18.7807 19.36C17.0007 21 14.6207 22.01 12.0007 22.01C9.3807 22.01 7.0007 21 5.2207 19.36C5.4607 18.45 6.1107 17.62 7.0607 16.98C9.7907 15.16 14.2307 15.16 16.9407 16.98C17.9007 17.62 18.5407 18.45 18.7807 19.36Z"
        fill={fillColor}
        fillOpacity={fillOpacity}
      />
    </svg>
  );
};
