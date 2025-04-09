// src/components/InterestFormModal.jsx
import React from "react";

const InterestFormModal = ({ product, onClose, onSubmit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-2">
          Interested in {product.title}?
        </h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            required
            name="name"
            placeholder="Your Name"
            minLength={2}
            maxLength={18}
            pattern="^[A-Za-zÀ-ÿ ,.'-]{2,50}$"
            title="Enter a valid name (letters, spaces, hyphens allowed)"
            className="w-full p-2 border rounded"
          />

          <input
            required
            name="email"
            type="email"
            placeholder="Email"
            maxLength={30}
            pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
            title="Enter a valid email address"
            className="w-full p-2 border rounded"
          />

          <input
            required
            name="phone"
            placeholder="Phone Number (e.g. +491234567890)"
            pattern="^\+?[1-9]\d{6,14}$"
            title="Enter a valid international phone number (7 to 15 digits, may start with +)"
            className="w-full p-2 border rounded"
          />

          <button
            type="submit"
            className="bg-red-600 text-white w-full py-2 rounded hover:bg-red-700"
          >
            Submit Interest
          </button>
        </form>
      </div>
    </div>
  );
};

export default InterestFormModal;
