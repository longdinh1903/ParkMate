import { Link } from "react-router-dom";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔹 Full-width Navbar */}
      <header className="bg-indigo-700 text-white shadow w-full">
        <div className="px-10 py-3 flex justify-between items-center">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            {/* ✅ Logo P */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white text-indigo-700 rounded-full flex items-center justify-center font-bold">
                P
              </div>
              <span className="font-semibold">Parking Admin</span>
            </div>

            {/* ✅ Navbar */}
            <nav className="flex gap-6 text-sm font-medium">
              <Link to="/admin/parking-lots" className="hover:underline">
                Parking Lots
              </Link>
              <Link to="/admin/users" className="hover:underline">
                User
              </Link>
              <Link to="/admin/partners" className="hover:underline">
                Partner
              </Link>
              <Link to="/admin/requests" className="hover:underline">
                Request
              </Link>
              <Link to="/admin/reports" className="hover:underline">
                Report
              </Link>
            </nav>
          </div>

          {/* Right: Admin avatar */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-indigo-700 rounded-full flex items-center justify-center font-bold">
              A
            </div>
            <span>Admin</span>
          </div>
        </div>
      </header>

      {/* Content full width but centered with padding */}
      <main className="px-10 py-6">{children}</main>
    </div>
  );
}
