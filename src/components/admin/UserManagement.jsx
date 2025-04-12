import React, { useEffect, useState } from "react";
import { getDatabase, ref, get, update } from "firebase/database";

const UserManagement = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    // Suppose you store your users in "appUsers" key
    get(ref(db, "appUsers")).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userArray = Object.entries(data).map(([uid, val]) => ({
          uid,
          ...val,
        }));
        setUsers(userArray);
      }
    });
  }, []);

  const handleRoleChange = async (uid, newRole) => {
    const db = getDatabase();
    await update(ref(db, `appUsers/${uid}`), { role: newRole });
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
    );
  };

  const handleDisableUser = async (uid, disabled) => {
    const db = getDatabase();
    await update(ref(db, `appUsers/${uid}`), { disabled });
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, disabled } : u))
    );
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">User Management</h3>
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">UID</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Disabled</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.uid}>
                <td className="px-4 py-2">{user.uid}</td>
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
};

export default UserManagement;
