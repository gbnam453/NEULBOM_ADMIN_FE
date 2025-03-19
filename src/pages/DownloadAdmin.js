import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, MoreVertical } from "lucide-react"; // 아이콘 추가

const API_URL = "http://gbnam453.iptime.org:2401/api/downloads";

export default function DownloadAdmin() {
    const [downloads, setDownloads] = useState([]);
    const [title, setTitle] = useState("");
    const [region, setRegion] = useState("대전");
    const [category, setCategory] = useState("공통");
    const [type, setType] = useState("교안");
    const [link, setLink] = useState("");
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(null); // 드롭다운 메뉴 상태
    const [timeLeft, setTimeLeft] = useState(0); // 초기값

    const toggleMenu = (id) => {
        setOpenMenu(openMenu === id ? null : id);
    };

    // 선택 가능한 옵션 목록
    const regionsOptions = ["대전", "서산", "아산", "전라제주"];
    const categories = ["공통", "기후환경", "문화예술", "사회정서", "창의과학", "체육"];
    const types = ["교안", "활동지", "영상"];

    useEffect(() => {
        if (!localStorage.getItem("isAdmin")) {
            navigate("/");
        }
        // logoutAt가 설정되어 있지 않으면 10분 후로 설정
        if (!localStorage.getItem("logoutAt")) {
            localStorage.setItem("logoutAt", Date.now() + 600000);
        }
        // 즉시 남은 시간 계산 후 state 업데이트
        const logoutAt = localStorage.getItem("logoutAt");
        if (logoutAt) {
            const initialTimeLeft = Math.floor((Number(logoutAt) - Date.now()) / 1000);
            setTimeLeft(initialTimeLeft);
        }
        fetchDownloads();
    }, [navigate]);

    // 타이머 업데이트 및 자동 로그아웃
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

    const fetchDownloads = async () => {
        try {
            const res = await axios.get(API_URL);
            // 다운로드 내역을 내림차순 정렬 (최신 항목이 위)
            const sortedDownloads = res.data.sort((a, b) => b.id - a.id);
            setDownloads(sortedDownloads);
        } catch (error) {
            console.error("다운로드 목록 불러오기 실패:", error);
        }
    };

    const addDownload = async () => {
        if (!title || !link) return alert("제목과 링크를 입력하세요.");
        if (!window.confirm("새로운 다운로드 항목을 추가하시겠습니까?")) return;

        const newDownload = { title, region, category, type, link };

        try {
            await axios.post(API_URL, newDownload);
            setTitle("");
            setRegion("대전");
            setCategory("공통");
            setType("교안");
            setLink("");
            fetchDownloads();
        } catch (error) {
            console.error("다운로드 추가 실패:", error);
        }
    };

    const deleteDownload = async (id) => {
        if (!window.confirm("이 다운로드 항목을 삭제하시겠습니까?")) return;

        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchDownloads();
        } catch (error) {
            console.error("다운로드 삭제 실패:", error);
        }
    };

    // 남은 시간을 mm:ss 형식으로 변환
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
        seconds
    ).padStart(2, "0")}`;

    return (
        <div className="max-w-xl mx-auto p-6 bg-gray-50 min-h-screen">
            {/* 상단 네비게이션 바 (중앙 정렬) */}
            <div className="fixed top-0 left-0 right-0 w-full bg-white shadow-md z-50">
                <div className="max-w-xl mx-auto flex flex-col justify-center items-center p-4 relative">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="absolute left-4 icon-button"
                    >
                        <ArrowLeft
                            size={24}
                            className="text-gray-700 hover:text-gray-900 transition-all"
                        />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">수업자료</h2>
                    {/* 타이머 표시 */}
                    <span className="text-sm text-gray-600">{formattedTime}</span>
                    <button
                        onClick={fetchDownloads}
                        className="absolute right-4 icon-button"
                    >
                        <RotateCcw
                            size={24}
                            className="text-gray-700 hover:text-gray-900 transition-all"
                        />
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
                    <select
                        className="input"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                    >
                        {regionsOptions.map((r, index) => (
                            <option key={index} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                    <select
                        className="input"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        {categories.map((c, index) => (
                            <option key={index} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    <select
                        className="input"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        {types.map((t, index) => (
                            <option key={index} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="링크 (URL)"
                        className="input"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                    />
                    <button onClick={addDownload} className="btn-primary">
                        다운로드 추가
                    </button>
                </div>

                {/* 다운로드 리스트 */}
                <ul className="mt-6 space-y-3">
                    {downloads.map((download) => (
                        <li
                            key={download.id}
                            className="flex items-center bg-white p-4 rounded-lg shadow-sm relative"
                        >
                            {/* 지역 표시 (색상 적용) */}
                            <span
                                className={`px-3 py-2 text-sm text-white rounded whitespace-nowrap ${
                                    download.region === "대전"
                                        ? "bg-blue-500"
                                        : download.region === "서산"
                                            ? "bg-green-500"
                                            : download.region === "아산"
                                                ? "bg-yellow-500"
                                                : "bg-red-500"
                                }`}
                            >
                {download.region}
              </span>

                            {/* 제목 및 설명 */}
                            <div className="ml-4 flex flex-col flex-grow overflow-hidden">
                <span className="font-semibold text-lg truncate">
                  {download.title}
                </span>
                                <span className="text-gray-500 text-sm truncate">
                  {download.category} | {download.type}
                </span>
                            </div>

                            {/* 우측: 더보기 버튼 */}
                            <div className="relative">
                                <button
                                    onClick={() => toggleMenu(download.id)}
                                    className="icon-button"
                                >
                                    <MoreVertical
                                        size={24}
                                        className="text-gray-700 hover:text-gray-900 transition-all"
                                    />
                                </button>

                                {/* 드롭다운 메뉴 */}
                                {openMenu === download.id && (
                                    <div className="absolute right-0 mt-2 w-24 bg-white shadow-lg rounded-md py-1 z-10">
                                        <a
                                            href={download.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            보기
                                        </a>
                                        <button
                                            onClick={() => deleteDownload(download.id)}
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