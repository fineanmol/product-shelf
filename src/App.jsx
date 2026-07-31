import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import "./styles/App.css";
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import VersionBadge from "./components/VersionBadge";
import ToastProvider from "./components/ToastProvider";
import LoadingSpinner from "./components/ui/LoadingSpinner";

// Everything under /admin is code-split out of the public storefront bundle.
// AdminLayout is lazy-loaded too (not just the pages nested inside it):
// although PrivateRoute only *renders* it once a user is authenticated on
// /admin, it's still statically imported by App.jsx, so without lazy() its
// module graph (NotificationsDropdown, GlassModal, FeedbackModal, react-icons,
// firebase/auth, firebase/database) would ship to every anonymous shopper
// regardless of whether they ever visit /admin. BulkImport is the biggest win
// here since it transitively pulls in the xlsx parsing library.
const StylistQuiz = lazy(() => import("./pages/stylist/Quiz"));
const StylistResults = lazy(() => import("./pages/stylist/Results"));
const StylistSavedBoards = lazy(() => import("./pages/stylist/SavedBoards"));

const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/dashboard"));
const Products = lazy(() => import("./pages/admin/Products"));
const AddProduct = lazy(() => import("./pages/admin/add-product"));
const EditProduct = lazy(() => import("./pages/admin/edit-product"));
const Users = lazy(() => import("./pages/admin/users"));
const Feedback = lazy(() => import("./pages/admin/feedback"));
const SalesReport = lazy(() => import("./pages/admin/sales-report"));
const BulkImport = lazy(() => import("./pages/admin/BulkImport"));

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/product/:id" element={<ProductDetails />} />

        {/* AI Stylist — lazy-loaded, same code-splitting rationale as admin below */}
        <Route
          path="/stylist"
          element={
            <Suspense fallback={<LoadingSpinner size="lg" text="Loading stylist..." />}>
              <StylistQuiz />
            </Suspense>
          }
        />
        <Route
          path="/stylist/results"
          element={
            <Suspense fallback={<LoadingSpinner size="lg" text="Loading stylist..." />}>
              <StylistResults />
            </Suspense>
          }
        />
        <Route
          path="/stylist/saved"
          element={
            <Suspense fallback={<LoadingSpinner size="lg" text="Loading stylist..." />}>
              <StylistSavedBoards />
            </Suspense>
          }
        />

        {/* Admin (protected) — lazy-loaded as a group behind one Suspense boundary */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Suspense
                fallback={
                  <LoadingSpinner size="lg" text="Loading admin console..." />
                }
              >
                <AdminLayout />
              </Suspense>
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="products/edit/:id" element={<EditProduct />} />
          <Route path="products/bulk-import" element={<BulkImport />} />
          <Route path="sales-report" element={<SalesReport />} />
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
