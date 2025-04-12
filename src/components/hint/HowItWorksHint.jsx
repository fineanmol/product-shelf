// src/components/hint/HowItWorksHint.jsx
import React from "react";
import { FaQuestionCircle } from "react-icons/fa";

const HowItWorksHint = () => {
  return (
    <div className="relative flex justify-end">
      <div className="group relative inline-flex items-center gap-1 text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition">
        <FaQuestionCircle className="text-gray-400 group-hover:text-gray-700 transition-colors" />
        <span>How to Buy</span>

        {/* Tooltip */}
        <div
          className="
            absolute bottom-full right-0 mb-2 w-72 text-left p-4 rounded-md shadow-xl bg-white border border-gray-200 text-[12px] text-gray-700 transition-all duration-300 transform scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 z-50 pointer-events-none group-hover:pointer-events-auto
          "
        >
          <div className="absolute top-full right-4 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 border-t-white" />
          <h4 className="font-semibold text-sm text-gray-800 mb-2">
            How to Buy
          </h4>
          <ol className="list-decimal list-inside space-y-1 leading-snug">
            <li>Tap the ❤️ to show interest & check delivery options.</li>
            <li>Fill in your name, email, and phone number.</li>
            <li>You’ll get a confirmation email. We ship or arrange pickup.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksHint;
