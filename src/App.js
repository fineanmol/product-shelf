import "./styles/App.css";
import ItemsForSale from "./pages/ItemsForSale";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import ProductPage from "./pages/ProductPage";

import AdminLayout from "./layouts/AdminLayout"; // New layout component
import AdminDashboard from "./pages/AdminDashboard"; // Renamed from Admin.jsx
import AdminProducts from "./pages/AdminProducts"; // New products page
import AdminUsers from "./pages/AdminUsers"; // New users page
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ItemsForSale />} />
          <Route path="/login" element={<Login />} />
          <Route path="/product/:id" element={<ProductPage />} />

          {/* Admin (protected) */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />

            {/* Products */}
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/add" element={<AddProduct />} />
            <Route path="products/edit/:id" element={<EditProduct />} />

            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
