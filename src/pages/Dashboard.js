import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Upload, Bell, Settings, LogOut } from "lucide-react"; // 아이콘 추가

export default function Dashboard() {
    const navigate = useNavigate();

    // ✅ 로그인 여부 확인 후, 비로그인 상태면 강제 이동
    useEffect(() => {
        if (!localStorage.getItem("isAdmin")) {
            navigate("/"); // 로그인 페이지로 이동
        }
    }, []);

    const handleLogout = () => {
        if (window.confirm("정말 로그아웃 하시겠습니까?")) {
            localStorage.removeItem("isAdmin"); // 관리자 권한 제거
            navigate("/"); // 로그인 페이지로 이동
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-white p-6">
            {/* 상단 네비게이션 */}
            <div className="w-full flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">호서늘봄 관리자 페이지</h1>
                <button onClick={handleLogout} className="logout-button">
                    <LogOut size={24} className="text-gray-600 hover:text-red-500" />
                </button>
            </div>

            {/* 카드 버튼 리스트 */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                {/* 공지사항 관리 */}
                <div
                    className="dashboard-card bg-blue-500 hover:bg-blue-600"
                    onClick={() => navigate('/notices')}
                >
                    <Bell className="dashboard-icon text-white" />
                    <span>공지사항</span>
                </div>

                {/* 업로드 관리 */}
                <div
                    className="dashboard-card bg-green-500 hover:bg-green-600"
                    onClick={() => navigate('/uploads')}
                >
                    <Upload className="dashboard-icon text-white" />
                    <span>서류제출</span>
                </div>

                {/* 파일 관리 */}
                <div
                    className="dashboard-card bg-yellow-500 hover:bg-yellow-600"
                    onClick={() => navigate('/downloads')}
                >
                    <FileText className="dashboard-icon text-white" />
                    <span>수업자료</span>
                </div>
            </div>
        </div>
    );
}