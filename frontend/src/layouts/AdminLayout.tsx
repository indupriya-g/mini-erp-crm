import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Customers", path: "/customers" },
    { name: "Products", path: "/products" },
    { name: "Sales Challans", path: "/challans" },
  ];

  return (
    <div className="min-h-screen bg-slate-100">

      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white">

        <div className="flex h-16 items-center border-b border-slate-700 px-6">
          <h1 className="text-xl font-bold">
            Mini ERP CRM
          </h1>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-4">

          <div className="mb-3">
            <p className="text-sm font-semibold">
              {user?.name}
            </p>

            <p className="text-xs text-slate-400">
              {user?.role}
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-red-600 hover:text-white"
          >
            Logout
          </button>

        </div>

      </aside>

      <main className="ml-64 min-h-screen">

        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8">
          <h2 className="font-semibold text-slate-800">
            Business Management
          </h2>

          <div className="text-sm text-slate-500">
            {user?.email}
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>

      </main>

    </div>
  );
}