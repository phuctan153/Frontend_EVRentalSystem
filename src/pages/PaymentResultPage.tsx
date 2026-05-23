import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, Home, Sparkles, CreditCard, Calendar, Hash, Wallet } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

export default function PaymentResultPage() {
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState("");
    const [paymentData, setPaymentData] = useState<any>(null);
    const params = new URLSearchParams(window.location.search);

    useEffect(() => {
        const processIpn = async () => {
            try {
                const token = localStorage.getItem("token");

                const ipnData = {
                    partnerCode: params.get("partnerCode"),
                    orderId: params.get("orderId"),
                    requestId: params.get("requestId"),
                    amount: Number(params.get("amount")),
                    orderInfo: decodeURIComponent(params.get("orderInfo") || ""),
                    orderType: params.get("orderType"),
                    transId: params.get("transId"),
                    resultCode: Number(params.get("resultCode")),
                    message: params.get("message"),
                    payType: params.get("payType"),
                    responseTime: Number(params.get("responseTime")),
                    extraData: params.get("extraData"),
                    signature: params.get("signature"),
                };

                // 🟢 Gửi dữ liệu IPN đến backend
                const res = await axios.post(
                    "https://ev-rental-backend.onrender.com/api/payments/momo/ipn",
                    ipnData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                // ✅ Cập nhật state
                setPaymentData(ipnData);
                setSuccess(ipnData.resultCode === 0);
                setMessage(
                    ipnData.resultCode === 0
                        ? "🎉 Thanh toán thành công!"
                        : "❌ Thanh toán thất bại!"
                );

                
            } catch (error: any) {
                console.error("❌ Lỗi khi gửi IPN:", error.response?.data || error.message);
                setSuccess(false);
                setMessage("Lỗi trong quá trình xác nhận thanh toán!");
                toast.error("Không thể gửi thông tin IPN đến server.", {
                    position: "top-right",
                });
            } finally {
                setLoading(false);
            }
        };

        processIpn();
    }, [params]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDateTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div style={styles.container}>
            {/* Animated background */}
            <div style={styles.bgAnimation}>
                <div style={styles.circle1}></div>
                <div style={styles.circle2}></div>
                <div style={styles.circle3}></div>
            </div>

            <div style={styles.contentWrapper}>
                {loading ? (
                    <div style={styles.loadingCard}>
                        <div style={styles.spinnerWrapper}>
                            <Loader2 size={64} style={styles.spinner} />
                        </div>
                        <h3 style={styles.loadingText}>Đang xác nhận thanh toán...</h3>
                        <div style={styles.dots}>
                            <span style={{ ...styles.dot, animationDelay: '0s' }}></span>
                            <span style={{ ...styles.dot, animationDelay: '0.2s' }}></span>
                            <span style={{ ...styles.dot, animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        ...styles.resultCard,
                        animation: 'slideIn 0.5s ease-out'
                    }}>
                        {success ? (
                            <>
                                <div style={styles.iconWrapper}>
                                    <div style={{ ...styles.successRing, animation: 'ringExpand 0.6s ease-out' }}></div>
                                    <CheckCircle size={80} style={styles.successIcon} />
                                    <Sparkles size={24} style={{ ...styles.sparkle, top: '10px', right: '10px' }} />
                                    <Sparkles size={20} style={{ ...styles.sparkle, bottom: '10px', left: '10px' }} />
                                </div>
                                <h2 style={styles.successTitle}>Thanh toán thành công!</h2>
                                <p style={styles.successMessage}>{message}</p>

                                {paymentData && (
                                    <>
                                        {/* Amount Highlight */}
                                        <div style={styles.amountBox}>
                                            <div style={styles.amountLabel}>Số tiền thanh toán</div>
                                        </div>

                                        {/* Payment Details */}
                                        <div style={styles.successDetails}>
                                            <div style={styles.detailItem}>
                                                <div style={styles.detailLeft}>
                                                    <Hash size={18} style={styles.detailIcon} />
                                                    <span style={styles.detailLabel}>Mã đơn hàng</span>
                                                </div>
                                                <span style={styles.detailValue}>{paymentData.orderId}</span>
                                            </div>

                                            <div style={styles.detailItem}>
                                                <div style={styles.detailLeft}>
                                                    <Hash size={18} style={styles.detailIcon} />
                                                    <span style={styles.detailLabel}>Mã giao dịch</span>
                                                </div>
                                                <span style={styles.detailValue}>{paymentData.transId}</span>
                                            </div>

                                            <div style={styles.detailItem}>
                                                <div style={styles.detailLeft}>
                                                    <CreditCard size={18} style={styles.detailIcon} />
                                                    <span style={styles.detailLabel}>Phương thức</span>
                                                </div>
                                                <span style={styles.detailValue}>
                                                    {paymentData.payType === 'napas' ? 'Thẻ ATM' :
                                                        paymentData.payType === 'cc' ? 'Thẻ tín dụng' :
                                                            'MoMo Wallet'}
                                                </span>
                                            </div>

                                            <div style={styles.detailItem}>
                                                <div style={styles.detailLeft}>
                                                    <Wallet size={18} style={styles.detailIcon} />
                                                    <span style={styles.detailLabel}>Đối tác</span>
                                                </div>
                                                <span style={styles.detailValue}>MoMo</span>
                                            </div>

                                            <div style={styles.detailItem}>
                                                <div style={styles.detailLeft}>
                                                    <Calendar size={18} style={styles.detailIcon} />
                                                    <span style={styles.detailLabel}>Thời gian</span>
                                                </div>
                                                <span style={styles.detailValue}>
                                                    {formatDateTime(paymentData.responseTime)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Order Info */}
                                        <div style={styles.orderInfoBox}>
                                            <div style={styles.orderInfoLabel}>Thông tin đơn hàng</div>
                                            <div style={styles.orderInfoText}>{paymentData.orderInfo}</div>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={styles.iconWrapper}>
                                    <div style={{ ...styles.errorRing, animation: 'shake 0.5s ease-out' }}></div>
                                    <XCircle size={80} style={styles.errorIcon} />
                                </div>
                                <h2 style={styles.errorTitle}>Thanh toán thất bại</h2>
                                <p style={styles.errorMessage}>{message}</p>

                                {paymentData && (
                                    <div style={styles.errorDetails}>
                                        <div style={styles.detailItem}>
                                            <span style={styles.detailLabel}>Mã đơn hàng:</span>
                                            <span style={styles.errorDetailValue}>{paymentData.orderId}</span>
                                        </div>
                                        <div style={styles.detailItem}>
                                            <span style={styles.detailLabel}>Mã lỗi:</span>
                                            <span style={styles.errorDetailValue}>{paymentData.resultCode}</span>
                                        </div>
                                    </div>
                                )}

                                <p style={styles.errorHint}>Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn.</p>
                            </>
                        )}

                        <button
                            style={{
                                ...styles.homeButton,
                                background: success
                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                            }}
                            onClick={() => window.location.href = '/'}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = success
                                    ? '0 8px 25px rgba(102, 126, 234, 0.4)'
                                    : '0 8px 25px rgba(245, 87, 108, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = success
                                    ? '0 4px 15px rgba(102, 126, 234, 0.3)'
                                    : '0 4px 15px rgba(245, 87, 108, 0.3)';
                            }}
                        >
                            <Home size={20} style={styles.buttonIcon} />
                            Về trang chủ
                        </button>
                    </div>
                )}
            </div>

            <style>{keyframes}</style>
        </div>
    );
}

const keyframes = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    @keyframes pulse {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.1); }
    }
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    @keyframes ringExpand {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(1);
            opacity: 0;
        }
    }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    @keyframes twinkle {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
    }
