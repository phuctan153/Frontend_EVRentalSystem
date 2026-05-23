import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Button, Spinner, Alert } from "react-bootstrap";
import "./DepositPage.css";
import { Vehicle, VehicleDetail } from "../../../models/VehicleModel";
import { Booking } from "../../../models/BookingModel";
import { useParams } from "react-router-dom";
import { usePolicy } from "../../../hooks/usePolicy";

export default function DepositPage() {
  const [invoiceId, setInvoiceId] = useState<number>(0);
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [depositNumber, setDepositNumber] = useState<number>(0);
  const [selectedGateway, setSelectedGateway] = useState<
    "momo" | "payos" | null
  >(null);
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [momoPaymentUrl, setMomoPaymentUrl] = useState<string | null>(null);
  const [payosPaymentUrl, setPayosPaymentUrl] = useState<string | null>(null);
  const [payosQrCode, setPayosQrCode] = useState<string | null>(null);
  const { fetchPolicDeposit } = usePolicy();

  const savePaymentUrl = (
    gateway: "momo" | "payos",
    url: string,
    qrCode?: string
  ) => {
    const getStorageKey = (gateway: "momo" | "payos", type: "url" | "qr") => {
      return `payment_${gateway}_${bookingId}_${type}`;
    };

    if (gateway === "momo") {
      setMomoPaymentUrl(url);
      localStorage.setItem(getStorageKey("momo", "url"), url);
    } else {
      if (url) {
        setPayosPaymentUrl(url);
        localStorage.setItem(getStorageKey("payos", "url"), url);
      }
      if (qrCode) {
        setPayosQrCode(qrCode);
        localStorage.setItem(getStorageKey("payos", "qr"), qrCode);
      }
    }
  };

  const fetchDepositNumber = useCallback(async () => {
    const depositValue = await fetchPolicDeposit();
    if (depositValue.success) {
      setDepositNumber(Number(depositValue.value));
    } else {
      setErrorMsg(depositValue.err);
    }
  }, [fetchPolicDeposit]);

  useEffect(() => {
    // Helper function để tạo storage key
    const getStorageKey = (gateway: "momo" | "payos", type: "url" | "qr") => {
      return `payment_${gateway}_${bookingId}_${type}`;
    };

    // Load payment URLs từ localStorage nếu có
    const loadPaymentUrls = () => {
      const momoUrl = localStorage.getItem(getStorageKey("momo", "url"));
      const payosUrl = localStorage.getItem(getStorageKey("payos", "url"));
      const payosQr = localStorage.getItem(getStorageKey("payos", "qr"));

      if (momoUrl) setMomoPaymentUrl(momoUrl);
      if (payosUrl) setPayosPaymentUrl(payosUrl);
      if (payosQr) setPayosQrCode(payosQr);
    };

    const fetchBooking = async () => {
      try {
        const res = await axios.get(
          `https://ev-rental-backend.onrender.com/api/bookings/${bookingId}`,
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          }
        );
        const data = res.data.data;
        setBooking(data);
        setLoadingBooking(false);

        if (data.vehicleId) {
          fetchVehicle(data.vehicleId);
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải thông tin đặt xe:", err);
        setLoadingBooking(false);
        setErrorMsg("Không thể tải thông tin đặt xe.");
      }
    };

    const fetchVehicle = async (vehicleId: number) => {
      try {
        const res = await axios.get(
          `https://ev-rental-backend.onrender.com/api/vehicle/detail/${vehicleId}`
        );
        const data = res.data.data;
        console.log("✅ Vehicle detail:", res.data.data);
        setVehicle(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải thông tin xe:", err);
        setErrorMsg("Không thể tải thông tin xe.");
      } finally {
        setLoadingVehicle(false);
      }
    };

    // Kiểm tra xem đã có invoice deposit chưa
    const checkExistingInvoice = async (): Promise<boolean> => {
      try {
        const res = await axios.get(
          `https://ev-rental-backend.onrender.com/api/invoices/bookings/${bookingId}/invoices`,
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          }
        );
        const invoices = res.data.data;
        // Tìm invoice deposit (thường là invoice đầu tiên hoặc có type deposit)
        if (invoices && invoices.length > 0) {
          const depositInvoice =
            invoices.find((inv: any) => inv.type === "DEPOSIT") || invoices[0];
          setInvoiceId(depositInvoice.invoiceId);
          setDepositNumber(
            depositInvoice.depositAmount || depositInvoice.amount
          );
          setInvoiceCreated(true);
          console.log(
            "✅ Đã tìm thấy invoice deposit tồn tại:",
            depositInvoice
          );
          return true; // Đã có invoice
        }
        return false; // Chưa có invoice
      } catch (err) {
        return false; // Lỗi hoặc chưa có invoice
      }
    };

    // Khởi tạo data
    const initializeData = async () => {
      loadPaymentUrls(); // Load payment URLs từ localStorage nếu có
      fetchBooking();

      // Kiểm tra invoice trước, nếu không có thì mới lấy từ policy
      const hasInvoice = await checkExistingInvoice();
      if (!hasInvoice) {
        // Chưa có invoice, lấy tiền cọc từ policy
        await fetchDepositNumber();
      }
    };

    initializeData();
  }, [bookingId, fetchDepositNumber]);

  // Tạo invoice và mở confirm box khi nhấn nút thanh toán
  const handleConfirm = async (gateway: "momo" | "payos") => {
    try {
      setSelectedGateway(gateway);
      setErrorMsg("");
      setLoading(true);

      // Tạo invoice nếu chưa có
      const invoiceReady = await createInvoiceIfNeeded();
      if (!invoiceReady) {
        setLoading(false);
        return; // Dừng lại nếu không tạo được invoice
      }

      setLoading(false);
      setShowConfirmBox(true);
    } catch (err) {
      console.error("❌ Lỗi khi xác nhận thanh toán:", err);
      setLoading(false);
      setErrorMsg("Đã xảy ra lỗi khi xác nhận thanh toán.");
    }
  };

  // Tạo invoice chỉ khi cần thiết (nếu chưa có)
  const createInvoiceIfNeeded = async (): Promise<boolean> => {
    // Nếu đã có invoice rồi, không tạo nữa
    if (invoiceCreated && invoiceId > 0) {
      return true;
    }

    try {
      setErrorMsg("");

      // Tạo invoice mới
      await axios.post(
        `https://ev-rental-backend.onrender.com/api/invoices/bookings/${bookingId}/invoices/deposit`,
        null,
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      // Lấy thông tin invoice vừa tạo
      const res2 = await axios.get(
        `https://ev-rental-backend.onrender.com/api/invoices/bookings/${bookingId}/invoices`,
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      const invoices = res2.data.data;
      if (invoices && invoices.length > 0) {
        const depositInvoice =
          invoices.find((inv: any) => inv.type === "DEPOSIT") || invoices[0];
        setInvoiceId(depositInvoice.invoiceId);
        setDepositNumber(depositInvoice.depositAmount || depositInvoice.amount);
        setInvoiceCreated(true);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error("❌ Lỗi khi tạo invoice:", error);
      setErrorMsg(
        error.response?.data?.data || "Đã xảy ra lỗi khi tạo hóa đơn tiền cọc."
      );
      return false;
    }
  };

  const handleRedirectToMomo = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      // Kiểm tra xem đã có payment URL chưa
      if (momoPaymentUrl) {
        console.log("ℹ️ Sử dụng payment URL đã lưu");
        window.location.href = momoPaymentUrl;
        return;
      }

      // Kiểm tra invoice đã được tạo chưa
      if (!invoiceCreated || invoiceId === 0) {
        setErrorMsg("Vui lòng xác nhận thanh toán trước.");
        setLoading(false);
        return;
      }

      // Tạo link thanh toán MoMo mới (chỉ tạo payment URL, không tạo invoice)
      const res = await axios.post(
        `https://ev-rental-backend.onrender.com/api/payments/invoice/${invoiceId}/momo`,
        {
          amount: depositNumber,
        },
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      const data = res.data.data;
      if (data.payUrl) {
        // Lưu URL vào state và localStorage
        savePaymentUrl("momo", data.payUrl);
        window.location.href = data.payUrl;
      } else {
        setErrorMsg("Không thể tạo liên kết thanh toán.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.data || "Đã xảy ra lỗi khi tạo liên kết thanh toán."
      );
      setLoading(false);
    }
  };

  const handleRedirectToPayOS = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      // Kiểm tra xem đã có payment URL hoặc QR code chưa
      if (payosPaymentUrl) {
        console.log("ℹ️ Sử dụng payment URL đã lưu");
        window.location.href = payosPaymentUrl;
        return;
      }

      if (payosQrCode) {
        console.log("ℹ️ Sử dụng QR code đã lưu");
        const newTab = window.open();
        newTab!.document.write(
          `<img src="${payosQrCode}" alt="QR Code PayOS"/>`
        );
        setLoading(false);
        return;
      }

      // Kiểm tra invoice đã được tạo chưa
      if (!invoiceCreated || invoiceId === 0) {
        setErrorMsg("Vui lòng xác nhận thanh toán trước.");
        setLoading(false);
        return;
      }

      // Tạo link thanh toán PayOS mới (chỉ tạo payment URL, không tạo invoice)
      const res = await axios.post(
        `https://ev-rental-backend.onrender.com/api/payments/invoice/${invoiceId}/payos`,
        { amount: depositNumber },
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      const data = res.data.data;
      if (data.checkoutUrl) {
        // Lưu URL và chuyển hướng đến link thanh toán PayOS
        savePaymentUrl("payos", data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else if (data.qrCode) {
        // Lưu QR code và mở tab mới để hiển thị
        savePaymentUrl("payos", "", data.qrCode);
        const newTab = window.open();
        newTab!.document.write(
          `<img src="${data.qrCode}" alt="QR Code PayOS"/>`
        );
        setLoading(false);
      } else {
        setErrorMsg("Không thể tạo liên kết thanh toán PayOS.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("❌ Lỗi khi gọi PayOS:", err);
      setErrorMsg(
        err.response?.data?.message || "Đã xảy ra lỗi khi tạo liên kết PayOS."
      );
      setLoading(false);
    }
  };

  const formatReadableRentalTime = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const optionsDate: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    };

    const optionsTime: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit"
    };

    const startStr =
      startDate.toLocaleTimeString("vi-VN", optionsTime) +
      " " +
      startDate.toLocaleDateString("vi-VN", optionsDate);

    const endStr =
      endDate.toLocaleTimeString("vi-VN", optionsTime) +
      " " +
      endDate.toLocaleDateString("vi-VN", optionsDate);

    // TÍNH SỐ NGÀY – GIỜ
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainHours = diffHours % 24;

    let duration = "";
    if (diffDays > 0) duration += `${diffDays} ngày `;
    if (remainHours > 0) duration += `${remainHours} giờ`;

    if (!duration) duration = "Dưới 1 giờ";

    return {
      startStr,
      endStr,
      duration
    };
  };


  return (
    <div className="container py-5 deposit-page">
      <h2 className="text-center fw-bold mb-5">XÁC NHẬN ĐẶT XE</h2>

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

      {/* THÔNG TIN ĐẶT XE */}
      <section className="card-custom mb-4 info-box">
        <h5 className="fw-bold mb-3 text-primary">THÔNG TIN ĐẶT XE</h5>
        {loadingBooking ? (
          <p>Đang tải thông tin đặt xe...</p>
        ) : booking ? (
          <ul className="info-list">
            <li>
              <strong>Mã đặt xe:</strong> {booking.bookingId}
            </li>
            <li className="d-flex">
              <strong>Thời gian thuê:</strong>

              <div className="ms-auto text-end">
                <span className="fw-bold text-primary me-2">
                  {formatReadableRentalTime(booking.startDateTime, booking.endDateTime).startStr}
                </span>

                <span className="fw-bold">→</span>

                <span className="fw-bold text-primary ms-2">
                  {formatReadableRentalTime(booking.startDateTime, booking.endDateTime).endStr}
                </span>

                <div className="text-muted small mt-1">
                  ({formatReadableRentalTime(booking.startDateTime, booking.endDateTime).duration})
                </div>
              </div>
            </li>
            <li>
              <strong>Giá ước tính:</strong>{" "}
              {booking.totalAmount.toLocaleString("vi-VN")} VND
            </li>
            <li>
              <strong>Tiền cọc:</strong>{" "}
              {depositNumber > 0
                ? depositNumber.toLocaleString("vi-VN") + " VND"
                : "Đang tải..."}
            </li>        
          </ul>
        ) : (
          <p className="text-muted">Không tìm thấy thông tin đặt xe.</p>
        )}
      </section>

      {/* THÔNG TIN XE */}
      <section className="card-custom mb-4 car-box">
        <h5 className="fw-bold mb-3 text-success">THÔNG TIN XE</h5>
        {loadingVehicle ? (
          <p>Đang tải thông tin xe...</p>
        ) : vehicle ? (
          <div className="car-info ">
            <ul className="info-list">
              <li>
                <strong>Biển số:</strong> {vehicle.plateNumber}
              </li>
              <li>
                <strong>Model:</strong> {vehicle.modelName || "Xe điện"}
              </li>
              <li>
                <strong>Pin:</strong> {vehicle.batteryLevel}%
              </li>
              <li>
                <strong>Quãng đường đã đi:</strong>{" "}
                {vehicle.mileage.toLocaleString("vi-VN")} km
              </li>
              <li>
                <strong>Trạng thái:</strong> {vehicle.status}
              </li>
              <li>
              <strong>Giá thuê của xe: </strong> {vehicle?.pricePerDay.toLocaleString("vi-VN")} VND / ngày
            </li>
            </ul>
          </div>
        ) : (
          <p className="text-muted">Không tìm thấy thông tin xe.</p>
        )}
      </section>

      {/* THANH TOÁN TIỀN CỌC */}
      <section className="card-custom fade-in text-center">
        <h5 className="fw-bold mb-3">Thanh toán tiền cọc</h5>
        <p>Chọn phương thức thanh toán bạn muốn sử dụng:</p>

        {!showConfirmBox ? (
          <div className="d-flex justify-content-center gap-4 flex-wrap">
            {/* --- Nút MOMO --- */}
            <Button
              variant="success"
              size="lg"
              onClick={() => handleConfirm("momo")}
              disabled={loading}
              className="rounded-pill px-4 d-flex align-items-center gap-2"
            >
              {loading && selectedGateway === "momo" ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                    alt="MoMo"
                    width={35}
                    height={35}
                  />
                  Thanh toán bằng MoMo
                </>
              )}
            </Button>

            {/* --- Nút PAYOS --- */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleConfirm("payos")}
              disabled={loading}
              className="rounded-pill px-4 d-flex align-items-center gap-2"
            >
              {loading && selectedGateway === "payos" ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <img
                      src="https://cas.so/img/payOS.png"
                    alt="PayOS"
                    width={35}
                    height={35}
                  />
                  Thanh toán bằng PayOS
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="confirm-box mt-4 p-3 fade-in">
            <h6 className="fw-bold mb-2">Xác nhận thanh toán</h6>
            <p>
              Bạn sắp được chuyển hướng đến trang{" "}
              <strong>{selectedGateway === "momo" ? "MoMo" : "PayOS"}</strong>{" "}
              để thanh toán{" "}
              <strong>{depositNumber.toLocaleString("vi-VN")} VND</strong>.
            </p>
            <p className="text-muted small">
              ⚠️ Vui lòng không tắt trình duyệt trong quá trình xử lý.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirmBox(false)}
              >
                Hủy
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() =>
                  selectedGateway === "momo"
                    ? handleRedirectToMomo()
                    : handleRedirectToPayOS()
                }
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />{" "}
                    Đang xử lý...
                  </>
                ) : (
                  `Tiếp tục đến ${selectedGateway === "momo" ? "MoMo" : "PayOS"
                  }`
                )}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
