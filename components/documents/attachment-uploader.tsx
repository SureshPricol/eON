"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { EONAttachment } from "@/lib/storage"
import { Upload, File, X, Paperclip } from "lucide-react"

interface AttachmentUploaderProps {
  attachments: EONAttachment[]
  onChange: (attachments: EONAttachment[]) => void
  eonId?: string
  userId: string
}

export function AttachmentUploader({ attachments, onChange, eonId, userId }: AttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const newAttachments: EONAttachment[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Simulate upload progress
      setUploadProgress((i / files.length) * 100)

      // In a real app, you would upload to OneDrive or another storage service
      // For demo, we'll create a blob URL and store file info
      const fileUrl = URL.createObjectURL(file)

      const attachment: EONAttachment = {
        id: Date.now().toString() + i,
        eon_id: eonId || "temp",
        added_by_user_id: userId,
        filename: file.name,
        size: file.size,
        file_url: fileUrl,
        added_at: new Date().toISOString(),
      }

      newAttachments.push(attachment)
    }

    setUploadProgress(100)
    onChange([...attachments, ...newAttachments])

    setTimeout(() => {
      setUploading(false)
      setUploadProgress(0)
    }, 500)
  }

  const removeAttachment = (id: string) => {
    const attachment = attachments.find((a) => a.id === id)
    if (attachment && attachment.file_url.startsWith("blob:")) {
      URL.revokeObjectURL(attachment.file_url)
    }
    onChange(attachments.filter((a) => a.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          Attachments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-1">Drag & drop files here, or click to upload</p>
          <p className="text-xs text-muted-foreground">Max 50MB per file</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading files...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Attachments List */}
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
              <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{attachment.filename}</div>
                <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(attachment.id)}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {attachments.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No attachments added.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
