import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Upload, Bell, LogOut, Link2 } from "lucide-react"; // Link2 아이콘 추가

export default function Dashboard() {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(0);

    // 로그인 여부 확인
    useEffect(() => {
        if (!localStorage.getItem("isAdmin")) {
            navigate("/");
        }
    }, [navigate]);

    // localStorage에 저장된 "logoutAt" 값을 기반으로 타이머 초기화 (없다면 10분 후로 설정)
    useEffect(() => {
        let logoutAt = localStorage.getItem("logoutAt");
        if (!logoutAt) {
            logoutAt = Date.now() + 600000; // 10분 후 (600,000ms)
            localStorage.setItem("logoutAt", logoutAt);
        }
        const initialTimeLeft = Math.floor((Number(logoutAt) - Date.now()) / 1000);
        setTimeLeft(initialTimeLeft);
    }, []);

    // 1초마다 localStorage의 "logoutAt" 값을 기준으로 타이머 업데이트 및 자동 로그아웃 처리
    useEffect(() => {
        const intervalId = setInterval(() => {
            const logoutAt = localStorage.getItem("logoutAt");
            if (logoutAt) {
                const remaining = Math.floor((Number(logoutAt) - Date.now()) / 1000);
                if (remaining <= 0) {
                    localStorage.removeItem("isAdmin");
                    localStorage.removeItem("logoutAt");
                    navigate("/");
                    clearInterval(intervalId);
                } else {
                    setTimeLeft(remaining);
                }
            }
        }, 1000);
        return () => clearInterval(intervalId);
    }, [navigate]);

    const handleLogout = () => {
        if (window.confirm("로그아웃 할까요?")) {
            localStorage.removeItem("isAdmin");
            localStorage.removeItem("logoutAt");
            navigate("/");
        }
    };

    // 남은 시간을 분, 초로 계산 및 두 자리 형식 (mm:ss)으로 변환
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    return (
        <div className="flex flex-col items-center min-h-screen bg-white p-6">
            {/* 상단 네비게이션 */}
            <div className="w-full flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">호서늘봄 DASHBOARD</h1>
                <div className="flex items-center">
                    <span className="mr-2 text-gray-600">{formattedTime}</span>
                    <button onClick={handleLogout} className="logout-button">
                        <LogOut size={24} className="text-gray-600 hover:text-red-500" />
                    </button>
                </div>
            </div>

            {/* 카드 버튼 리스트 */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                {/* 공지사항 관리 */}
                <div
                    className="dashboard-card bg-blue-500 hover:bg-blue-600"
                    onClick={() => navigate("/notices")}
                >
                    <Bell className="dashboard-icon text-white" />
                    <span>공지사항</span>
                </div>

                {/* 업로드 관리 */}
                <div
                    className="dashboard-card bg-green-500 hover:bg-green-600"
                    onClick={() => navigate("/uploads")}
                >
                    <Upload className="dashboard-icon text-white" />
                    <span>서류제출</span>
                </div>

                {/* 파일 관리 */}
                <div
                    className="dashboard-card bg-yellow-500 hover:bg-yellow-600"
                    onClick={() => navigate("/downloads")}
                >
                    <FileText className="dashboard-icon text-white" />
                    <span>수업자료</span>
                </div>

                {/* 링크 변환 버튼 */}
                <div
                    className="dashboard-card bg-purple-500 hover:bg-purple-600"
                    onClick={() => navigate("/link")}
                >
                    <Link2 className="dashboard-icon text-white" />
                    <span>링크 변환</span>
                </div>
            </div>
        </div>
    );
}