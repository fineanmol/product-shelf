import { Routes, Route } from "react-router-dom";
import "./styles/App.css";
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/dashboard";
import Products from "./pages/admin/Products";
import AddProduct from "./pages/admin/add-product";
import EditProduct from "./pages/admin/edit-product";
import Users from "./pages/admin/users";
import Feedback from "./pages/admin/feedback";
import BulkImport from "./pages/admin/BulkImport";
import VersionBadge from "./components/VersionBadge";
import ToastProvider from "./components/ToastProvider";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/product/:id" element={<ProductDetails />} />

        {/* Admin (protected) */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="products/edit/:id" element={<EditProduct />} />
          <Route path="products/bulk-import" element={<BulkImport />} />
          <Route path="users" element={<Users />} />
          <Route path="feedback" element={<Feedback />} />
        </Route>
      </Routes>
      <VersionBadge />
      <ToastProvider />
    </div>
  );
}

export default App;