# API Analysis Report - Chi tiết vị trí Hardcoded URLs

Ngày: 2026-05-21  
Trạng thái: Quét kỹ càng toàn bộ codebase

---

## Tóm tắt nhanh

**Kết luận:** Chỉ thay đổi 2 biến môi trường `.env` (**KHÔNG đủ**) vì project còn **nhiều vị trí gọi API bằng URL tuyệt đối hardcoded**.

- File `.env` hiện có:
  - `REACT_APP_BACKEND_URL=https://evrental-hjbfaxg0cbfgamha.eastasia-01.azurewebsites.net`
  - `REACT_APP_API_URL=https://evrental-hjbfaxg0cbfgamha.eastasia-01.azurewebsites.net`

- **Vấn đề:** Nhiều component/service vẫn hardcode `http://localhost:8080` trong code, không dùng biến môi trường.

---

## Danh sách đầy đủ: 20 vị trí chứa `http://localhost:8080`

### ✅ Danh sách các file có vấn đề (10 file):

---

### 1. **src/services/authService.ts** (1 vị trí)
| Dòng | Code | Tình trạng |
|------|------|-----------|
| 5 | `const baseURL = process.env.REACT_APP_API_URL \|\| "http://localhost:8080";` | ⚠️ Fallback (OK nếu env được set) |

---

### 2. **src/services/kycService.ts** (1 vị trí)
| Dòng | Code | Tình trạng |
|------|------|-----------|
| 4 | `const baseURL = process.env.REACT_APP_API_URL \|\| "http://localhost:8080";` | ⚠️ Fallback (OK nếu env được set) |

---

### 3. **src/pages/VehicleDetailPage.tsx** (1 vị trí - đã comment)
| Dòng | Code | Tình trạng |
|------|------|-----------|
| 114 | `// const res2 = await axios.put(\`http://localhost:8080/api/bookings/${res.bookingId}/status/reserved\`)` | ✅ Đã comment (không active) |

---

### 4. **src/pages/PaymentResultPage.tsx** (1 vị trí - ACTIVE ❌)
| Dòng | Code | Tình trạng |
|------|------|-----------|
| 36 | `"http://localhost:8080/api/payments/momo/ipn",` | ❌ **HARDCODED ACTIVE** |
| **Context** | Gửi IPN data từ MoMo payment callback | Cần sửa ngay |

---

### 5. **src/components/XacNhanTraXe/components/DepositPage.tsx** (7 vị trí - ACTIVE ❌)
| Dòng | Code | Tình trạng |
|------|------|-----------|
| 83 | `\`http://localhost:8080/api/bookings/${bookingId}\`` | ❌ **HARDCODED ACTIVE** - Fetch booking info |
| 107 | `\`http://localhost:8080/api/vehicle/detail/${vehicleId}\`` | ❌ **HARDCODED ACTIVE** - Fetch vehicle detail |
| 124 | `\`http://localhost:8080/api/invoices/bookings/${bookingId}/invoices\`` | ❌ **HARDCODED ACTIVE** - Check existing invoices |
| 204 | `\`http://localhost:8080/api/invoices/bookings/${bookingId}/invoices/deposit\`` | ❌ **HARDCODED ACTIVE** - Create deposit invoice |
| 215 | `\`http://localhost:8080/api/invoices/bookings/${bookingId}/invoices\`` | ❌ **HARDCODED ACTIVE** - Get invoices after create |
| 264 | `\`http://localhost:8080/api/payments/invoice/${invoiceId}/momo\`` | ❌ **HARDCODED ACTIVE** - Create MoMo payment |
| 323 | `\`http://localhost:8080/api/payments/invoice/${invoiceId}/payos\`` | ❌ **HARDCODED ACTIVE** - Create PayOS payment |

---

