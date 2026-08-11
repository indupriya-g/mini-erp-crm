import { useState, useEffect } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    lowStock: 0,
    challans: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const [
        customersRes,
        productsRes,
        lowStockRes,
        challansRes,
      ] = await Promise.all([
        apiClient.get("/customers", { params: { limit: 1 } }),
        apiClient.get("/products", { params: { limit: 1 } }),
        apiClient.get("/products", {
          params: { lowStock: true, limit: 100 },
        }),
        apiClient.get("/challans", { params: { limit: 1 } }),
      ]);

      setStats({
        customers: customersRes.data.pagination.total,
        products: productsRes.data.pagination.total,
        lowStock: lowStockRes.data.data.length,
        challans: challansRes.data.pagination.total,
      });
    }

    loadStats();
  }, []);

  const cards = [
    {
      label: "Total Customers",
      value: stats.customers,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Total Products",
      value: stats.products,
      color: "bg-purple-50 text-purple-700",
    },
    {
      label: "Low Stock Items",
      value: stats.lowStock,
      color: "bg-red-50 text-red-700",
    },
    {
      label: "Total Challans",
      value: stats.challans,
      color: "bg-green-50 text-green-700",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">
        Welcome, {user?.name}
      </h1>

      <p className="text-slate-500 text-sm mb-6">
        Here's what's happening in your business today.
      </p>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl p-5 ${card.color}`}
          >
            <p className="text-sm font-medium opacity-80">
              {card.label}
            </p>

            <p className="text-3xl font-semibold mt-2">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}