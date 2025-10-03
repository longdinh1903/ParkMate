import React, { useState } from "react";
import adminApi from "../api/adminApi";
import InputField from "../components/InputField";
import AuthLayout from "../layouts/AuthLayout";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

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

        // lưu token vào localStorage
        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);

        alert("✅ Admin login successful!");
        // TODO: chuyển hướng sang dashboard
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
