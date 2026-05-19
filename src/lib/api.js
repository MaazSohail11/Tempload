const IS_DEV = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE = IS_DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');

if (!IS_DEV && !API_BASE) {
    console.warn('VITE_API_BASE_URL is not set. Check your .env.local');
}

const PART_SIZE = 20 * 1024 * 1024;
const FAST_LIMIT = 80 * 1024 * 1024;

function apiUrl(path) {
    return `${API_BASE}${path}`;
}

/* ------------------------------------------------------------------ */
/*  POST /api/upload  (simple, ≤ FAST_LIMIT)                          */
/* ------------------------------------------------------------------ */
/**
 * @param {{
 *   file: File,
 *   username: string,
 *   pin: string,          // 4 digits
 *   email?: string,
 *   emailMode?: "link"|"credentials"|"file",
 *   includePin?: boolean,
 *   onProgress?: (pct: number) => void
 * }} opts
 */
export async function apiUpload({ file, username, pin, email, emailMode, includePin, onProgress }) {
    const fd = new FormData();
    fd.append("file", file, file.name || "file");
    fd.append("username", username);
    fd.append("pin", pin);

    if (email) {
        fd.append("email", email);
        fd.append("emailMode", emailMode || "link");
        fd.append("includePin", includePin ? "true" : "false");
    }

    onProgress?.(5);

    const res = await fetch(apiUrl("/api/upload"), { method: "POST", body: fd });
    const data = await res.json().catch(() => null);

    onProgress?.(100);

    if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Upload failed (${res.status})`);
    }
    return data;
}

/* ------------------------------------------------------------------ */
/*  Multipart upload  (> FAST_LIMIT)                                   */
/* ------------------------------------------------------------------ */
/**
 * @param {{
 *   file: File,
 *   username: string,
 *   pin: string,
 *   email?: string,
 *   emailMode?: "link"|"credentials"|"file",
 *   includePin?: boolean,
 *   onProgress?: (pct: number) => void,
 *   onStatus?: (msg: string) => void
 * }} opts
 */
export async function apiUploadMultipart({ file, username, pin, email, emailMode, includePin, onProgress, onStatus }) {
    // 1. Init
    const initRes = await fetch(apiUrl("/api/mpu/init"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username,
            pin,
            filename: file.name || "file",
            contentType: file.type || "application/octet-stream",
            size: file.size,
            email: email || "",
            emailMode: emailMode || "link",
            includePin: !!includePin,
        }),
    });

    const init = await initRes.json().catch(() => null);
    if (!initRes.ok || !init?.ok) {
        throw new Error(init?.error || "Multipart init failed");
    }

    const { uploadId, token, partSize: serverPartSize } = init;
    const effectivePartSize = serverPartSize || PART_SIZE;
    const totalParts = Math.ceil(file.size / effectivePartSize);
    const parts = [];
    let uploadedBytes = 0;

    // 2. Upload each part
    for (let i = 0; i < totalParts; i++) {
        const start = i * effectivePartSize;
        const end = Math.min(file.size, start + effectivePartSize);
        const chunk = file.slice(start, end);
        const partNumber = i + 1;

        const partRes = await fetch(
            apiUrl(`/api/mpu/part?username=${encodeURIComponent(username)}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`),
            {
                method: "PUT",
                headers: {
                    "X-Upload-Token": token,
                    "Content-Type": "application/octet-stream",
                },
                body: chunk,
            }
        );

        const part = await partRes.json().catch(() => null);
        if (!partRes.ok || !part?.ok) {
            // Best-effort abort
            try {
                await fetch(apiUrl("/api/mpu/abort"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, uploadId, token }),
                });
            } catch { /* ignore */ }
            throw new Error(part?.error || "Part upload failed");
        }

        parts.push(part.part);
        uploadedBytes += end - start;
        const pct = Math.floor((uploadedBytes / file.size) * 100);
        onProgress?.(pct);
        onStatus?.(`Uploading… ${pct}% (${formatBytes(uploadedBytes)} / ${formatBytes(file.size)})`);
    }

    // 3. Complete
    const doneRes = await fetch(apiUrl("/api/mpu/complete"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, uploadId, token, parts }),
    });

    const done = await doneRes.json().catch(() => null);
    if (!doneRes.ok || !done?.ok) {
        throw new Error(done?.error || "Multipart complete failed");
    }
    return done;
}

/* ------------------------------------------------------------------ */
/*  Unified upload: picks simple vs multipart automatically            */
/* ------------------------------------------------------------------ */
/**
 * @param {{
 *   file: File,
 *   username: string,
 *   pin: string,
 *   email?: string,
 *   emailMode?: string,
 *   includePin?: boolean,
 *   onProgress?: (pct: number) => void,
 *   onStatus?: (msg: string) => void
 * }} opts
 */
export async function apiUploadAuto(opts) {
    if (opts.file.size > FAST_LIMIT) {
        return apiUploadMultipart(opts);
    }
    return apiUpload(opts);
}

/* ------------------------------------------------------------------ */
/*  GET /api/meta?username=...                                         */
/* ------------------------------------------------------------------ */
export async function apiMeta({ username }) {
    const params = new URLSearchParams({ username });
    const res = await fetch(apiUrl(`/api/meta?${params}`));
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Meta failed (${res.status})`);
    }
    return data;
}

/* ------------------------------------------------------------------ */
/*  POST /api/text  — retrieve text payload                            */
/* ------------------------------------------------------------------ */
export async function apiText({ username, pin }) {
    const res = await fetch(apiUrl("/api/text"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Text failed (${res.status})`);
    }
    return data; // { ok, text, expiresAt }
}

/* ------------------------------------------------------------------ */
/*  POST /api/download  - retrieve binary file                         */
/* ------------------------------------------------------------------ */
export async function apiDownload({ username, pin }) {
    const res = await fetch(apiUrl("/api/download"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        let errMsg = "Download failed (" + res.status + ")";
        try { const d = JSON.parse(text); if (d && d.error) errMsg = d.error; } catch(ex) {}
        throw new Error(errMsg);
    }

    const cd = res.headers.get("Content-Disposition") || "";
    const filenameMatch = cd.match(/filename="([^"]+)"/i);
    const filename = (filenameMatch && filenameMatch[1]) ? filenameMatch[1].trim() : "vault-file";

    const blob = await res.blob();
    return { blob, filename };
}

/*  POST /api/email  — send email for existing vault entry             */
/* ------------------------------------------------------------------ */
/**
 * @param {{
 *   username: string,
 *   pin: string,
 *   email: string,
 *   emailMode?: "link"|"credentials"|"file",
 *   includePin?: boolean
 * }} opts
 */
export async function apiEmailExisting({ username, pin, email, emailMode, includePin }) {
    const res = await fetch(apiUrl("/api/email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username,
            pin,
            email,
            emailMode: emailMode || "link",
            includePin: !!includePin,
        }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Email failed");
    }
    return data; // { ok, message, to, emailMode, includePin }
}

/* ------------------------------------------------------------------ */
/*  Utility                                                            */
/* ------------------------------------------------------------------ */
export function formatBytes(bytes) {
    const n = Number(bytes || 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export const UPLOAD_FAST_LIMIT = FAST_LIMIT;
export const MAX_MB = Number(import.meta.env.VITE_MAX_MB || "500");
