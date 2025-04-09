import React from "react";
import { FaHeart, FaEnvelopeOpenText, FaBoxOpen } from "react-icons/fa";

const StepsToBuy = () => {
  return (
    <div className="max-w-6xl mx-auto my-12 px-6 py-10 bg-white rounded-xl shadow-lg text-center">
      <h2 className="text-3xl font-bold mb-3 text-gray-800">
        How to Buy in 3 Easy Steps
      </h2>
      <p className="text-gray-600 mb-10">
        Just a few clicks away from your next great product!
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
        {/* Step 1 */}
        <div className="flex flex-col items-center text-center">
          <FaHeart className="text-purple-600 text-5xl mb-4" />
          <h4 className="font-semibold text-lg mb-1 text-gray-800">
            1. Show Interest
          </h4>
          <p className="text-sm text-gray-600">
            Click the ❤️ on the product and check the available delivery
            options.
          </p>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center text-center">
          <FaEnvelopeOpenText className="text-indigo-600 text-5xl mb-4" />
          <h4 className="font-semibold text-lg mb-1 text-gray-800">
            2. Fill Your Details
          </h4>
          <p className="text-sm text-gray-600">
            Enter your name, email, and phone number so we can contact you.
          </p>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center text-center">
          <FaBoxOpen className="text-green-600 text-5xl mb-4" />
          <h4 className="font-semibold text-lg mb-1 text-gray-800">
            3. Receive Your Product
          </h4>
          <p className="text-sm text-gray-600">
            You'll get an email confirmation. We’ll ship it or arrange pickup.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepsToBuy;
