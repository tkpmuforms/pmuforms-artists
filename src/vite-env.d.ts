/// <reference types="vite/client" />

declare module "*.jsx" {
  import { ComponentType } from "react";
  const Component: ComponentType<Record<string, unknown>>;
  export default Component;
}

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
