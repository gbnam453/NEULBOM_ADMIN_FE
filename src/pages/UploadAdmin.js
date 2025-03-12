import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, MoreVertical } from "lucide-react"; // 아이콘 추가

const API_URL = "http://gbnam453.iptime.org:2401/api/uploads";

export default function UploadAdmin() {
    const [uploads, setUploads] = useState([]);
    const [title, setTitle] = useState("");
    const [detail, setDetail] = useState("");
    const [type, setType] = useState("survey"); // 기본값: 설문
    const [link, setLink] = useState("");
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(null); // 드롭다운 메뉴 상태

    const toggleMenu = (id) => {
        setOpenMenu(openMenu === id ? null : id);
    };

    const types = [
        { label: "설문", value: "survey" },
        { label: "파일", value: "file" },
    ];

    useEffect(() => {
        if (!localStorage.getItem("isAdmin")) {
            navigate("/");
        }
        fetchUploads();
    }, []);

    const fetchUploads = async () => {
        try {
            const res = await axios.get(API_URL);
            // ✅ 업로드 내역을 '내림차순' 정렬 (최신 항목이 가장 위)
            const sortedUploads = res.data.sort((a, b) => b.id - a.id);
            setUploads(sortedUploads);
        } catch (error) {
            console.error("업로드 목록 불러오기 실패:", error);
        }
    };

    const addUpload = async () => {
        if (!title || !detail || !link) return alert("제목, 설명, 링크를 입력하세요.");
        if (!window.confirm("새로운 업로드 항목을 추가하시겠습니까?")) return;

        const newUpload = { title, detail, type, link };

        try {
            await axios.post(API_URL, newUpload);
            setTitle("");
            setDetail("");
            setType("survey"); // 기본값으로 초기화
            setLink("");
            fetchUploads();
        } catch (error) {
            console.error("업로드 추가 실패:", error);
        }
    };

    const deleteUpload = async (id) => {
        if (!window.confirm("이 업로드 항목을 삭제하시겠습니까?")) return;

        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchUploads();
        } catch (error) {
            console.error("업로드 삭제 실패:", error);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 bg-white min-h-screen">
            {/* ✅ 상단 네비게이션 바 (중앙 정렬) */}
            <div className="fixed top-0 left-0 right-0 w-full bg-white shadow-md z-50">
                <div className="max-w-xl mx-auto flex justify-center items-center p-4 relative">
                    <button onClick={() => navigate("/dashboard")} className="absolute left-4 icon-button">
                        <ArrowLeft size={24} className="text-gray-700 hover:text-gray-900 transition-all" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">서류제출</h2>
                    <button onClick={fetchUploads} className="absolute right-4 icon-button">
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
                    <input
                        type="text"
                        placeholder="설명"
                        className="input"
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                    />
                    <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                        {types.map((t, index) => (
                            <option key={index} value={t.value}>
                                {t.label}
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
                    <button onClick={addUpload} className="btn-primary">
                        업로드 추가
                    </button>
                </div>

                {/* 업로드 리스트 */}
                <ul className="mt-6 space-y-3">
                    {uploads.map((upload) => (
                        <li key={upload.id} className="flex items-center bg-white p-4 rounded-lg shadow-sm relative">
                            {/* 타입 표시 (색상 적용) */}
                            <span
                                className={`px-3 py-2 text-sm text-white rounded whitespace-nowrap ${
                                    upload.type === "survey" ? "bg-blue-500" : "bg-green-500"
                                }`}
                            >
                                {upload.type === "survey" ? "설문" : "파일"}
                            </span>

                            {/* 제목 및 설명 */}
                            <div className="ml-4 flex flex-col flex-grow overflow-hidden">
                                <span className="font-semibold text-lg truncate">{upload.title}</span>
                                <span className="text-gray-500 text-sm truncate">{upload.detail}</span>
                            </div>

                            {/* 우측: 더보기 버튼 */}
                            <div className="relative">
                                <button onClick={() => toggleMenu(upload.id)} className="icon-button">
                                    <MoreVertical size={24} className="text-gray-700 hover:text-gray-900 transition-all" />
                                </button>

                                {/* 드롭다운 메뉴 */}
                                {openMenu === upload.id && (
                                    <div className="absolute right-0 mt-2 w-24 bg-white shadow-lg rounded-md py-1 z-10">
                                        <a
                                            href={upload.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            보기
                                        </a>
                                        <button
                                            onClick={() => deleteUpload(upload.id)}
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