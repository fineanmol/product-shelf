// src/components/StepsToBuy.jsx
import React from "react";
import { FaHeart, FaEnvelopeOpenText, FaBoxOpen } from "react-icons/fa";

const StepsToBuy = () => {
  return (
    <section className="max-w-7xl mx-auto my-16 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-brand-navy mb-3">
          How to Buy in 3 Easy Steps
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          A clean, secure, and straightforward process to get the products you love.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Step 1 */}
        <div className="glass-card p-8 flex flex-col items-center text-center hover:shadow-md transition-all">
          <div className="mb-5 p-4 rounded-full bg-blue-50 border border-brand-sky/20">
            <FaHeart className="text-brand-sky text-4xl" />
          </div>
          <h3 className="font-semibold text-lg text-brand-navy mb-2">
            1. Show Interest
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Click the ❤️ on any product to let the seller know you're interested and explore delivery options.
          </p>
        </div>

        {/* Step 2 */}
        <div className="glass-card p-8 flex flex-col items-center text-center hover:shadow-md transition-all">
          <div className="mb-5 p-4 rounded-full bg-green-50 border border-brand-mint/20">
            <FaEnvelopeOpenText className="text-brand-mint text-4xl" />
          </div>
          <h3 className="font-semibold text-lg text-brand-navy mb-2">
            2. Fill Your Details
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Provide your basic contact info so we can confirm the transaction and coordinate pickup or shipping details.
          </p>
        </div>

        {/* Step 3 */}
        <div className="glass-card p-8 flex flex-col items-center text-center hover:shadow-md transition-all">
          <div className="mb-5 p-4 rounded-full bg-yellow-50 border border-brand-sunshine/20">
            <FaBoxOpen className="text-brand-navy text-4xl" />
          </div>
          <h3 className="font-semibold text-lg text-brand-navy mb-2">
            3. Receive Your Product
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            The seller will contact you to finalize. Pay securely on pickup or receive trackable shipping.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StepsToBuy;
