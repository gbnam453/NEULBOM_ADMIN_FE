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
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(null); // 드롭다운 메뉴 상태

    const toggleMenu = (id) => {
        setOpenMenu(openMenu === id ? null : id);
    };

    const regions = ["전체", "대전", "서산", "아산", "전라제주"];

    // 카테고리 색상 설정
    const regionColors = {
        전체: "bg-gray-500",
        대전: "bg-blue-500",
        서산: "bg-green-500",
        아산: "bg-yellow-500",
        전라제주: "bg-red-500",
    };

    useEffect(() => {
        if (!localStorage.getItem("isAdmin")) {
            navigate("/");
        }
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const res = await axios.get(API_URL);
            // ✅ 공지사항을 '내림차순' 정렬 (최신 공지가 가장 위)
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
            setRegion("전체"); // 기본값으로 초기화
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

    return (
        <div className="max-w-xl mx-auto p-6 bg-white min-h-screen">
            {/* ✅ 상단 네비게이션 바 (고정 및 중앙 정렬 적용) */}
            <div className="fixed top-0 left-0 right-0 w-full bg-white shadow-md z-50">
                <div className="max-w-xl mx-auto flex justify-center items-center p-4 relative">
                    <button onClick={() => navigate("/dashboard")} className="absolute left-4 icon-button">
                        <ArrowLeft size={24} className="text-gray-700 hover:text-gray-900 transition-all" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">공지사항</h2>
                    <button onClick={fetchNotices} className="absolute right-4 icon-button">
                        <RotateCcw size={24} className="text-gray-700 hover:text-gray-900 transition-all" />
                    </button>
                </div>
            </div>

            {/* ✅ 컨텐츠가 네비게이션에 가려지지 않도록 padding-top 추가 */}
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
                    {/* 지역 선택 드롭다운 */}
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