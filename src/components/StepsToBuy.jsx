// src/components/StepsToBuy.jsx
import React from "react";
import { FaHeart, FaEnvelopeOpenText, FaBoxOpen } from "react-icons/fa";

const StepsToBuy = () => {
  return (
    <section className="max-w-6xl mx-auto my-12 px-6 py-10 rounded-xl shadow-lg bg-gradient-to-br from-white to-blue-50">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800">
          How to Buy in 3 Easy Steps
        </h2>
        <p className="text-gray-600">
          A smooth and simple process to get your products!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Step 1 */}
        <div className="flex flex-col items-center text-center p-4 rounded-lg hover:shadow-xl transition-shadow">
          <div className="mb-4 p-4 bg-purple-100 rounded-full">
            <FaHeart className="text-purple-600 text-5xl" />
          </div>
          <h4 className="font-semibold text-lg text-gray-800 mb-1">
            1. Show Interest
          </h4>
          <p className="text-sm text-gray-600 max-w-xs">
            Click the ❤️ on any product to let us know you're interested and
            explore the delivery options.
          </p>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center text-center p-4 rounded-lg hover:shadow-xl transition-shadow">
          <div className="mb-4 p-4 bg-indigo-100 rounded-full">
            <FaEnvelopeOpenText className="text-indigo-600 text-5xl" />
          </div>
          <h4 className="font-semibold text-lg text-gray-800 mb-1">
            2. Fill Your Details
          </h4>
          <p className="text-sm text-gray-600 max-w-xs">
            Provide your name, email, and phone number so we can confirm your
            order and answer any questions.
          </p>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center text-center p-4 rounded-lg hover:shadow-xl transition-shadow">
          <div className="mb-4 p-4 bg-green-100 rounded-full">
            <FaBoxOpen className="text-green-600 text-5xl" />
          </div>
          <h4 className="font-semibold text-lg text-gray-800 mb-1">
            3. Receive Your Product
          </h4>
          <p className="text-sm text-gray-600 max-w-xs">
            You’ll get a confirmation email or call. Then, your product will be
            shipped or prepared for pickup.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StepsToBuy;
