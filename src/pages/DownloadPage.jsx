import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiMeta, apiText, apiDownload, formatBytes as apiFmtBytes } from "../lib/api.js";
import { extractZipBlob } from "../lib/zip.js";
import VanishInput from "../components/ui/VanishInput.jsx";

function isValidPin(pin) {
    return /^[0-9]{4}$/.test(pin);
}

function isValidUsername(u) {
    return /^[A-Z0-9_-]{3,20}$/i.test(u);
}

export default function DownloadPage() {
    const [username, setUsername] = useState("");
    const [pin, setPin] = useState("");

    const [meta, setMeta] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const [text, setText] = useState("");
    const [zipFiles, setZipFiles] = useState([]);
    const [fullZipBlob, setFullZipBlob] = useState(null);
    const [fullZipFilename, setFullZipFilename] = useState("");
    const [unlocked, setUnlocked] = useState(false);

    function formatBytes(bytes) {
        return apiFmtBytes(bytes);
    }

    async function onLoadMeta() {
        if (!isValidUsername(username)) {
            setError("Invalid username. 3-20 characters.");
            return;
        }

        setError("");
        setMeta(null);
        setText("");
        setZipFiles([]);
        setFullZipBlob(null);
        setUnlocked(false);
        setBusy(true);

        try {
            const data = await apiMeta({ username: username.trim().toUpperCase() });
            setMeta(data);
        } catch (e) {
            setError(e.message || "Failed to load.");
        } finally {
            setBusy(false);
        }
    }

    async function onUnlock() {
        setError("");
        setText("");
        setZipFiles([]);
        setFullZipBlob(null);

        if (!isValidPin(pin)) {
            setError("PIN must be exactly 4 digits.");
            return;
        }
        if (!meta) return;

        setBusy(true);
        try {
            const cleanUser = username.trim().toUpperCase();
            if (meta.kind === "text") {
                const data = await apiText({ username: cleanUser, pin });
                setText(data.text || "");
                setUnlocked(true);
            } else {
                const { blob, filename } = await apiDownload({ username: cleanUser, pin });
                setFullZipBlob(blob);
                setFullZipFilename(filename);
                setUnlocked(true);

                if (filename === "drop.zip" || blob.type === "application/zip" || blob.type === "application/x-zip-compressed") {
                    try {
                        const extracted = await extractZipBlob(blob);
                        setZipFiles(extracted);
                    } catch (e) {
                        console.error("Failed to extract zip:", e);
                    }
                } else {
                    triggerDownload(blob, filename);
                }
            }
        } catch (e) {
            setError(e.message || "Unlock failed.");
        } finally {
            setBusy(false);
        }
    }

    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    function downloadFile(fileUrl, filename) {
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    function downloadFullZip() {
        if (fullZipBlob) {
            triggerDownload(fullZipBlob, fullZipFilename);
        }
    }

    return (
        <div className="app-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Receive Payload</h1>
                <p className="page-subtitle">Access a secure file or text drop.</p>
            </div>

            {/* Step 1: Username lookup — compact card */}
            {!meta && !unlocked && (
                <div className="card card-transparent card-compact">
                    {error && (
                        <div className="alert alert-error animate-fade-in" style={{ marginBottom: '16px' }}>
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="receive-input-row">
                        <VanishInput
                            placeholders={["Enter username", "To verify payload..."]}
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toUpperCase())}
                        />
                        <button
                            className="verify-circle-btn"
                            onClick={onLoadMeta}
                            disabled={busy || !username}
                            title="Verify"
                        >
                            {busy ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin-icon">
                                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: PIN unlock */}
            {meta && !unlocked && (
                <div className="card card-transparent animate-fade-in">
                    {error && (
                        <div className="alert alert-error animate-fade-in" style={{ marginBottom: '16px' }}>
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="result-box" style={{ marginTop: 0, marginBottom: '24px' }}>
                        <div className="result-meta">
                            <div className="meta-item">
                                <span className="meta-label">Username</span>
                                <span className="meta-value">{meta.username}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Type</span>
                                <span className="meta-value">{meta.kind.toUpperCase()}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Size</span>
                                <span className="meta-value">{formatBytes(meta.size || 0)}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Expires</span>
                                <span className="meta-value">{new Date(meta.expiresAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="receive-input-row">
                        <VanishInput
                            placeholders={["Enter 4-digit PIN", "Required to unlock"]}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            inputMode="numeric"
                            maxLength={4}
                            type="password"
                        />
                        <button
                            className="verify-circle-btn"
                            onClick={onUnlock}
                            disabled={busy || pin.length !== 4 || !meta}
                            title="Unlock"
                        >
                            {busy ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin-icon">
                                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Unlocked content */}
            {unlocked && (
                <div className="card card-transparent animate-fade-in">
                    {/* Text View */}
                    {text && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Decrypted Text</h3>
                                <button
                                    className="btn btn-secondary btn-icon btn-rounded"
                                    onClick={() => { navigator.clipboard.writeText(text); alert("Copied text!"); }}
                                >
                                    Copy Text
                                </button>
                            </div>
                            <div className="pre-block">
                                {text}
                            </div>
                        </div>
                    )}

                    {/* ZIP Files List */}
                    {zipFiles.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Decrypted Files ({zipFiles.length})</h3>
                                <button className="btn btn-primary btn-icon btn-rounded" onClick={downloadFullZip}>
                                    Download ZIP
                                </button>
                            </div>

                            <div className="file-list" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                                {zipFiles.map((file, idx) => (
                                    <div key={idx} className="file-item" style={{ border: 'none', borderBottom: idx < zipFiles.length - 1 ? '1px solid var(--border-color)' : 'none', borderRadius: 0, background: 'transparent' }}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span className="file-name">{file.name}</span>
                                            <span className="file-size">{formatBytes(file.size)}</span>
                                        </div>
                                        <button
                                            className="btn btn-secondary btn-icon"
                                            onClick={() => downloadFile(file.url, file.name)}
                                        >
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Non-ZIP download fallback */}
                    {meta?.kind === "file" && zipFiles.length === 0 && fullZipBlob && (
                        <div className="alert alert-success animate-fade-in" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ color: 'var(--success)', margin: '0 0 4px 0' }}>File Unlocked ✅</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Your file '{fullZipFilename}' is ready.</p>
                            </div>
                            <button className="btn btn-primary btn-rounded" onClick={downloadFullZip}>
                                Download
                            </button>
                        </div>
                    )}
                </div>
            )}

            {unlocked && (
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        ← Upload a new payload
                    </Link>
                </div>
            )}
        </div>
    );
}
