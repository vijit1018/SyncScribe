import { create } from "zustand";

import { apiRequest } from "../app/api/client";
import type { DocumentDetail, DocumentListResponse, SharedUser } from "../lib/types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type DocumentState = {
  owned: DocumentListResponse["owned"];
  shared: DocumentListResponse["shared"];
  activeDocument: DocumentDetail | null;
  loadingList: boolean;
  loadingDocument: boolean;
  saveStatus: SaveStatus;
  error: string | null;
  loadDocuments: () => Promise<void>;
  createDocument: (title?: string) => Promise<DocumentDetail>;
  loadDocument: (documentId: string) => Promise<void>;
  updateDocument: (documentId: string, payload: { title?: string; content?: Record<string, unknown> }) => Promise<void>;
  shareDocument: (documentId: string, email: string, role: SharedUser["role"]) => Promise<void>;
  importDocument: (file: File) => Promise<DocumentDetail>;
  clearError: () => void;
};

export const useDocumentStore = create<DocumentState>((set, get) => ({
  owned: [],
  shared: [],
  activeDocument: null,
  loadingList: false,
  loadingDocument: false,
  saveStatus: "idle",
  error: null,
  clearError: () => set({ error: null }),
  loadDocuments: async () => {
    set({ loadingList: true, error: null });
    try {
      const response = await apiRequest<DocumentListResponse>("/documents");
      set({ owned: response.owned, shared: response.shared, loadingList: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to load documents.", loadingList: false });
    }
  },
  createDocument: async (title = "Untitled document") => {
    const document = await apiRequest<DocumentDetail>("/documents", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    set((state) => ({ owned: [document, ...state.owned] }));
    return document;
  },
  loadDocument: async (documentId) => {
    set({ loadingDocument: true, error: null });
    try {
      const document = await apiRequest<DocumentDetail>(`/documents/${documentId}`);
      set({ activeDocument: document, loadingDocument: false, saveStatus: "idle" });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unable to load this document.",
        loadingDocument: false,
      });
    }
  },
  updateDocument: async (documentId, payload) => {
    set({ saveStatus: "saving", error: null });
    try {
      const document = await apiRequest<DocumentDetail>(`/documents/${documentId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      set((state) => ({
        activeDocument: document,
        owned: state.owned.map((item) => (item.id === document.id ? document : item)),
        shared: state.shared.map((item) => (item.id === document.id ? document : item)),
        saveStatus: "saved",
      }));
      window.setTimeout(() => {
        if (get().saveStatus === "saved") {
          set({ saveStatus: "idle" });
        }
      }, 1200);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to save.", saveStatus: "error" });
    }
  },
  shareDocument: async (documentId, email, role) => {
    try {
      await apiRequest<{ message: string }>(`/documents/${documentId}/share`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      await get().loadDocument(documentId);
      await get().loadDocuments();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to share document." });
    }
  },
  importDocument: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const document = await apiRequest<DocumentDetail>("/uploads/import", {
      method: "POST",
      body: formData,
    });
    set((state) => ({ owned: [document, ...state.owned] }));
    return document;
  },
}));
