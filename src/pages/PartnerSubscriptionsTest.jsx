import React, { useState, useEffect } from "react";
import PartnerTopLayout from "../layouts/PartnerTopLayout";
import subscriptionApi from "../api/subscriptionApi";

export default function PartnerSubscriptionsTest() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await subscriptionApi.getAll();
        console.log("Full API Response:", response);
        console.log("Response data:", response.data);
        console.log("Response data type:", typeof response.data);
        console.log("Is array?", Array.isArray(response.data));
        setData(response);
        setError(null);
      } catch (err) {
        console.error("API Error:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <PartnerTopLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Subscription API Test</h1>
          
          {loading && (
            <div className="bg-blue-100 p-4 rounded">
              Loading...
            </div>
          )}

          {error && (
            <div className="bg-red-100 p-4 rounded mb-4">
              <h2 className="font-bold text-red-800">Error:</h2>
              <pre className="text-sm">{error}</pre>
            </div>
          )}

          {data && (
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-bold mb-2">API Response:</h2>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </PartnerTopLayout>
  );
}
