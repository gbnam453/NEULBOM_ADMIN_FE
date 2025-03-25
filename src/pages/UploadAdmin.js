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

const API_URL = "http://gbnam453.iptime.org:2401/api/uploads";

// CustomSelect: OS에 상관없이 동일한 UI의 드롭다운 메뉴 제공
function CustomSelect({ options, value, onChange, placeholder }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
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
                <span>{value ? value.label : placeholder}</span>
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
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function UploadAdmin() {
    const [uploads, setUploads] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const navigate = useNavigate();

    // 모달 상태: "add", "view", "edit" 또는 ""
    const [modalType, setModalType] = useState("");
    // 신규 등록 모달 상태
    const [addForm, setAddForm] = useState({
        title: "",
        detail: "",
        type: { label: "설문", value: "survey" },
        link: "",
    });
    // view / edit 모달에서 선택된 업로드 항목
    const [selectedUpload, setSelectedUpload] = useState(null);
    // 수정 모달에서 사용할 데이터
    const [editData, setEditData] = useState({
        title: "",
        detail: "",
        type: { label: "설문", value: "survey" },
        link: "",
    });

    // 유형 옵션
    const typeOptions = [
        { label: "설문", value: "survey" },
        { label: "파일", value: "file" },
    ];

    // 초기 인증 체크 및 타이머, 업로드 목록 불러오기
    useEffect(() => {
        if (!localStorage.getItem("isAdmin")) {
            navigate("/");
        }
        if (!localStorage.getItem("logoutAt")) {
            localStorage.setItem("logoutAt", Date.now() + 600000);
        }
        const logoutAt = localStorage.getItem("logoutAt");
        if (logoutAt) {
            const initialTimeLeft = Math.floor(
                (Number(logoutAt) - Date.now()) / 1000
            );
            setTimeLeft(initialTimeLeft);
        }
        fetchUploads();
    }, [navigate]);

    // 타이머 업데이트 및 자동 로그아웃
    useEffect(() => {
        const intervalId = setInterval(() => {
            const logoutAt = localStorage.getItem("logoutAt");
            if (logoutAt) {
                const remaining = Math.floor(
                    (Number(logoutAt) - Date.now()) / 1000
                );
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

    // 업로드 목록 불러오기 (최신순 정렬)
    const fetchUploads = async () => {
        try {
            const res = await axios.get(API_URL);
            const sortedUploads = res.data.sort((a, b) => b.id - a.id);
            setUploads(sortedUploads);
        } catch (error) {
            console.error("업로드 목록 불러오기 실패:", error);
        }
    };

    // 신규 업로드 항목 등록
    const addUpload = async () => {
        if (!addForm.title || !addForm.detail || !addForm.link)
            return alert("제목, 설명, 링크를 입력해주세요.");
        if (!window.confirm("새로운 서류를 추가할까요?")) return;
        const newUpload = {
            title: addForm.title,
            detail: addForm.detail,
            type: addForm.type.value,
            link: addForm.link,
        };
        try {
            await axios.post(API_URL, newUpload);
            setAddForm({
                title: "",
                detail: "",
                type: { label: "설문", value: "survey" },
                link: "",
            });
            closeModal();
            fetchUploads();
        } catch (error) {
            console.error("업로드 추가 실패:", error);
        }
    };

    // 업로드 항목 수정
    const handleUpdate = async () => {
        if (!editData.title || !editData.detail || !editData.link)
            return alert("제목, 설명, 링크를 입력하세요.");
        if (!window.confirm("서류를 수정할까요?")) return;
        const updatedUpload = {
            title: editData.title,
            detail: editData.detail,
            type: editData.type.value,
            link: editData.link,
        };
        try {
            await axios.put(`${API_URL}/${selectedUpload.id}`, updatedUpload);
            closeModal();
            fetchUploads();
        } catch (error) {
            console.error("업로드 수정 실패:", error);
        }
    };

    // 업로드 항목 삭제
    const deleteUpload = async (id) => {
        if (!window.confirm("서류를 삭제할까요?")) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchUploads();
        } catch (error) {
            console.error("업로드 삭제 실패:", error);
        }
    };

    // 모달 열기: type이 "add", "view", "edit" 중 하나를 사용
    const openModal = (type, upload = null) => {
        setModalType(type);
        if (upload) {
            setSelectedUpload(upload);
            if (type === "edit") {
                setEditData({
                    title: upload.title,
                    detail: upload.detail,
                    type:
                        typeOptions.find((opt) => opt.value === upload.type) || {
                            label: "설문",
                            value: "survey",
                        },
                    link: upload.link,
                });
            }
        }
    };

    const closeModal = () => {
        setModalType("");
        setSelectedUpload(null);
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
                        <ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <h1 className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold">
                        서류제출
                    </h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{formattedTime}</span>
                        <button onClick={fetchUploads} className="p-2">
                            <RotateCcw size={24} className="text-gray-700" />
                        </button>
                    </div>
                </div>
            </header>

            {/* 메인 콘텐츠: 업로드 카드 목록 */}
            <main className="pt-20 px-4 pb-20">
                {uploads.length === 0 ? (
                    <p className="text-center text-gray-600">
                        등록된 서류가 없거나 서버와 연결할 수 없어요.
                    </p>
                ) : (
                    uploads.map((upload) => (
                        <div
                            key={upload.id}
                            className="bg-white shadow rounded-lg p-4 mb-4 flex items-center"
                        >
              <span
                  className={`px-3 py-1 text-sm text-white rounded ${
                      upload.type === "survey" ? "bg-blue-500" : "bg-green-500"
                  }`}
              >
                {upload.type === "survey" ? "설문" : "파일"}
              </span>
                            <div className="ml-4 flex-grow">
                                <h2 className="font-bold text-lg">{upload.title}</h2>
                                <p className="text-gray-500 text-sm">{upload.detail}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => openModal("view", upload)}
                                    title="내용확인"
                                >
                                    <Eye
                                        size={20}
                                        className="text-gray-700 hover:text-blue-500"
                                    />
                                </button>
                                <button
                                    onClick={() => openModal("edit", upload)}
                                    title="수정"
                                >
                                    <Edit2
                                        size={20}
                                        className="text-gray-700 hover:text-blue-500"
                                    />
                                </button>
                                <button
                                    onClick={() => deleteUpload(upload.id)}
                                    title="삭제"
                                >
                                    <Trash
                                        size={20}
                                        className="text-red-600 hover:text-red-800"
                                    />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* 오른쪽 아래 플로팅 버튼: 신규 등록 모달 오픈 */}
            <button
                onClick={() => openModal("add")}
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg"
                title="새 항목 추가"
            >
                <Plus size={24} />
            </button>

            {/* 신규 등록 모달 */}
            {modalType === "add" && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">서류 추가</h2>
                        <input
                            type="text"
                            placeholder="제목"
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
                            value={addForm.title}
                            onChange={(e) =>
                                setAddForm({ ...addForm, title: e.target.value })
                            }
                        />
                        <input
                            type="text"
                            placeholder="설명"
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
                            value={addForm.detail}
                            onChange={(e) =>
                                setAddForm({ ...addForm, detail: e.target.value })
                            }
                        />
                        <div className="mb-2">
                            <CustomSelect
                                options={typeOptions}
                                value={addForm.type}
                                onChange={(option) =>
                                    setAddForm({ ...addForm, type: option })
                                }
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
                                onClick={addUpload}
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

            {/* 내용확인 모달 */}
            {modalType === "view" && selectedUpload && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
                        <h2 className="text-2xl font-bold mb-6">서류 정보</h2>
                        <div className="space-y-5">
                            <div>
                                <div className="text-lg font-semibold text-gray-800">
                                    제목
                                </div>
                                <div className="text-gray-700 mt-1">
                                    {selectedUpload.title}
                                </div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-800">
                                    설명
                                </div>
                                <div className="text-gray-700 mt-1">
                                    {selectedUpload.detail}
                                </div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-800">
                                    유형
                                </div>
                                <div className="text-gray-700 mt-1">
                                    {selectedUpload.type === "survey" ? "설문" : "파일"}
                                </div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-800">
                                    링크
                                </div>
                                <div className="text-blue-500 mt-1 break-all">
                                    <a
                                        href={selectedUpload.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {selectedUpload.link}
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

            {/* 수정 모달 */}
            {modalType === "edit" && selectedUpload && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">서류 수정</h2>
                        <input
                            type="text"
                            placeholder="제목"
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
                            value={editData.title}
                            onChange={(e) =>
                                setEditData({ ...editData, title: e.target.value })
                            }
                        />
                        <input
                            type="text"
                            placeholder="설명"
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
                            value={editData.detail}
                            onChange={(e) =>
                                setEditData({ ...editData, detail: e.target.value })
                            }
                        />
                        <div className="mb-2">
                            <CustomSelect
                                options={typeOptions}
                                value={editData.type}
                                onChange={(option) =>
                                    setEditData({ ...editData, type: option })
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