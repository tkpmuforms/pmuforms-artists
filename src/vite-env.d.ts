/// <reference types="vite/client" />

// Allow importing JSX files as React components
declare module "*.jsx" {
  import { ComponentType } from "react";
  const Component: ComponentType<Record<string, unknown>>;
  export default Component;
}

// Add Swiper CSS module declarations
declare module "swiper/css";
declare module "swiper/css/bundle";
declare module "swiper/css/navigation";
declare module "swiper/css/pagination";
declare module "swiper/css/scrollbar";
declare module "swiper/css/effect-fade";
declare module "swiper/css/effect-coverflow";
declare module "swiper/css/effect-flip";
declare module "swiper/css/effect-cube";
declare module "swiper/css/effect-cards";
declare module "swiper/css/autoplay";
