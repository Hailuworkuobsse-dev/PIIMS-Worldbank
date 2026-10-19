import { useId, useRef, useState, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "./utils/cn";

export interface FileUploadProps {
  label: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
  files?: File[];
  error?: string;
  hint?: string;
  required?: boolean;
}

export function FileUpload({
  label,
  accept,
  maxSizeMB = 10,
  multiple = false,
  onFiles,
  files = [],
  error,
  hint,
  required,
}: FileUploadProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validate = (fs: File[]): File[] => {
    const tooBig = fs.find((f) => f.size / 1024 / 1024 > maxSizeMB);
    if (tooBig) {
      setLocalError(`"${tooBig.name}" exceeds ${maxSizeMB}MB.`);
      return [];
    }
    setLocalError(null);
    return fs;
  };

  const handle = (fs: File[]) => {
    const ok = validate(fs);
    if (ok.length) onFiles?.(ok);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    const fs = Array.from(e.dataTransfer.files);
    if (fs.length) handle(fs);
  };

  const shown = error ?? localError;

  return (
    <div className="w-full">
      <span className="block text-caption font-semibold text-primary-900 mb-1.5">
        {label}
        {required && (
          <span aria-hidden className="text-danger ml-0.5">
            *
          </span>
        )}
      </span>

      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 w-full px-4 py-6 rounded-md cursor-pointer",
          "border-2 border-dashed transition-colors text-center",
          dragging
            ? "border-primary-700 bg-primary-100"
            : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100",
          shown && "border-danger",
          "focus-within:ring-2 focus-within:ring-info focus-within:ring-offset-2",
        )}
      >
        <UploadCloud className="h-8 w-8 text-neutral-600" aria-hidden />
        <div className="text-body-sm text-neutral-600">
          <span className="font-semibold text-primary-700">
            Click to upload
          </span>{" "}
          or drag and drop
        </div>
        <div className="text-caption text-neutral-600">
          {accept ? `Accepted: ${accept}` : "Any file type"} · Max {maxSizeMB}{" "}
          MB
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            const fs = e.target.files;
            if (fs) handle(Array.from(fs));
            e.target.value = "";
          }}
        />
      </label>

      {hint && !shown && (
        <p className="mt-1 text-caption text-neutral-600">{hint}</p>
      )}
      {shown && (
        <p role="alert" className="mt-1 text-caption text-danger font-medium">
          {shown}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f) => (
            <li
              key={f.name}
              className="flex items-center justify-between gap-3 text-body-sm bg-neutral-50 border border-neutral-300 rounded-md px-3 py-2"
            >
              <span className="truncate">{f.name}</span>
              <span className="text-caption text-neutral-600">
                {(f.size / 1024).toFixed(0)} KB
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}