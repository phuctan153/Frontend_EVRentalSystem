import React, { useEffect, useState } from "react";
import { Button, Spinner, Card } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminContractPage.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ContractFullDetail } from "./types/api.type";
import * as adminContractService from "./services/authServicesForAdmin";



export default function AdminContractPage() {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();

    const [contract, setContract] = useState<ContractFullDetail | null>(null);
    const [booking, setBooking] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingView, setLoadingView] = useState(false);
    const [loadingOtp, setLoadingOtp] = useState(false);
    const [loadingSign, setLoadingSign] = useState(false);
    const [otp, setOtp] = useState("");

    useEffect(() => {
        const fetchContractAndBooking = async () => {
            if (!bookingId) return;

            setLoading(true);
            try {
                const contractResult = await adminContractService.getContractByBookingId(Number(bookingId));

                if (!contractResult.success || !contractResult.data) {
                    toast.error(contractResult.message || 'Không tìm thấy hợp đồng');
                    return;
                }

                setContract(contractResult.data);

                const bookingResult = await adminContractService.getBookingDetail(Number(bookingId));

                if (bookingResult.success && bookingResult.data) {
                    setBooking(bookingResult.data);
                }
            } catch (error) {
                toast.error("Có lỗi xảy ra khi tải dữ liệu");
            } finally {
                setLoading(false);
            }
        };
        fetchContractAndBooking();
    }, [bookingId]);



    const handleViewContract = async () => {
        if (!contract) return;

        setLoadingView(true);
        const result = await adminContractService.viewContractPDF(contract.contractId);
        setLoadingView(false);

        if (!result.success) {
            toast.error(result.message);
            return;
        }

        const fileURL = URL.createObjectURL(new Blob([result.data!], { type: "application/pdf" }));
        window.open(fileURL, "_blank");
    };

    const handleSendOtp = async () => {
        if (!booking) return;

        setLoadingOtp(true);
        const result = await adminContractService.sendAdminOTP(contract!.contractId);
        setLoadingOtp(false);

        if (result.success) {
            toast.success(result.message || "Mã OTP đã được gửi đến email của bạn!");
        } else {
            toast.error(result.message);
        }
    };

    const handleSignContract = async () => {
        if (!booking || otp.length < 6) {
            toast.warning("Vui lòng nhập đủ 6 số OTP");
            return;
        }

        setLoadingSign(true);
        const result = await adminContractService.signContractByAdmin(contract!.contractId, otp);
        setLoadingSign(false);

        if (result.success) {
            toast.success(result.message || "Hợp đồng đã được ký thành công!");
            setTimeout(() => navigate(-1), 2000);
        } else {
            toast.error(result.message);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (!contract) {
        return <p className="text-danger text-center mt-5">❌ Không tìm thấy thông tin hợp đồng.</p>;
    }

    return (
        <div className="container mt-5 p-5 shadow-sm bg-white rounded-4">
            <ToastContainer position="top-center" autoClose={2500} />
            <h3 className="text-center mb-4 fw-bold text-primary">📄 HỢP ĐỒNG THUÊ XE (ADMIN)</h3>

            {/* Contract Info */}
            <Card className="p-4 mb-4">
                <h5 className="fw-bold">Thông tin hợp đồng</h5>
                <p><strong>Mã hợp đồng:</strong> #{contract.contractId}</p>
                <p><strong>Mã booking:</strong> #{contract.bookingId}</p>
                <p><strong>Loại hợp đồng:</strong> {contract.contractType}</p>
                <p><strong>Trạng thái:</strong> <span className={`badge bg-${contract.status === 'FULLY_SIGNED' ? 'success' :
                    contract.status === 'ADMIN_SIGNED' ? 'primary' :
                        contract.status === 'PENDING_ADMIN_SIGNATURE' ? 'warning' : 'secondary'
                    }`}>{contract.status}</span></p>
                <p><strong>Ngày tạo:</strong> {contract.contractDate?.replace("T", " ")}</p>
                <p><strong>Admin:</strong> {contract.adminName}</p>
                <p><strong>Khách hàng:</strong> {contract.renterName}</p>
                {contract.adminSignedAt && <p><strong>Admin ký lúc:</strong> {contract.adminSignedAt.replace("T", " ")}</p>}
                {contract.renterSignedAt && <p><strong>Khách ký lúc:</strong> {contract.renterSignedAt.replace("T", " ")}</p>}
            </Card>

            {/* Booking info */}
            {booking && (
                <Card className="p-4 mb-4">
                    <h5 className="fw-bold">Thông tin đơn đặt xe</h5>
                    <p><strong>Tên khách hàng:</strong> {booking.renterName}</p>
                    <p><strong>Thời gian ADMIN ký:</strong> {booking.adminSignedAt?.replace("T", " ")}</p>
                    <p><strong>Thời gian Người Thuê ký:</strong> {booking.renterSignedAt?.replace("T", " ")}</p>
                    <p><strong>Trạng thái booking:</strong> {booking.status}</p>
                </Card>
            )}

            {/* Contract Terms */}
            {contract.terms && contract.terms.length > 0 && (
                <Card className="p-4 mb-4">
                    <h5 className="fw-bold">Điều khoản hợp đồng</h5>
                    {contract.terms.sort((a, b) => a.termNumber - b.termNumber).map(term => (
                        <div key={term.termNumber} className="mb-3">
                            <h6 className="text-primary">{term.termNumber}. {term.termTitle}</h6>
                            <p className="text-muted">{term.termContent}</p>
                        </div>
                    ))}
                </Card>
            )}

            {/* Xem hợp đồng */}
            <div className="text-center mb-4">
                <Button variant="info" size="lg" onClick={handleViewContract} disabled={loadingView}>
                    {loadingView ? <><Spinner animation="border" size="sm" /> Đang tải...</> : "📄 Xem file hợp đồng PDF"}
                </Button>
            </div>

            {/* OTP & Ký hợp đồng - chỉ hiện khi PENDING_ADMIN_SIGNATURE */}
            {contract.status === "PENDING_ADMIN_SIGNATURE" && (
                <div className="text-center mt-4">
                    <h5 className="fw-bold mb-3 text-warning">⚠️ Chờ Admin ký hợp đồng</h5>

                    <div className="d-flex justify-content-center gap-2 mb-3">
                        {otp.split("").concat(Array(6 - otp.length).fill("")).map((digit, index) => (
                            <input
                                key={index}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!/^\d?$/.test(val)) return;
                                    const newOtp = otp.substring(0, index) + val + otp.substring(index + 1);
                                    setOtp(newOtp);
                                    if (val && index < 5) {
                                        const next = document.getElementById(`otp-${index + 1}`);
                                        (next as HTMLInputElement)?.focus();
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Backspace" && !otp[index] && index > 0) {
                                        const prev = document.getElementById(`otp-${index - 1}`);
                                        (prev as HTMLInputElement)?.focus();
                                    }
                                }}
                                id={`otp-${index}`}
                                className="form-control text-center fw-bold fs-4"
                                style={{ width: "50px", height: "60px" }}
                            />
                        ))}
                    </div>

                    {/* Gửi OTP */}
                    <div className="mb-3">
                        <Button variant="secondary" size="lg" onClick={handleSendOtp} disabled={loadingOtp}>
                            {loadingOtp ? "Đang gửi..." : "Gửi mã OTP"}
                        </Button>
                        <div className="mt-2">
                            <span className="text-muted">Không nhận được mã? </span>
                            <Button variant="link" className="p-0" onClick={handleSendOtp} disabled={loadingOtp}>
                                Gửi lại
                            </Button>
                        </div>
                    </div>

                    {/* Ký hợp đồng */}
                    <Button
                        variant="success"
                        size="lg"
                        onClick={handleSignContract}
                        disabled={loadingSign || otp.length < 6}
                    >
                        {loadingSign ? <><Spinner animation="border" size="sm" /> Đang ký...</> : "Xác nhận ký (Admin)"}
                    </Button>
                </div>
            )}

            {/* Admin đã ký, chờ renter */}
            {contract.status === "ADMIN_SIGNED" && (
                <p className="text-info text-center fw-bold mt-3 fs-5">
                    Admin đã ký hợp đồng. Đang chờ khách hàng ký.
                </p>
            )}

            {/* Đã hoàn tất */}
            {contract.status === "FULLY_SIGNED" && (
                <p className="text-success text-center fw-bold mt-3 fs-5">
                    Hợp đồng đã được ký hoàn tất bởi cả hai bên.
                </p>
            )}

            {/* Bị hủy */}
            {contract.status === "CANCELLED" && (
                <p className="text-danger text-center fw-bold mt-3 fs-5">
                    Hợp đồng đã bị hủy.
                </p>
            )}
        </div>
    );
}




