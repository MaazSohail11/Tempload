import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiMeta, apiText, apiDownload, formatBytes as apiFmtBytes } from "../lib/api.js";
import { extractZipBlob } from "../lib/zip.js";

function isValidPin(pin) {
    return /^[0-9]{4}$/.test(pin);
}

export default function SharePage() {
    const params = useParams();
    const username = params.username || "";

    const [meta, setMeta] = useState(null);
    const [pin, setPin] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    // Extracted content state
    const [text, setText] = useState("");
    const [zipFiles, setZipFiles] = useState([]);
    const [fullZipBlob, setFullZipBlob] = useState(null);
    const [fullZipFilename, setFullZipFilename] = useState("");
    const [unlocked, setUnlocked] = useState(false);

    // Clean up object URLs when component unmounts to prevent memory leaks
    useEffect(() => {
        return () => {
            zipFiles.forEach(f => {
                if (f.url) URL.revokeObjectURL(f.url);
            });
        };
    }, [zipFiles]);

    useEffect(() => {
        async function load() {
            if (!username) return;
            setError("");
            setMeta(null);
            setText("");
            setZipFiles([]);
            setFullZipBlob(null);
            setUnlocked(false);
            try {
                const data = await apiMeta({ username });
                setMeta(data);
            } catch (e) {
                setError(e.message || "Failed to load.");
            }
        }
        load();
    }, [username]);

    // Format bytes to a human readable string
    function formatBytes(bytes) {
        return apiFmtBytes(bytes);
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
            if (meta.kind === "text") {
                const data = await apiText({ username, pin });
                setText(data.text || "");
                setUnlocked(true);
            } else {
                const { blob, filename } = await apiDownload({ username, pin });

                // Store the full zip for the "Download All" option
                setFullZipBlob(blob);
                setFullZipFilename(filename);
                setUnlocked(true);

                // Detect ZIP by filename extension — blob.type is unreliable
                // across browsers when reading from fetch responses.
                const lowerFilename = filename.toLowerCase();
                const isZip = lowerFilename.endsWith(".zip");

                if (isZip) {
                    try {
                        const extracted = await extractZipBlob(blob);
                        if (extracted.length > 0) {
                            setZipFiles(extracted);
                        } else {
                            // ZIP was empty or only directories — offer direct download
                            triggerDownload(blob, filename);
                        }
                    } catch (e) {
                        console.error("Failed to extract zip:", e);
                        // Fall back to offering the full zip download
                    }
                } else {
                    // For non-zip files, trigger direct download
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

        // Revoke after a short delay to ensure works in all browsers
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

    if (!username) {
        return <div className="app-container"><p>No username provided.</p></div>;
    }

    return (
        <div className="app-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Unlock Payload</h1>
                <p className="page-subtitle">Secure drop for <strong>{username}</strong></p>
            </div>

            <div className="card">
                {error && (
                    <div className="alert alert-error animate-fade-in" style={{ marginBottom: '24px' }}>
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {!meta && !error ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="pulse" style={{ width: '40px', height: '40px', margin: '0 auto', border: '3px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Verifying payload...</p>
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : meta && !unlocked ? (
                    <div className="animate-fade-in">
                        <div className="result-box" style={{ marginTop: 0, marginBottom: '24px' }}>
                            <div className="result-meta">
                                <div className="meta-item">
                                    <span className="meta-label">Filename</span>
                                    <span className="meta-value">{meta.filename}</span>
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

                        <div className="form-group" style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <label className="form-label">Security PIN</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    className="form-control"
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="Enter 4-digit PIN"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                    disabled={busy}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={onUnlock}
                                    disabled={busy || pin.length !== 4}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    {busy ? "Decrypting..." : "Unlock"}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Text View */}
                {unlocked && text && (
                    <div className="animate-fade-in" style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Decrypted Text</h3>
                            <button
                                className="btn btn-secondary btn-icon"
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

                {/* ZIP Files List View */}
                {unlocked && zipFiles.length > 0 && (
                    <div className="animate-fade-in" style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Decrypted Files ({zipFiles.length})</h3>
                            <button className="btn btn-primary btn-icon" onClick={downloadFullZip}>
                                Download ZIP Archive
                            </button>
                        </div>

                        <div className="file-list" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', overflow: 'hidden' }}>
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

                {/* Non-ZIP file download fallback */}
                {unlocked && meta?.kind === "file" && zipFiles.length === 0 && fullZipBlob && (
                    <div className="alert alert-success animate-fade-in" style={{ marginTop: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ color: 'var(--success)', margin: '0 0 4px 0' }}>File Unlocked ✅</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Your file '{fullZipFilename}' is ready.</p>
                        </div>
                        <button className="btn btn-primary" onClick={downloadFullZip}>
                            Download File
                        </button>
                    </div>
                )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    ← Upload a new payload
                </Link>
            </div>
        </div>
    );
}
