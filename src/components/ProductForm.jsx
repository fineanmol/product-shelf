import React, { useState } from "react";
import { getDatabase, push, ref } from "firebase/database";

const initial = {
  title: "",
  description: "",
  image: "",
  price: "",
  original_price: "",
  age: "",
  available_from: "Now",
  status: "available",
  source: "Amazon",
  url: "",
};

const ProductForm = () => {
  const [product, setProduct] = useState(initial);
  const db = getDatabase();

  const handleChange = (e) =>
    setProduct({ ...product, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await push(ref(db, "/"), product);
    alert("Product added successfully!");
    setProduct(initial);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {Object.keys(initial).map((key) => (
        <input
          key={key}
          name={key}
          value={product[key]}
          onChange={handleChange}
          placeholder={key}
          className="p-2 border rounded"
        />
      ))}
      <button className="bg-green-600 text-white py-2 rounded hover:bg-green-700">
        Add Product
      </button>
    </form>
  );
};

export default ProductForm;
