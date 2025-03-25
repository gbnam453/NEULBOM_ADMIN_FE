import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Link2 } from "lucide-react";

export default function LinkAdmin() {
    const navigate = useNavigate();
    const [originalLink, setOriginalLink] = useState("");
    const [convertedLink, setConvertedLink] = useState("");
    const [copySuccess, setCopySuccess] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);

    // 로그인 여부 확인 및 logoutAt 설정 (없으면 10분 후)
    useEffect(() => {
        if (!localStorage.getItem("isAdmin")) {
            navigate("/");
        }
        let logoutAt = localStorage.getItem("logoutAt");
        if (!logoutAt) {
            logoutAt = Date.now() + 600000; // 10분 후
            localStorage.setItem("logoutAt", logoutAt);
        }
        const initialTimeLeft = Math.floor((Number(logoutAt) - Date.now()) / 1000);
        setTimeLeft(initialTimeLeft);
    }, [navigate]);

    // 1초마다 타이머 업데이트 및 자동 로그아웃 처리
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

    // originalLink가 변경될 때 자동으로 유효성 검사 후 변환
    useEffect(() => {
        if (originalLink) {
            // 정규식으로 "/d/ID" 부분 추출
            const match = originalLink.match(/\/d\/([^/]+)/);
            if (match && match[1]) {
                const id = match[1];
                // 바로 다운로드 되는 링크 생성 (uc?export=download 사용)
                const newLink = `https://drive.google.com/uc?export=download&id=${id}`;
                setConvertedLink(newLink);
            } else {
                setConvertedLink("");
            }
        } else {
            setConvertedLink("");
        }
    }, [originalLink]);

    // 복사 성공 메시지를 2초 후 자동 제거
    useEffect(() => {
        if (copySuccess) {
            const timer = setTimeout(() => {
                setCopySuccess("");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [copySuccess]);

    const handleCopy = async () => {
        if (convertedLink) {
            try {
                await navigator.clipboard.writeText(convertedLink);
                setCopySuccess("복사가 완료되었습니다!");
            } catch (err) {
                console.error("복사 실패", err);
            }
        }
    };

    // mm:ss 형식으로 타이머 표시
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
        seconds
    ).padStart(2, "0")}`;

    return (
        <div className="min-h-screen bg-gray-100 relative">
            {/* 헤더 */}
            <header className="fixed top-0 left-0 right-0 bg-white shadow p-4 z-50">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded"
                    >
                        <ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold">링크 변환</h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{formattedTime}</span>
                    </div>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="pt-20 px-4 pb-20">
                <p className="mb-4 text-gray-700">
                    Google Drive 파일 링크를 입력하면 바로 다운로드 가능한 링크로 변환됩니다.
                </p>
                <input
                    type="text"
                    value={originalLink}
                    onChange={(e) => setOriginalLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/ID/view?usp=sharing"
                    className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {convertedLink && (
                    <div className="w-full flex flex-col items-center">
                        <div className="w-full relative mb-2">
                            <input
                                type="text"
                                value={convertedLink}
                                readOnly
                                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Link2
                                size={20}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
                            />
                        </div>
                        <button
                            onClick={handleCopy}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors duration-300"
                        >
                            복사하기
                        </button>
                        {copySuccess && (
                            <p className="mt-2 text-green-600 transition-opacity duration-300">
                                {copySuccess}
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}