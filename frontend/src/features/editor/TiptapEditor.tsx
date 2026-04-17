import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import { EditorToolbar } from "./EditorToolbar";

type TiptapEditorProps = {
  initialContent: Record<string, unknown>;
  editable: boolean;
  onContentChange: (content: Record<string, unknown>) => void;
};

export function TiptapEditor({ initialContent, editable, onContentChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: editable ? "Start writing..." : "This shared document is view-only.",
      }),
    ],
    content: initialContent,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onContentChange(currentEditor.getJSON() as Record<string, unknown>);
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(editable);
  }, [editable, editor]);

  return (
    <div className="editor-card">
      <EditorToolbar disabled={!editable} editor={editor} />
      <EditorContent className="editor-surface" editor={editor} />
    </div>
  );
}
