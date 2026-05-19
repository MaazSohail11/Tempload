import { zipSync, unzipSync, strToU8 } from "fflate";

/**
 * Build a ZIP blob from an array of File objects.
 * Returns: { blob, filename, contentType }
 */
export async function buildZipFromFiles(files) {
    // fflate zipSync expects an object: { "filename": Uint8Array }
    const zipObj = {};

    for (const f of files) {
        const buf = new Uint8Array(await f.arrayBuffer());
        zipObj[f.name] = buf;
    }

    const zipped = zipSync(zipObj, { level: 6 }); // compression level 0-9
    const blob = new Blob([zipped], { type: "application/zip" });

    return { blob, filename: "drop.zip", contentType: "application/zip" };
}

/**
 * Extract files from a ZIP blob.
 * Returns an array of: { name, blob, url }
 */
export async function extractZipBlob(blob) {
    const buf = new Uint8Array(await blob.arrayBuffer());
    const unzipped = unzipSync(buf);

    const files = [];
    for (const [name, data] of Object.entries(unzipped)) {
        // Skip directories
        if (data.length === 0 && name.endsWith('/')) continue;

        const fileBlob = new Blob([data]);
        const url = URL.createObjectURL(fileBlob);
        files.push({ name, blob: fileBlob, url, size: data.length });
    }

    return files;
}

/**
 * Build a TXT blob from text input.
 */
export function buildTxtFromString(text) {
    const u8 = strToU8(text);
    const blob = new Blob([u8], { type: "text/plain" });
    return { blob, filename: "note.txt", contentType: "text/plain" };
}
