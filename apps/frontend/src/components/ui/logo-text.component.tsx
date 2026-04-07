import React from 'react';

export const LogoTextComponent = () => {
  return (
    <div className="flex items-center gap-2">
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="8" fill="#1565C0" />
        <text
          x="50%"
          y="55%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="20"
          fontWeight="700"
          fontFamily="Helvetica Neue, Arial, sans-serif"
        >
          O
        </text>
      </svg>
      <span
        className="text-[22px] font-semibold tracking-tight"
        style={{ color: 'currentColor' }}
      >
        OmniPost
      </span>
    </div>
  );
};
