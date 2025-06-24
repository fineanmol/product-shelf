import React, { useEffect, useState, useRef, useMemo } from "react";
import { getDatabase, ref, onValue, update, get } from "firebase/database";
import {
  FaBell,
  FaWhatsapp,
  FaMoneyBill,
  FaEnvelope,
  FaPhone,
  FaClock,
} from "react-icons/fa";

const NotificationsDropdown = ({ userRole }) => {
  const [allInterests, setAllInterests] = useState({});
  const [products, setProducts] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!userRole) return; // Wait for user role to be loaded

    const db = getDatabase();
    const interestsRef = ref(db, "interests");
    const productsRef = ref(db, "products");

    // Fetch products
    const productsUnsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        setProducts(snapshot.val());
      }
    });

    // Use onValue for real-time updates instead of get() for one-time fetch
    const interestsUnsubscribe = onValue(interestsRef, (snapshot) => {
      if (snapshot.exists()) {
        setAllInterests(snapshot.val());
      } else {
        setAllInterests({});
      }
    });

    return () => {
      productsUnsubscribe();
      interestsUnsubscribe();
    };
  }, [userRole]);

  // Memoize expensive filtering and sorting operations
  const notifications = useMemo(() => {
    let filteredInterests = [];

    // Process all interests
    Object.entries(allInterests).forEach(([productId, productInterests]) => {
      const product = products[productId];
      Object.entries(productInterests).forEach(([interestId, interest]) => {
        // For super admins, show all notifications
        // For editors, only show notifications for their products
        if (
          userRole.isSuperAdmin ||
          (userRole.role === "editor" &&
            interest.added_by === userRole.user?.uid)
        ) {
          filteredInterests.push({
            id: interestId,
            productId,
            productTitle: product?.title || "Deleted Product",
            productImage: product?.image,
            productPrice: product?.price,
            productCurrency: product?.currency || "EUR",
            ...interest,
            viewed: interest.viewed || false,
          });
        }
      });
    });

    // Sort by timestamp descending
    return filteredInterests.sort((a, b) => b.timestamp - a.timestamp);
  }, [allInterests, products, userRole]);

  // Memoize unread count calculation
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.viewed).length;
  }, [notifications]);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.viewed) {
      try {
        const db = getDatabase();
        await update(
          ref(db, `interests/${notification.productId}/${notification.id}`),
          {
            viewed: true,
          }
        );

        // Update local state to reflect the change
        setAllInterests((prev) => ({
          ...prev,
          [notification.productId]: {
            ...prev[notification.productId],
            [notification.id]: {
              ...prev[notification.productId][notification.id],
              viewed: true,
            },
          },
        }));
      } catch (error) {
        console.error("Error marking notification as viewed:", error);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-lg bg-white rounded-lg shadow-lg border z-50">
          <div className="p-3 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
          </div>

          <div className="max-h-[80vh] sm:max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.viewed ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {notification.productImage && (
                      <img
                        src={notification.productImage}
                        alt={notification.productTitle}
                        className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base line-clamp-1">
                            {notification.productTitle}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs sm:text-sm text-gray-600">
                            <FaMoneyBill className="text-gray-400" />
                            <span>
                              {notification.productCurrency}{" "}
                              {notification.productPrice}
                            </span>
                          </div>
                        </div>
                        <a
                          href={`https://wa.me/${notification.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 p-1 -mt-1 -mr-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaWhatsapp className="text-xl" />
                        </a>
                      </div>

                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-800">
                          {notification.name}{" "}
                          <span className="text-gray-500 font-normal">
                            is interested
                          </span>
                        </p>
                        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <FaEnvelope className="text-gray-400" />
                            <span className="truncate">
                              {notification.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FaPhone className="text-gray-400" />
                            <span>{notification.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:col-span-2 mt-0.5">
                            <FaClock className="text-gray-400" />
                            <span>
                              {new Date(
                                notification.timestamp
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
