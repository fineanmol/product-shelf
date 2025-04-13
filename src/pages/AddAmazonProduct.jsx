import React, { useState } from "react";

function AddAmazonProduct() {
  const [asin, setAsin] = useState("");

  const handleAdd = async () => {
    try {
      const res = await fetch("/api/add-amazon-product", {
        method: "POST",
        body: JSON.stringify({ asin }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        alert("Product added!");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }
  };

  return (
    <div>
      <input
        type="text"
        value={asin}
        onChange={(e) => setAsin(e.target.value)}
        placeholder="Enter Amazon ASIN"
        className="border p-2"
      />
      <button
        onClick={handleAdd}
        className="bg-blue-500 text-white px-4 py-2 ml-2 rounded"
      >
        Add Product
      </button>
    </div>
  );
}

export default AddAmazonProduct;
