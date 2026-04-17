import type { ChangeEvent } from "react";
import { useRef, useState } from "react";

import { useDocumentStore } from "../../stores/documentStore";

type ImportFileButtonProps = {
  onImported: (documentId: string) => void;
};

export function ImportFileButton({ onImported }: ImportFileButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const importDocument = useDocumentStore((state) => state.importDocument);
  const [uploading, setUploading] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const document = await importDocument(file);
      onImported(document.id);
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  }

  return (
    <>
      <input
        accept=".txt,.md,text/plain,text/markdown"
        className="hidden-input"
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
      <button className="secondary-button" disabled={uploading} onClick={() => inputRef.current?.click()} type="button">
        {uploading ? "Importing..." : "Import .txt / .md"}
      </button>
    </>
  );
}
