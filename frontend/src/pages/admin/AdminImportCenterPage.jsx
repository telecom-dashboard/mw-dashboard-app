import { useState } from "react";
import { uploadMicrowaveLinkExcel } from "../../api/microwaveLinkImportApi";

function AdminImportCenterPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please choose an Excel file first");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setResult(null);

      const data = await uploadMicrowaveLinkExcel(file);
      setResult(data);
    } catch (err) {
      console.error("Upload failed", err);
      setError(err?.response?.data?.detail || "Import failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1>Import Center</h1>
      <p>Upload Excel file to import microwave links.</p>

      <div style={cardStyle}>
        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <div style={{ marginTop: 16 }}>
            <button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Microwave Link Excel"}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div style={{ ...cardStyle, marginTop: 20, borderLeft: "6px solid crimson" }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ ...cardStyle, marginTop: 20, borderLeft: "6px solid green" }}>
          <h3>Import Result</h3>
          <p><strong>File:</strong> {result.file_name}</p>
          <p><strong>Total Rows:</strong> {result.total_rows}</p>
          <p><strong>Inserted:</strong> {result.inserted_rows}</p>
          <p><strong>Updated:</strong> {result.updated_rows}</p>
          <p><strong>Failed:</strong> {result.failed_rows}</p>

          {result.errors?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <strong>Sample Errors:</strong>
              <ul>
                {result.errors.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={{ ...cardStyle, marginTop: 20 }}>
        <h3>Required Excel Columns</h3>
        <ul>
          <li>ne_id</li>
          <li>fe_id</li>
          <li>link_id</li>
          <li>management_ip</li>
          <li>web_protocol</li>
          <li>link_class</li>
          <li>is_active</li>
          <li>vendor</li>
          <li>model</li>
          <li>type</li>
          <li>status</li>
        </ul>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

export default AdminImportCenterPage;