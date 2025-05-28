import React from "react";

const Header = ({ title }) => (
  <header className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white py-6 px-4 shadow-lg">
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
    </div>
  </header>
);

export default Header;
