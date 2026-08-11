import { useEffect, useState } from "react";
import apiClient from "../api/client";

interface Customer {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  currentStock: number;
  minStockAlert: number;
}

interface Challan {
  id: number;
  challanNumber: string;
  status: string;
  totalQuantity: number;
  createdAt: string;
  customer?: {
    name: string;
  };
}

export default function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [customersRes, productsRes, challansRes] =
          await Promise.all([
            apiClient.get("/customers"),
            apiClient.get("/products"),
            apiClient.get("/challans"),
          ]);

        setCustomers(customersRes.data.data || []);
        setProducts(productsRes.data.data || []);
        setChallans(challansRes.data.data || []);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const lowStockProducts = products.filter(
    (product) => product.currentStock <= product.minStockAlert
  );

  const confirmedChallans = challans.filter(
    (challan) => challan.status === "CONFIRMED"
  );

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-4 text-gray-500">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Welcome back! Here's an overview of your business.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Customers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Customers
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {customers.length}
              </p>
            </div>

            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
              👥
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Products
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {products.length}
              </p>
            </div>

            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
              📦
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Low Stock
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {lowStockProducts.length}
              </p>
            </div>

            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">
              ⚠️
            </div>
          </div>
        </div>

        {/* Challans */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Confirmed Challans
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {confirmedChallans.length}
              </p>
            </div>

            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              🧾
            </div>
          </div>
        </div>

      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">

        {/* Recent Challans */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Challans
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Latest sales transactions
            </p>
          </div>

          <div className="overflow-x-auto">

            {challans.length === 0 ? (
              <div className="p-6 text-gray-500">
                No challans found.
              </div>
            ) : (
              <table className="w-full">

                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Challan
                    </th>

                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>

                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>

                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">

                  {challans.slice(0, 5).map((challan) => (
                    <tr key={challan.id}>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {challan.challanNumber}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {challan.customer?.name || "Unknown"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            challan.status === "CONFIRMED"
                              ? "bg-green-100 text-green-700"
                              : challan.status === "DRAFT"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {challan.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {challan.totalQuantity}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>
            )}

          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Low Stock Products
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Products that need attention
            </p>
          </div>

          <div>

            {lowStockProducts.length === 0 ? (
              <div className="p-6 text-gray-500">
                All products have sufficient stock.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">

                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="p-5 flex items-center justify-between"
                  >

                    <div>
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        SKU: {product.sku}
                      </p>
                    </div>

                    <div className="text-right">

                      <p className="font-semibold text-red-600">
                        {product.currentStock} units
                      </p>

                      <p className="text-xs text-gray-500">
                        Minimum: {product.minStockAlert}
                      </p>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}