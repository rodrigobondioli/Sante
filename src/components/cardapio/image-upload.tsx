"use client";

import { useRef, useState } from "react";
import { Upload, X, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
  currentUrl?: string | null;
  autoUrl?: string | null;    // from drink library
  onUpload: (url: string | null) => void;
}

export function ImageUpload({ currentUrl, autoUrl, onUpload }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview ?? autoUrl ?? null;
  const isAuto = !preview && !!autoUrl;

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Apenas imagens são aceitas.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande (máx 5MB).");
      return;
    }

    setError(null);
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false });

    if (upErr) {
      setError("Erro ao enviar imagem. Tente novamente.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setPreview(data.publicUrl);
    onUpload(data.publicUrl);
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    onUpload(autoUrl ?? null);
  }

  return (
    <div>
      {displayUrl ? (
        /* Preview */
        <div style={{ position: "relative", width: 80, height: 80 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="Preview"
            style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", display: "block" }}
          />
          {isAuto && (
            <div style={{
              position: "absolute", bottom: 4, left: 4,
              background: "rgba(38,0,120,0.85)",
              borderRadius: 4, padding: "2px 5px",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <Sparkles style={{ width: 9, height: 9, color: "rgba(160,130,255,0.9)" }} />
              <span style={{ fontSize: 9, color: "rgba(160,130,255,0.9)", fontWeight: 500 }}>auto</span>
            </div>
          )}
          {!isAuto && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                position: "absolute", top: -6, right: -6,
                width: 20, height: 20, borderRadius: "50%",
                background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.70)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X style={{ width: 10, height: 10 }} />
            </button>
          )}
          {/* Trocar sempre visível — permite substituir inclusive imagens automáticas */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              position: "absolute", bottom: 4, right: 4,
              background: "rgba(0,0,0,0.65)", border: "none", borderRadius: 4,
              color: "rgba(255,255,255,0.70)", cursor: "pointer", padding: "3px 5px",
              fontSize: 10,
            }}
          >
            Trocar
          </button>
        </div>
      ) : (
        /* Upload zone */
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            width: 80, height: 80, borderRadius: 8,
            border: "1.5px dashed rgba(255,255,255,0.15)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 4, cursor: "pointer",
            background: uploading ? "rgba(38,0,120,0.15)" : "rgba(255,255,255,0.03)",
            transition: "background 0.15s",
          }}
        >
          {uploading ? (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>Enviando…</span>
          ) : (
            <>
              <Upload style={{ width: 16, height: 16, color: "rgba(255,255,255,0.25)" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)", textAlign: "center", lineHeight: 1.3 }}>
                Upload
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {error && (
        <p style={{ fontSize: 11, color: "rgba(239,68,68,0.9)", marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}
