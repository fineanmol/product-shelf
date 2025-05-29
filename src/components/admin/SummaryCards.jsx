// src/components/admin/SummaryCards.jsx
import React, { useEffect, useState } from "react";
import StatCard from "./StatCard";
import { FaBox, FaUserFriends, FaClock, FaEye, FaCommentDots } from "react-icons/fa";
import { getDatabase, ref, get } from "firebase/database";

const SummaryCards = () => {
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalInterested, setTotalInterested] = useState(0);
  const [recentCount, setRecentCount] = useState(0);
  const [mostViewed, setMostViewed] = useState("—");
  const [feedbackData, setFeedbackData] = useState({
    total: 0,
    pending: 0
  });

  useEffect(() => {
    const db = getDatabase();

    const fetchSummary = async () => {
      const productsSnap = await get(ref(db, "products"));
      const interestsSnap = await get(ref(db, "interests"));
      const feedbackSnap = await get(ref(db, "feedback"));

      if (productsSnap.exists()) {
        const products = Object.values(productsSnap.val());
        setTotalProducts(products.length);

        // Recently added (last 7 days)
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = products.filter((p) => p.timestamp > oneWeekAgo);
        setRecentCount(recent.length);

        // Most viewed (based on 'views' property)
        const sortedByViews = [...products].sort(
          (a, b) => (b.views || 0) - (a.views || 0)
        );
        setMostViewed(sortedByViews[0]?.title || "—");
      }

      if (interestsSnap.exists()) {
        const interestData = interestsSnap.val();
        const total = Object.values(interestData).reduce((acc, group) => {
          return acc + Object.keys(group).length;
        }, 0);
        setTotalInterested(total);
      }

      // Fetch feedback data
      if (feedbackSnap.exists()) {
        const feedback = Object.values(feedbackSnap.val());
        const pending = feedback.filter(f => 
          !f.status || f.status === 'todo' || f.status === 'in progress'
        ).length;
        
        setFeedbackData({
          total: feedback.length,
          pending
        });
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <StatCard title="Total Products" value={totalProducts} icon={<FaBox />} />
      <StatCard
        title="Interested Users"
        value={totalInterested}
        icon={<FaUserFriends />}
      />
      <StatCard
        title="Recently Added"
        value={`${recentCount} this week`}
        icon={<FaClock />}
      />
      <StatCard title="Most Viewed" value={mostViewed} icon={<FaEye />} />
      <StatCard 
        title="Feedback" 
        value={`${feedbackData.pending} pending`}
        subtitle={`${feedbackData.total} total`}
        icon={<FaCommentDots />} 
      />
    </div>
  );
};

export default SummaryCards;
