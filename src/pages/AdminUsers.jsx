import React, { useEffect, useState } from "react";
import { getDatabase, ref, get, update } from "firebase/database";

function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const db = getDatabase();
      const snap = await get(ref(db, "users"));
      if (snap.exists()) {
        const data = snap.val() || {};
        const userArray = Object.entries(data).map(([uid, val]) => ({
          uid,
          ...val,
        }));
        setUsers(userArray);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (uid, newRole) => {
    const db = getDatabase();
    await update(ref(db, `users/${uid}`), { role: newRole });
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
    );
  };

  const handleDisableUser = async (uid, disabled) => {
    const db = getDatabase();
    await update(ref(db, `users/${uid}`), { disabled });
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, disabled } : u))
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Disabled</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user, index) => (
              <tr key={user.uid} className="group relative hover:bg-gray-50">
                <td className="px-4 py-2 relative">
                  {index + 1}
                  {/* UID Tooltip */}
                  <div className="absolute top-full left-2 mt-1 hidden group-hover:block bg-white text-gray-600 text-xs rounded px-2 py-1 shadow z-10 whitespace-nowrap">
                    UID: {user.uid}
                  </div>
                </td>
                <td className="px-4 py-2">{user.name || "-"}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">
                  <select
                    value={user.role || "editor"}
                    onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={user.disabled || false}
                      onChange={(e) =>
                        handleDisableUser(user.uid, e.target.checked)
                      }
                    />
                    <span className="ml-2">Disabled</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsers;
