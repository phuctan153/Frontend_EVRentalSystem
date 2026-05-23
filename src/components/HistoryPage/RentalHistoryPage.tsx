
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Spinner, Badge, Modal } from "react-bootstrap";
import "./RentalHistoryPage.css";
import { Booking } from "../../models/BookingModel";
import axios from "axios";
import { toast } from "react-toastify";
import StarRating from "./StarRating";
import { User } from "../../models/AuthModel";
import { UserContext } from "../../context/UserContext";

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function RentalHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contractStatuses, setContractStatuses] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [cancelInfo, setCancelInfo] = useState<{ message: string } | null>(null);
  const [loadingCancelInfo, setLoadingCancelInfo] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [vehicleRating, setVehicleRating] = useState(5);
  const [staffRating, setStaffRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratedBookingIds, setRatedBookingIds] = useState<number[]>([]);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userContext = useContext(UserContext);




  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userContext?.token) {
        setError("Vui lòng đăng nhập để xem thông tin");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 🔹 Gọi trực tiếp API renter/profile
        const res = await axios.get("https://ev-rental-backend.onrender.com/api/renter/profile", {
          headers: {
            Authorization: `Bearer ${userContext.token}`,
          },
        });

        if (res.data?.data) {
          const renterData = res.data.data;
          setProfileData(renterData);
          setError(null);
        }
      } catch (err: any) {
        console.error("❌ Lỗi khi tải thông tin người dùng:", err);
        setError(
          err.response?.data?.message || "Không thể tải thông tin người dùng"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        setLoading(true);
        const res = await axios.get("https://ev-rental-backend.onrender.com/api/renter/bookings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data.data;
        setBookings(data);

        const statusMap: { [key: number]: string } = {};
        for (const bk of data) {
          try {
            const resContract = await axios.get(
              `https://ev-rental-backend.onrender.com/api/contracts/${bk.bookingId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            statusMap[bk.bookingId] = resContract.data.data?.status;
          } catch (err) {
            console.warn(`Không thể lấy trạng thái contract cho booking ${bk.bookingId}`);
          }
        }
        setContractStatuses(statusMap);

        const ratedIds: number[] = [];
        await Promise.all(
          data.map(async (bk: any) => {
            try {
              const resRating = await axios.get(
                `https://ev-rental-backend.onrender.com/api/bookings/${bk.bookingId}/rating`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (resRating.data?.data) ratedIds.push(bk.bookingId);
            } catch (err: any) {
              if (err?.response?.status === 404) return; // ch có rating
              console.warn(`⚠️ Không thể lấy rating cho booking ${bk.bookingId}`);
            }
          })
        );
        setRatedBookingIds(ratedIds);
      } catch (error) {
        console.error("❌ Lỗi khi tải danh sách booking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchBookingDetail = async (bookingId: number) => {
    try {
      setLoadingDetail(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`https://ev-rental-backend.onrender.com/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let booking = res.data.data;

      const localConfirmed = JSON.parse(
        localStorage.getItem("localConfirmedImages") || "[]"
      );

      booking.bookingImages = booking.bookingImages.map((img: any) => ({
        ...img,
        confirmed: img.confirmed || localConfirmed.includes(img.imageId),
      }));

      setSelectedBooking(booking);
      setShowModal(true);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết đơn đặt xe", error);
      alert("Không thể tải chi tiết đơn đặt xe.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCancelClick = async (bookingId: number) => {
    setBookingToCancel(bookingId);
    await fetchCancelInfo(bookingId);
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async (bookingId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `https://ev-rental-backend.onrender.com/api/bookings/${bookingId}/cancel`,
        { reason: "Người thuê tự hủy" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.status === "success") {
        toast.success("✅ Đơn đặt xe đã được hủy thành công!", {
          position: "top-right",
          autoClose: 3000,
        });

        // ✅ Cập nhật danh sách booking tại chỗ
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId
              ? { ...b, status: "CANCELLED" }
              : b
          )
        );
      } else {
        toast.error("⚠️ Không thể hủy đơn. Vui lòng thử lại sau.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      console.error("❌ Lỗi khi hủy đơn:", error);
      toast.error(
        error.response?.data?.message ||
        "Không thể hủy đơn. Vui lòng thử lại.",
      );
    }
  };


  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p>Đang tải lịch sử thuê xe...</p>
      </div>
    );

  const fetchCancelInfo = async (bookingId: number) => {
    try {
      setLoadingCancelInfo(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `https://ev-rental-backend.onrender.com/api/bookings/${bookingId}/confirm-cancel`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.data) {
        setCancelInfo(res.data.data);
      }
    } catch (error) {
      console.error("❌ Lỗi khi gọi API confirm-cancel:", error);
      setCancelInfo({ message: "Không thể lấy thông tin hoàn tiền. Vui lòng thử lại." });
    } finally {
      setLoadingCancelInfo(false);
    }
  };

  const handleNotifyReturn = async (bookingId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `https://ev-rental-backend.onrender.com/api/bookings/${bookingId}/notify-return`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.status === "success") {
        toast.success("📨 Thông báo trả xe đã được gửi đến nhân viên trạm!", {
          position: "top-center",
          autoClose: 3000,
        });
      } else {
        toast.error("⚠️ Gửi thông báo thất bại. Vui lòng thử lại.", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      console.error("❌ Lỗi khi gửi thông báo trả xe:", error);
      toast.error(
        error.response?.data?.message ||
        "Không thể gửi thông báo. Vui lòng thử lại.",
        { position: "top-right", autoClose: 3000 }
      );
    }
  };

  const handleSubmitRating = async (bookingId: number) => {
    if (!bookingId) return;

    try {
      setSubmittingRating(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `https://ev-rental-backend.onrender.com/api/bookings/${bookingId}/rating`,
        {
          vehicleRating,
          staffRating,
          comment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("🌟 Cảm ơn bạn đã đánh giá!", {
        position: "top-right",
        autoClose: 2500,
      });

      setShowRatingModal(false);
      setComment("");
      setVehicleRating(5);
      setStaffRating(5);
    } catch (error: any) {
      console.error(" Lỗi khi gửi đánh giá:", error);
      toast.error(
        error.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại.",
        { position: "top-right", autoClose: 3000 }
      );
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleConfirmImage = async (img: any) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.patch(
        `https://ev-rental-backend.onrender.com/api/bookings/images/${img.imageId}/confirm`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("✅ Đã xác nhận ảnh!");

      // ⬅️ LƯU imageId vào localStorage
      const stored = JSON.parse(localStorage.getItem("localConfirmedImages") || "[]");
      if (!stored.includes(img.imageId)) {
        stored.push(img.imageId);
        localStorage.setItem("localConfirmedImages", JSON.stringify(stored));
      }

      // ✅ Update UI
      setSelectedBooking((prev: any) => ({
        ...prev,
        bookingImages: prev.bookingImages.map((i: any) =>
          i.imageId === img.imageId ? { ...i, confirmed: true } : i
        ),
      }));
    } catch (err) {
      console.error(err);
      toast.error("❌ Lỗi khi xác nhận ảnh!");
    }
  };

  const formatRentalPeriod = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);

    const format = (d: Date) =>
      d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }) +
      " " +
      d.toLocaleDateString("vi-VN");

    const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));

    return {
      startStr: format(s),
      endStr: format(e),
      days: diffDays,
    };
  };


  return (
    <div className="container py-4">
      <h3 className="fw-bold text-center mb-4">Lịch sử thuê xe của người dùng</h3>

      {bookings.length === 0 ? (
        <p className="text-center text-muted">Bạn chưa có lịch sử thuê xe.</p>
      ) : (
        bookings.map((b) => {
          const contractStatus = contractStatuses[b.bookingId];
          return (
            <div
              key={b.bookingId}
              className="booking-card d-flex align-items-center shadow-sm p-3 rounded mb-3"
              onClick={() => fetchBookingDetail(b.bookingId)}
              style={{ cursor: "pointer" }}
            >
              <div className="flex-grow-1 px-3">
                <h5 className="fw-bold mb-1">{b.vehicleName}</h5>
                {(() => {
                  const f = formatRentalPeriod(b.startDateTime, b.endDateTime);
                  return (
                    <div className="mb-1">
                      <strong>Thời gian:</strong> {f.startStr} → {f.endStr}
                      <div className="text-muted small mt-1">
                        ({f.days} ngày)
                      </div>
                    </div>
                  );
                })()}


                <Badge
                  bg={
                    b.status === "PENDING"
                      ? "warning"
                      : b.status === "RESERVED"
                        ? "info"
                        : b.status === "IN_USE"
                          ? "success"
                          : b.status === "COMPLETED"
                            ? "secondary"
                            : b.status === "CANCELLED"
                              ? "danger"
                              : "dark"
                  }
                >
                  {b.status === "PENDING"
                    ? "Đang chờ duyệt"
                    : b.status === "RESERVED"
                      ? "Đang chờ nhận xe"
                      : b.status === "IN_USE"
                        ? "Đang sử dụng"
                        : b.status === "COMPLETED"
                          ? "Hoàn tất"
                          : b.status === "CANCELLED"
                            ? "Đã hủy"
                            : "Đã hết hạn"}
                </Badge>
              </div>

              {/* ---- Các nút hành động ---- */}
              <div className="d-flex flex-wrap align-items-center gap-2">

                {/*nút Ký/Xem hợp đồng*/}
                {(() => {
                  if (contractStatus === "CANCELLED") return null; // Ẩn nếu hợp đồng bị hủy

                  if (contractStatus === "PENDING_ADMIN_SIGNATURE") {
                    return (
                      <Button variant="secondary" disabled={profileData?.kycStatus !== "VERIFIED"}>
                        Ký hợp đồng
                      </Button>
                    );
                  }

                  if (contractStatus === "ADMIN_SIGNED" && profileData?.kycStatus === "VERIFIED") {
                    return (
                      <Button
                        variant="success"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const token = localStorage.getItem("token");
                            const res = await axios.get(
                              `https://ev-rental-backend.onrender.com/api/contracts/${b.bookingId}`,
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            navigate(`/contract-preview/${b.bookingId}`, {
                              state: { contract: res.data.data },
                            });
                          } catch (error) {
                            alert("Không thể tải hợp đồng. Vui lòng thử lại.");
                          }
                        }}
                      >
                        Ký hợp đồng
                      </Button>
                    );
                  }

                  if (contractStatus === "FULLY_SIGNED") {
                    return (
                      <Button
                        variant="info"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const token = localStorage.getItem("token");
                            const res = await axios.get(
                              `https://ev-rental-backend.onrender.com/api/contracts/${b.bookingId}`,
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            navigate(`/contract-preview/${b.bookingId}`, {
                              state: { contract: res.data.data },
                            });
                          } catch (error) {
                            alert("Không thể tải hợp đồng. Vui lòng thử lại.");
                          }
                        }}
                      >
                        Xem hợp đồng
                      </Button>
                    );
                  }

                  return (
                    <Button variant="secondary" disabled>
                      Chưa có hợp đồng
                    </Button>
                  );
                })()}

                {/*Nút Đặt cọc / Đã hoàn tiền*/}
                {(() => {
                  if (b.depositStatus === "PENDING" && b.status !== "CANCELLED") {
                    return (
                      <Button
                        variant="warning"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/xac-nhan-dat-xe/${b.bookingId}`);
                        }}
                      >
                        Đặt cọc
                      </Button>
                    );
                  }

                  if (b.depositStatus === "REFUNDED") {
                    return (
                      <Button variant="outline-success" disabled>
                        Đã hoàn tiền
                      </Button>
                    );
                  }

                  // Nếu depositStatus = PAID hoặc null → không hiển thị gì
                  return null;
                })()}

                {/* ✅ Nút Trả xe */}
                <Button
                  variant={b.status === "IN_USE" ? "success" : "secondary"}
                  disabled={b.status !== "IN_USE"}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleNotifyReturn(b.bookingId);
                  }}
                >
                  Trả xe
                </Button>

                {b.status === "COMPLETED" && !ratedBookingIds.includes(b.bookingId) && (
                  <Button
                    variant="outline-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRatingModal(true);
                      setBookingId(b.bookingId);
                    }}
                  >
                    ⭐ Đánh giá
                  </Button>
                )}

                {b.status === "COMPLETED" && ratedBookingIds.includes(b.bookingId) && (
                  <Button variant="outline-success" disabled>
                    ✅ Đã đánh giá
                  </Button>
                )}



                {/* ✅ Nút Hủy đơn (ẩn khi hợp đồng FULLY_SIGNED hoặc CANCELLED) */}
                {(b.status === "RESERVED" || b.status === "PENDING") &&
                  contractStatus !== "FULLY_SIGNED" &&
                  contractStatus !== "CANCELLED" && (
                    <Button
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelClick(b.bookingId);
                      }}
                    >
                      Hủy đơn đặt xe
                    </Button>
                  )}
              </div>
            </div>
          );
        })
      )}

      {/* Modal Chi tiết đơn */}
      {selectedBooking && (
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Chi tiết đơn đặt xe #{selectedBooking.bookingId}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {loadingDetail ? (
              <div className="text-center">
                <Spinner animation="border" /> Đang tải chi tiết...
              </div>
            ) : (
              <div>
                <p><strong>Người thuê:</strong> {selectedBooking.renterName}</p>
                <p><strong>Xe:</strong> {selectedBooking.vehicleName}</p>
                <p><strong>Nhân viên:</strong> {selectedBooking.staffName}</p>
                {(() => {
                  const f = formatRentalPeriod(
                    selectedBooking.startDateTime,
                    selectedBooking.endDateTime
                  );
                  return (
                    <p>
                      <strong>Thời gian:</strong> {f.startStr} → {f.endStr}
                      <br />
                      <span className="text-muted">({f.days} ngày)</span>
                    </p>
                  );
                })()}

                <p>
                  <strong>Tổng tiền (ước tính): </strong>{" "}
                  {selectedBooking.totalAmount.toLocaleString()} VND
                </p>
                {/* 🧾 Nút xem hóa đơn */}
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="mb-3"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      const res = await axios.get(
                        `https://ev-rental-backend.onrender.com/api/invoices/bookings/${selectedBooking.bookingId}/invoices`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );

                      const invoices = res.data?.data || [];
                      const finalInvoice = invoices.find(
                        (inv: any) => inv.type === "FINAL"
                      );

                      if (finalInvoice) {
                        toast.success("✅ Đang mở hóa đơn tổng của bạn...", {
                          position: "top-right",
                          autoClose: 2500,
                        });
                        // Điều hướng sang trang FinalInvoice.tsx
                        navigate(`/final-invoice/booking/${selectedBooking.bookingId}`);
                      } else {
                        toast.info(" Hiện chưa có hóa đơn tổng cho đơn này.", {
                          position: "top-right",
                          autoClose: 3000,
                        });
                      }
                    } catch (error: any) {
                      console.error("❌ Lỗi khi tải hóa đơn:", error);
                      toast.error("Không thể tải thông tin hóa đơn. Vui lòng thử lại sau.", {
                        position: "top-right",
                        autoClose: 3000,
                      });
                    }
                  }}
                >
                  💳 Xem chi tiết hóa đơn
                </Button>

                {/* Hình ảnh xe */}
                {selectedBooking.bookingImages && selectedBooking.bookingImages.length > 0 && (
                  <>
                    <hr />
                    <h5 className="fw-bold mb-3 text-primary">Hình ảnh xe</h5>

                    {["BEFORE_RENTAL", "AFTER_RENTAL", "DAMAGE", "OTHER"].map((type) => {
                      const imagesOfType = selectedBooking.bookingImages?.filter(
                        (img) => img.imageType === type
                      );

                      if (!imagesOfType || imagesOfType.length === 0) return null;

                      const typeTitle: Record<string, string> = {
                        BEFORE_RENTAL: "Ảnh xe trước khi thuê",
                        AFTER_RENTAL: "Ảnh xe sau khi trả",
                        DAMAGE: " Ảnh hư hỏng (nếu có)",
                        OTHER: "Ảnh khác",
                      };

                      // ✅ Số ảnh confirm
                      const confirmedCount = imagesOfType.filter((img) => img.confirmed).length;

                      return (
                        <div key={type} className="mb-4">

                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold text-secondary">{typeTitle[type]}</h6>

                            <span className="badge bg-primary fs-6">
                              ✅ Đã xác nhận: {confirmedCount}/{imagesOfType.length}
                            </span>
                          </div>

                          <div className="booking-images-list">
                            {imagesOfType.map((img) => (
                              <div
                                key={img.imageId}
                                className="d-flex align-items-center p-2 border rounded shadow-sm mb-2"
                                style={{ gap: "12px" }}
                              >
                                <img
                                  src={img.imageUrl}
                                  alt={img.description || "Hình ảnh xe"}
                                  style={{
                                    width: "150px",
                                    height: "110px",
                                    objectFit: "cover",
                                    borderRadius: "6px",
                                    border: "1px solid #ddd",
                                  }}
                                />

                                <div className="flex-grow-1 small text-muted">
                                  <p className="mb-1">
                                    <strong>Mô tả:</strong> {img.description || "Không có mô tả"}
                                  </p>
                                  <p className="mb-1">
                                    <strong>Hạng mục:</strong> {img.vehicleComponent || "Không rõ"}
                                  </p>
                                  <p className="mb-2">
                                    <strong>Tạo lúc:</strong>{" "}
                                    {new Date(img.createdAt || "").toLocaleString("vi-VN")}
                                  </p>
                                </div>
                                <button
                                  className={`btn ${img.confirmed ? "btn-success disabled" : "btn-outline-primary"
                                    }`}
                                  onClick={() => !img.confirmed && handleConfirmImage(img)}
                                >
                                  {img.confirmed ? "✅ Đã xác nhận" : "Xác nhận"}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

              </div>
            )}
          </Modal.Body>
        </Modal>
      )}

      {/* Modal xác nhận hủy */}
      <Modal show={showCancelConfirm} onHide={() => setShowCancelConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận hủy đơn đặt xe</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {loadingCancelInfo ? (
            <div className="text-center">
              <Spinner animation="border" size="sm" /> Đang kiểm tra chính sách hoàn tiền...
            </div>
          ) : cancelInfo ? (
            <>
              {(() => {
                const booking = bookings.find(b => b.bookingId === bookingToCancel);
                if (booking?.depositStatus !== "PENDING") {
                  return (
                    <p className="text-danger fw-bold">⚠️ {cancelInfo.message}</p>
                  );
                }
                return null;
              })()}
              <p>Bạn có chắc chắn muốn hủy đơn này không?</p>
            </>
          ) : (
            <p>Không thể tải thông tin hoàn tiền. Bạn có chắc chắn muốn hủy?</p>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>
            Không
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              setShowCancelConfirm(false);
              if (bookingToCancel) {
                await handleConfirmCancel(bookingToCancel);
              }
              setShowCancelConfirm(false);
            }}
          >
            Có, hủy ngay
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal đánh giá */}
      <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Đánh giá đơn thuê #{bookingId}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/*Đánh giá xe*/}
          <div className="mb-4 text-center">
            <label className="form-label fw-bold">Đánh giá xe</label>
            <StarRating rating={vehicleRating} onRatingChange={setVehicleRating} />
          </div>

          {/*Đánh giá nhân viên */}
          <div className="mb-4 text-center">
            <label className="form-label fw-bold">Đánh giá nhân viên</label>
            <StarRating rating={staffRating} onRatingChange={setStaffRating} />
          </div>

          {/* Nhận xét thêm */}
          <div className="mb-3">
            <label className="form-label fw-bold">Nhận xét thêm</label>
            <textarea
              className="form-control"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn..."
            ></textarea>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRatingModal(false)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={() => bookingId && handleSubmitRating(Number(bookingId))}
            disabled={submittingRating}
          >
            {submittingRating ? (
              <>
                <Spinner size="sm" animation="border" /> Đang gửi...
              </>
            ) : (
              "Gửi đánh giá"
            )}
          </Button>
        </Modal.Footer>
      </Modal>


    </div>
  );
}