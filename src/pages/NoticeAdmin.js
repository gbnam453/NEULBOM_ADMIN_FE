import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, MoreVertical } from "lucide-react"; // 아이콘 추가

const API_URL = "http://gbnam453.iptime.org:2401/api/notices";

export default function NoticeAdmin() {
    const [notices, setNotices] = useState([]);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [region, setRegion] = useState("전체");
    const [openMenu, setOpenMenu] = useState(null); // 드롭다운 메뉴 상태
    const [timeLeft, setTimeLeft] = useState(0); // 초기값 0
    const navigate = useNavigate();

    const regions = ["전체", "대전", "서산", "아산", "전라제주"];

    // 카테고리 색상 설정
    const regionColors = {
        전체: "bg-gray-500",
        대전: "bg-blue-500",
        서산: "bg-green-500",
        아산: "bg-yellow-500",
        전라제주: "bg-red-500",
    };

    // 로그인 여부 확인 및 logoutAt 설정, 그리고 즉시 초기 타이머 계산
    useEffect(() => {
        if (!localStorage.getItem("isAdmin")) {
            navigate("/");
        }
        let logoutAt = localStorage.getItem("logoutAt");
        if (!logoutAt) {
            logoutAt = Date.now() + 600000; // 10분 후
            localStorage.setItem("logoutAt", logoutAt);
        }
        // 초기 남은 시간 즉시 계산 후 state 업데이트
        const initialTimeLeft = Math.floor((Number(logoutAt) - Date.now()) / 1000);
        setTimeLeft(initialTimeLeft);
        fetchNotices();
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

    const fetchNotices = async () => {
        try {
            const res = await axios.get(API_URL);
            // 최신 공지가 위에 오도록 내림차순 정렬
            const sortedNotices = res.data.sort((a, b) => b.id - a.id);
            setNotices(sortedNotices);
        } catch (error) {
            console.error("공지사항 목록 불러오기 실패:", error);
        }
    };

    const addNotice = async () => {
        if (!title || !content) return alert("제목과 내용을 입력하세요.");
        if (!window.confirm("공지사항을 추가하시겠습니까?")) return;

        const newNotice = { title, content, region };

        try {
            await axios.post(API_URL, newNotice);
            setTitle("");
            setContent("");
            setRegion("전체");
            fetchNotices();
        } catch (error) {
            console.error("공지 추가 실패:", error);
        }
    };

    const deleteNotice = async (id) => {
        if (!window.confirm("공지사항을 삭제하시겠습니까?")) return;

        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchNotices();
        } catch (error) {
            console.error("공지 삭제 실패:", error);
        }
    };

    const toggleMenu = (id) => {
        setOpenMenu(openMenu === id ? null : id);
    };

    // mm:ss 형식으로 남은 시간 표시
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    return (
        <div className="max-w-xl mx-auto p-6 bg-white min-h-screen">
            {/* 상단 네비게이션 바 (고정 및 중앙 정렬) */}
            <div className="fixed top-0 left-0 right-0 w-full bg-white shadow-md z-50">
                <div className="max-w-xl mx-auto flex justify-between items-center p-4">
                    <button onClick={() => navigate("/dashboard")} className="icon-button">
                        <ArrowLeft size={24} className="text-gray-700 hover:text-gray-900 transition-all" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h2 className="text-xl font-bold text-gray-900">공지사항</h2>
                        <span className="text-sm text-gray-600">{formattedTime}</span>
                    </div>
                    <button onClick={fetchNotices} className="icon-button">
                        <RotateCcw size={24} className="text-gray-700 hover:text-gray-900 transition-all" />
                    </button>
                </div>
            </div>

            {/* 네비게이션 영역이 가리지 않도록 padding-top 추가 */}
            <div className="pt-20">
                {/* 입력 폼 */}
                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="제목"
                        className="input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <textarea
                        placeholder="내용"
                        className="input"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    ></textarea>
                    <select className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
                        {regions.map((r, index) => (
                            <option key={index} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                    <button onClick={addNotice} className="btn-primary">
                        공지 추가
                    </button>
                </div>

                {/* 공지사항 리스트 */}
                <ul className="mt-6 space-y-3">
                    {notices.map((notice) => (
                        <li key={notice.id} className="flex items-center bg-white p-4 rounded-lg shadow-sm relative">
                            {/* 지역 표시 (색상 적용) */}
                            <span
                                className={`px-3 py-2 text-sm text-white rounded whitespace-nowrap ${
                                    regionColors[notice.region]
                                }`}
                            >
                                {notice.region}
                            </span>

                            {/* 제목 및 내용 */}
                            <div className="ml-4 flex flex-col flex-grow overflow-hidden">
                                <span className="font-semibold text-lg truncate">{notice.title}</span>
                                <span className="text-gray-500 text-sm truncate">{notice.content}</span>
                            </div>

                            {/* 우측: 더보기 버튼 */}
                            <div className="relative">
                                <button onClick={() => toggleMenu(notice.id)} className="icon-button">
                                    <MoreVertical size={24} className="text-gray-700 hover:text-gray-900 transition-all" />
                                </button>

                                {/* 드롭다운 메뉴 */}
                                {openMenu === notice.id && (
                                    <div className="absolute right-0 mt-2 w-24 bg-white shadow-lg rounded-md py-1 z-10">
                                        <button
                                            onClick={() => alert(`공지사항 내용: ${notice.content}`)}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            보기
                                        </button>
                                        <button
                                            onClick={() => deleteNotice(notice.id)}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}