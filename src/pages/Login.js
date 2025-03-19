import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = () => {
        const adminId = process.env.REACT_APP_ADMIN_ID;
        const adminPw = process.env.REACT_APP_ADMIN_PW;

        if (username === adminId && password === adminPw) {
            localStorage.setItem("isAdmin", "true");
            navigate("/dashboard");
        } else {
            setError("아이디 또는 비밀번호가 올바르지 않아요");
            setTimeout(() => setError(null), 3000);
        }
    };

    // ✅ 엔터 키를 누르면 로그인 실행
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="login-box flex flex-col items-center w-96 p-6 border rounded shadow">
                {/* 로그인 박스 너비의 20% 크기로 로고 이미지 지정 */}
                <img
                    src="/logo_splash.png"
                    alt="Logo"
                    className="mb-4"
                    style={{ width: "40%", height: "40%" }}
                />
                <h1 className="text-2xl font-bold text-gray-900 mb-6">호서늘봄 DASHBOARD</h1>
                <input
                    type="text"
                    placeholder="아이디"
                    className="login-input w-full p-2 mb-2 border rounded outline-none focus:ring-0 focus:border-gray-500"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    className="login-input w-full p-2 mb-2 border rounded outline-none focus:ring-0 focus:border-gray-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                {error && <p className="error-message text-red-500 mb-2">{error}</p>}
                <button
                    onClick={handleLogin}
                    className="login-button w-full px-4 py-2 bg-blue-500 text-white rounded"
                >
                    로그인
                </button>
            </div>
        </div>
    );
}