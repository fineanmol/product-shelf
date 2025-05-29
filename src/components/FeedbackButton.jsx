import React, { useState } from "react";
import { FaCommentDots } from "react-icons/fa";
import FeedbackModal from "./FeedbackModal";

const FeedbackButton = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 group"
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {/* Mobile version - just icon */}
        <div className="block sm:hidden p-4">
          <FaCommentDots className="text-xl" />
        </div>
        
        {/* Desktop version - icon + text */}
        <div className="hidden sm:flex items-center gap-3 py-3 px-5">
          <FaCommentDots className="text-lg" />
          <span className="font-semibold">Feedback</span>
        </div>
        
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
      </button>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
};

export default FeedbackButton; 