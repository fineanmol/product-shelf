import React, { useEffect, useState, useMemo } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { FaWhatsapp } from "react-icons/fa";
import SearchInput from "../shared/SearchInput";
import ExportCSVButton from "../shared/ExportCSVButton";
import { getCurrentUserRole } from "../../utils/permissions";

const ITEMS_PER_PAGE = 10;

const InterestsTable = () => {
  const [interests, setInterests] = useState([]);
  const [products, setProducts] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
            Object.values(entries).forEach((entry) => {
              interestList.push({
                ...entry,
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
      .filter((i) =>
        `${i.name} ${i.email} ${i.phone}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
  }, [interests, search]);

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
    <div className="p-4 bg-white shadow rounded-xl mt-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h3 className="text-lg font-semibold">Interested Users</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
              <thead className="bg-gray-100 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Delivery</th>
                  <th className="px-4 py-2">Timestamp</th>
                  <th className="px-4 py-2 text-right">Chat</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((entry, index) => (
                  <tr
                    key={index}
                    className="border-t hover:bg-gray-50 transition whitespace-nowrap"
                  >
                    <td className="px-4 py-2">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-4 py-2">{entry.name}</td>
                    <td className="px-4 py-2">{entry.email}</td>
                    <td className="px-4 py-2">{entry.phone}</td>
                    <td className="px-4 py-2">
                      {products[entry.productId]?.title || "—"}
                    </td>
                    <td className="px-4 py-2">
                      {entry.deliveryPreference || "—"}
                    </td>
                    <td className="px-4 py-2">
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {entry.phone && (
                        <a
                          href={`https://wa.me/${entry.phone.replace(
                            /\D/g,
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 text-lg"
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
