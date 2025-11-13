import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import partnerApi from "../api/partnerApi";
import PartnerTopLayout from "../layouts/PartnerTopLayout";

export default function PartnerProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [businessLicensePreview, setBusinessLicensePreview] = useState(null);

  const [formData, setFormData] = useState({
    companyName: "",
    taxNumber: "",
    businessLicenseNumber: "",
    businessLicenseFileUrl: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    businessDescription: "",
    contactPersonName: "",
    contactPersonPhone: "",
    contactPersonEmail: "",
    website: "",
  });

  // Fetch current registration
  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        console.log("🔄 Fetching registration for current user...");
        
        // Luôn fetch lại theo email hiện tại (không dùng registrationId cũ từ localStorage)
        const userEmail = localStorage.getItem("userEmail");
        
        if (!userEmail) {
          console.warn("⚠️ No user email found");
          toast.error("Không tìm thấy thông tin người dùng");
          setLoading(false);
          return;
        }
        
        console.log("� Searching for registration with email:", userEmail);
        
        // Get all registrations and filter by email
        const requestsResponse = await partnerApi.getRequests({});
        console.log("📦 Requests response:", requestsResponse);
      
        let registrationsList = null;
        if (requestsResponse?.data?.data?.content) {
          registrationsList = requestsResponse.data.data.content;
        } else if (requestsResponse?.data?.content) {
          registrationsList = requestsResponse.data.content;
        } else if (Array.isArray(requestsResponse?.data?.data)) {
          registrationsList = requestsResponse.data.data;
        } else if (requestsResponse?.data) {
          registrationsList = requestsResponse.data;
        }
        
        console.log("📋 Registrations list:", registrationsList);
        
        // ✅ Debug: Log all emails in the list
        if (Array.isArray(registrationsList) && registrationsList.length > 0) {
          console.log("📧 All emails in registrations:");
          registrationsList.forEach((r, index) => {
            console.log(`  [${index}] partnerEmail: "${r.partnerEmail}", companyEmail: "${r.companyEmail}", contactPersonEmail: "${r.contactPersonEmail}"`);
          });
        }
        
        // Find registration matching user's email
        let registrationId = null;
        if (Array.isArray(registrationsList) && registrationsList.length > 0) {
          const found = registrationsList.find(
            r => r.companyEmail === userEmail || r.contactPersonEmail === userEmail
          );
          if (found) {
            registrationId = found.id;
            localStorage.setItem("registrationId", registrationId);
            console.log("✅ Found registration by email:", registrationId);
          }
        }
        
        if (!registrationId) {
          console.warn("⚠️ No registration found");
          toast.error("Không tìm thấy đơn đăng ký");
          setLoading(false);
          return;
        }
        
        console.log("� Step 2: Fetching registration detail for ID:", registrationId);
        
        // Step 2: Get detailed registration info by ID
        const detailResponse = await partnerApi.getById(registrationId);
        console.log("📦 Detail response:", detailResponse);
        
        let data = null;
        if (detailResponse?.data?.data) {
          data = detailResponse.data.data;
        } else if (detailResponse?.data) {
          data = detailResponse.data;
        }
        
        console.log("✅ Extracted registration data:", data);
        
        if (data) {
          setRegistration(data);
          
          // ✅ Update localStorage with current registration info
          if (data.id) {
            localStorage.setItem("registrationId", data.id);
          }
          if (data.status) {
            localStorage.setItem("registrationStatus", data.status);
            console.log("✅ Updated registrationStatus to:", data.status);
          }
          
          // Populate form with existing data
          const updatedFormData = {
            companyName: data.companyName || "",
            taxNumber: data.taxNumber || "",
            businessLicenseNumber: data.businessLicenseNumber || "",
            businessLicenseFileUrl: data.businessLicenseFileUrl || data.businessLicenseImageUrl || "",
            companyAddress: data.companyAddress || "",
            companyPhone: data.companyPhone || "",
            companyEmail: data.companyEmail || "",
            businessDescription: data.businessDescription || "",
            contactPersonName: data.contactPersonName || "",
            contactPersonPhone: data.contactPersonPhone || "",
            contactPersonEmail: data.contactPersonEmail || "",
            website: data.website || "",
          };
          
          console.log("📝 Updated formData:", updatedFormData);
          setFormData(updatedFormData);
          
          // Set preview if business license exists
          if (data.businessLicenseFileUrl) {
            setBusinessLicensePreview(data.businessLicenseFileUrl);
          } else if (data.businessLicenseImageUrl) {
            setBusinessLicensePreview(data.businessLicenseImageUrl);
          }
        } else {
          console.warn("⚠️ No registration data found");
        }
      } catch (error) {
        console.error("❌ Error fetching registration:", error);
        console.error("Error details:", error.response?.data);
        toast.error("Không thể tải thông tin đăng ký");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistration();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBusinessLicenseFile(file);
      
      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBusinessLicensePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files (like PDF), don't show preview
        setBusinessLicensePreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!registration?.id) {
      toast.error("Không tìm thấy thông tin đăng ký");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Đang cập nhật đơn đăng ký...");

    try {
      // 1. Upload business license if changed
      if (businessLicenseFile) {
        try {
          const uploadRes = await partnerApi.uploadBusinessLicense(
            registration.id,
            businessLicenseFile
          );
          const imageUrl = uploadRes?.data?.data?.url;
          if (imageUrl) {
            formData.businessLicenseImageUrl = imageUrl;
          }
        } catch (uploadError) {
          console.error("Error uploading business license:", uploadError);
          toast.error("Không thể tải lên giấy phép kinh doanh");
          throw uploadError;
        }
      }

      // 2. Update registration
      const updatePayload = {
        ...formData,
        status: "PENDING", // Change status back to PENDING
      };

      await partnerApi.updateRegistration(registration.id, updatePayload);
      
      toast.dismiss(toastId);
      toast.success("✅ Đã cập nhật đơn đăng ký thành công! Đơn của bạn đang được xét duyệt lại.");
      
      // Update localStorage
      localStorage.setItem("registrationStatus", "PENDING");
      
      // Refresh data using getById
      const refreshRes = await partnerApi.getById(registration.id);
      const refreshData = refreshRes?.data?.data || refreshRes?.data;
      if (refreshData) {
        setRegistration(refreshData);
      }
      
    } catch (error) {
      console.error("Error updating registration:", error);
      toast.dismiss(toastId);
      toast.error(error.response?.data?.message || "Không thể cập nhật đơn đăng ký");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold border border-yellow-300">
            <i className="ri-time-line text-lg"></i>
            Pending Review
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-semibold border border-green-300">
            <i className="ri-checkbox-circle-line text-lg"></i>
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-semibold border border-red-300">
            <i className="ri-close-circle-line text-lg"></i>
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold border border-gray-300">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <PartnerTopLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PartnerTopLayout>
    );
  }

  return (
    <PartnerTopLayout>
      <div className="fixed inset-0 top-16 bg-gray-50 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <i className="ri-user-settings-line text-indigo-600"></i>
                    Partner Registration Profile
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Manage and update your partner registration information
                  </p>
                </div>
                {registration && (
                  <div className="flex items-center gap-3">
                    {getStatusBadge(registration.status)}
                  </div>
                )}
              </div>
            </div>
            
            {registration?.status === "REJECTED" && registration?.rejectionReason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 mb-6">
                <i className="ri-error-warning-line text-2xl text-red-600 mt-0.5"></i>
                <div className="flex-1">
                  <p className="font-semibold text-red-800 mb-1">
                    <i className="ri-close-circle-line mr-1"></i>
                    Rejection Reason:
                  </p>
                  <p className="text-sm text-red-700 bg-red-100 px-3 py-2 rounded border border-red-200">
                    "{registration.rejectionReason}"
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    Please update the information below and resubmit your application.
                  </p>
                </div>
              </div>
            )}

            {registration?.status === "PENDING" && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3 mb-6">
                <i className="ri-time-line text-2xl text-yellow-600 mt-0.5"></i>
                <div>
                  <p className="text-sm text-yellow-800">
                    📋 Your registration is currently under review. Please wait for admin approval.
                  </p>
                </div>
              </div>
            )}

            {registration?.status === "APPROVED" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 mb-6">
                <i className="ri-checkbox-circle-line text-2xl text-green-600 mt-0.5"></i>
                <div className="flex items-center justify-between flex-1">
                  <p className="text-sm text-green-800">
                    🎉 Your registration has been approved!
                  </p>
                  <button
                    onClick={() => navigate("/home")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                  >
                    Go to Partner Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* Registration Summary Card - Show existing data */}
            {registration && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 mb-6 border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                  <i className="ri-file-list-line"></i>
                  Current Registration Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Company:</span>
                    <span className="ml-2 font-medium text-gray-900">{registration.companyName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tax Number:</span>
                    <span className="ml-2 font-medium text-gray-900">{registration.taxNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">License Number:</span>
                    <span className="ml-2 font-medium text-gray-900">{registration.businessLicenseNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact Person:</span>
                    <span className="ml-2 font-medium text-gray-900">{registration.contactPersonName || "N/A"}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium text-gray-900">{registration.companyEmail || "N/A"}</span>
                  </div>
                  {registration.businessDescription && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Description:</span>
                      <p className="mt-1 text-gray-900">{registration.businessDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
            {/* Company Information Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 pb-3 border-b">
                <i className="ri-building-line text-indigo-600"></i>
                Company Information
              </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Number
                </label>
                <input
                  type="text"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleChange}
                  placeholder="e.g., 0123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="businessLicenseNumber"
                  value={formData.businessLicenseNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., BL-2024-001234"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://www.yourcompany.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description
                </label>
                <textarea
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe your business activities..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            </div>

            {/* Contact Person Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 pb-3 border-b">
                <i className="ri-user-line text-indigo-600"></i>
                Contact Person
              </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contactPersonPhone"
                  value={formData.contactPersonPhone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="contactPersonEmail"
                  value={formData.contactPersonEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            </div>

            {/* Business License Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 pb-3 border-b">
                <i className="ri-file-text-line text-indigo-600"></i>
                Business License
              </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Business License Document
              </label>
              
              {/* Show current file if exists */}
              {registration?.businessLicenseFileUrl && !businessLicenseFile && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <i className="ri-file-text-line text-blue-600 text-xl"></i>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Current File:</p>
                    <a
                      href={registration.businessLicenseFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Business License
                    </a>
                  </div>
                </div>
              )}
              
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                {businessLicenseFile ? "New file selected" : "Upload a new file to replace the current one"}
              </p>
              
              {businessLicensePreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Preview:</p>
                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50 p-4">
                    <img
                      src={businessLicensePreview}
                      alt="Business License Preview"
                      className="max-w-full h-auto mx-auto shadow-sm rounded"
                      onError={() => {
                        console.error("Failed to load image:", businessLicensePreview);
                      }}
                    />
                  </div>
                </div>
              )}
              
              {businessLicenseFile && !businessLicenseFile.type.startsWith('image/') && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <i className="ri-file-warning-line text-2xl"></i>
                    <div>
                      <p className="text-sm font-medium">PDF file selected</p>
                      <p className="text-xs text-yellow-600">Preview not available for PDF files</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-6 border-t mt-6">
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center gap-2"
              >
                <i className="ri-arrow-left-line"></i>
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || registration?.status === "APPROVED"}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line"></i>
                    Update Registration
                  </>
                )}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </PartnerTopLayout>
  );
}
