"use client";

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from "react";
import {
  Upload,
  X,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { BulkUploadResult } from "@/app/services/players.service";

// ── Template helper ───────────────────────────────────────────────────────────

export interface BulkUploadTemplateConfig {
  filename: string; // e.g. "players_template.csv"
  headers: string; // e.g. "name,role,batting_style,bowling_style"
  sampleRows: string[]; // each row as a CSV string
}

function downloadTemplate(config: BulkUploadTemplateConfig) {
  const content = [config.headers, ...config.sampleRows].join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = config.filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  templateConfig: BulkUploadTemplateConfig;
  uploadFn: (file: File) => Promise<{ data: BulkUploadResult }>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BulkUploadModal({
  open,
  onClose,
  title,
  description,
  templateConfig,
  uploadFn,
}: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errorsOpen, setErrorsOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = useCallback((f: File) => {
    const validExts = [".csv", ".xlsx"];
    const hasValidExt = validExts.some((ext) =>
      f.name.toLowerCase().endsWith(ext),
    );
    if (!hasValidExt) {
      setApiError("Only .csv and .xlsx files are accepted.");
      return;
    }
    setFile(f);
    setResult(null);
    setApiError(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) acceptFile(f);
    },
    [acceptFile],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) acceptFile(f);
    },
    [acceptFile],
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setApiError(null);
    try {
      const res = await uploadFn(file);
      setResult(res.data);
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      const msg =
        axiosMsg ??
        (err instanceof Error
          ? err.message
          : "Upload failed. Please try again.");
      setApiError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setApiError(null);
    setUploading(false);
    setErrorsOpen(false);
    if (inputRef.current) inputRef.current.value = "";
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setApiError(null);
    setErrorsOpen(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (!open) return null;

  const isDone = !!result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted mt-0.5">
              {description ?? "Import multiple records from a CSV or XLSX file"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-border/60 text-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {isDone ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-background p-3 text-center">
                  <p className="text-xl font-bold text-foreground font-mono">
                    {result.success_count + result.failed_count}
                  </p>
                  <p className="text-[11px] font-medium text-muted uppercase tracking-wide mt-0.5">
                    Total
                  </p>
                </div>
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-center">
                  <p className="text-xl font-bold text-accent font-mono">
                    {result.success_count}
                  </p>
                  <p className="text-[11px] font-medium text-accent/70 uppercase tracking-wide mt-0.5">
                    Imported
                  </p>
                </div>
                <div
                  className={`rounded-xl border p-3 text-center ${
                    result.failed_count > 0
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-border bg-background"
                  }`}
                >
                  <p
                    className={`text-xl font-bold font-mono ${
                      result.failed_count > 0
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                  >
                    {result.failed_count}
                  </p>
                  <p
                    className={`text-[11px] font-medium uppercase tracking-wide mt-0.5 ${
                      result.failed_count > 0
                        ? "text-destructive/70"
                        : "text-muted"
                    }`}
                  >
                    Failed
                  </p>
                </div>
              </div>

              {result.failed_count === 0 && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-accent/8 border border-accent/25">
                  <CheckCircle2 size={16} className="text-accent shrink-0" />
                  <p className="text-sm font-medium text-accent">
                    All {result.success_count} records imported successfully!
                  </p>
                </div>
              )}

              {result.failed_count > 0 && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-destructive/6 border border-destructive/25">
                  <AlertCircle
                    size={15}
                    className="text-destructive shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-destructive">
                    <span className="font-semibold">
                      No records were imported.
                    </span>{" "}
                    Fix the {result.failed_count} error
                    {result.failed_count > 1 ? "s" : ""} below and re-upload the
                    file.
                  </p>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="rounded-xl border border-destructive/30 overflow-hidden">
                  <button
                    onClick={() => setErrorsOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-destructive/5 hover:bg-destructive/8 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
                        Validation Errors
                      </p>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                        {result.errors.length} row
                        {result.errors.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-destructive transition-transform duration-200 ${errorsOpen ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {errorsOpen && (
                    <div className="max-h-52 overflow-y-auto border-t border-destructive/20">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-background border-b border-border">
                          <tr>
                            <th className="text-left px-4 py-2 font-semibold text-muted w-16">
                              Row
                            </th>
                            <th className="text-left px-4 py-2 font-semibold text-muted">
                              Error
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {result.errors.map((e, i) => (
                            <tr
                              key={i}
                              className="hover:bg-background/60 transition-colors"
                            >
                              <td className="px-4 py-2.5">
                                <span className="font-bold font-mono text-destructive">
                                  {e.row}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-muted leading-relaxed">
                                {e.error}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {result.failed_count > 0 && (
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted hover:border-primary hover:text-primary transition-colors"
                  >
                    Upload Again
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Template download */}
              <button
                onClick={() => downloadTemplate(templateConfig)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/4 hover:bg-primary/8 hover:border-primary/60 transition-colors group"
              >
                <Download size={14} className="text-primary shrink-0" />
                <span className="text-sm font-medium text-primary">
                  Download CSV template
                </span>
                <span className="ml-auto text-[11px] font-mono text-primary/60">
                  .csv · use as reference
                </span>
              </button>

              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/6"
                      : "border-border hover:border-primary/50 hover:bg-background"
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,.xlsx"
                    className="hidden"
                    onChange={handleInputChange}
                  />
                  <div
                    className={`p-3 rounded-xl transition-colors ${
                      isDragging
                        ? "bg-primary/10"
                        : "bg-background border border-border"
                    }`}
                  >
                    <Upload
                      size={20}
                      className={isDragging ? "text-primary" : "text-muted"}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      Drop your file here
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      or{" "}
                      <span className="text-primary font-medium">
                        browse files
                      </span>
                    </p>
                    <p className="text-[11px] text-muted mt-1">.csv or .xlsx</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate font-mono">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg hover:bg-border/60 text-muted transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {apiError && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-destructive/6 border border-destructive/25">
                  <AlertCircle
                    size={15}
                    className="text-destructive shrink-0"
                  />
                  <p className="text-sm text-destructive">{apiError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted hover:border-primary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
