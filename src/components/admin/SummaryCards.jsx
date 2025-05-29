// src/components/admin/SummaryCards.jsx
import React, { useEffect, useState } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { FaBox, FaUsers, FaCommentDots, FaClock } from "react-icons/fa";
import { getCurrentUserRole, filterDataByUserRole } from "../../utils/permissions";

function SummaryCards() {
  const [productCount, setProductCount] = useState(0);
  const [interestCount, setInterestCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      const db = getDatabase();
      
      try {
        // Get current user role
        const userRoleData = await getCurrentUserRole();
        setUserRole(userRoleData);
        
        // Fetch products
        const productsSnapshot = await get(ref(db, "products"));
        const productsData = productsSnapshot.val() || {};
        let productsList = Object.entries(productsData).map(([id, data]) => ({ id, ...data }));
        
        // Filter products based on user role
        productsList = filterDataByUserRole(
          productsList,
          userRoleData.role,
          userRoleData.user?.uid,
          userRoleData.isSuperAdmin
        );
        
        setProductCount(productsList.length);

        // Fetch interests
        const interestsSnapshot = await get(ref(db, "interests"));
        const interestsData = interestsSnapshot.val() || {};
        
        let totalInterests = 0;
        if (userRoleData.isSuperAdmin) {
          // Super admins see all interests
          totalInterests = Object.values(interestsData).reduce((total, productInterests) => {
            return total + Object.keys(productInterests).length;
          }, 0);
        } else {
          // Editors only see interests for their products
          const userProductIds = productsList.map(p => p.id);
          userProductIds.forEach(productId => {
            if (interestsData[productId]) {
              totalInterests += Object.keys(interestsData[productId]).length;
            }
          });
        }
        
        setInterestCount(totalInterests);

        // Fetch feedback (only for super admins)
        if (userRoleData.isSuperAdmin) {
          const feedbackSnapshot = await get(ref(db, "feedback"));
          const feedbackData = feedbackSnapshot.val() || {};
          const feedbackArray = Object.values(feedbackData);
          
          setFeedbackCount(feedbackArray.length);
          const pendingCount = feedbackArray.filter(
            item => !item.status || item.status === 'todo' || item.status === 'in progress'
          ).length;
          setPendingFeedbackCount(pendingCount);
        } else {
          setFeedbackCount(0);
          setPendingFeedbackCount(0);
        }
      } catch (error) {
        console.error("Error fetching counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const baseCards = [
    {
      title: "My Products",
      value: productCount,
      icon: <FaBox className="text-blue-600" />,
      bgColor: "bg-blue-100",
    },
    {
      title: "Customer Interests", 
      value: interestCount,
      icon: <FaUsers className="text-green-600" />,
      bgColor: "bg-green-100",
    }
  ];

  const adminOnlyCards = [
    {
      title: "Total Feedback",
      value: feedbackCount,
      icon: <FaCommentDots className="text-purple-600" />,
      bgColor: "bg-purple-100",
    },
    {
      title: "Pending Feedback",
      value: pendingFeedbackCount,
      icon: <FaClock className="text-orange-600" />,
      bgColor: "bg-orange-100",
    }
  ];

  const cards = userRole?.isSuperAdmin ? [...baseCards, ...adminOnlyCards] : baseCards;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div 
          key={index}
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SummaryCards;