`;

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    bgAnimation: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0,
    },
    circle1: {
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        top: '-100px',
        left: '-100px',
        animation: 'float 6s ease-in-out infinite',
    },
    circle2: {
        position: 'absolute',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.08)',
        bottom: '-50px',
        right: '100px',
        animation: 'float 8s ease-in-out infinite',
        animationDelay: '1s',
    },
    circle3: {
        position: 'absolute',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.06)',
        top: '50%',
        right: '-50px',
        animation: 'float 7s ease-in-out infinite',
        animationDelay: '2s',
    },
    contentWrapper: {
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '600px',
    },
    loadingCard: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '60px 40px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
    spinnerWrapper: {
        marginBottom: '30px',
    },
    spinner: {
        color: '#667eea',
        animation: 'spin 1s linear infinite',
    },
    loadingText: {
        color: '#333',
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '20px',
    },
    dots: {
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
    },
    dot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: '#667eea',
        animation: 'pulse 1.4s ease-in-out infinite',
        display: 'inline-block',
    },
    resultCard: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '50px 40px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
    iconWrapper: {
        position: 'relative',
        display: 'inline-block',
        marginBottom: '30px',
    },
    successRing: {
        position: 'absolute',
        width: '120px',
        height: '120px',
        border: '3px solid #10b981',
        borderRadius: '50%',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
    },
    successIcon: {
        color: '#10b981',
        filter: 'drop-shadow(0 4px 8px rgba(16, 185, 129, 0.3))',
    },
    sparkle: {
        position: 'absolute',
        color: '#fbbf24',
        animation: 'twinkle 1.5s ease-in-out infinite',
    },
    errorRing: {
        position: 'absolute',
        width: '120px',
        height: '120px',
        border: '3px solid #ef4444',
        borderRadius: '50%',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
    },
    errorIcon: {
        color: '#ef4444',
        filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))',
    },
    successTitle: {
        color: '#10b981',
        fontSize: '32px',
        fontWeight: '700',
        marginBottom: '15px',
    },
    successMessage: {
        color: '#666',
        fontSize: '18px',
        marginBottom: '30px',
    },
    amountBox: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: '16px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)',
    },
    amountLabel: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    amountValue: {
        color: 'white',
        fontSize: '36px',
        fontWeight: '700',
        letterSpacing: '-0.5px',
    },
    successDetails: {
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        textAlign: 'left',
    },
    detailItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
    },
    detailLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    detailIcon: {
        color: '#10b981',
    },
    detailLabel: {
        color: '#666',
        fontSize: '14px',
        fontWeight: '500',
    },
    detailValue: {
        color: '#10b981',
        fontSize: '14px',
        fontWeight: '600',
        textAlign: 'right',
        maxWidth: '60%',
        wordBreak: 'break-word',
    },
    orderInfoBox: {
        background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
        borderRadius: '12px',
        padding: '15px',
        marginBottom: '25px',
    },
    orderInfoLabel: {
        color: '#7c3aed',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '8px',
    },
    orderInfoText: {
        color: '#5b21b6',
        fontSize: '14px',
        fontWeight: '500',
        lineHeight: '1.5',
    },
    errorTitle: {
        color: '#ef4444',
        fontSize: '32px',
        fontWeight: '700',
        marginBottom: '15px',
    },
    errorMessage: {
        color: '#666',
        fontSize: '18px',
        marginBottom: '25px',
    },
    errorDetails: {
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
    },
    errorDetailValue: {
        color: '#ef4444',
        fontSize: '14px',
        fontWeight: '600',
    },
    errorHint: {
        color: '#999',
        fontSize: '14px',
        marginBottom: '30px',
    },
    homeButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '16px 40px',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
    },
    buttonIcon: {
        strokeWidth: 2.5,
    },
};