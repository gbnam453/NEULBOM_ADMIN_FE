import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NoticeAdmin from './pages/NoticeAdmin';
import UploadAdmin from './pages/UploadAdmin';
import DownloadAdmin from './pages/DownloadAdmin';
import LinkAdmin from './pages/LinkAdmin'; // 추가

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/notices" element={<NoticeAdmin />} />
                <Route path="/uploads" element={<UploadAdmin />} />
                <Route path="/downloads" element={<DownloadAdmin />} /> {/* 추가 */}
                <Route path="/link" element={<LinkAdmin />} />
            </Routes>
        </Router>
    );
}