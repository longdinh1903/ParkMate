import { toast } from "react-hot-toast";

export const showSuccess = (message) => {
  toast.success(message, {
    duration: 2500,
    style: {
      background: "#ECFDF5",
      color: "#065F46",
      border: "1px solid #A7F3D0",
      borderRadius: "10px",
      fontWeight: "500",
    },
  });
};

export const showError = (message) => {
  toast.error(message, {
    duration: 3000,
    style: {
      background: "#FEF2F2",
      color: "#991B1B",
      border: "1px solid #FECACA",
      borderRadius: "10px",
      fontWeight: "500",
    },
  });
};

export const showInfo = (message) => {
  toast(message, {
    icon: "ℹ️",
    style: {
      background: "#EFF6FF",
      color: "#1E3A8A",
      border: "1px solid #BFDBFE",
      borderRadius: "10px",
      fontWeight: "500",
    },
  });
};

export const showConfirm = (message, onConfirm) => {
  toast((t) => (
    <div className="flex flex-col gap-3">
      <p className="font-medium text-gray-800">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Confirm
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  ));
};
