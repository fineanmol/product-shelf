import "./styles/App.css";
import ItemsForSale from "./pages/ItemsForSale";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import EditProduct from "./pages/EditProduct";
import AddProduct from "./pages/AddProduct";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ItemsForSale />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/edit/:id" element={<EditProduct />} />
          <Route path="/admin/add" element={<AddProduct />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