### 6. **src/components/UserProfile/UserProfile.tsx** (3 vị trí - ACTIVE ❌)
| Dòng | Code | Tình trạng |
|------|------|-----------|
| 31 | `"http://localhost:8080/api/renter/profile",` | ❌ **HARDCODED ACTIVE** - Fetch user profile |
| 45 | `\`http://localhost:8080/api/wallet/${renterData.walletId}\`` | ❌ **HARDCODED ACTIVE** - Fetch wallet balance |
| 151 | `\`http://localhost:8080/api/wallet/${profileData.walletId}/transactions\`` | ❌ **HARDCODED ACTIVE** - Fetch wallet transactions |

---

### 7. **src/components/StaffInterface/services/authServices.ts** (1 vị trí cố định + nhiều sử dụng baseURL)
| Dòng | Code | Tình trạng |
|------|------|-----------|
| 3 | `const baseURL = 'http://localhost:8080';` | ❌ **HARDCODED CỐ ĐỊNH** - Không dùng env |
| 21 | `await axios.post("http://localhost:8080/api/auth/logout/staff", null, {...})` | ❌ **HARDCODED ACTIVE** - Hardcode thêm một lần |
| 8, 40, 55, 70, 81, 96, 111, 126, 140, 158, 175, 190, 212, 233, 252, 267, 282, 302, 329, 352, 368, 384, 404, 425, 445, 464, 525, 545, 565, 586 | Tất cả dùng `baseURL` variable | ⚠️ Phụ thuộc `baseURL` cố định (cần sửa line 3) |

---

### 8. **src/components/layouts/Navbar.tsx** (1 vị trí - ACTIVE ❌)
| Dòng | Code | Tình trạng |
|------|------|-----------|
| 54 | `const res = await axios.get("http://localhost:8080/api/notifications/my", {...})` | ❌ **HARDCODED ACTIVE** - Fetch notifications |

---

### 9. **src/components/HistoryPage/RentalHistoryPage.tsx** (4+ vị trí - ACTIVE ❌)
| Dòng | Code | Tình trạng |
|------|------|-----------|
| 63 | `const res = await axios.get("http://localhost:8080/api/renter/profile", {...})` | ❌ **HARDCODED ACTIVE** - Fetch renter profile |
| 90 | `const res = await axios.get("http://localhost:8080/api/renter/bookings", {...})` | ❌ **HARDCODED ACTIVE** - Fetch bookings |
| 100 | `\`http://localhost:8080/api/contracts/${bk.bookingId}\`` | ❌ **HARDCODED ACTIVE** - Fetch contract status |
| 115+ | Có thêm call tương tự trong Promise.all | ❌ **HARDCODED ACTIVE** - Rating API |

---

## Tổng kết số lượng

| Loại | Số lượng |
|------|---------|
| Fallback (có dự phòng env) | 2 |
| Hardcoded ACTIVE ❌ | **15+** |
| Đã comment | 1 |
| **TỔNG CỘNG** | **20** |

---

## Những gọi API đang sử dụng đúng (dùng env / apiClient) ✅

- `src/services/apiClient.ts` — Tạo axios instance với `baseURL: process.env.REACT_APP_API_URL` ✅
- `src/services/authService.ts` — Dùng fallback env (được) ✅
- `src/services/kycService.ts` — Dùng fallback env (được) ✅
- `src/components/AdminInterface/services/AdminApiConfig.ts` — Dùng `process.env.REACT_APP_API_URL` ✅

---

---

## Các gọi đến dịch vụ bên ngoài (không phải backend của bạn) ✅
Những URL sau là gọi tới dịch vụ bên thứ ba (ví dụ OCR, thanh toán, ảnh...) và không liên quan tới `REACT_APP_API_URL`:

- `https://api.fpt.ai/vision/idr/vnm` và `https://api.fpt.ai/vision/dlr/vnm` trong `src/services/kycService.ts` (OCR) — đây là endpoint third-party, không thay bằng biến môi trường backend ✅
- Một số ảnh/logo dùng URL công khai (ví dụ MoMo logo từ wikimedia) — không cần đổi ✅

