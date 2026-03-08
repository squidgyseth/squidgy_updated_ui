import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Game URL - update this to your deployed game URL
const GAME_URL = 'https://squidgy-waitlist-game.vercel.app';

// SVG Icons
const TeamIcon = () => (
  <svg width="40" height="41" viewBox="0 0 40 41" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8.83309C20.002 8.16648 19.8706 7.5062 19.6137 6.89109C19.3567 6.27598 18.9794 5.71847 18.5038 5.25133C18.0283 4.7842 17.4641 4.41688 16.8445 4.17098C16.2249 3.92507 15.5623 3.80555 14.8959 3.81945C14.2294 3.83334 13.5724 3.98036 12.9636 4.25187C12.3548 4.52338 11.8064 4.91389 11.3507 5.40043C10.895 5.88698 10.5412 6.45973 10.3101 7.08501C10.079 7.71029 9.9753 8.37547 10.005 9.04142C9.02538 9.29332 8.11588 9.76484 7.34543 10.4203C6.57498 11.0757 5.96377 11.8979 5.55812 12.8245C5.15246 13.7511 4.96298 14.7579 5.00402 15.7686C5.04507 16.7793 5.31557 17.7674 5.79504 18.6581C4.95201 19.343 4.28909 20.2235 3.86394 21.223C3.4388 22.2225 3.26431 23.3107 3.35565 24.3931C3.44699 25.4754 3.8014 26.519 4.38805 27.4331C4.9747 28.3472 5.77582 29.1042 6.72171 29.6381C6.6049 30.5418 6.67461 31.4599 6.92652 32.3356C7.17843 33.2114 7.6072 34.0262 8.18635 34.7297C8.7655 35.4332 9.48273 36.0105 10.2937 36.426C11.1048 36.8415 11.9923 37.0863 12.9017 37.1453C13.811 37.2043 14.7228 37.0763 15.5807 36.7691C16.4386 36.4619 17.2244 35.9821 17.8896 35.3594C18.5549 34.7366 19.0853 33.984 19.4483 33.1482C19.8113 32.3124 19.9991 31.411 20 30.4998V8.83309Z" stroke="white" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 8.83309C19.9981 8.16648 20.1294 7.5062 20.3864 6.89109C20.6433 6.27598 21.0207 5.71847 21.4962 5.25133C21.9718 4.7842 22.536 4.41688 23.1556 4.17098C23.7752 3.92507 24.4377 3.80555 25.1042 3.81945C25.7707 3.83334 26.4276 3.98036 27.0365 4.25187C27.6453 4.52338 28.1937 4.91389 28.6494 5.40043C29.105 5.88698 29.4588 6.45973 29.6899 7.08501C29.921 7.71029 30.0248 8.37547 29.995 9.04142C30.9747 9.29332 31.8842 9.76484 32.6546 10.4203C33.4251 11.0757 34.0363 11.8979 34.442 12.8245C34.8476 13.7511 35.0371 14.7579 34.996 15.7686C34.955 16.7793 34.6845 17.7674 34.205 18.6581C35.0481 19.343 35.711 20.2235 36.1361 21.223C36.5613 22.2225 36.7358 23.3107 36.6444 24.3931C36.5531 25.4754 36.1987 26.519 35.612 27.4331C35.0254 28.3472 34.2242 29.1042 33.2784 29.6381C33.3952 30.5418 33.3255 31.4599 33.0735 32.3356C32.8216 33.2114 32.3929 34.0262 31.8137 34.7297C31.2346 35.4332 30.5173 36.0105 29.7063 36.426C28.8953 36.8415 28.0077 37.0863 27.0984 37.1453C26.1891 37.2043 25.2773 37.0763 24.4194 36.7691C23.5615 36.4619 22.7756 35.9821 22.1104 35.3594C21.4452 34.7366 20.9147 33.984 20.5517 33.1482C20.1888 32.3124 20.001 31.411 20 30.4998V8.83309Z" stroke="white" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25 22.1667C23.6007 21.6744 22.3789 20.7783 21.4889 19.5917C20.5989 18.405 20.0808 16.9811 20 15.5C19.9192 16.9811 19.4011 18.405 18.5111 19.5917C17.6211 20.7783 16.3993 21.6744 15 22.1667" stroke="white" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M29.3315 11.3332C29.7349 10.6341 29.9631 9.84787 29.9965 9.0415" stroke="white" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.0049 9.0415C10.0378 9.84773 10.2654 10.634 10.6682 11.3332" stroke="white" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.79492 18.66C6.09982 18.4117 6.42609 18.1908 6.76992 18" stroke="white" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M33.23 18C33.5738 18.1908 33.9001 18.4117 34.205 18.66" stroke="white" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 30.5001C8.8514 30.5007 7.72212 30.2044 6.72168 29.6401" stroke="white" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M33.2783 29.6401C32.2779 30.2044 31.1486 30.5007 30 30.5001" stroke="white" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ExpertsIcon = () => (
  <svg width="52" height="50" viewBox="0 0 52 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_experts)">
      <path d="M34.7784 17.1094C32.069 14.6094 28.5628 13.3594 24.7378 13.5938C17.805 13.9844 12.3065 19.6094 12.2268 26.3282C12.1471 30.625 14.219 34.5313 17.6456 36.9532V42.5782C17.6456 45.4688 20.0362 47.7344 22.9846 47.7344H27.9253C30.8737 47.7344 33.2643 45.3907 33.2643 42.5782V37.0313C36.7706 34.6094 38.8425 30.7032 38.8425 26.4844C38.9221 22.9688 37.4081 19.6094 34.7784 17.1094ZM28.005 44.2969H23.0643C22.1081 44.2969 21.3112 43.5157 21.3112 42.6563V37.8907H29.8378V42.6563C29.7581 43.5157 28.9612 44.2969 28.005 44.2969ZM31.0331 34.2969H27.2878V32.1875C27.2878 31.25 26.4909 30.3907 25.455 30.3907C24.4987 30.3907 23.6221 31.1719 23.6221 32.1875V34.2969H19.9565C17.2471 32.5 15.6534 29.6094 15.7331 26.3282C15.8128 21.4063 19.7971 17.3438 24.8971 17.0313C25.0565 17.0313 25.2956 17.0313 25.455 17.0313C28.0846 17.0313 30.3956 17.8907 32.2284 19.6094C34.1409 21.4063 35.2565 23.9063 35.2565 26.4844C35.3362 29.6875 33.7425 32.5782 31.0331 34.2969Z" fill="white"/>
      <path d="M25.5345 10.2344C26.4907 10.2344 27.3673 9.45312 27.3673 8.4375V3.98438C27.3673 3.04687 26.5704 2.1875 25.5345 2.1875C24.5782 2.1875 23.7017 2.96875 23.7017 3.98438V8.51562C23.7813 9.45312 24.5782 10.2344 25.5345 10.2344Z" fill="white"/>
      <path d="M46.2534 12.8125C46.9706 12.1094 46.9706 11.0156 46.2534 10.3125C45.5362 9.60938 44.4206 9.60938 43.7034 10.3125L40.5159 13.3594C39.7987 14.0625 39.7987 15.1562 40.5159 15.8594C40.8347 16.1719 41.3128 16.4062 41.7909 16.4062C42.269 16.4062 42.6675 16.25 43.0659 15.9375L46.2534 12.8125Z" fill="white"/>
      <path d="M7.36572 10.3125C6.64853 9.60938 5.53291 9.60938 4.81572 10.3125C4.09854 11.0156 4.09854 12.1094 4.81572 12.8125L7.92353 15.8594C8.24228 16.1719 8.72041 16.4062 9.19853 16.4062C9.67666 16.4062 10.1548 16.25 10.4735 15.8594C11.1907 15.1562 11.1907 14.0625 10.4735 13.3594L7.36572 10.3125Z" fill="white"/>
      <path d="M7.04697 28.0469H2.4251C1.46885 28.0469 0.592285 28.8281 0.592285 29.8438C0.592285 30.8594 1.38916 31.6406 2.4251 31.6406H7.04697C8.00322 31.6406 8.87979 30.8594 8.87979 29.8438C8.87979 28.8281 8.00322 28.0469 7.04697 28.0469Z" fill="white"/>
      <path d="M48.6437 28.0469H44.0218C43.0655 28.0469 42.189 28.8281 42.189 29.8438C42.189 30.8594 42.9858 31.6406 44.0218 31.6406H48.6437C49.5999 31.6406 50.4765 30.8594 50.4765 29.8438C50.4765 28.8281 49.5999 28.0469 48.6437 28.0469Z" fill="white"/>
    </g>
    <defs>
      <clipPath id="clip0_experts">
        <rect width="51" height="50" fill="white" transform="translate(0.034668)"/>
      </clipPath>
    </defs>
  </svg>
);

