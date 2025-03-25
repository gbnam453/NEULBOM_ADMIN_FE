import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    RotateCcw,
    Eye,
    Edit2,
    Trash,
    Plus,
    ChevronDown,
} from "lucide-react";

const API_URL = "http://gbnam453.iptime.org:2401/api/downloads";

// CustomSelect 컴포넌트: native select 대신 사용 (어느 OS에서나 동일한 UI 제공)
function CustomSelect({ options, value, onChange, placeholder }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // 컴포넌트 외부 클릭 시 닫히도록 처리
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        onChange(option);
        setOpen(false);
    };

    return (
        <div className="relative w-full" ref={ref}>
            <button
                type="button"
                className="border border-gray-300 rounded px-3 py-2 w-full text-left flex items-center justify-between"
                onClick={() => setOpen(!open)}
            >
                <span>{value || placeholder}</span>
                <ChevronDown size={20} className="text-gray-600" />
            </button>
            {open && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow z-10">
                    {options.map((option, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelect(option)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DownloadAdmin() {
    const [downloads, setDownloads] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const navigate = useNavigate();

    // 모달 상태: "add", "view", "edit" 또는 ""
    const [modalType, setModalType] = useState("");
    // add 모달에서 사용할 상태
    const [addForm, setAddForm] = useState({
        title: "",
        region: "대전",
        category: "공통",
        type: "교안",
        link: "",
    });
    // view / edit 모달에서 선택된 다운로드 항목
    const [selectedDownload, setSelectedDownload] = useState(null);
    // edit 모달에서 수정할 데이터
    const [editData, setEditData] = useState({
        title: "",
        region: "대전",
        category: "공통",
        type: "교안",
        link: "",
    });

    // 옵션 목록
    const regionsOptions = ["대전", "서산", "아산", "전라제주"];
    const categories = ["공통", "기후환경", "문화예술", "사회정서", "창의과학", "체육"];
    const types = ["교안", "활동지", "영상"];

    // 초기 로딩 및 인증 체크
    useEffect(() => {
        if (!localStorage.getItem("isAdmin")) {
            navigate("/");
        }
        if (!localStorage.getItem("logoutAt")) {
            localStorage.setItem("logoutAt", Date.now() + 600000);
        }
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

    // 다운로드 목록 불러오기 (최신순 정렬)
    const fetchDownloads = async () => {
        try {
            const res = await axios.get(API_URL);
            const sortedDownloads = res.data.sort((a, b) => b.id - a.id);
            setDownloads(sortedDownloads);
        } catch (error) {
            console.error("다운로드 목록 불러오기 실패:", error);
        }
    };

    // 새 항목 등록
    const addDownload = async () => {
        if (!addForm.title || !addForm.link) return alert("제목과 링크를 입력해주세요.");
        if (!window.confirm("새로운 수업자료를 추가할까요?")) return;

        try {
            await axios.post(API_URL, addForm);
            setAddForm({
                title: "",
                region: "대전",
                category: "공통",
                type: "교안",
                link: "",
            });
            closeModal();
            fetchDownloads();
        } catch (error) {
            console.error("다운로드 추가 실패:", error);
        }
    };

    // 항목 수정
    const handleUpdate = async () => {
        if (!editData.title || !editData.link) return alert("제목과 링크를 입력해주세요.");
        if (!window.confirm("수업자료를 수정할까요?")) return;

        try {
            await axios.put(`${API_URL}/${selectedDownload.id}`, editData);
            closeModal();
            fetchDownloads();
        } catch (error) {
            console.error("다운로드 수정 실패:", error);
        }
    };

    // 항목 삭제
    const deleteDownload = async (id) => {
        if (!window.confirm("수업자료를 삭제할까요?")) return;

        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchDownloads();
        } catch (error) {
            console.error("다운로드 삭제 실패:", error);
        }
    };

    // 모달 열기/닫기
    const openModal = (type, download = null) => {
        setModalType(type);
        if (download) {
            setSelectedDownload(download);
            if (type === "edit") {
                setEditData({
                    title: download.title,
                    region: download.region,
                    category: download.category,
                    type: download.type,
                    link: download.link,
                });
            }
        }
    };

    const closeModal = () => {
        setModalType("");
        setSelectedDownload(null);
    };

    // 남은 시간을 mm:ss 형식으로 변환
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
        seconds
    ).padStart(2, "0")}`;

    return (
        <div className="min-h-screen bg-gray-100 relative">
            {/* 헤더 */}
            <header className="fixed top-0 left-0 right-0 bg-white shadow p-4 z-50">
                <div className="relative flex items-center justify-between">
                    <button onClick={() => navigate("/dashboard")} className="p-2">
                        <ArrowLeft size={24} className="text-gray-700"/>
                    </button>
                    <h1 className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold">
                        수업자료
                    </h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{formattedTime}</span>
                        <button onClick={fetchDownloads} className="p-2">
                            <RotateCcw size={24} className="text-gray-700"/>
                        </button>
                    </div>
                </div>
            </header>

            {/* 메인 콘텐츠: 다운로드 카드 목록 */}
            <main className="pt-20 px-4 pb-20">
                {downloads.length === 0 ? (
                    <p className="text-center text-gray-600">등록된 수업자료가 없거나 서버와 연결할 수 없어요.</p>
                ) : (
                    downloads.map((download) => (
                        <div
                            key={download.id}
                            className="bg-white shadow rounded-lg p-4 mb-4 flex items-center"
                        >
              <span
                  className={`px-3 py-1 text-sm text-white rounded ${
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
                            <div className="ml-4 flex-grow">
                                <h2 className="font-bold text-lg">{download.title}</h2>
                                <p className="text-gray-500 text-sm">
                                    {download.category} | {download.type}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button onClick={() => openModal("view", download)} title="내용확인">
                                    <Eye size={20} className="text-gray-700 hover:text-blue-500" />
                                </button>
                                <button onClick={() => openModal("edit", download)} title="수정">
                                    <Edit2 size={20} className="text-gray-700 hover:text-blue-500" />
                                </button>
                                <button onClick={() => deleteDownload(download.id)} title="삭제">
                                    <Trash size={20} className="text-red-600 hover:text-red-800" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* 오른쪽 아래 플로팅 액션 버튼: 신규 등록 모달 오픈 */}
            <button
                onClick={() => openModal("add")}
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg"
                title="수업자료 추가"
            >
                <Plus size={24} />
            </button>

            {/* 모달: 신규 항목 추가 */}
            {modalType === "add" && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">수업자료 추가</h2>
                        <input
                            type="text"
                            placeholder="제목"
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
                            value={addForm.title}
                            onChange={(e) =>
                                setAddForm({ ...addForm, title: e.target.value })
                            }
                        />
                        <div className="mb-2">
                            <CustomSelect
                                options={regionsOptions}
                                value={addForm.region}
                                onChange={(value) =>
                                    setAddForm({ ...addForm, region: value })
                                }
                                placeholder="지역 선택"
                            />
                        </div>
                        <div className="mb-2">
                            <CustomSelect
                                options={categories}
                                value={addForm.category}
                                onChange={(value) =>
                                    setAddForm({ ...addForm, category: value })
                                }
                                placeholder="카테고리 선택"
                            />
                        </div>
                        <div className="mb-2">
                            <CustomSelect
                                options={types}
                                value={addForm.type}
                                onChange={(value) => setAddForm({ ...addForm, type: value })}
                                placeholder="유형 선택"
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="링크 (URL)"
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
                            value={addForm.link}
                            onChange={(e) =>
                                setAddForm({ ...addForm, link: e.target.value })
                            }
                        />
                        <div className="flex space-x-2">
                            <button
                                onClick={addDownload}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 flex-1"
                            >
                                등록
                            </button>
                            <button
                                onClick={closeModal}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded px-4 py-2 flex-1"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalType === "view" && selectedDownload && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
                        <h2 className="text-2xl font-bold mb-6">수업자료 정보</h2>
                        <div className="space-y-5">
                            <div>
                                <div className="text-lg font-semibold text-gray-800">제목</div>
                                <div className="text-gray-700 mt-1">{selectedDownload.title}</div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-800">지역</div>
                                <div className="text-gray-700 mt-1">{selectedDownload.region}</div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-800">카테고리</div>
                                <div className="text-gray-700 mt-1">{selectedDownload.category}</div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-800">유형</div>
                                <div className="text-gray-700 mt-1">{selectedDownload.type}</div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-800">링크</div>
                                <div className="text-blue-500 mt-1 break-all">
                                    <a
                                        href={selectedDownload.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {selectedDownload.link}
                                    </a>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={closeModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 w-full mt-8"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {/* 모달: 항목 수정 */}
            {modalType === "edit" && selectedDownload && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">수업자료 수정</h2>
                        <input
                            type="text"
                            placeholder="제목"
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
                            value={editData.title}
                            onChange={(e) =>
                                setEditData({ ...editData, title: e.target.value })
                            }
                        />
                        <div className="mb-2">
                            <CustomSelect
                                options={regionsOptions}
                                value={editData.region}
                                onChange={(value) =>
                                    setEditData({ ...editData, region: value })
                                }
                                placeholder="지역 선택"
                            />
                        </div>
                        <div className="mb-2">
                            <CustomSelect
                                options={categories}
                                value={editData.category}
                                onChange={(value) =>
                                    setEditData({ ...editData, category: value })
                                }
                                placeholder="카테고리 선택"
                            />
                        </div>
                        <div className="mb-2">
                            <CustomSelect
                                options={types}
                                value={editData.type}
                                onChange={(value) =>
                                    setEditData({ ...editData, type: value })
                                }
                                placeholder="유형 선택"
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="링크 (URL)"
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
                            value={editData.link}
                            onChange={(e) =>
                                setEditData({ ...editData, link: e.target.value })
                            }
                        />
                        <div className="flex space-x-2">
                            <button
                                onClick={handleUpdate}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 flex-1"
                            >
                                저장
                            </button>
                            <button
                                onClick={closeModal}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded px-4 py-2 flex-1"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}