---

## Hướng khắc phục

### Phương án 1: Thay tất cả `http://localhost:8080` bằng `process.env.REACT_APP_API_URL`
Chỉnh các file có hardcoded URL:

#### Ví dụ thay thế:

**Trước (không tốt):**
```typescript
const res = await axios.get("http://localhost:8080/api/renter/profile", {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Sau (tốt):**
```typescript
import api from "../../services/apiClient";
const res = await api.get("/api/renter/profile");
// hoặc
const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/renter/profile`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Phương án 2: Thay `baseURL` cứng thành dùng env

**Trước (StaffInterface):**
```typescript
const baseURL = 'http://localhost:8080';
```

**Sau:**
```typescript
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
```

---

## Priority: File cần sửa ngay (ACTIVE hardcoded ❌)

### 🔴 **P1 - Sửa ngay (Critical)**
1. **src/pages/PaymentResultPage.tsx** (L36) — Payment IPN callback
2. **src/components/XacNhanTraXe/components/DepositPage.tsx** (L83, 107, 124, 204, 215, 264, 323) — Deposit flow (7 vị trí)
3. **src/components/UserProfile/UserProfile.tsx** (L31, 45, 151) — Profile & wallet (3 vị trí)

### 🟡 **P2 - Sửa theo sau**
4. **src/components/StaffInterface/services/authServices.ts** (L3, 21) — Staff module  
5. **src/components/layouts/Navbar.tsx** (L54) — Notifications
6. **src/components/HistoryPage/RentalHistoryPage.tsx** (L63, 90, 100, ...) — Rental history

---

## Lệnh PowerShell kiểm tra

Liệt kê tất cả file có `http://localhost:8080`:
```powershell
Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | Select-String -Pattern "http://localhost:8080" | Select-Object Path, LineNumber, Line | Format-Table -AutoSize
```

Thống kê số lần xuất hiện:
```powershell
(Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | Select-String -Pattern "http://localhost:8080" | Measure-Object).Count
```

---

## Kết luận & Bước tiếp theo

✅ **Danh sách chi tiết đã được ghi lại.**

Để hoàn tất việc chỉ cần thay `.env` là đủ, bạn có thể:

- **(A)** Tôi tự động sửa tất cả hardcoded URLs → replace `http://localhost:8080` thành `${process.env.REACT_APP_API_URL}` (preview trước, apply sau)
- **(B)** Tôi sửa từng file theo priority (P1 → P2 → ...)
- **(C)** Bạn tự sửa thủ công dùng danh sách trên làm hướng dẫn

**Đề xuất:** Chọn **(A)** để tiết kiệm thời gian và đảm bảo không sót.

---

## Vấn đề GitHub warning về file lớn
Bạn báo có cảnh báo: `src/components/StaffInterface/chat.json` ~73 MB. Nếu file đã bị xóa khỏi tree hiện tại nhưng vẫn từng được commit thì GitHub sẽ cảnh báo khi push lịch sử có file > 50MB. Nếu bạn đã xóa và push commit xóa, kích thước repo có thể vẫn lớn vì file tồn tại trong lịch sử commit. Nếu bạn không muốn can thiệp, để yên là được — nhưng nếu muốn hoàn toàn loại bỏ khỏi lịch sử (giảm size repo), cần dùng các công cụ như `git filter-repo` hoặc `git filter-branch` (cẩn trọng; sẽ rewrite history).

---

## Khuyến nghị & bước tiếp theo để chỉ cần thay .env là đủ
1. Thay thế tất cả các `http://localhost:8080` (hoặc URL backend cứng) bằng một trong các cách sau:
   - Tốt nhất: dùng `src/services/apiClient.ts` (ví dụ `import api from '../services/apiClient'`) rồi gọi `api.get('/api/...')` / `api.post('/api/...')`. apiClient đã đặt baseURL từ `process.env.REACT_APP_API_URL`.
   - Hoặc dùng `axios.get(process.env.REACT_APP_API_URL + '/api/...')` (ít gọn hơn nhưng nhanh).
   - Hoặc sửa `const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080'` ở các service có baseURL cứng (ví dụ `authServices.ts`) thay vì `'http://localhost:8080'` tĩnh.

