import React from "react";

export default function InputField({ type, value, onChange, placeholder, error }) {
  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error ? "border-red-500 focus:ring-red-400" : "focus:ring-indigo-400"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
