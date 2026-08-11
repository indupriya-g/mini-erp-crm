
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
    const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Customers", path: "/customers", icon: "👥" },
    { name: "Products", path: "/products", icon: "📦" },
    { name: "Challans", path: "/challans", icon: "🧾" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            Mini ERP CRM
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Business Management
          </p>
        </div>

        <nav className="flex-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3">
            <p className="font-medium text-gray-900">
              {user?.name || "User"}
            </p>

            <p className="text-sm text-gray-500">
              {user?.role || "Employee"}
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
          >
            Sign Out
          </button>
        </div>
      </aside>

     <main className="flex-1 min-w-0">
  <Outlet />
</main>
    </div>
  );
}
