import { FormEvent, useState } from "react";

import type { SharedUser } from "../../lib/types";
import { useDocumentStore } from "../../stores/documentStore";

type ShareDialogProps = {
  documentId: string;
  open: boolean;
  onClose: () => void;
  sharedWith: SharedUser[];
};

export function ShareDialog({ documentId, open, onClose, sharedWith }: ShareDialogProps) {
  const shareDocument = useDocumentStore((state) => state.shareDocument);
  const error = useDocumentStore((state) => state.error);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SharedUser["role"]>("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await shareDocument(documentId, email, role);
      setEmail("");
      setRole("viewer");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title">
        <div className="section-heading">
          <div>
            <h2 id="share-dialog-title">Share document</h2>
            <p>Grant another registered user access by email.</p>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Collaborator email
            <input
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ben@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Access role
            <select onChange={(event) => setRole(event.target.value as SharedUser["role"])} value={role}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sharing..." : "Share"}
          </button>
        </form>
        <div className="stack">
          <h3>Current access</h3>
          {sharedWith.length === 0 ? <p className="muted-copy">No collaborators yet.</p> : null}
          {sharedWith.map((entry) => (
            <div className="inline-meta" key={entry.email}>
              <span>{entry.email}</span>
              <strong>{entry.role}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
