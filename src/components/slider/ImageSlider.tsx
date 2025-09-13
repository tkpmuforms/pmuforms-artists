import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import "./ImageSlider.scss";
import artistauth1 from "../../assets/images/artistauth1.jpg";
import artistauth2 from "../../assets/images/artistauth5.png";
import artistauth3 from "../../assets/images/artistauth3.jpg";

const ImageSlider: React.FC = () => {
  const slides = [
    {
      image: artistauth1,
      title: "Welcome to PMU Forms",
      description:
        "Streamline your consent form management with our easy-to-use app.",
    },
    {
      image: artistauth2,
      title: "Create and Manage Consent Forms",
      description: "Quickly create, customize, and track your consent forms.",
    },
    {
      image: artistauth3,
      title: "Stay Organized with Clients",
      description:
        "Manage client details and appointments easily. Keep everything at your fingertips.",
    },
  ];

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
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div className="slide">
                <img
                  src={slide.image}
                  alt={`Artist ${index + 1}`}
                  onError={() => {
                    console.error(
                      `Failed to load image at index ${index}:`,
                      slide.image
                    );
                  }}
                />
                <div className="slide-content">
                  <h2 className="slide-title">{slide.title}</h2>
                  <p className="slide-description">{slide.description}</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="swiper-pagination custom-pagination"></div>
      </div>
    </div>
  );
};

export default ImageSlider;
