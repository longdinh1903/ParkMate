import React, { useState, useEffect } from "react";
import { showError, showSuccess } from "../utils/toastUtils";
import withdrawalApi from "../api/withdrawalApi";
import parkingLotApi from "../api/parkingLotApi";

export default function RequestWithdrawalModal({ onClose, onRequested, isEmbedded = false }) {
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState("");
  const [periods, setPeriods] = useState([]);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [banks, setBanks] = useState([]);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showBankDropdown && !event.target.closest('.bank-dropdown-container')) {
        setShowBankDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBankDropdown]);

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
      showError("Đã có lỗi khi tải danh sách bãi đỗ xe");
    }
  };

  const fetchPeriods = async (lotId) => {
    try {
      setLoadingPeriods(true);
      console.log("🔍 Fetching periods for lotId:", lotId);
      
      const res = await withdrawalApi.getPeriods({
        parkingLotId: lotId,
        page: 0,
        size: 100,
      });
      
      console.log("📊 Full periods response:", res);
      console.log("📊 res.data:", res.data);
      
      // Handle response structure
      const responseData = res.data?.data || res.data;
      
      if (responseData?.content) {
        const periodsList = Array.isArray(responseData.content) ? responseData.content : [];
        console.log("✅ Periods list (from content):", periodsList);
        console.log("✅ Number of periods:", periodsList.length);
        // Check if periods are for the correct lot
        periodsList.forEach((p, idx) => {
          console.log(`Period ${idx + 1} - lotId:`, p.lotId, "| Expected:", lotId);
        });
        setPeriods(periodsList);
      } else if (Array.isArray(responseData)) {
        console.log("✅ Periods data (array):", responseData);
        setPeriods(responseData);
      } else {
        console.log("⚠️ No periods data found");
        setPeriods([]);
      }
    } catch (err) {
      console.error("❌ Error fetching periods:", err);
      showError("Đã có lỗi khi tải các kỳ thu nhập");
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
      showError("Đã có lỗi khi tải danh sách ngân hàng");
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
      showError("Vui lòng chọn bãi đỗ xe");
      return;
    }

    if (selectedPeriods.length === 0) {
      showError("Vui lòng chọn ít nhất một kỳ thu nhập");
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
        showSuccess("✅ Đã gửi yêu cầu rút tiền thành công!");
        onRequested();
        onClose();
      } else {
        showError("❌ Đã có lỗi khi gửi yêu cầu rút tiền!");
      }
    } catch (err) {
      console.error("❌ Error submitting withdrawal:", err);
      const msg = err.response?.data?.message || "Đã có lỗi khi gửi yêu cầu rút tiền.";
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

  const content = (
    <>
      {!isEmbedded && (
        <div className="bg-indigo-600 text-white py-8 px-6 shadow-md ">
          <h2 className="text-2xl font-bold flex items-center gap-2 ">
            <span className="text-3xl ">💰</span>
            Yêu Cầu Rút Tiền
          </h2>
        </div>
      )}

      <form className={isEmbedded ? "space-y-6" : "p-6 space-y-6"} onSubmit={handleSubmit}>
          {/* Parking Lot Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bãi Đỗ Xe <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              required
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-base cursor-pointer"
            >
              <option value="">-- Chọn Bãi Đỗ Xe --</option>
              {parkingLots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name} - {lot.address}
                </option>
              ))}
            </select>
          </div>

          {/* Bank Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 ">
              Ngân Hàng <span className="text-red-500">*</span>
            </label>
            {loadingBanks ? (
              <div className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg bg-gray-50 text-gray-500">
                Đang tải danh sách ngân hàng...
              </div>
            ) : (
              <div className="relative bank-dropdown-container">
                <div className="relative">
                  <input
                    type="text"
                    value={bankSearchQuery}
                    onChange={(e) => {
                      setBankSearchQuery(e.target.value);
                      setShowBankDropdown(true);
                    }}
                    onFocus={() => setShowBankDropdown(true)}
                    placeholder={form.bankCode ? banks.find(b => b.bin === form.bankCode)?.name : "Tìm kiếm ngân hàng..."}
                    className="w-full border-2 border-gray-300 pl-4 pr-12 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-base cursor-pointer"
                  />
                  {form.bankCode && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                      <img
                        src={banks.find(b => b.bin === form.bankCode)?.logo}
                        alt=""
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowBankDropdown(!showBankDropdown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {showBankDropdown && (() => {
                  const filteredBanks = banks.filter(bank => 
                    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
                    bank.shortName.toLowerCase().includes(bankSearchQuery.toLowerCase())
                  );
                  
                  return filteredBanks.length > 0 ? (
                    <div className="absolute z-50 w-full bottom-full mb-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto custom-scrollbar">
                      {filteredBanks.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, bankCode: bank.bin });
                            setBankSearchQuery("");
                            setShowBankDropdown(false);
                          }}
                          className="w-full px-4 py-3 hover:bg-indigo-50 flex items-center gap-3 transition-colors border-b last:border-b-0"
                        >
                          <img
                            src={bank.logo}
                            alt={bank.shortName}
                            className="w-10 h-10 object-contain flex-shrink-0"
                          />
                          <div className="text-left flex-1">
                            <div className="font-medium text-gray-900">{bank.name}</div>
                            <div className="text-sm text-gray-500">{bank.shortName}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute z-50 w-full bottom-full mb-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl px-4 py-6 text-center text-gray-500">
                      Không tìm thấy ngân hàng nào
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Bank Account Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Số Tài Khoản Ngân Hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="bankAccountNumber"
              value={form.bankAccountNumber}
              onChange={handleChange}
              required
              placeholder="Nhập số tài khoản ngân hàng"
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-base"
            />
          </div>

          {/* Bank Account Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tên Chủ Tài Khoản <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="bankAccountName"
              value={form.bankAccountName}
              onChange={handleChange}
              required
              placeholder="Nhập tên chủ tài khoản"
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-base"
            />
          </div>

          {/* Withdrawal Periods */}
          {selectedLotId && (
            <div className="mb-6">
              <label className="block text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2 px-5 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl">
                <span className="text-2xl">📋</span>
                Chọn Các Kỳ Để Rút Tiền <span className="text-red-500">*</span>
              </label>
              {loadingPeriods ? (
                <div className="text-center py-8 text-gray-500 text-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                  Đang tải các kỳ thu nhập...
                </div>
              ) : (() => {
                const availablePeriods = periods.filter(p => !p.isWithdrawn && p.lotId === parseInt(selectedLotId));
                return availablePeriods.length > 0 ? (
                <div className="space-y-3">
                  {availablePeriods.map((period) => (
                    <div
                      key={period.id}
                      className="bg-white border-2 border-indigo-200 rounded-xl p-4 hover:shadow-lg transition-all hover:border-indigo-400"
                    >
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={selectedPeriods.includes(period.id)}
                          onChange={() => handlePeriodToggle(period.id)}
                          className="w-5 h-5 mt-1 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-base mb-2">
                            📅 {formatDate(period.periodStartDate)} → {formatDate(period.periodEndDate)}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between p-1.5 bg-blue-50 rounded">
                              <span className="text-gray-600 text-xs">Đặt Chỗ:</span>
                              <span className="font-semibold text-blue-700 text-xs">{formatCurrency(period.reservationRevenue)}</span>
                            </div>
                            <div className="flex justify-between p-1.5 bg-purple-50 rounded">
                              <span className="text-gray-600 text-xs">Đăng Ký:</span>
                              <span className="font-semibold text-purple-700 text-xs">{formatCurrency(period.subscriptionRevenue)}</span>
                            </div>
                            <div className="flex justify-between p-1.5 bg-green-50 rounded">
                              <span className="text-gray-600 text-xs">Vãng Lai:</span>
                              <span className="font-semibold text-green-700 text-xs">{formatCurrency(period.walkInRevenue)}</span>
                            </div>
                            <div className="flex justify-between p-1.5 bg-indigo-50 rounded">
                              <span className="font-gray-600 font-semibold text-xs">Tổng Thu:</span>
                              <span className="font-bold text-indigo-700 text-xs">{formatCurrency(period.grossRevenue)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between mt-2 pt-2 border-t border-dashed">
                            <span className="text-red-600 font-medium text-xs">Phí Nền Tảng:</span>
                            <span className="font-bold text-red-600 text-xs">-{formatCurrency(period.platformFee)}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4 flex flex-col items-end justify-center min-w-[140px]">
                          <div className="text-xs text-gray-500 mb-1">
                            Thu Nhập Ròng
                          </div>
                          <div className="font-bold text-green-600 text-2xl mb-1">
                            {formatCurrency(period.netRevenue)}
                          </div>
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium text-xs">● Có Sẵn</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                ) : (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  Không có kỳ thu nhập nào để rút cho bãi đỗ xe này
                </div>
                );
              })()}
            </div>
          )}

          {/* Total Amount */}
          {selectedPeriods.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-semibold text-gray-700">Tổng Số Tiền Rút:</span>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedPeriods.length} kỳ đã chọn
                  </div>
                </div>
                <span className="text-4xl font-bold text-indigo-700">
                  {formatCurrency(calculateTotalAmount())}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t-2">
            {!isEmbedded && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition text-base"
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              disabled={loading || selectedPeriods.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg shadow-md font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Đang gửi..." : "Gửi Yêu Cầu Rút Tiền"}
            </button>
          </div>
        </form>
    </>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50">
      <div className="bg-white w-[900px] max-h-[90vh] overflow-y-auto custom-scrollbar rounded-xl shadow-xl">
        {content}
      </div>
    </div>
  );
}
