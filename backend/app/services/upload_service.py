import re
from typing import Any

from fastapi import HTTPException, UploadFile, status

SUPPORTED_EXTENSIONS = {".txt", ".md"}


def parse_uploaded_document(file: UploadFile) -> tuple[str, dict[str, Any]]:
    extension = _get_extension(file.filename or "")
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Upload a .txt or .md file.",
        )

    raw = file.file.read()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file must be UTF-8 encoded.",
        ) from exc

    title = (file.filename or "Imported document").rsplit(".", 1)[0] or "Imported document"
    return title, markdown_to_tiptap(text)


def markdown_to_tiptap(text: str) -> dict[str, Any]:
    content: list[dict[str, Any]] = []
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()
        if not stripped:
            i += 1
            continue
        if stripped.startswith("## "):
            content.append(_heading(stripped[3:], 2))
            i += 1
            continue
        if stripped.startswith("# "):
            content.append(_heading(stripped[2:], 1))
            i += 1
            continue
        if re.match(r"^[-*]\s+", stripped):
            items = []
            while i < len(lines) and re.match(r"^\s*[-*]\s+", lines[i]):
                item_text = re.sub(r"^\s*[-*]\s+", "", lines[i]).strip()
                items.append(_list_item(item_text))
                i += 1
            content.append({"type": "bulletList", "content": items})
            continue
        if re.match(r"^\d+\.\s+", stripped):
            items = []
            while i < len(lines) and re.match(r"^\s*\d+\.\s+", lines[i]):
                item_text = re.sub(r"^\s*\d+\.\s+", "", lines[i]).strip()
                items.append(_list_item(item_text))
                i += 1
            content.append({"type": "orderedList", "content": items})
            continue

        paragraph_lines = [stripped]
        i += 1
        while i < len(lines) and lines[i].strip() and not _is_special_line(lines[i].strip()):
            paragraph_lines.append(lines[i].strip())
            i += 1
        content.append({"type": "paragraph", "content": _inline_marks(" ".join(paragraph_lines))})

    return {"type": "doc", "content": content or [{"type": "paragraph"}]}


def _heading(value: str, level: int) -> dict[str, Any]:
    return {"type": "heading", "attrs": {"level": level}, "content": _inline_marks(value)}


def _list_item(value: str) -> dict[str, Any]:
    return {"type": "listItem", "content": [{"type": "paragraph", "content": _inline_marks(value)}]}


def _inline_marks(value: str) -> list[dict[str, Any]]:
    tokens: list[dict[str, Any]] = []
    pattern = re.compile(r"(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)")
    last_index = 0
    for match in pattern.finditer(value):
        if match.start() > last_index:
            tokens.append({"type": "text", "text": value[last_index:match.start()]})
        token = match.group(0)
        text = token.strip("*_")
        mark_type = "bold" if token.startswith("**") or token.startswith("__") else "italic"
        tokens.append({"type": "text", "text": text, "marks": [{"type": mark_type}]})
        last_index = match.end()
    if last_index < len(value):
        tokens.append({"type": "text", "text": value[last_index:]})
    return tokens or [{"type": "text", "text": value}]


def _is_special_line(value: str) -> bool:
    return (
        value.startswith("# ")
        or value.startswith("## ")
        or bool(re.match(r"^[-*]\s+", value))
        or bool(re.match(r"^\d+\.\s+", value))
    )


def _get_extension(filename: str) -> str:
    if "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[1].lower()
