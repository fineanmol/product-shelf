import React, { useEffect, useState, useRef } from 'react';
import { getDatabase, ref, get, update } from 'firebase/database';
import { FaBell, FaWhatsapp } from 'react-icons/fa';

const NotificationsDropdown = ({ userRole }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const db = getDatabase();
        const interestsRef = ref(db, 'interests');
        const snapshot = await get(interestsRef);
        
        if (snapshot.exists()) {
          const allInterests = snapshot.val();
          let filteredInterests = [];

          // Process all interests
          Object.entries(allInterests).forEach(([productId, productInterests]) => {
            Object.entries(productInterests).forEach(([interestId, interest]) => {
              // For super admins, show all notifications
              // For editors, only show notifications for their products
              if (userRole.isSuperAdmin || 
                  (userRole.role === 'editor' && interest.added_by === userRole.user?.uid)) {
                filteredInterests.push({
                  id: interestId,
                  productId,
                  ...interest,
                  viewed: interest.viewed || false
                });
              }
            });
          });

          // Sort by timestamp descending
          filteredInterests.sort((a, b) => b.timestamp - a.timestamp);
          setNotifications(filteredInterests);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [userRole]);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.viewed) {
      try {
        const db = getDatabase();
        await update(ref(db, `interests/${notification.productId}/${notification.id}`), {
          viewed: true
        });
        
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, viewed: true } : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as viewed:', error);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.viewed).length;

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
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.viewed ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {notification.productTitle || 'Product Interest'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {notification.name} is interested in your product
                      </p>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Email: {notification.email}</p>
                        <p>Phone: {notification.phone}</p>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/${notification.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaWhatsapp className="text-xl" />
                    </a>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {new Date(notification.timestamp).toLocaleString()}
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