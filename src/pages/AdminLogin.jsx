import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ import navigate
import adminApi from "../api/adminApi";
import InputField from "../components/InputField";
import AuthLayout from "../layouts/AuthLayout";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate(); // ✅ hook điều hướng

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const res = await adminApi.login({ email, password });
        console.log("✅ Login success:", res.data);

        // ✅ accessToken nằm trong res.data.data
        const accessToken = res.data?.data?.authResponse?.accessToken;
        const refreshToken = res.data?.data?.authResponse?.refreshToken;

        // decode JWT to check role/authorities to allow only admin users here
        const decodeJwt = (t) => {
          try {
            const seg = (t || "").split('.');
            if (seg.length < 2) return null;
            const payload = seg[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = JSON.parse(decodeURIComponent(atob(payload).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')));
            return json;
          } catch {
            return null;
          }
        };

        const payload = decodeJwt(accessToken);
        // Normalize possible role fields
        const rolesFromToken = [];
        if (payload) {
          if (Array.isArray(payload.roles)) rolesFromToken.push(...payload.roles);
          if (Array.isArray(payload.authorities)) rolesFromToken.push(...payload.authorities);
          if (typeof payload.role === 'string') rolesFromToken.push(payload.role);
          if (typeof payload.authority === 'string') rolesFromToken.push(payload.authority);
          if (typeof payload.scope === 'string') rolesFromToken.push(...payload.scope.split(' '));
        }

        const isAdmin = rolesFromToken.map(r => String(r).toLowerCase()).some(r => r.includes('admin'));

        if (!isAdmin) {
          alert('Access denied: this login is not an admin account.');
          console.warn('Non-admin attempted admin login. Token payload:', payload);
          return;
        }

        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          // optionally store role
          localStorage.setItem('role', JSON.stringify(rolesFromToken));
          console.log("✅ Admin tokens saved to localStorage");
        } else {
          console.warn("⚠️ No token found in response:", res.data);
        }

        // ✅ chuyển hướng sang dashboard
        navigate("/admin/partners");
      } catch (error) {
        console.error("❌ Login failed:", error);
        alert("Login failed. Please check your credentials.");
      }
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mb-3">
          <span className="text-white text-xl font-bold">A</span>
        </div>
        <h2 className="text-xl font-semibold">Admin Login</h2>
        <p className="text-sm text-gray-500">Welcome to Parking Admin System</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <InputField
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          error={errors.email}
        />

        <InputField
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          error={errors.password}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" /> Remember me
          </label>
          <a href="#" className="text-indigo-600 hover:underline">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
        >
          Log in
        </button>
      </form>
    </AuthLayout>
  );
}
