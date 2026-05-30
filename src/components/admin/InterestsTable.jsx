import React, { useEffect, useState, useMemo } from "react";
import { getDatabase, ref, get, update } from "firebase/database";
import { FaWhatsapp } from "react-icons/fa";
import SearchInput from "../shared/SearchInput";
import ExportCSVButton from "../shared/ExportCSVButton";
import { getCurrentUserRole } from "../../utils/permissions";
import { showToast } from "../../utils/showToast";

const ITEMS_PER_PAGE = 10;

const InterestsTable = () => {
  const [interests, setInterests] = useState([]);
  const [products, setProducts] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const handleToggleResolve = async (productId, interestId, currentResolved) => {
    try {
      const db = getDatabase();
      const interestRef = ref(db, `interests/${productId}/${interestId}`);
      await update(interestRef, { resolved: !currentResolved });
      
      setInterests((prev) =>
        prev.map((i) =>
          i.productId === productId && i.interestId === interestId
            ? { ...i, resolved: !currentResolved }
            : i
        )
      );
      showToast(`✅ Interest marked as ${!currentResolved ? "Resolved" : "Active"}`);
    } catch (err) {
      console.error("Error toggling resolve state:", err);
      showToast("❌ Failed to update interest status");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase();

      // Get current user role
      const userRoleData = await getCurrentUserRole();

      const [interestsSnap, productsSnap] = await Promise.all([
        get(ref(db, "interests")),
        get(ref(db, "products")),
      ]);

      let productsList = {};
      if (productsSnap.exists()) {
        productsList = productsSnap.val();

        // Filter products based on user role
        if (!userRoleData.isSuperAdmin && userRoleData.role === "editor") {
          // For editors, filter to only their products
          const filteredProducts = {};
          Object.entries(productsList).forEach(([productId, productData]) => {
            if (productData.added_by === userRoleData.user?.uid) {
              filteredProducts[productId] = productData;
            }
          });
          productsList = filteredProducts;
        }

        setProducts(productsList);
      }

      const interestList = [];
      if (interestsSnap.exists()) {
        const rawData = interestsSnap.val();
        Object.entries(rawData).forEach(([productId, entries]) => {
          // Only include interests for products the user can see
          if (productsList[productId]) {
            Object.entries(entries).forEach(([interestId, entry]) => {
              interestList.push({
                ...entry,
                interestId,
                productId,
              });
            });
          }
        });

        setInterests(interestList);
      }
    };

    fetchData();
  }, []);

  // Memoize expensive filtering and sorting operations
  const filteredAndSorted = useMemo(() => {
    return interests
      .slice() // Create a copy to avoid mutating original array
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .filter((i) => {
        const matchesTab = activeTab === "resolved" ? !!i.resolved : !i.resolved;
        const matchesSearch = `${i.name} ${i.email} ${i.phone}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return matchesTab && matchesSearch;
      });
  }, [interests, search, activeTab]);

  // Memoize pagination calculation
  const { paginated, totalPages } = useMemo(() => {
    const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
    const paginated = filteredAndSorted.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE
    );
    return { paginated, totalPages };
  }, [filteredAndSorted, page]);

  // Memoize export data to prevent re-computation
  const exportData = useMemo(() => {
    return filteredAndSorted.map((i) => ({
      name: i.name,
      email: i.email,
      phone: i.phone,
      product: products[i.productId]?.title || "—",
      deliveryPreference: i.deliveryPreference,
      timestamp: i.timestamp ? new Date(i.timestamp).toLocaleString() : "—",
    }));
  }, [filteredAndSorted, products]);

  return (
    <div className="p-6 bg-white shadow-sm rounded-xl mt-10 border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4 border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <h3 className="text-xl font-bold text-gray-800">Interested Users</h3>
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "active"
                  ? "bg-white text-brand-navy shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab("resolved")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "resolved"
                  ? "bg-white text-brand-navy shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Resolved
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, email or phone"
          />
          <ExportCSVButton
            data={exportData}
            headers={[
              "name",
              "email",
              "phone",
              "product",
              "deliveryPreference",
              "timestamp",
            ]}
            filename="interests.csv"
          />
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <p className="text-sm text-gray-500">No matching users found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto border rounded">
              <thead className="bg-gray-50 text-gray-600 text-left border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Delivery</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((entry, index) => (
                  <tr
                    key={index}
                    className="border-t hover:bg-gray-50/50 transition whitespace-nowrap align-middle"
                  >
                    <td className="px-4 py-3 text-gray-500 font-medium">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{entry.name}</td>
                    <td className="px-4 py-3 text-gray-600">{entry.email}</td>
                    <td className="px-4 py-3 text-gray-600">{entry.phone}</td>
                    <td className="px-4 py-3 text-gray-800">
                      {products[entry.productId]?.title || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {entry.deliveryPreference || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleResolve(entry.productId, entry.interestId, entry.resolved)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                          entry.resolved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        {entry.resolved ? "Resolved" : "Active"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.phone && (
                        <a
                          href={`https://wa.me/${entry.phone.replace(
                            /\D/g,
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-green-600 hover:text-green-700 text-lg transition-colors p-1"
                          title="Chat on WhatsApp"
                        >
                          <FaWhatsapp />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end items-center mt-4 gap-2 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default InterestsTable;
