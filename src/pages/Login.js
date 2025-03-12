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
            localStorage.setItem("isAdmin", "true"); // 로그인 성공 시 저장
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">호서늘봄 관리자 페이지</h1>

            <div className="login-box">
                {/* 아이디 입력 */}
                <input
                    type="text"
                    placeholder="아이디"
                    className="login-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown} // ✅ 엔터 감지
                />
                {/* 비밀번호 입력 */}
                <input
                    type="password"
                    placeholder="비밀번호"
                    className="login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown} // ✅ 엔터 감지
                />
                {/* 오류 메시지 */}
                {error && <p className="error-message">{error}</p>}
                {/* 로그인 버튼 */}
                <button onClick={handleLogin} className="login-button">로그인</button>
            </div>
        </div>
    );
}