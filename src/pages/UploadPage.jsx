import React, { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { apiUploadAuto, formatBytes, UPLOAD_FAST_LIMIT, MAX_MB } from "../lib/api.js";
import { buildZipFromFiles } from "../lib/zip.js";
import FileUploadZone from "../components/ui/FileUploadZone.jsx";
import VanishInput from "../components/ui/VanishInput.jsx";
import NoiseBackground from "../components/ui/NoiseBackground.jsx";
import LogoSVG from "../components/ui/LogoSVG.jsx";

const EMAIL_MODE_OPTIONS = [
    { label: "Send link only", value: "link" },
    { label: "Send link + username", value: "credentials" },
    { label: "Send file as attachment", value: "file" },
];

function isValidPin(pin) {
    return /^[0-9]{4}$/.test(pin);
}

function isValidUsername(u) {
    return /^[A-Z0-9_-]{3,20}$/i.test(u);
}

function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default function UploadPage() {
    const [files, setFiles] = useState([]);
    const [username, setUsername] = useState("");
    const [pin, setPin] = useState("");

    // Email fields
    const [email, setEmail] = useState("");
    const [emailMode, setEmailMode] = useState("link");
    const [includePin, setIncludePin] = useState(false);
    const [showEmailSection, setShowEmailSection] = useState(false);

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");

    const totalSize = files.reduce((s, f) => s + f.size, 0);

    const canSubmit = useMemo(() => {
        if (!isValidPin(pin)) return false;
        if (!isValidUsername(username)) return false;
        if (files.length === 0) return false;
        return true;
    }, [files, pin, username]);

    async function onUpload() {
        setError("");
        setResult(null);
        setProgress(0);
        setStatusText("");

        if (!isValidUsername(username)) {
            setError("Username must be 3-20 characters (A-Z, 0-9, _, -).");
            return;
        }
        if (!isValidPin(pin)) {
            setError("PIN must be exactly 4 digits.");
            return;
        }
        if (files.length === 0) {
            setError("Please select at least one file.");
            return;
        }
        if (email && !isValidEmail(email)) {
            setError("Enter a valid email address or leave the field blank.");
            return;
        }

        setBusy(true);
        try {
            let uploadFile;

            if (files.length === 1) {
                // Single file — upload directly
                uploadFile = files[0];
                setStatusText("Preparing upload…");
            } else {
                // Multiple files — zip them first
                setStatusText(`Zipping ${files.length} files…`);
                const { blob, filename, contentType } = await buildZipFromFiles(files);
                uploadFile = new File([blob], filename, { type: contentType });
            }

            if (uploadFile.size > MAX_MB * 1024 * 1024) {
                setError(`Total size too large. Max ${MAX_MB} MB.`);
                setBusy(false);
                return;
            }

            const isLarge = uploadFile.size > UPLOAD_FAST_LIMIT;
            setStatusText(isLarge ? "Starting chunked upload…" : "Uploading…");

            const data = await apiUploadAuto({
                file: uploadFile,
                username: username.trim(),
                pin: pin.trim(),
                email: email.trim() || undefined,
                emailMode,
                includePin,
                onProgress: setProgress,
                onStatus: setStatusText,
            });

            setResult(data);
            setProgress(100);
            setStatusText("Upload complete!");
        } catch (e) {
            setError(e.message || "Upload failed.");
            setProgress(0);
            setStatusText("");
        } finally {
            setBusy(false);
        }
    }

    async function copyLink() {
        if (!result?.shareUrl) return;
        await navigator.clipboard.writeText(result.shareUrl);
        alert("Copied link!");
    }

    return (
        <div className="app-container animate-fade-in">
            <div className="page-header">
                <LogoSVG style={{ height: "120px", margin: "0 auto 16px auto", display: "block" }} />
                <p className="page-subtitle">Secure, ephemeral file sharing. PIN-protected.</p>
            </div>

            <div className="card card-transparent">
                {/* File drop zone */}
                <FileUploadZone files={files} onFilesChange={setFiles} />

                {/* Multi-file info */}
                {files.length > 1 && (
                    <p style={{ marginTop: "8px", fontSize: "0.82rem", color: "var(--accent-primary, #2B7FFF)" }}>
                        ✓ {files.length} files selected ({formatBytes(totalSize)}) — will be zipped automatically.
                    </p>
                )}

                {/* Username / PIN row */}
                <div className="grid-2" style={{ marginTop: "28px" }}>
                    <VanishInput
                        label="Username"
                        placeholders={["e.g. JOHN-PDF", "3–20 chars"]}
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    />
                    <VanishInput
                        label="4-Digit PIN"
                        placeholders={["e.g. 1234"]}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        inputMode="numeric"
                        maxLength={4}
                    />
                </div>

                {/* Optional email section */}
                <div style={{ marginTop: "20px" }}>
                    <button
                        type="button"
                        className="btn btn-secondary btn-rounded"
                        style={{ fontSize: "0.85rem", padding: "8px 18px" }}
                        onClick={() => setShowEmailSection((v) => !v)}
                    >
                        {showEmailSection ? "▲ Hide email options" : "▼ Email after upload (optional)"}
                    </button>
                </div>

                {showEmailSection && (
                    <div className="card card-transparent" style={{ marginTop: "12px", padding: "16px", border: "1px solid var(--border-color)" }}>
                        <div className="grid-2" style={{ marginBottom: "12px" }}>
                            <VanishInput
                                label="Recipient email"
                                placeholders={["friend@example.com"]}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                            />
                            <div className="form-group">
                                <label className="form-label">Email content</label>
                                <select
                                    className="form-control form-control-rounded"
                                    value={emailMode}
                                    onChange={(e) => setEmailMode(e.target.value)}
                                >
                                    {EMAIL_MODE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={includePin}
                                onChange={(e) => setIncludePin(e.target.checked)}
                                style={{ width: "auto", accentColor: "var(--accent-primary)" }}
                            />
                            Include PIN in the email
                        </label>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
                            For files &gt;10 MB, use "link only" — attachments have a size limit.
                        </p>
                    </div>
                )}

                {/* Progress bar */}
                {(busy || progress > 0) && (
                    <div style={{ marginTop: "18px" }}>
                        <div className="progress-bar-track">
                            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                        </div>
                        {statusText && (
                            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "6px", textAlign: "center" }}>
                                {statusText}
                            </p>
                        )}
                    </div>
                )}

                {/* Upload button */}
                <div style={{ marginTop: "20px" }}>
                    <NoiseBackground
                        containerClassName="noise-bg-container"
                        gradientColors={["rgb(100,150,255)", "rgb(56,189,248)", "rgb(139,92,246)"]}
                        speed={0.08}
                        noiseIntensity={0.15}
                    >
                        <button
                            className="noise-submit-btn"
                            onClick={onUpload}
                            disabled={!canSubmit || busy}
                        >
                            {busy
                                ? (statusText || "Uploading…")
                                : files.length > 1
                                    ? `Zip & Upload ${files.length} Files →`
                                    : "Upload & Generate Link →"}
                        </button>
                    </NoiseBackground>
                </div>

                {/* Error */}
                {error && (
                    <div className="alert alert-error animate-fade-in" style={{ marginTop: "24px" }}>
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="result-box animate-fade-in">
                        <h3 style={{ color: "var(--accent-primary)", marginBottom: "4px" }}>Upload Successful ✅</h3>
                        <p style={{ fontSize: "0.875rem" }}>Your file is securely stored. Share the link below.</p>

                        <div className="result-meta">
                            <div className="meta-item">
                                <span className="meta-label">Username</span>
                                <span className="meta-value">{result.username}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Expires At</span>
                                <span className="meta-value">{new Date(result.expiresAt).toLocaleString()}</span>
                            </div>
                            {result.email?.requested && (
                                <div className="meta-item">
                                    <span className="meta-label">Email</span>
                                    <span className="meta-value" style={{ color: result.email.sent ? "var(--success, #2BE4A7)" : "var(--error, #FF4D6D)" }}>
                                        {result.email.sent ? `Sent to ${result.email.to}` : "Failed to send"}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: "24px" }}>
                            <label className="form-label">Shareable Link</label>
                            <div className="copy-group">
                                <input
                                    className="form-control form-control-rounded"
                                    readOnly
                                    value={result.shareUrl}
                                    style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                                />
                                <button className="btn btn-secondary btn-rounded" onClick={copyLink}>
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <label className="form-label" style={{ marginBottom: "12px" }}>Scan with Mobile</label>
                            <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "12px", display: "inline-block", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                                <QRCodeSVG value={result.shareUrl || ""} size={160} level="M" includeMargin={false} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
