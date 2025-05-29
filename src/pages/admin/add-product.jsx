// src/pages/AddProduct.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import ProductForm from "../../components/product/ProductForm";

const AddProduct = () => {
  const navigate = useNavigate();

  return <ProductForm />;
};

export default AddProduct;
