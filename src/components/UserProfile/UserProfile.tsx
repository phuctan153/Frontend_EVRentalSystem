import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "../../context/UserContext";
import { User } from "../../models/AuthModel";
import "./UserProfile.css";
import { Modal, Table, Spinner } from "react-bootstrap";

const UserProfile: React.FC = () => {
  const userContext = useContext(UserContext);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

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

          if (renterData.walletId) {
            try {
              const walletRes = await axios.get(
                `https://ev-rental-backend.onrender.com/api/wallet/${renterData.walletId}`,
                {
                  headers: { Authorization: `Bearer ${userContext.token}` },
                }
              );
              setWalletBalance(walletRes.data?.data?.balance ?? 0);
            } catch (walletErr) {
              console.warn("⚠️ Không thể tải số dư ví:", walletErr);
              setWalletBalance(null);
            }
          }
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
  }, [userContext?.token]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);
  const handleSave = async () => setIsEditing(false);

  const handleInputChange = (field: keyof User, value: string) => {
    if (profileData) {
      setProfileData({
        ...profileData,
        [field]: value,
      });
    }
  };

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-container">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="user-profile-container">
        <div className="no-data-message">
          <p>Không tìm thấy thông tin người dùng</p>
        </div>
      </div>
    );
  }

  const getKycStatusText = (status?: string) => {
    switch (status) {
      case "VERIFIED":
        return "Đã xác thực";
      case "WAITING_APPROVAL":
        return "Đang chờ xác thực";
      case "DELETED":
        return "Không hợp lệ";
      default:
        return "Chưa xác thực";
    }
  };

  const getKycStatusClass = (status?: string) => {
    switch (status) {
      case "VERIFIED":
        return "status-verified";
      case "PENDING_VERIFICATION":
        return "status-pending";
      case "NEED_UPLOAD":
        return "status-need-upload";
      default:
        return "status-unverified";
    }
  };

  const handleViewTransactions = async () => {
    if (!profileData?.walletId) {
      alert("Không tìm thấy thông tin ví của bạn.");
      return;
    }

    try {
      setLoadingTransactions(true);
      const token = userContext?.token;
      const res = await axios.get(
        `https://ev-rental-backend.onrender.com/api/wallet/${profileData.walletId}/transactions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const rawData = res.data?.data || [];

      // 🔹 Chỉ lấy thông tin cần thiết từ response
      const formatted = rawData.map((tx: any) => ({
        id: tx.transactionId,
        amount: tx.amount,
        status: tx.status,
        type: tx.transactionType,
        createdAt: tx.transactionTime,
        orderCode: tx.orderCode,
        notes: tx.notes,
        invoiceId: tx.invoice?.invoiceId,
        invoiceType: tx.invoice?.type,
        paymentMethod: tx.invoice?.paymentMethod,
      }));

      setTransactions(formatted);
      setShowModal(true);
    } catch (error) {
      console.error("❌ Lỗi khi lấy lịch sử giao dịch:", error);
      alert("Không thể tải danh sách giao dịch.");
    } finally {
      setLoadingTransactions(false);
    }
  };



  return (
    <div className="user-profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2 className="profile-title">Thông tin cá nhân</h2>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h3 className="section-title">Thông tin cơ bản</h3>

            <div className="info-group">
              <label className="info-label">Họ và tên</label>
              {isEditing ? (
                <input
                  type="text"
                  className="info-input"
                  value={profileData.fullName || ""}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                />
              ) : (
                <p className="info-value">
                  {profileData.fullName || "Chưa cập nhật"}
                </p>
              )}
            </div>

            <div className="info-group">
              <label className="info-label">Email</label>
              <p className="info-value">{profileData.email}</p>
              <span className="info-note">Email không thể thay đổi</span>
            </div>

            <div className="info-group">
              <label className="info-label">Số điện thoại</label>
              {isEditing ? (
                <input
                  type="tel"
                  className="info-input"
                  value={profileData.phoneNumber || ""}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                />
              ) : (
                <p className="info-value">
                  {profileData.phoneNumber || "Chưa cập nhật"}
                </p>
              )}
            </div>

            <div className="info-group">
              <label className="info-label">Địa chỉ</label>
              {isEditing ? (
                <textarea
                  className="info-textarea"
                  value={profileData.address || ""}
                  onChange={(e) =>
                    handleInputChange("address", e.target.value)
                  }
                  rows={3}
                />
              ) : (
                <p className="info-value">
                  {profileData.address || "Chưa cập nhật"}
                </p>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h3 className="section-title">Trạng thái tài khoản</h3>

            <div className="info-group">
              <label className="info-label">Trạng thái KYC</label>
              <div className="status-container">
                <span
                  className={`status-badge ${getKycStatusClass(
                    profileData.kycStatus
                  )}`}
                >
                  {getKycStatusText(profileData.kycStatus)}
                </span>
                {(profileData.kycStatus !== "VERIFIED" &&
                  profileData.kycStatus !== "WAITING_APPROVAL") && (
                    <a href="/kyc-verification" className="verify-link">
                      Xác thực ngay
                    </a>
                  )}
              </div>
            </div>

            <div className="info-group">
              <label className="info-label">Trạng thái tài khoản</label>
              <span
                className={`status-badge ${profileData.blacklisted
                  ? "status-blocked"
                  : "status-active"
                  }`}
              >
                {profileData.blacklisted ? "Bị khóa" : "Hoạt động"}
              </span>
            </div>

            {profileData.renterId && (
              <div className="info-group">
                <label className="info-label">Mã người thuê</label>
                <p className="info-value">#{profileData.renterId}</p>
              </div>
            )}

            <div className="info-group wallet-section">
              <label className="info-label">Ví của bạn</label>
              <div className="wallet-box">
                <p className="wallet-balance">
                  {walletBalance !== null
                    ? `${walletBalance.toLocaleString()} VND`
                    : "Đang tải..."}</p>
                <button
                  className="btn btn-outline-primary view-transactions-btn"
                  onClick={handleViewTransactions}
                >
                  Xem các giao dịch của bạn
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button className="btn-secondary" onClick={handleCancel}>
                Hủy
              </button>
              <button className="btn-primary" onClick={handleSave}>
                Lưu thay đổi
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={handleEdit}>
              <i className="fas fa-edit"></i> Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Lịch sử giao dịch ví của bạn</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {loadingTransactions ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2 text-muted">Đang tải danh sách giao dịch...</p>
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-muted fst-italic text-center">
              Không có giao dịch nào gần đây.
            </p>
          ) : (
            <Table striped bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Loại giao dịch</th>
                  <th>Số tiền (VND)</th>
                  <th>Trạng thái</th>
                  <th>Ngày giao dịch</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={tx.id}>
                    <td>{index + 1}</td>
                    <td>
                      {tx.type === "INVOICE_CASH"
                        ? "Thanh toán tiền mặt"
                        : tx.type === "INVOICE_MOMO"
                          ? "Thanh toán MoMo"
                          : tx.type === "DEPOSIT_REFUND"
                            ? "Hoàn tiền đặt cọc"
                            : tx.type === "DEPOSIT"
                              ? "Nạp tiền đặt cọc"
                              : tx.type}
                    </td>
                    <td className="fw-bold text-end">{tx.amount?.toLocaleString()}</td>
                    <td>
                      <span
                        className={`badge ${tx.status === "SUCCESS"
                          ? "bg-success"
                          : tx.status === "PENDING"
                            ? "bg-warning text-dark"
                            : "bg-danger"
                          }`}
                      >
                        {tx.status === "SUCCESS"
                          ? "Thành công"
                          : tx.status === "PENDING"
                            ? "Đang xử lý"
                            : "Thất bại"}
                      </span>
                    </td>
                    <td>{new Date(tx.createdAt).toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>

      </Modal>
    </div>
  );
};

export default UserProfile;
