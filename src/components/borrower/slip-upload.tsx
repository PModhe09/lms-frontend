"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FileCheck2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, ApiError, fetchJson, unwrap } from "@/lib/api/client";
import type { BorrowerProfile } from "@/lib/api/types";
import { formatBytes, formatDateTime } from "@/lib/format";
import { keys } from "@/lib/queries";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["application/pdf", "image/jpeg", "image/png"];

export function SlipUpload({ profile, onDone }: { profile: BorrowerProfile; onDone?: () => void }) {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const options = useQuery({
    queryKey: ["borrower", "upload-options"],
    queryFn: () => unwrap(api.GET("/borrower/salary-slip/upload-options")),
    staleTime: Infinity,
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const opts = options.data ?? (await unwrap(api.GET("/borrower/salary-slip/upload-options")));
      if (opts.mode === "direct") {
        // Browser → private storage with a 5-minute presigned URL (the hosting platform caps request
        // bodies below 5 MB). The server then checks what landed: size and real file type.
        const { uploadPresigned } = await import("@vercel/blob/client");
        const ext =
          file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
        const key = `${opts.keyPrefix}${crypto.randomUUID()}.${ext}`;
        await uploadPresigned(key, file, {
          access: "private",
          contentType: file.type,
          handleUploadUrl: "/api/borrower/salary-slip/presign",
        });
        return unwrap(
          api.POST("/borrower/salary-slip/confirm", { body: { key, originalName: file.name } }),
        );
      }
      const body = new FormData();
      body.append("file", file);
      return fetchJson<BorrowerProfile>("/api/borrower/salary-slip", { method: "POST", body });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(keys.profile, data);
      onDone?.();
    },
  });

  function choose(file: File | undefined) {
    if (!file) return;
    setClientError(null);
    // Quick checks for a good experience. The server checks the real type from the file's bytes.
    if (!ACCEPT.includes(file.type)) return setClientError("Choose a PDF, JPG or PNG file.");
    if (file.size > MAX_BYTES)
      return setClientError(`That file is ${formatBytes(file.size)}. The limit is 5 MB.`);
    upload.mutate(file);
  }

  const error =
    clientError ??
    (upload.error instanceof ApiError
      ? upload.error.message
      : upload.error
        ? "Upload failed. Try again."
        : null);
  const slip = profile.salarySlip;

  return (
    <div className="space-y-4">
      {slip && (
        <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-3 text-sm">
          <FileCheck2 className="text-primary size-5 shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-medium">{slip.originalName}</p>
            <p className="text-muted-foreground text-xs">
              {formatBytes(slip.size)} · uploaded {formatDateTime(slip.uploadedAt)}
            </p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          choose(e.dataTransfer.files[0]);
        }}
        disabled={upload.isPending}
        className={cn(
          "hover:border-primary/60 hover:bg-muted/40 flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors",
          dragging && "border-primary bg-primary/5",
        )}
      >
        <Upload className="text-muted-foreground size-6" />
        <span className="text-sm font-medium">
          {upload.isPending
            ? "Uploading…"
            : slip
              ? "Replace salary slip"
              : "Upload your latest salary slip"}
        </span>
        <span className="text-muted-foreground text-xs">
          PDF, JPG or PNG · up to 5 MB · drag and drop or click
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="sr-only"
        aria-label="Salary slip file"
        onChange={(e) => {
          choose(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {slip && onDone && (
        <Button variant="outline" onClick={onDone}>
          Continue with this slip
        </Button>
      )}
    </div>
  );
}
