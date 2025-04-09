import React from "react";

const HowItWorksHint = () => {
  return (
    <div className="relative mt-4 flex justify-end">
      <div className="group relative inline-block text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition">
        ❓ How it works
        {/* Hover Box */}
        <div
          className="absolute bottom-full right-0 mb-2 w-72 text-left p-4 rounded-md shadow-xl bg-white border border-gray-200
          text-[12px] text-gray-700 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-50 pointer-events-none group-hover:pointer-events-auto"
        >
          <h4 className="font-semibold text-sm text-gray-800 mb-2">
            How it works
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
