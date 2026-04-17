import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useDocumentStore } from "../../stores/documentStore";

export function DocumentsPage() {
  const navigate = useNavigate();
  const owned = useDocumentStore((state) => state.owned);
  const shared = useDocumentStore((state) => state.shared);
  const loadingList = useDocumentStore((state) => state.loadingList);
  const error = useDocumentStore((state) => state.error);
  const loadDocuments = useDocumentStore((state) => state.loadDocuments);
  const createDocument = useDocumentStore((state) => state.createDocument);
  const clearError = useDocumentStore((state) => state.clearError);

  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function handleCreateDocument() {
    setIsCreating(true);
    clearError();
    try {
      const document = await createDocument();
      navigate(`/documents/${document.id}`);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="dashboard-layout">
      <section className="dashboard-hero card">
        <div>
          <span className="badge">Owned vs shared</span>
          <h1>Your collaborative workspace</h1>
          <p>Create a new document, import a file, or reopen a shared draft.</p>
        </div>
        <button className="primary-button" disabled={isCreating} onClick={handleCreateDocument} type="button">
          {isCreating ? "Creating..." : "New document"}
        </button>
      </section>

      {error ? <p className="form-error card">{error}</p> : null}

      <div className="document-grid">
        <DocumentColumn
          description="Drafts you own and can edit or share."
          documents={owned}
          emptyState={loadingList ? "Loading documents..." : "Create your first document to get started."}
          onOpen={(documentId) => navigate(`/documents/${documentId}`)}
          title="Owned documents"
        />
        <DocumentColumn
          description="Docs shared with you by another user."
          documents={shared}
          emptyState={loadingList ? "Loading documents..." : "No shared documents yet."}
          onOpen={(documentId) => navigate(`/documents/${documentId}`)}
          title="Shared with me"
        />
      </div>
    </div>
  );
}

type DocumentColumnProps = {
  title: string;
  description: string;
  emptyState: string;
  documents: Array<{
    id: string;
    title: string;
    preview: string;
    updatedAt: string;
    ownerName?: string | null;
    accessRole: "owner" | "editor" | "viewer";
  }>;
  onOpen: (documentId: string) => void;
};

function DocumentColumn({ title, description, emptyState, documents, onOpen }: DocumentColumnProps) {
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="counter-pill">{documents.length}</span>
      </div>
      <div className="stack">
        {documents.length === 0 ? <p className="muted-copy">{emptyState}</p> : null}
        {documents.map((document) => (
          <button className="document-card" key={document.id} onClick={() => onOpen(document.id)} type="button">
            <div className="document-card-top">
              <strong>{document.title}</strong>
              <span>{new Date(document.updatedAt).toLocaleString()}</span>
            </div>
            <p>{document.preview || "No content yet."}</p>
            {document.ownerName ? (
              <small>
                Shared by {document.ownerName} as {document.accessRole}
              </small>
            ) : (
              <small>Owned by you</small>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
