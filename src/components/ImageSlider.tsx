import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import "./ImageSlider.scss";
import artistauth1 from "../assets/images/artistauth1.jpg";
import artistauth2 from "../assets/images/artistauth2.png";
import artistauth3 from "../assets/images/artistauth3.jpg";

const ImageSlider: React.FC = () => {
  const images = [artistauth1, artistauth2, artistauth3];

  return (
    <div className="image-slider">
      <div className="slider-container">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          pagination={{
            el: ".swiper-pagination",
            clickable: true,
            bulletClass: "swiper-pagination-bullet custom-bullet",
            bulletActiveClass:
              "swiper-pagination-bullet-active custom-bullet-active",
          }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          loop={true}
          className="image-swiper"
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <div className="slide">
                <img
                  src={image}
                  alt={`Artist ${index + 1}`}
                  onError={(e) => {
                    console.error(
                      `Failed to load image at index ${index}:`,
                      image
                    );
                  }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Pagination */}
        <div className="swiper-pagination custom-pagination"></div>
      </div>
    </div>
  );
};

export default ImageSlider;
