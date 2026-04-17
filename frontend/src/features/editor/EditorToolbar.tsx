import type { MouseEvent } from "react";

import type { Editor } from "@tiptap/react";

type EditorToolbarProps = {
  editor: Editor | null;
  disabled?: boolean;
};

export function EditorToolbar({ editor, disabled = false }: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="toolbar">
      <ToolbarButton active={editor.isActive("bold")} disabled={disabled} label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton active={editor.isActive("italic")} disabled={disabled} label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton active={editor.isActive("underline")} disabled={disabled} label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <ToolbarButton active={editor.isActive("heading", { level: 1 })} disabled={disabled} label="H1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
      <ToolbarButton active={editor.isActive("heading", { level: 2 })} disabled={disabled} label="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton active={editor.isActive("bulletList")} disabled={disabled} label="Bullets" onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton active={editor.isActive("orderedList")} disabled={disabled} label="Numbers" onClick={() => editor.chain().focus().toggleOrderedList().run()} />
    </div>
  );
}

type ToolbarButtonProps = {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
};

function ToolbarButton({ label, active, disabled, onClick }: ToolbarButtonProps) {
  function handleMouseDown(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!disabled) {
      onClick();
    }
  }

  return (
    <button
      className={active ? "toolbar-button active" : "toolbar-button"}
      disabled={disabled}
      onMouseDown={handleMouseDown}
      type="button"
    >
      {label}
    </button>
  );
}
