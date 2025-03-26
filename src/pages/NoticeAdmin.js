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
    MoreVertical,
} from "lucide-react";

// 공지사항 API 기본 URL
const API_URL = "http://gbnam453.iptime.org:2401/api/notices";

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

export default function NoticeAdmin() {
    const [notices, setNotices] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const navigate = useNavigate();

    // 모달 상태: "add", "view", "edit" 또는 ""
    const [modalType, setModalType] = useState("");

    // 공지사항 추가 모달 상태
    const [addForm, setAddForm] = useState({
        title: "",
        content: "",
        region: "전체",
    });
    const [addFiles, setAddFiles] = useState([]);
    const addFileInputRef = useRef(null);

    // view / edit 모달에서 선택된 공지사항
    const [selectedNotice, setSelectedNotice] = useState(null);

    // 수정 모달에서 사용할 데이터
    const [editData, setEditData] = useState({
        title: "",
        content: "",
        region: "전체",
    });
    const [editFiles, setEditFiles] = useState([]);
    const editFileInputRef = useRef(null);

    // 업로드 진행률 (퍼센트)
    const [uploadProgress, setUploadProgress] = useState(0);

    // 모달에서 현재 업로드된 이미지 목록
    const [viewImages, setViewImages] = useState([]);

    // 지역 옵션
    const regions = ["전체", "대전", "서산", "아산", "전라제주"];
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
        if (!localStorage.getItem("logoutAt")) {
            localStorage.setItem("logoutAt", Date.now() + 600000);
        }
        const logoutAt = localStorage.getItem("logoutAt");
        if (logoutAt) {
            const initialTimeLeft = Math.floor((Number(logoutAt) - Date.now()) / 1000);
            setTimeLeft(initialTimeLeft);
        }
        fetchNotices();
    }, [navigate]);

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

    // 모달 타입이 "view" 또는 "edit"일 때 선택된 공지의 이미지를 불러옴
    useEffect(() => {
        if ((modalType === "view" || modalType === "edit") && selectedNotice) {
            axios
                .get(`${API_URL}/${selectedNotice.id}/images`)
                .then((res) => setViewImages(res.data))
                .catch((err) => console.error("이미지 조회 실패", err));
        }
    }, [modalType, selectedNotice]);

    const fetchNotices = async () => {
        try {
            const res = await axios.get(API_URL);
            const sortedNotices = res.data.sort((a, b) => b.id - a.id);
            setNotices(sortedNotices);
        } catch (error) {
            console.error("공지사항 목록을 불러오는데 실패했습니다.\n", error);
        }
    };

    const addNotice = async () => {
        if (!addForm.title || !addForm.content)
            return alert("제목과 내용을 입력해주세요.");
        if (!window.confirm("새로운 공지사항을 추가할까요?")) return;

        try {
            const response = await axios.post(API_URL, addForm);
            const createdNotice = response.data;
            if (addFiles.length > 0) {
                const formData = new FormData();
                for (let i = 0; i < addFiles.length; i++) {
                    formData.append("files", addFiles[i]);
                }
                await axios.post(`${API_URL}/${createdNotice.id}/images`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    },
                });
                setTimeout(() => setUploadProgress(0), 1000);
            }
            setAddForm({ title: "", content: "", region: "전체" });
            setAddFiles([]);
            closeModal();
            fetchNotices();
        } catch (error) {
            console.error("공지사항 추가 실패:", error);
        }
    };

    const handleUpdate = async () => {
        if (!editData.title || !editData.content)
            return alert("제목과 내용을 입력해주세요.");
        if (!window.confirm("공지사항을 수정할까요?")) return;

        try {
            await axios.put(`${API_URL}/${selectedNotice.id}`, editData);
            if (editFiles.length > 0) {
                const formData = new FormData();
                for (let i = 0; i < editFiles.length; i++) {
                    formData.append("files", editFiles[i]);
                }
                await axios.post(`${API_URL}/${selectedNotice.id}/images`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    },
                });
                setTimeout(() => setUploadProgress(0), 1000);
            }
            setEditData({ title: "", content: "", region: "전체" });
            setEditFiles([]);
            closeModal();
            fetchNotices();
        } catch (error) {
            console.error("공지사항 수정 실패:", error);
        }
    };

    const deleteNotice = async (id) => {
        if (!window.confirm("공지사항을 삭제할까요?")) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchNotices();
        } catch (error) {
            console.error("공지사항을 삭제하는데 실패했습니다.\n", error);
        }
    };

    // 개별 이미지 삭제 함수
    const handleDeleteImage = async (imageId) => {
        if (!window.confirm("이 이미지를 삭제하시겠습니까?")) return;
        try {
            await axios.delete(`${API_URL}/${selectedNotice.id}/images/${imageId}`);
            setViewImages(viewImages.filter(img => img.id !== imageId));
        } catch (error) {
            console.error("이미지 삭제 실패:", error);
            alert("이미지 삭제에 실패했습니다.");
        }
    };

    const openModal = (type, notice = null) => {
        setModalType(type);
        if (notice) {
            setSelectedNotice(notice);
            if (type === "edit") {
                setEditData({
                    title: notice.title,
                    content: notice.content,
                    region: notice.region,
                });
                setEditFiles([]);
            }
        }
    };

    const closeModal = () => {
        setModalType("");
        setSelectedNotice(null);
        setViewImages([]);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    return (
        <div className="min-h-screen bg-gray-100 relative">
            {/* 헤더 */}
            <header className="fixed top-0 left-0 right-0 bg-white shadow p-4 z-50">
                <div className="relative flex items-center justify-between">
                    <button onClick={() => navigate("/dashboard")} className="p-2">
                        <ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <h1 className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold">
                        공지사항
                    </h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{formattedTime}</span>
                        <button onClick={fetchNotices} className="p-2">
                            <RotateCcw size={24} className="text-gray-700" />
                        </button>
                    </div>
                </div>
            </header>

            {/* 메인 콘텐츠: 공지사항 카드 목록 */}
            <main className="pt-20 px-4 pb-20">
                {notices.length === 0 ? (
                    <p className="text-center text-gray-600">
                        등록된 공지사항이 없거나 서버와 연결할 수 없어요.
                    </p>
                ) : (
                    notices.map((notice) => (
                        <div
                            key={notice.id}
                            className="bg-white shadow rounded-lg p-4 mb-4 flex items-center"
                        >
                            <span
                                className={`px-3 py-1 text-sm text-white rounded ${
                                    notice.region === "전체"
                                        ? "bg-gray-500"
                                        : notice.region === "대전"
                                            ? "bg-blue-500"
                                            : notice.region === "서산"
                                                ? "bg-green-500"
                                                : notice.region === "아산"
                                                    ? "bg-yellow-500"
                                                    : "bg-red-500"
                                }`}
                            >
                                {notice.region}
                            </span>
                            <div className="ml-4 flex-grow">
                                <h2 className="font-bold text-lg truncate">
                                    {notice.title}
                                </h2>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => openModal("view", notice)}
                                    title="내용 확인"
                                >
                                    <Eye size={20} className="text-gray-700 hover:text-blue-500" />
                                </button>
                                <button
                                    onClick={() => openModal("edit", notice)}
                                    title="수정"
                                >
                                    <Edit2 size={20} className="text-gray-700 hover:text-blue-500" />
                                </button>
                                <button
                                    onClick={() => deleteNotice(notice.id)}
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

            {/* 오른쪽 아래 플로팅 액션 버튼: 신규 등록 모달 오픈 */}
            <button
                onClick={() => openModal("add")}
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg"
                title="공지사항 추가"
            >
                <Plus size={24} />
            </button>

            {/* 모달: 공지사항 추가 */}
            {modalType === "add" && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">공지사항 추가</h2>
                        <input
                            type="text"
                            placeholder="제목"
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
                            value={addForm.title}
                            onChange={(e) =>
                                setAddForm({ ...addForm, title: e.target.value })
                            }
                        />
                        <textarea
                            placeholder="내용"
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
                            value={addForm.content}
                            onChange={(e) =>
                                setAddForm({ ...addForm, content: e.target.value })
                            }
                        ></textarea>
                        <div className="mb-2">
                            <CustomSelect
                                options={regions}
                                value={addForm.region}
                                onChange={(value) =>
                                    setAddForm({ ...addForm, region: value })
                                }
                                placeholder="지역 선택"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-1 font-semibold">
                                이미지 업로드
                            </label>
                            <button
                                className="btn-primary"
                                onClick={() => addFileInputRef.current.click()}
                            >
                                파일 선택
                            </button>
                            <input
                                type="file"
                                multiple
                                ref={addFileInputRef}
                                className="hidden"
                                onChange={(e) =>
                                    setAddFiles([...e.target.files])
                                }
                            />
                            {addFiles.length > 0 && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {addFiles.length}개 파일 선택됨
                                </p>
                            )}
                        </div>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="mb-4">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    {uploadProgress}% 업로드중...
                                </p>
                            </div>
                        )}
                        <div className="flex space-x-2">
                            <button
                                onClick={addNotice}
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

            {/* 모달: 공지사항 내용 확인 (view) */}
            {modalType === "view" && selectedNotice && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6 overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">공지사항 정보</h2>
                        <div className="space-y-5">
                            <div>
                                <div className="text-lg font-semibold text-gray-800">제목</div>
                                <div className="text-gray-700 mt-1">
                                    {selectedNotice.title}
                                </div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-800">지역</div>
                                <div className="text-gray-700 mt-1">
                                    {selectedNotice.region}
                                </div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-800">내용</div>
                                <div className="text-gray-700 mt-1 whitespace-pre-wrap" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {selectedNotice.content}
                                </div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-800">이미지</div>
                                {viewImages.length > 0 ? (
                                    <div className="mt-2 flex space-x-2 overflow-x-auto">
                                        {viewImages.map((img, index) => (
                                            <div key={img.id} className="relative">
                                                <img
                                                    src={img.imageUrl}
                                                    alt={`공지사항 ${index + 1}`}
                                                    className="w-24 h-24 object-cover cursor-pointer rounded"
                                                    onClick={() =>
                                                        window.open(img.imageUrl, "_blank")
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-700 mt-1">없음</div>
                                )}
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

            {/* 모달: 공지사항 수정 (edit) */}
            {modalType === "edit" && selectedNotice && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6 overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">공지사항 수정</h2>
                        <input
                            type="text"
                            placeholder="제목"
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
                            value={editData.title}
                            onChange={(e) =>
                                setEditData({ ...editData, title: e.target.value })
                            }
                        />
                        <textarea
                            placeholder="내용"
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
                            value={editData.content}
                            onChange={(e) =>
                                setEditData({ ...editData, content: e.target.value })
                            }
                        ></textarea>
                        <div className="mb-2">
                            <CustomSelect
                                options={regions}
                                value={editData.region}
                                onChange={(value) =>
                                    setEditData({ ...editData, region: value })
                                }
                                placeholder="지역 선택"
                            />
                        </div>
                        {/* 현재 업로드된 이미지들 (삭제 가능 및 추가 버튼 포함) */}
                        <div className="mb-4">
                            <div className="text-lg font-semibold text-gray-800 mb-1">현재 이미지</div>
                            <div className="flex space-x-2 overflow-x-auto">
                                {viewImages.length > 0 &&
                                    viewImages.map((img, index) => (
                                        <div key={img.id} className="relative">
                                            <img
                                                src={img.imageUrl}
                                                alt={`공지사항 ${index + 1}`}
                                                className="w-24 h-24 object-cover cursor-pointer rounded"
                                            />
                                            <button
                                                onClick={() => handleDeleteImage(img.id)}
                                                className="absolute top-0 right-0 bg-red-600 text-white text-xs flex items-center justify-center w-6 h-6 rounded-full"
                                            >
                                                X
                                            </button>
                                        </div>
                                    ))
                                }
                                {/* 추가 이미지 업로드를 위한 + 버튼 */}
                                <div
                                    className="relative flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-400 rounded flex items-center justify-center cursor-pointer"
                                    onClick={() => editFileInputRef.current.click()}
                                >
                                    <Plus size={24} className="text-gray-400" />
                                </div>
                            </div>
                        </div>
                        {/* 추가 이미지 업로드 */}
                        <div className="mb-4">
                            <input
                                type="file"
                                multiple
                                ref={editFileInputRef}
                                className="hidden"
                                onChange={(e) => setEditFiles([...e.target.files])}
                            />
                            {editFiles.length > 0 && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {editFiles.length}개 파일 선택됨
                                </p>
                            )}
                        </div>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="mb-4">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    {uploadProgress}% 업로드중...
                                </p>
                            </div>
                        )}
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