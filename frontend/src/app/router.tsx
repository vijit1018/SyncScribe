import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AuthPage } from "../features/auth/AuthPage";
import { DocumentsPage } from "../features/dashboard/DocumentsPage";
import { EditorPage } from "../features/editor/EditorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate replace to="/documents" />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: "/documents",
            element: <DocumentsPage />,
          },
          {
            path: "/documents/:documentId",
            element: <EditorPage />,
          },
        ],
      },
    ],
  },
]);
