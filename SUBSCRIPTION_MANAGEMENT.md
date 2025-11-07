# Subscription Management Feature

## 📋 Tổng quan

Tính năng quản lý gói đăng ký (Subscription Management) cho phép partner tạo và quản lý các gói đăng ký theo tháng, quý, hoặc năm cho bãi xe của họ.

## 🎯 Tính năng chính

### 1. **Danh sách gói đăng ký**
- Hiển thị tất cả gói đăng ký dạng card grid
- Thông tin hiển thị:
  - Tên gói
  - Mô tả
  - Loại phương tiện (Bike, Motorbike, Car)
  - Thời hạn (Monthly, Quarterly, Yearly)
  - Giá tiền (VND)
  - ID bãi xe

### 2. **Tìm kiếm và lọc**
- **Tìm kiếm**: Theo tên hoặc mô tả gói
- **Lọc theo loại phương tiện**:
  - BIKE (Xe đạp)
  - MOTORBIKE (Xe máy)
  - CAR_UP_TO_9_SEATS (Ô tô dưới 9 chỗ)
- **Lọc theo thời hạn**:
  - MONTHLY (Tháng)
  - QUARTERLY (Quý - 3 tháng)
  - YEARLY (Năm - 12 tháng)

### 3. **Thêm gói đăng ký mới**
- Modal form với các trường:
  - Tên gói (bắt buộc)
  - Mô tả (bắt buộc)
  - Loại phương tiện (dropdown)
  - Thời hạn (dropdown)
  - Giá tiền (VND, số dương)
  - Chọn bãi xe (từ danh sách bãi của partner)
- Validation đầy đủ
- Thông báo success/error

### 4. **Chỉnh sửa gói đăng ký**
- Cập nhật thông tin gói hiện có
- Giữ nguyên format và validation như form thêm mới

### 5. **Xóa gói đăng ký**
- Confirm modal trước khi xóa
- Thông báo kết quả

## 📁 Cấu trúc file

```
src/
├── api/
│   └── subscriptionApi.js          # API calls cho subscription
├── components/
│   ├── AddSubscriptionModal.jsx    # Modal thêm gói mới
│   ├── EditSubscriptionModal.jsx   # Modal chỉnh sửa gói
│   └── ConfirmModal.jsx            # Modal xác nhận (đã có)
├── pages/
│   └── PartnerSubscriptions.jsx    # Trang chính quản lý subscription
├── layouts/
│   └── PartnerTopLayout.jsx        # Updated với menu Subscriptions
└── routes/
    └── AppRoutes.jsx               # Added /subscriptions route
```

## 🔌 API Endpoints

### Base URL
```
/api/v1/parking-service/subscriptions
```

### Endpoints được sử dụng:

1. **GET** `/api/v1/parking-service/subscriptions`
   - Lấy tất cả gói đăng ký
   
2. **GET** `/api/v1/parking-service/subscriptions/{id}`
   - Lấy chi tiết 1 gói theo ID
   
3. **POST** `/api/v1/parking-service/subscriptions`
   - Tạo gói mới
   - Body:
     ```json
     {
       "name": "Monthly Car Parking - Premium",
       "description": "Premium monthly subscription for cars with 24/7 access",
       "vehicleType": "CAR_UP_TO_9_SEATS",
       "durationType": "MONTHLY",
       "price": 1500000,
       "lotId": 1
     }
     ```

4. **PUT** `/api/v1/parking-service/subscriptions/{id}`
   - Cập nhật gói
   - Body: giống POST

5. **DELETE** `/api/v1/parking-service/subscriptions/{id}`
   - Xóa gói

## 🚀 Hướng dẫn sử dụng

### Truy cập trang
1. Đăng nhập với tài khoản Partner
2. Click menu **"Subscriptions"** trên navbar
3. Hoặc truy cập: `http://localhost:5174/subscriptions`

### Thêm gói mới
1. Click nút **"Add Package"**
2. Điền đầy đủ thông tin:
   - Tên gói (vd: "Premium Monthly Car Parking")
   - Mô tả chi tiết
   - Chọn loại phương tiện
   - Chọn thời hạn
   - Nhập giá (VND)
   - Chọn bãi xe
3. Click **"Create Package"**

### Chỉnh sửa gói
1. Click icon **Pencil** (✏️) trên card gói
2. Cập nhật thông tin cần thiết
3. Click **"Update Package"**

### Xóa gói
1. Click icon **Trash** (🗑️) trên card gói
2. Xác nhận trong modal
3. Gói sẽ bị xóa vĩnh viễn

### Tìm kiếm và lọc
1. **Tìm kiếm**: Nhập từ khóa vào ô search
2. **Lọc loại xe**: Chọn từ dropdown "All Types"
3. **Lọc thời hạn**: Chọn từ dropdown "All Durations"
4. Có thể combine cả 3 filter cùng lúc

## 🎨 UI/UX Features

- **Responsive Design**: Hoạt động tốt trên mọi kích thước màn hình
- **Grid Layout**: 
  - Mobile: 1 column
  - Tablet: 2 columns
  - Desktop: 3 columns
- **Color-coded Badges**:
  - Vehicle types: Blue (Bike), Green (Motorbike), Purple (Car)
  - Duration: Orange (Monthly), Teal (Quarterly), Indigo (Yearly)
- **Loading States**: Spinner khi fetch data
- **Empty States**: Thông báo khi không có data
- **Toast Notifications**: Success/Error messages
- **Smooth Transitions**: Hover effects và animations

## ⚙️ Yêu cầu

- Partner phải có ít nhất 1 bãi xe đã đăng ký
- Nếu chưa có bãi xe, hệ thống sẽ thông báo và không cho tạo gói

## 🔒 Authentication

- Tất cả API calls đều yêu cầu Bearer token
- Token được tự động thêm vào header bởi `axiosClient`
- Token được lưu trong localStorage sau khi đăng nhập

## 📝 Notes

- Giá tiền được format theo VND (Việt Nam Đồng)
- Validation được thực hiện ở cả client và server
- Dữ liệu được refresh sau mỗi thao tác thành công
- Không thể tạo gói cho bãi xe của partner khác

## 🐛 Troubleshooting

### Không load được danh sách gói
- Kiểm tra token có hợp lệ không
- Kiểm tra API endpoint có đúng không
- Xem console log để debug

### Không tạo được gói mới
- Kiểm tra đã có bãi xe chưa
- Kiểm tra validation form
- Đảm bảo giá > 0
- Đảm bảo đã chọn bãi xe

### Lỗi 401 Unauthorized
- Token hết hạn → Đăng nhập lại
- Kiểm tra localStorage có accessToken không

## 📞 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console log
2. Kiểm tra Network tab trong DevTools
3. Liên hệ dev team
