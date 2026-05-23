import React, { useCallback, useEffect, useRef, useState } from "react";
import logo from "../../images/favicon.png";
import { useNavigate, useLocation } from "react-router-dom";
import SignUpForm from "../auth/SignUpForm";
import LoginForm from "../auth/LoginForm";
import { FormProvider } from "../../context/FormContext";
import { useAuth } from "../../hooks/useAuth";
import OTPVerificationModal from "../auth/OtpVerificationForm";
import { toast } from "react-toastify";
import "./Navbar.css";
import axios from "axios";
import { Bell, ChevronRight } from "lucide-react";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const notificationRef = useRef<HTMLLIElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;


  interface Notification {
    notificationId: number;
    title: string;
    message: string;
    recipientType: "STAFF" | "USER";
    recipientId: number;
    isRead: boolean;
    createdAt?: string;
  }

  // Theo dõi khi người dùng cuộn
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // === Fetch API thông báo ===
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://ev-rental-backend.onrender.com/api/notifications/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.data) setNotifications(res.data.data.slice(0, 10));
    } catch (error) {
      console.error("❌ Lỗi tải thông báo:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // === Toggle dropdown ===
  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  // === Đóng dropdown khi click ra ngoài ===
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === Click vào 1 thông báo ===
  const handleNotificationClick = (id: number) => {
    console.log("Clicked notification:", id);
    setShowDropdown(false);
    // 👉 sau này thêm API đánh dấu đã đọc tại đây
  };

  // === Render dropdown ===
  const renderDropdown = () => {
    if (!showDropdown) return null;
    return (
      <div
        className="dropdown-menu dropdown-menu-end show p-3 shadow-lg"
        style={{
          minWidth: "350px",
          maxHeight: "450px",
          overflowY: "auto",
          position: "absolute",
          right: 0,
          zIndex: 1050,
          borderRadius: "0.75rem",
          backgroundColor: "#ffffff",
        }}
      >
        <h6 className="fw-bold border-bottom pb-2 mb-3 text-dark">
          Thông báo ({unreadCount} chưa đọc)
        </h6>

        {notifications.length > 0 ? (
          notifications.map((n) => (
            <a
              key={n.notificationId}
              onClick={() => handleNotificationClick(n.notificationId)}
              className={`d-flex align-items-start p-2 mb-2 rounded-3 text-decoration-none ${!n.isRead ? "bg-light fw-bold text-dark" : "text-secondary"
                }`}
              style={{ cursor: "pointer" }}
            >
              <div className="flex-grow-1">
                <div className="text-truncate" style={{ maxWidth: "260px" }}>
                  {n.title}
                </div>
                <small className={`${!n.isRead ? "text-primary" : "text-muted"}`}>
                  {n.message}
                </small>
              </div>
              <ChevronRight size={16} className="ms-2 text-muted flex-shrink-0" />
            </a>
          ))
        ) : (
          <div className="text-center text-muted py-4">
            <Bell size={32} className="mb-2" />
            <p>Không có thông báo mới</p>
          </div>
        )}

        <div className="border-top pt-2 mt-2">
          <button
            className="btn btn-sm w-100 text-primary fw-bold"
            onClick={() => {
              navigate("notifications");
              setShowDropdown(false);
            }}
          >
            Xem tất cả
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <nav
        className={`navbar navbar-expand-lg navbar-gentle ${isScrolled ? "scrolled" : ""
          }`}
      >
        <div className="container-fluid">
          {/* Logo */}
          <button
            className="navbar-brand d-flex align-items-center btn btn-link p-0"
            type="button"
            onClick={() => navigate("/")}
          >
            <img src={logo} alt="EV Station" height="80" className="me-3" />
            <span className="fw-bold text-primary fs-1">EV Station</span>
          </button>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Menu */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto d-flex align-items-lg-center gap-3">
              {!user ? (
                <>
                  <li className="nav-item mx-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary px-4"
                      data-bs-toggle="modal"
                      data-bs-target="#loginForm"
                    >
                      Đăng nhập
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className="btn btn-primary rounded-pill shadow w-100 px-4 py-2"
                      data-bs-toggle="modal"
                      data-bs-target="#signUpForm"
                    >
                      Đăng ký miễn phí
                    </button>
                  </li>
                </>
              ) : (
                // (SỬA LỖI) Xóa thẻ <ul> lồng nhau, chỉ giữ lại <>
                <>
                  <li className="nav-item">
                    <span className="fw-bold">
                      Xin chào, {user?.fullName || user?.email || "Guest"}
                    </span>
                  </li>

                  <li className="nav-item position-relative" ref={notificationRef}>
                    <button className="btn btn-link p-0 border-0" onClick={toggleDropdown}>
                      <Bell size={24} className="text-primary" />
                      {unreadCount > 0 && (
                        <span
                          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                          style={{ fontSize: "0.65rem" }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {renderDropdown()}
                  </li>

                  <li className="nav-item">
                    <button
                      className={`btn btn-link text-decoration-none ${location.pathname === "/rental-history" ? "active" : ""
                        }`}
                      onClick={() => navigate("/rental-history")}
                    >
                      Lịch sử thuê xe
                    </button>
                  </li>

                  <li className="nav-item">
                    <button
                      className={`btn btn-link text-decoration-none ${location.pathname === "/kyc-verification" ? "active" : ""
                        }`}
                      onClick={() => navigate("/kyc-verification")}
                    >
                      <i className="fas fa-id-card me-2"></i>
                      Xác thực danh tính
                    </button>
                  </li>

                  <li className="nav-item">
                    <button className="btn btn-link text-decoration-none"
                      onClick={() => navigate("/profile")}>
                      <i className="fas fa-user-circle   me-2"></i>
                      Tài khoản của tôi
                    </button>
                  </li>

                  <li className="nav-item">
                    <button
                      className="btn btn-link text-danger text-decoration-none"
                      onClick={() => {
                        logout();
                        toast.success("Đăng xuất thành công!", {
                          position: "top-center",
                          autoClose: 2000,
                        });
                        setTimeout(() => {
                          navigate("/");
                        }, 500);
                      }}
                    >
                      Đăng xuất
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Modal forms */}
      <FormProvider>
        <LoginForm />
      </FormProvider>
      <FormProvider>
        <SignUpForm />
        <OTPVerificationModal />
      </FormProvider>
    </>
  );
};

export default Navbar;