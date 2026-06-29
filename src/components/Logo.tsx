import React, { useState, useEffect } from 'react';
import logoImg from '../assets/images/logo.jpeg';

interface LogoProps {
  className?: string;
  showPhone?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', showPhone = false, size = 'md' }: LogoProps) {
  const [logoSrc, setLogoSrc] = useState<string>(() => {
    return localStorage.getItem('custom_store_logo') || logoImg;
  });

  useEffect(() => {
    const handleLogoChange = () => {
      setLogoSrc(localStorage.getItem('custom_store_logo') || logoImg);
    };

    window.addEventListener('store_logo_changed', handleLogoChange);
    return () => {
      window.removeEventListener('store_logo_changed', handleLogoChange);
    };
  }, []);

  const heightClass = size === 'sm' ? 'h-8 sm:h-10' : size === 'lg' ? 'h-20 sm:h-24' : 'h-14 sm:h-16';

  return (
    <div className={`flex flex-col items-center sm:items-start select-none ${className}`}>
      <img 
        src={logoSrc} 
        alt="The Sweet Baby Shop Logo" 
        className={`${heightClass} object-contain rounded-md`}
        referrerPolicy="no-referrer"
      />
      
      {showPhone && (
        <a 
          href="tel:+923303511464"
          className={`mt-2 flex items-center justify-center rounded-full bg-neutral-100 px-3.5 py-1 font-mono font-bold text-black border border-neutral-200 hover:bg-black hover:text-white transition-colors duration-200 ${
            size === 'sm' ? 'text-[8px] px-2 py-0.5' : 'text-[10px]'
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="mr-1.5 h-3 w-3"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          0330 3511464
        </a>
      )}
    </div>
  );
}
