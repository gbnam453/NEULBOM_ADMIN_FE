import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Link2 } from "lucide-react"; // LogOut, Link2 아이콘 사용

export default function LinkAdmin() {
    const navigate = useNavigate();
    const [originalLink, setOriginalLink] = useState("");
    const [convertedLink, setConvertedLink] = useState("");
    const [copySuccess, setCopySuccess] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);

    // 로그인 여부 확인 및 logoutAt 설정 (없다면 10분 후로)
    useEffect(() => {
        if (!localStorage.getItem("isAdmin")) {
            navigate("/");
        }
        let logoutAt = localStorage.getItem("logoutAt");
        if (!logoutAt) {
            logoutAt = Date.now() + 600000; // 10분 후 (600,000ms)
            localStorage.setItem("logoutAt", logoutAt);
        }
        const initialTimeLeft = Math.floor((Number(logoutAt) - Date.now()) / 1000);
        setTimeLeft(initialTimeLeft);
    }, [navigate]);

    // 1초마다 logoutAt 값을 기준으로 타이머 업데이트 및 자동 로그아웃 처리
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
        if (window.confirm("로그아웃 하시겠습니까?")) {
            localStorage.removeItem("isAdmin");
            localStorage.removeItem("logoutAt");
            navigate("/");
        }
    };

    // mm:ss 형식으로 타이머 표시
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
        seconds
    ).padStart(2, "0")}`;

    // Google Drive 링크에서 파일 ID 추출 후 변환 URL 생성
    const handleConvert = () => {
        // 정규식으로 "/d/ID" 부분 추출
        const match = originalLink.match(/\/d\/([^/]+)/);
        if (match && match[1]) {
            const id = match[1];
            const newLink = `https://drive.usercontent.google.com/download?id=${id}&export=download`;
            setConvertedLink(newLink);
            setCopySuccess("");
        } else {
            setConvertedLink("");
            alert("유효한 Google Drive 링크를 입력하세요.");
        }
    };

    // 변환된 링크 클립보드 복사
    const handleCopy = async () => {
        if (convertedLink) {
            try {
                await navigator.clipboard.writeText(convertedLink);
                setCopySuccess("링크가 복사되었습니다!");
            } catch (err) {
                console.error("복사 실패", err);
            }
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 bg-white min-h-screen">
            {/* 상단 네비게이션 바 */}
            <div className="w-full flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">링크 변환</h1>
                <div className="flex items-center">
                    <span className="mr-2 text-gray-600">{formattedTime}</span>
                    <button onClick={handleLogout} className="p-2 rounded hover:bg-gray-100">
                        <LogOut size={24} className="text-gray-600" />
                    </button>
                </div>
            </div>

            {/* 설명 */}
            <p className="mb-4 text-gray-700">
                아래에 Google Drive 링크를 입력하세요:
            </p>

            {/* 입력 폼 */}
            <input
                type="text"
                value={originalLink}
                onChange={(e) => setOriginalLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/ID/view?usp=sharing"
                className="w-full p-2 border rounded mb-4"
            />
            <button
                onClick={handleConvert}
                className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
                변환
            </button>

            {/* 변환 결과 및 복사하기 */}
            {convertedLink && (
                <div className="w-full flex flex-col items-center">
                    <input
                        type="text"
                        value={convertedLink}
                        readOnly
                        className="w-full p-2 border rounded mb-2"
                    />
                    <button
                        onClick={handleCopy}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    >
                        복사하기
                    </button>
                    {copySuccess && (
                        <p className="mt-2 text-green-600">{copySuccess}</p>
                    )}
                </div>
            )}
        </div>
    );
}