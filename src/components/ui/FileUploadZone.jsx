import React, { useRef, useState } from "react";
import { motion } from "motion/react";

/**
 * Animated file upload zone with motion effects.
 * - Drag-and-drop with animated border
 * - File list with stagger animation
 * - Reduced text for clean UX
 */
export default function FileUploadZone({ files, onFilesChange }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) onFilesChange(dropped);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  return (
    <div className="file-upload-zone-wrapper">
      <motion.div
        className={`file-upload-zone ${dragActive ? "drag-active" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => onFilesChange(Array.from(e.target.files || []))}
          onClick={(e) => e.stopPropagation()}
        />

        <motion.div
          className="file-upload-zone-icon"
          animate={{ y: dragActive ? -6 : 0 }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="40" height="40">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </motion.div>
        <p className="file-upload-zone-text">
          <strong>Drop files</strong> or click to browse
        </p>
        <span className="file-upload-zone-hint">Max 200 MB · Multiple files zipped</span>
      </motion.div>

      {files.length > 0 && (
        <div className="file-upload-list">
          {files.map((f, i) => (
            <motion.div
              key={i}
              className="file-upload-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", bounce: 0.3 }}
            >
              <span className="file-name">{f.name}</span>
              <span className="file-size">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
