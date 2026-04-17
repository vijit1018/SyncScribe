export type AccessRole = "owner" | "editor" | "viewer";

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type SharedUser = {
  userId: string;
  email: string;
  role: Exclude<AccessRole, "owner">;
  grantedAt: string | null;
};

export type DocumentSummary = {
  id: string;
  title: string;
  ownerId: string;
  ownerName?: string | null;
  accessRole: AccessRole;
  preview: string;
  updatedAt: string;
  createdAt: string;
};

export type DocumentDetail = DocumentSummary & {
  content: Record<string, unknown>;
  sharedWith: SharedUser[];
};

export type DocumentListResponse = {
  owned: DocumentSummary[];
  shared: DocumentSummary[];
};
