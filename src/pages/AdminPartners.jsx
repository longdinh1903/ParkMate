import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import partnerApi from "../api/partnerApi";

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // số record mỗi trang

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await partnerApi.getAll();
        setPartners(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching partners:", err);
      }
    };
    fetchData();
  }, []);

  // Filter theo search và location
  const filtered = partners.filter((p) => {
    const matchSearch = p.companyName
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchLocation = location ? p.city === location : true;
    return matchSearch && matchLocation;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <AdminLayout>
      {/* Header: Title + Search + Location */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Partners</h2>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search"
            className="border px-3 py-2 rounded-md w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border px-3 py-2 rounded-md w-40"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">Location</option>
            <option value="New York, NY">New York, NY</option>
            <option value="Los Angeles, CA">Los Angeles, CA</option>
            <option value="Chicago, IL">Chicago, IL</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Parking Lots</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Registered At</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((p, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50 transition">
                  <td className="px-4 py-2">{p.companyName}</td>
                  <td className="px-4 py-2">{p.companyEmail}</td>
                  <td className="px-4 py-2">{p.companyPhone}</td>
                  <td className="px-4 py-2 text-center">
                    {p.parkingLots || 0}
                  </td>
                  <td className="px-4 py-2">{p.city}</td>
                  <td className="px-4 py-2">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-4 text-center text-gray-500"
                >
                  No partners found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => handlePageChange(idx + 1)}
              className={`px-3 py-1 border rounded-md ${
                currentPage === idx + 1
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
