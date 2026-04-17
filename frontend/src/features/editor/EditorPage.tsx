import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { DocumentDetail } from "../../lib/types";
import { useDocumentStore } from "../../stores/documentStore";
import { ShareDialog } from "../sharing/ShareDialog";
import { ImportFileButton } from "../uploads/ImportFileButton";
import { TiptapEditor } from "./TiptapEditor";

export function EditorPage() {
  const { documentId = "" } = useParams();
  const navigate = useNavigate();
  const activeDocument = useDocumentStore((state) => state.activeDocument);
  const loadingDocument = useDocumentStore((state) => state.loadingDocument);
  const saveStatus = useDocumentStore((state) => state.saveStatus);
  const error = useDocumentStore((state) => state.error);
  const loadDocument = useDocumentStore((state) => state.loadDocument);
  const updateDocument = useDocumentStore((state) => state.updateDocument);
  const clearError = useDocumentStore((state) => state.clearError);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<Record<string, unknown>>({ type: "doc", content: [{ type: "paragraph" }] });
  const [editorDocumentId, setEditorDocumentId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const initializedRef = useRef(false);
  const latestDocumentRef = useRef<DocumentDetail | null>(null);
  const hydratedDocumentIdRef = useRef<string | null>(null);

  useEffect(() => {
    clearError();
    initializedRef.current = false;
    hydratedDocumentIdRef.current = null;
    setEditorDocumentId(null);
    void loadDocument(documentId);
  }, [clearError, documentId, loadDocument]);

  useEffect(() => {
    if (!activeDocument) {
      return;
    }
    latestDocumentRef.current = activeDocument;
    if (hydratedDocumentIdRef.current !== activeDocument.id) {
      hydratedDocumentIdRef.current = activeDocument.id;
      initializedRef.current = true;
      setTitle(activeDocument.title);
      setContent(activeDocument.content);
      setEditorDocumentId(activeDocument.id);
    }
  }, [activeDocument]);

  useEffect(() => {
    if (!initializedRef.current || !latestDocumentRef.current) {
      return;
    }
    const lastDocument = latestDocumentRef.current;
    const titleChanged = lastDocument.title !== title;
    const contentChanged = JSON.stringify(lastDocument.content) !== JSON.stringify(content);
    if (!titleChanged && !contentChanged) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void updateDocument(documentId, { title, content });
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [content, documentId, title, updateDocument]);

  const accessRole = useMemo(() => activeDocument?.accessRole ?? "viewer", [activeDocument?.accessRole]);
  const canEdit = accessRole === "owner" || accessRole === "editor";
  const canShare = accessRole === "owner" || accessRole === "editor";

  if (loadingDocument || !activeDocument || editorDocumentId !== activeDocument.id) {
    return <div className="card">{error ? <p className="form-error">{error}</p> : <p>Loading document...</p>}</div>;
  }

  return (
    <div className="editor-layout">
      <section className="card editor-sidebar">
        <span className="badge">{accessRole === "owner" ? "Owner access" : `${accessRole} access`}</span>
        <label className="input-label">
          Document title
          <input disabled={!canEdit} onChange={(event) => setTitle(event.target.value)} value={title} />
        </label>
        <div className="stack">
          <div className="inline-meta">
            <span>Owner</span>
            <strong>{activeDocument.ownerName ?? "You"}</strong>
          </div>
          <div className="inline-meta">
            <span>Save status</span>
            <strong>{saveStatus}</strong>
          </div>
          <div className="inline-meta">
            <span>Supported imports</span>
            <strong>.txt and .md</strong>
          </div>
        </div>
        <div className="stack">
          <button className="primary-button" disabled={!canShare} onClick={() => setShareOpen(true)} type="button">
            Share document
          </button>
          <ImportFileButton onImported={(nextDocumentId) => navigate(`/documents/${nextDocumentId}`)} />
        </div>
        {!canEdit ? (
          <p className="muted-copy">Viewers can open shared documents, but only owners and editors can edit or re-share them.</p>
        ) : null}
        {accessRole === "editor" ? (
          <p className="muted-copy">Editors can update this document and share it with other collaborators.</p>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
      </section>

      <section className="editor-main">
        <TiptapEditor
          key={editorDocumentId}
          initialContent={content}
          editable={canEdit}
          onContentChange={setContent}
        />
      </section>

      <ShareDialog
        documentId={activeDocument.id}
        onClose={() => setShareOpen(false)}
        open={shareOpen}
        sharedWith={activeDocument.sharedWith}
      />
    </div>
  );
}