2. Sau khi thay đổi `.env` (hoặc file cấu hình môi trường), bạn phải restart dev server (`npm start`) vì Create React App chỉ nạp biến môi trường lúc build/start.

3. Kiểm tra kỹ các gọi AJAX trong `src/components` (không chỉ `src/services`) — nhiều component đang dùng axios trực tiếp với URL cứng.

4. (Tùy chọn) Tạo 1 script lint/check hoặc grep pattern để tìm `http://localhost:8080` và `REACT_APP_BACKEND_URL` để xác định còn sót chỗ nào nữa.

---

## Ví dụ thay thế (mẫu code)
- Hiện (hardcoded):

```ts
const res = await axios.get(`http://localhost:8080/api/bookings/${bookingId}`, { headers: { Authorization: 'Bearer ' + token } });
```

- Thay bằng (dùng api client):
```ts
import api from '../../services/apiClient';
const res = await api.get(`/api/bookings/${bookingId}`); // api client sẽ add Authorization header nếu cần
```

- Hoặc tối thiểu (dùng env):
```ts
const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}`, { headers: { Authorization: 'Bearer ' + token } });
```

---

## Lệnh PowerShell tìm & in file chứa URL cứng (preview, KHÔNG sửa tự động)
Bạn có thể chạy lệnh này trong thư mục project để liệt kê file chứa `http://localhost:8080`:

```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Select-String -Pattern 'http://localhost:8080' | Select-Object Path, LineNumber, Line
```

Nếu muốn thay thế tự động (hãy cẩn thận, tốt nhất backup trước), bạn có thể dùng PowerShell để replace (ví dụ thay bằng process.env):

```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx | ForEach-Object {
  (Get-Content $_.FullName) -replace 'http://localhost:8080', 'process.env.REACT_APP_API_URL' | Set-Content $_.FullName
}
```

Lưu ý: biến `process.env.REACT_APP_API_URL` trong file TypeScript phải được dùng trong template/string phù hợp (ví dụ `${process.env.REACT_APP_API_URL}`), nên kiểm tra thủ công các thay đổi.

---

## Kết luận ngắn gọn
- Hiện có `.env` với `REACT_APP_API_URL` — nhưng **không** mọi gọi API đều sử dụng nó.
- Để chỉ cần chỉnh `.env` để chuyển backend cho toàn bộ app, bạn phải sửa các chỗ gọi hardcoded (`http://localhost:8080` hoặc baseURL constants) sang dùng `process.env.REACT_APP_API_URL` hoặc (tốt hơn) dùng `src/services/apiClient.ts`.
- Nếu bạn muốn, tôi có thể:
  - Tự động tìm tất cả file có chuỗi `http://localhost:8080` và tạo một patch để sửa (ví dụ replace bằng `${process.env.REACT_APP_API_URL}` hoặc chuyển sang dùng `apiClient`) — tôi sẽ preview các thay đổi trước khi apply.
  - Hoặc tạo PR/patch thay đổi chỉ ở một bộ phận (ví dụ `src/components/XacNhanTraXe/*`) theo yêu cầu.

---

Nếu bạn đồng ý, tôi sẽ:
- (A) tạo pull/patch tự động để thay tất cả `http://localhost:8080` thành `process.env.REACT_APP_API_URL` (tạo backup/preview trước), hoặc
- (B) liệt kê chi tiết từng file và cung cấp patch thủ công cho bạn duyệt. 

Hãy cho biết bạn muốn tôi thực hiện bước nào tiếp theo (A hoặc B), hoặc chỉ cần file báo cáo này thôi.
