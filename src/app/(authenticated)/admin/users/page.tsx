"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  location: { name: string; code: string } | null;
}

const roleBadge: Record<string, string> = {
  ADMIN: "bg-ias-gray-100 text-purple-600",
  MANAGER: "bg-ias-gray-100 text-blue-600",
  PURCHASER: "bg-ias-gray-100 text-green-600",
  EMPLOYEE: "bg-ias-gray-100 text-ias-gray-600",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-ias-gray-400 py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ias-charcoal">Users</h1>
        <p className="text-ias-gray-500 text-sm mt-1">{users.length} users</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ias-gray-50 border-b border-ias-gray-200">
              <th className="text-left px-4 py-3 font-medium text-ias-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-ias-gray-600 hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-medium text-ias-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-ias-gray-600 hidden md:table-cell">Location</th>
              <th className="text-center px-4 py-3 font-medium text-ias-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ias-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-ias-gray-50">
                <td className="px-4 py-3 font-medium">{user.name || "—"}</td>
                <td className="px-4 py-3 text-ias-gray-600 hidden sm:table-cell">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadge[user.role]}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-ias-gray-600 hidden md:table-cell">
                  {user.location ? `${user.location.name} (${user.location.code})` : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`w-2 h-2 rounded-full inline-block ${user.active ? "bg-ias-success" : "bg-ias-gray-300"}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
