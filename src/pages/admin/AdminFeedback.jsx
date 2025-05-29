import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db, analytics } from "../../firebase";
import { showToast } from "../../utils/showToast";
import { logEvent } from "firebase/analytics";
import {
  FaBug,
  FaLightbulb,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaTools,
  FaTimes,
  FaExclamationTriangle,
  FaUser,
  FaCalendar,
  FaTag,
  FaFlag,
} from "react-icons/fa";

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    const feedbackRef = ref(db, "feedback");
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const feedbackList = Object.entries(data).map(([id, item]) => ({
          id,
          ...item,
        }));
        // Sort by timestamp descending (newest first)
        feedbackList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setFeedback(feedbackList);
      } else {
        setFeedback([]);
      }
      setLoading(false);
    });

    // Log admin feedback view
    if (analytics) logEvent(analytics, "admin_view_feedback");

    return () => unsubscribe();
  }, []);

  const updateFeedbackStatus = async (feedbackId, newStatus) => {
    setUpdatingStatus(feedbackId);
    try {
      await update(ref(db, `feedback/${feedbackId}`), {
        status: newStatus,
        updatedAt: Date.now(),
      });
      
      showToast(`✅ Status updated to "${newStatus}"`);
      if (analytics) {
        logEvent(analytics, "admin_update_feedback_status", {
          feedback_id: feedbackId,
          new_status: newStatus,
        });
      }
    } catch (error) {
      console.error("Failed to update feedback status:", error);
      showToast("❌ Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Filter feedback
  const filteredFeedback = feedback
    .filter((item) =>
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((item) => (typeFilter ? item.type === typeFilter : true))
    .filter((item) => (statusFilter ? item.status === statusFilter : true))
    .filter((item) => (priorityFilter ? item.priority === priorityFilter : true));

  const getStatusIcon = (status) => {
    const icons = {
      todo: <FaClock className="text-blue-500" />,
      "in progress": <FaTools className="text-yellow-500" />,
      resolved: <FaCheckCircle className="text-green-500" />,
      "not required": <FaTimes className="text-gray-500" />,
    };
    return icons[status] || <FaClock className="text-blue-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: "bg-blue-100 text-blue-800",
      "in progress": "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      "not required": "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-blue-100 text-blue-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type) => {
    return type === "feature" ? (
      <FaLightbulb className="text-yellow-500" />
    ) : (
      <FaBug className="text-red-500" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-600">Loading feedback...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Feedback</h1>
          <p className="text-gray-600">Manage feature requests and bug reports</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {feedback.length} | Filtered: {filteredFeedback.length}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search feedback..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="feature">Feature Requests</option>
            <option value="bug">Bug Reports</option>
          </select>

          {/* Status Filter */}
          <select
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="todo">Todo</option>
            <option value="in progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="not required">Not Required</option>
          </select>

          {/* Priority Filter */}
          <select
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredFeedback.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaExclamationTriangle className="text-4xl mx-auto mb-4 text-gray-300" />
            <p>No feedback found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feedback
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFeedback.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {item.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {item.description}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                              <FaFlag className="inline mr-1" />
                              {item.priority}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              <FaTag className="inline mr-1" />
                              {item.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        {item.email && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <FaUser className="text-xs" />
                            <span>{item.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-600">
                          <FaCalendar className="text-xs" />
                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {item.status || 'todo'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={item.status || 'todo'}
                          onChange={(e) => updateFeedbackStatus(item.id, e.target.value)}
                          disabled={updatingStatus === item.id}
                          className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="todo">Todo</option>
                          <option value="in progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="not required">Not Required</option>
                        </select>
                        
                        <button
                          onClick={() => setSelectedFeedback(item)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white hover:text-gray-100 transition-all duration-200"
                aria-label="Close modal"
              >
                <FaTimes className="text-lg" />
              </button>
              
              <div className="flex items-start gap-4 pr-12">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  {getTypeIcon(selectedFeedback.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      selectedFeedback.type === 'feature' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedFeedback.type === 'feature' ? (
                        <>
                          <FaLightbulb className="text-yellow-500" />
                          Feature Request
                        </>
                      ) : (
                        <>
                          <FaBug className="text-red-500" />
                          Bug Report
                        </>
                      )}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(selectedFeedback.status)}`}>
                      {getStatusIcon(selectedFeedback.status)}
                      {selectedFeedback.status || 'todo'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                    {selectedFeedback.title}
                  </h2>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <div className="flex items-center gap-1.5">
                      <FaCalendar className="text-white/60" />
                      {new Date(selectedFeedback.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    {selectedFeedback.email && (
                      <div className="flex items-center gap-1.5">
                        <FaUser className="text-white/60" />
                        {selectedFeedback.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
              <div className="p-6 space-y-6">
                {/* Priority and Category Pills */}
                <div className="flex flex-wrap gap-3">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${getPriorityColor(selectedFeedback.priority)}`}>
                    <FaFlag className="text-sm" />
                    {selectedFeedback.priority} Priority
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700">
                    <FaTag className="text-sm" />
                    {selectedFeedback.category}
                  </div>
                </div>

                {/* Description Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Description
                  </h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                      {selectedFeedback.description}
                    </p>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  {selectedFeedback.email && (
                    <div className="bg-blue-50 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wide">
                        Contact Information
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FaUser className="text-blue-600 text-sm" />
                          </div>
                          <div>
                            <div className="text-xs text-blue-600 font-medium">Email</div>
                            <div className="text-blue-900 font-medium">{selectedFeedback.email}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="bg-green-50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-green-900 mb-3 uppercase tracking-wide">
                      Timeline
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FaCalendar className="text-green-600 text-sm" />
                        </div>
                        <div>
                          <div className="text-xs text-green-600 font-medium">Submitted</div>
                          <div className="text-green-900 font-medium">
                            {new Date(selectedFeedback.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      
                      {selectedFeedback.updatedAt && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <FaClock className="text-green-600 text-sm" />
                          </div>
                          <div>
                            <div className="text-xs text-green-600 font-medium">Last Updated</div>
                            <div className="text-green-900 font-medium">
                              {new Date(selectedFeedback.updatedAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                {selectedFeedback.url && (
                  <div className="bg-amber-50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-amber-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      Technical Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-amber-600 font-medium mb-1">Page URL</div>
                        <div className="bg-white rounded-lg p-3 border border-amber-200">
                          <code className="text-sm text-gray-700 break-all">{selectedFeedback.url}</code>
                        </div>
                      </div>
                      {selectedFeedback.userAgent && (
                        <div>
                          <div className="text-xs text-amber-600 font-medium mb-1">User Agent</div>
                          <div className="bg-white rounded-lg p-3 border border-amber-200">
                            <code className="text-xs text-gray-600 break-all">{selectedFeedback.userAgent}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Feedback ID: <code className="text-xs bg-gray-200 px-2 py-1 rounded">{selectedFeedback.id}</code>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedFeedback(null)}
                      className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors duration-200"
                    >
                      Close
                    </button>
                    {selectedFeedback.email && (
                      <a
                        href={`mailto:${selectedFeedback.email}?subject=Re: ${selectedFeedback.title}&body=Hi,%0D%0A%0D%0AThank you for your feedback regarding "${selectedFeedback.title}".%0D%0A%0D%0A`}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors duration-200 flex items-center gap-2"
                      >
                        <FaUser className="text-sm" />
                        Reply via Email
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback; 