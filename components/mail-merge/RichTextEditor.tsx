"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImageIcon,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Table2,
  Smile,
} from "lucide-react";
import { FontSize } from "@/lib/mail-merge/font-size-extension";

const EMOJIS = ["😀", "😊", "🎉", "👍", "🙏", "❤️", "✅", "⭐", "📎", "📅"];
const FONT_FAMILIES = ["Default", "Arial", "Georgia", "Times New Roman", "Courier New"];
const FONT_SIZES = ["12px", "14px", "16px", "18px", "24px", "32px"];

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-brand-brown-dark/70 transition-colors hover:bg-brand-cream disabled:opacity-30 ${
        active ? "bg-brand-blue/10 text-brand-blue-deep" : ""
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [emojiOpen, setEmojiOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-brand-brown-dark/10 bg-brand-cream/60 p-2">
      <select
        onChange={(e) => {
          const value = e.target.value;
          if (value === "Default") editor.chain().focus().unsetFontFamily().run();
          else editor.chain().focus().setFontFamily(value).run();
        }}
        className="h-8 rounded-lg border border-brand-brown-dark/15 bg-white px-1 text-xs text-brand-brown-dark"
        defaultValue="Default"
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <select
        onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
        className="h-8 rounded-lg border border-brand-brown-dark/15 bg-white px-1 text-xs text-brand-brown-dark"
        defaultValue="16px"
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        onChange={(e) => {
          const value = e.target.value;
          if (value === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(value) as 1 | 2 | 3 }).run();
        }}
        className="h-8 rounded-lg border border-brand-brown-dark/15 bg-white px-1 text-xs text-brand-brown-dark"
        defaultValue="p"
      >
        <option value="p">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>

      <span className="mx-1 h-6 w-px bg-brand-brown-dark/10" />

      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={15} />
      </ToolbarButton>

      <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-brand-cream" title="Text color">
        <input
          type="color"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
        />
      </label>
      <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-brand-cream" title="Background color">
        <input
          type="color"
          onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
        />
      </label>

      <span className="mx-1 h-6 w-px bg-brand-brown-dark/10" />

      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={15} />
      </ToolbarButton>

      <ToolbarButton
        label="Align left"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft size={15} />
      </ToolbarButton>
      <ToolbarButton
        label="Align center"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter size={15} />
      </ToolbarButton>
      <ToolbarButton
        label="Align right"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight size={15} />
      </ToolbarButton>

      <span className="mx-1 h-6 w-px bg-brand-brown-dark/10" />

      <ToolbarButton
        label="Insert link"
        active={editor.isActive("link")}
        onClick={() => {
          const url = window.prompt("Link URL");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        <LinkIcon size={15} />
      </ToolbarButton>
      <ToolbarButton
        label="Insert image"
        onClick={() => {
          const url = window.prompt("Image URL");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
      >
        <ImageIcon size={15} />
      </ToolbarButton>
      <ToolbarButton
        label="Insert table"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <Table2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        label="Horizontal line"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={15} />
      </ToolbarButton>

      <div className="relative">
        <ToolbarButton label="Emoji" onClick={() => setEmojiOpen((o) => !o)}>
          <Smile size={15} />
        </ToolbarButton>
        {emojiOpen && (
          <div className="absolute left-0 top-full z-10 mt-1 flex w-48 flex-wrap gap-1 rounded-xl border border-brand-brown-dark/10 bg-white p-2 shadow-lg">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  editor.chain().focus().insertContent(emoji).run();
                  setEmojiOpen(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded hover:bg-brand-cream"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="mx-1 h-6 w-px bg-brand-brown-dark/10" />

      <ToolbarButton
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 size={15} />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder,
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder || "Write your message…" }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none px-5 py-4 min-h-[220px] focus:outline-none",
      },
    },
  });

  // Keep the editor in sync when `content` is replaced from outside (e.g.
  // loading a template) rather than typed.
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-brown-dark/15 bg-white">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