const InsightsIcon = () => (
  <svg width="55" height="54" viewBox="0 0 55 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.78467 6.75V42.75C6.78467 43.9435 7.25877 45.0881 8.10269 45.932C8.9466 46.7759 10.0912 47.25 11.2847 47.25H47.2847M42.7847 20.25L31.5347 31.5L22.5347 22.5L15.7847 29.25" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface CarouselState {
  type: 'game' | 'content';
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

const carouselStates: CarouselState[] = [
  {
    type: 'game',
    title: "Reclaim Your Time",
  },
  {
    type: 'content',
    icon: <TeamIcon />,
    title: "AI That Works Like a Team",
    description: "Built for the way you work — intelligent, flexible, and always collaborative."
  },
  {
    type: 'content',
    icon: <ExpertsIcon />,
    title: "Department Experts",
    description: "Use specialized AI for marketing, sales, HR, strategy, and more."
  },
  {
    type: 'content',
    icon: <InsightsIcon />,
    title: "New Insights, Instantly",
    description: "Your Marketing Assistant analyzed your campaign and suggested 3 ways to improve results."
  }
];

interface AuthCarouselProps {
  hideGameSlide?: boolean;
}

export default function AuthCarousel({ hideGameSlide = false }: AuthCarouselProps) {
  // Filter out game slide if hideGameSlide is true
  const slides = hideGameSlide
    ? carouselStates.filter(slide => slide.type !== 'game')
    : carouselStates;

  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="flex-1 flex flex-col min-h-[100vh] md:min-h-screen bg-gradient-to-br from-[#FB252A] via-[#A61D92] to-[#6017E8] p-6 md:p-12 justify-between">
      {/* Carousel Indicators */}
      <div className="flex justify-center gap-2 mb-8">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              currentSlide === index
                ? "w-8 bg-white"
                : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {slides[currentSlide].type === 'game' ? (
          /* Game Slide - Pushed up from bottom by 15% */
          <div className="w-full h-full flex flex-col px-4 md:px-8 pt-4 pb-2 mb-[15%]">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4 leading-tight font-['Open_Sans']">
              {slides[currentSlide].title}
            </h2>
            <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src={GAME_URL}
                className="w-full h-full border-0"
                title="Squidgy Game"
                allow="autoplay; fullscreen; clipboard-write"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
              />
            </div>
          </div>
        ) : (
          /* Content Slide */
          <div className="relative mb-12">
            {/* Icon Container */}
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
              {slides[currentSlide].icon}
            </div>

            {/* Title and Description */}
            <div className="max-w-[453px]">
              <h2 className="text-4xl font-bold text-white mb-4 leading-[45px] font-['Open_Sans']">
                {slides[currentSlide].title}
              </h2>
              <p className="text-lg text-white/90 leading-7 font-['Open_Sans'] max-w-[448px]">
                {slides[currentSlide].description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation and Trust Indicators */}
      <div>
        {/* Navigation Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={prevSlide}
            className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={1.67} />
          </button>
          <button
            onClick={nextSlide}
            className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={20} strokeWidth={1.67} />
          </button>
        </div>

        {/* Trust Indicators - Hidden for game slide */}
        {slides[currentSlide].type !== 'game' && (
          <div>
            <p className="text-center text-white/80 text-[15px] mb-4 font-['Open_Sans']">
              Trusted by teams worldwide
            </p>
            <div className="flex justify-center items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#05DF72]"></div>
                <span className="text-white text-[14px] font-['Open_Sans']">99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#51A2FF]"></div>
                <span className="text-white text-[14px] font-['Open_Sans']">Secure & private</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#C27AFF]"></div>
                <span className="text-white text-[14px] font-['Open_Sans']">24/7 Support</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
