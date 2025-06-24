import React, { useEffect, useState, useMemo } from "react";
import { getDatabase, ref, get, update } from "firebase/database";
import {
  FaUsers,
  FaShieldAlt,
  FaSearch,
  FaCrown,
  FaUserCheck,
  FaUserTimes,
} from "react-icons/fa";
import { showToast } from "../../utils/showToast";
import ProfileImage from "../../components/shared/ProfileImage";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const db = getDatabase();
      const snap = await get(ref(db, "users"));
      if (snap.exists()) {
        const data = snap.val() || {};
        console.log("Raw user data from Firebase:", data);
        const userArray = Object.entries(data).map(([uid, val]) => {
          console.log("Processing user:", { uid, ...val });
          return {
            uid,
            ...val,
          };
        });
        setUsers(userArray);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const db = getDatabase();
      const userRef = ref(db, `users/${userId}`);
      const superAdminsRef = ref(db, "superAdmins");

      // Update user role
      await update(userRef, { role: newRole });

      // Get current superAdmins data
      const superAdminsSnapshot = await get(superAdminsRef);
      const superAdmins = superAdminsSnapshot.val() || {};

      if (newRole === "superadmin") {
        // Add user to superAdmins if not already present
        if (!superAdmins[userId]) {
          await update(superAdminsRef, {
            [userId]: true,
          });
        }
      } else {
        // Remove user from superAdmins if they were a superadmin
        if (superAdmins[userId]) {
          const updates = {};
          updates[userId] = null; // This will remove the entry
          await update(superAdminsRef, updates);
        }
      }

      // Update local state
      setUsers(
        users.map((user) =>
          user.uid === userId ? { ...user, role: newRole } : user
        )
      );

      showToast(`User role updated to ${newRole}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      showToast("Failed to update user role", "error");
    }
  };

  const handleDisableUser = async (uid, disabled) => {
    const db = getDatabase();
    await update(ref(db, `users/${uid}`), { disabled });
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, disabled } : u))
    );
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Memoize expensive stats calculations
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => !u.disabled).length,
      disabled: users.filter((u) => u.disabled).length,
      admins: users.filter((u) => u.role === "admin" || u.role === "superadmin")
        .length,
    };
  }, [users]);

  const getRoleIcon = (role) => {
    const icons = {
      editor: <FaUserCheck className="text-blue-600" />,
      admin: <FaShieldAlt className="text-purple-600" />,
      superadmin: <FaCrown className="text-red-600" />,
    };
    return icons[role] || <FaUsers className="text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage user accounts, roles, and permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaUsers className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FaUserCheck className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FaUserTimes className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Disabled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.disabled}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaCrown className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.admins}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">All Users</h3>
                <p className="text-gray-600 text-sm">
                  Manage user accounts and permissions
                </p>
              </div>

              {/* Search */}
              <div className="flex items-center bg-white rounded-lg px-4 py-2 border">
                <FaSearch className="text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent outline-none text-gray-700 placeholder-gray-500 w-48"
                />
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-600">Loading users...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">
                        #
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">
                        User
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">
                        Role
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user.uid}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4 text-gray-600 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <ProfileImage
                              src={user.photoURL}
                              alt={user.name || user.email || "User"}
                              className="w-8 h-8 rounded-full object-cover"
                              size={32}
                              key={user.uid}
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.name || "No name"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {user.uid.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={user.role || "editor"}
                              onChange={(e) =>
                                handleRoleChange(user.uid, e.target.value)
                              }
                              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="editor">Editor</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Superadmin</option>
                            </select>
                            {getRoleIcon(user.role)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              user.disabled
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.disabled ? (
                              <>
                                <FaUserTimes />
                                Disabled
                              </>
                            ) : (
                              <>
                                <FaUserCheck />
                                Active
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={user.disabled || false}
                              onChange={(e) =>
                                handleDisableUser(user.uid, e.target.checked)
                              }
                              className="sr-only"
                            />
                            <div
                              className={`relative w-10 h-6 rounded-full transition-colors ${
                                user.disabled ? "bg-red-400" : "bg-green-400"
                              }`}
                            >
                              <div
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                  user.disabled
                                    ? "translate-x-4"
                                    : "translate-x-0"
                                }`}
                              ></div>
                            </div>
                            <span className="ml-3 text-sm text-gray-700">
                              {user.disabled ? "Enable" : "Disable"}
                            </span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;
