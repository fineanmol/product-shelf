import React from "react";
import AdminFeedback from "./AdminFeedback";

function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
              <p className="text-gray-600 mt-1">
                Manage customer feedback and feature requests.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Component */}
        <AdminFeedback />
      </div>
    </div>
  );
}

export default FeedbackPage; 