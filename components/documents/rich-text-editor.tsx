"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  ImageIcon,
  LinkIcon,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter description...",
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const isCommandActive = (command: string) => {
    return document.queryCommandState(command)
  }

  const toolbarButtons = [
    { command: "bold", icon: Bold, label: "Bold" },
    { command: "italic", icon: Italic, label: "Italic" },
    { command: "underline", icon: Underline, label: "Underline" },
    { command: "strikeThrough", icon: Strikethrough, label: "Strikethrough" },
  ]

  const alignmentButtons = [
    { command: "justifyLeft", icon: AlignLeft, label: "Align Left" },
    { command: "justifyCenter", icon: AlignCenter, label: "Align Center" },
    { command: "justifyRight", icon: AlignRight, label: "Align Right" },
  ]

  const listButtons = [
    { command: "insertUnorderedList", icon: List, label: "Bullet List" },
    { command: "insertOrderedList", icon: ListOrdered, label: "Numbered List" },
  ]

  return (
    <div className={`border rounded-lg ${isFocused ? "ring-2 ring-primary ring-offset-2" : ""} ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
        {/* Formatting buttons */}
        {toolbarButtons.map((button) => (
          <Button
            key={button.command}
            variant={isCommandActive(button.command) ? "secondary" : "ghost"}
            size="sm"
            onClick={() => executeCommand(button.command)}
            className="h-8 w-8 p-0"
            title={button.label}
            type="button"
          >
            <button.icon className="w-4 h-4" />
          </Button>
        ))}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment buttons */}
        {alignmentButtons.map((button) => (
          <Button
            key={button.command}
            variant={isCommandActive(button.command) ? "secondary" : "ghost"}
            size="sm"
            onClick={() => executeCommand(button.command)}
            className="h-8 w-8 p-0"
            title={button.label}
            type="button"
          >
            <button.icon className="w-4 h-4" />
          </Button>
        ))}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* List buttons */}
        {listButtons.map((button) => (
          <Button
            key={button.command}
            variant={isCommandActive(button.command) ? "secondary" : "ghost"}
            size="sm"
            onClick={() => executeCommand(button.command)}
            className="h-8 w-8 p-0"
            title={button.label}
            type="button"
          >
            <button.icon className="w-4 h-4" />
          </Button>
        ))}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link and Image buttons */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt("Enter URL:")
            if (url) executeCommand("createLink", url)
          }}
          className="h-8 w-8 p-0"
          title="Insert Link"
          type="button"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt("Enter image URL:")
            if (url) executeCommand("insertImage", url)
          }}
          className="h-8 w-8 p-0"
          title="Insert Image"
          type="button"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="min-h-[120px] p-3 outline-none prose prose-sm max-w-none"
        style={{ whiteSpace: "pre-wrap" }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
