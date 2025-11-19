import React, { useState, useEffect } from "react";
import { showError, showSuccess } from "../utils/toastUtils";
import withdrawalApi from "../api/withdrawalApi";
import parkingLotApi from "../api/parkingLotApi";

export default function RequestWithdrawalModal({ onClose, onRequested }) {
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState("");
  const [periods, setPeriods] = useState([]);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState({
    bankCode: "",
    bankAccountNumber: "",
    bankAccountName: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Fetch parking lots on mount
  useEffect(() => {
    fetchParkingLots();
    fetchBanks();
  }, []);

  // Fetch periods when parking lot is selected
  useEffect(() => {
    if (selectedLotId) {
      fetchPeriods(selectedLotId);
    } else {
      setPeriods([]);
      setSelectedPeriods([]);
    }
  }, [selectedLotId]);

  const fetchParkingLots = async () => {
    try {
      const res = await parkingLotApi.getAll({
        page: 0,
        size: 100,
        sortBy: "name",
        sortOrder: "asc",
        ownedByMe: true, // ✅ Only get partner's own parking lots
      });
      const data = res.data?.data;
      setParkingLots(Array.isArray(data?.content) ? data.content : []);
    } catch (err) {
      console.error("Error fetching parking lots:", err);
      showError("Failed to load parking lots");
    }
  };

  const fetchPeriods = async (lotId) => {
    try {
      setLoadingPeriods(true);
      const res = await withdrawalApi.getPeriods({
        parkingLotId: lotId,
        page: 0,
        size: 100,
      });
      
      // Handle response structure
      const responseData = res.data?.data || res.data;
      
      if (responseData?.content) {
        const periodsList = Array.isArray(responseData.content) ? responseData.content : [];
        console.log("📊 Periods data:", periodsList);
        setPeriods(periodsList);
      } else if (Array.isArray(responseData)) {
        console.log("📊 Periods data (array):", responseData);
        setPeriods(responseData);
      } else {
        console.log("⚠️ No periods data found");
        setPeriods([]);
      }
    } catch (err) {
      console.error("Error fetching periods:", err);
      showError("Failed to load withdrawal periods");
      setPeriods([]);
    } finally {
      setLoadingPeriods(false);
    }
  };

  const fetchBanks = async () => {
    try {
      setLoadingBanks(true);
      const res = await withdrawalApi.getBanks();
      setBanks(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Error fetching banks:", err);
      showError("Failed to load banks");
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handlePeriodToggle = (periodId) => {
    setSelectedPeriods((prev) =>
      prev.includes(periodId)
        ? prev.filter((id) => id !== periodId)
        : [...prev, periodId]
    );
  };

  const calculateTotalAmount = () => {
    return periods
      .filter((p) => selectedPeriods.includes(p.id))
      .reduce((sum, p) => sum + (p.netRevenue || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLotId) {
      showError("Please select a parking lot");
      return;
    }

    if (selectedPeriods.length === 0) {
      showError("Please select at least one period");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        lotId: parseInt(selectedLotId),
        periodIds: selectedPeriods,
        bankAccountNumber: form.bankAccountNumber,
        bankAccountName: form.bankAccountName,
        bankCode: form.bankCode,
      };

      const res = await withdrawalApi.createRequest(payload);

      if (res.status === 200 || res.status === 201) {
        showSuccess("✅ Withdrawal request submitted successfully!");
        onRequested();
        onClose();
      } else {
        showError("❌ Failed to submit withdrawal request!");
      }
    } catch (err) {
      console.error("❌ Error submitting withdrawal:", err);
      const msg = err.response?.data?.message || "Failed to submit withdrawal request.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50">
      <div className="bg-white w-[900px] max-h-[90vh] overflow-y-auto rounded-xl shadow-xl">
        <div className="bg-indigo-600 text-white py-8 px-6 shadow-md">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">💰</span>
            Request Withdrawal
          </h2>
        </div>

        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
          {/* Parking Lot Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Parking Lot <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              required
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-base"
            >
              <option value="">-- Select Parking Lot --</option>
              {parkingLots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name} - {lot.address}
                </option>
              ))}
            </select>
          </div>

          {/* Withdrawal Periods */}
          {selectedLotId && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Periods to Withdraw <span className="text-red-500">*</span>
              </label>
              {loadingPeriods ? (
                <div className="text-center py-8 text-gray-500 text-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                  Loading periods...
                </div>
              ) : periods.length > 0 ? (
                <div className="border-2 border-gray-300 rounded-xl max-h-80 overflow-y-auto bg-gray-50">
                  {periods.filter(p => !p.isWithdrawn).map((period) => (
                    <div
                      key={period.id}
                      className="flex items-start justify-between p-5 border-b last:border-b-0 hover:bg-white transition-colors bg-white mb-2 mx-2 mt-2 rounded-lg shadow-sm"
                    >
                      <label className="flex items-start gap-4 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={selectedPeriods.includes(period.id)}
                          onChange={() => handlePeriodToggle(period.id)}
                          className="w-5 h-5 mt-1 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-lg mb-3">
                            📅 {formatDate(period.periodStartDate)} → {formatDate(period.periodEndDate)}
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between p-2 bg-blue-50 rounded">
                              <span className="text-gray-600">Reservation:</span>
                              <span className="font-semibold text-blue-700">{formatCurrency(period.reservationRevenue)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-purple-50 rounded">
                              <span className="text-gray-600">Subscription:</span>
                              <span className="font-semibold text-purple-700">{formatCurrency(period.subscriptionRevenue)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-green-50 rounded">
                              <span className="text-gray-600">Walk-in:</span>
                              <span className="font-semibold text-green-700">{formatCurrency(period.walkInRevenue)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-indigo-50 rounded">
                              <span className="font-gray-600 font-semibold">Gross Revenue:</span>
                              <span className="font-bold text-indigo-700">{formatCurrency(period.grossRevenue)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between mt-3 pt-3 border-t-2 border-dashed">
                            <span className="text-red-600 font-medium">Platform Fee:</span>
                            <span className="font-bold text-red-600">-{formatCurrency(period.platformFee)}</span>
                          </div>
                        </div>
                        <div className="text-right ml-6 flex flex-col items-end justify-center min-w-[180px]">
                          <div className="text-sm text-gray-500 mb-2">
                            Net Revenue
                          </div>
                          <div className="font-bold text-green-600 text-3xl mb-2">
                            {formatCurrency(period.netRevenue)}
                          </div>
                          <div className="text-sm">
                            {period.isWithdrawn ? (
                              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">✓ Withdrawn</span>
                            ) : (
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">● Available</span>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 border border-gray-300 rounded-lg">
                  No withdrawal periods available for this parking lot
                </div>
              )}
            </div>
          )}

          {/* Total Amount */}
          {selectedPeriods.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-semibold text-gray-700">Total Withdrawal Amount:</span>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedPeriods.length} period(s) selected
                  </div>
                </div>
                <span className="text-4xl font-bold text-indigo-700">
                  {formatCurrency(calculateTotalAmount())}
                </span>
              </div>
            </div>
          )}

          {/* Bank Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bank <span className="text-red-500">*</span>
            </label>
            <select
              name="bankCode"
              value={form.bankCode}
              onChange={handleChange}
              required
              disabled={loadingBanks}
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-base"
            >
              <option value="">
                {loadingBanks ? "Loading banks..." : "-- Select Bank --"}
              </option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.code}>
                  {bank.name} ({bank.shortName})
                </option>
              ))}
            </select>
          </div>

          {/* Bank Account Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bank Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="bankAccountNumber"
              value={form.bankAccountNumber}
              onChange={handleChange}
              required
              placeholder="Enter your bank account number"
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-base"
            />
          </div>

          {/* Bank Account Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bank Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="bankAccountName"
              value={form.bankAccountName}
              onChange={handleChange}
              required
              placeholder="Enter account holder name"
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-base"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedPeriods.length === 0}
              className="bg-indigo-600 text-white py-3 px-6 rounded-lg shadow-md"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
