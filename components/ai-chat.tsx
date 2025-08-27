"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Upload, FileText, Bot, User, Loader2, X } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: number;
}

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "processed" | "error";
  content: string;
  contentLength: number;
  error?: string;
  uploadedAt: string;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log("Starting file upload for", files.length, "files");

    // Validate files before upload
    const validFiles = Array.from(files).filter((file) => {
      const maxSize = 50 * 1024 * 1024; // 50MB limit
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
        "text/markdown",
      ];

      if (file.size > maxSize) {
        console.warn(`File ${file.name} is too large: ${file.size} bytes`);
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        console.warn(`File ${file.name} has unsupported type: ${file.type}`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content:
            "No valid files found. Please upload Word or text files under 50MB.",
          role: "assistant",
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    if (validFiles.length < files.length) {
      console.warn(
        `${files.length - validFiles.length} files were filtered out`
      );
    }

    setUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      validFiles.forEach((file) => {
        console.log(
          "Adding file to FormData:",
          file.name,
          file.type,
          file.size
        );
        formData.append("files", file);
      });

      // Upload files to the API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      const data = await response.json();

      // Add processed documents to state
      setDocuments((prev) => [...prev, ...data.documents]);

      // Add a welcome message when documents are uploaded
      if (messages.length === 0) {
        setMessages([
          {
            id: Date.now().toString(),
            content: `I've successfully uploaded and processed ${validFiles.length} document(s). You can now ask me questions about their content!`,
            role: "assistant",
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content:
            "Sorry, there was an error uploading your documents. Please try again.",
          role: "assistant",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    // Check if there are any successfully processed documents
    const processedDocs = documents.filter(
      (doc) => doc.status === "processed" && doc.content
    );
    if (processedDocs.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content:
            "I need at least one successfully processed document to answer questions. Please upload a document and wait for it to be processed.",
          role: "assistant",
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent.trim(),
      role: "user",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the AI API with the message and documents
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageContent.trim(),
          documents: documents,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let aiResponse = "";
      const aiMessageId = (Date.now() + 1).toString();

      // Add initial AI message
      const initialAIMessage: Message = {
        id: aiMessageId,
        content: "",
        role: "assistant",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, initialAIMessage]);

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        aiResponse += chunk;

        // Update the AI message with new content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, content: aiResponse } : msg
          )
        );
      }

      // If we got no response, show an error
      if (!aiResponse.trim()) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  content:
                    "Sorry, I received an empty response. Please try asking your question again.",
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleSendMessage(input);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSendMessage(input);
      }
    }
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    if (documents.length === 1) {
      // Clear messages when removing the last document
      setMessages([]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar for documents */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents ({documents.length})
          </h2>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Upload area */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".doc,.docx,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              DOC, TXT, MD files supported
            </p>
          </div>

          {/* Document list */}
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className={`p-3 ${
                  doc.status === "error" ? "border-red-200 bg-red-50" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText
                        className={`w-4 h-4 flex-shrink-0 ${
                          doc.status === "error"
                            ? "text-red-500"
                            : "text-primary"
                        }`}
                      />
                      <p className="text-sm font-medium truncate">{doc.name}</p>

                      {doc.status === "error" && (
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                          Error
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(doc.size)} • {doc.type}
                    </p>
                    {doc.status === "processed" && doc.content && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {doc.contentLength.toLocaleString()} characters
                        extracted
                      </p>
                    )}
                    {doc.status === "error" && doc.error && (
                      <p className="text-xs text-red-600 mt-1">{doc.error}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDocument(doc.id)}
                    className="h-6 w-6 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                AI Document Assistant
              </h1>
              <p className="text-sm text-muted-foreground">
                {documents.length > 0
                  ? `Ready to answer questions about ${
                      documents.filter(
                        (doc) => doc.status === "processed" && doc.content
                      ).length
                    } processed document(s)`
                  : "Upload documents to start chatting with AI"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && documents.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">
                Welcome to AI Document Assistant
              </p>
              <p className="text-sm">
                Upload documents to start asking questions about their content.
              </p>
            </div>
          ) : messages.length === 0 && documents.length > 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Documents uploaded! Ask me anything about their content.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex items-start gap-3 max-w-2xl">
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-card-foreground border border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium opacity-75">
                        {message.role === "user" ? "You" : "AI Assistant"}
                      </span>
                      <span className="text-xs opacity-50">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-2xl">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="px-4 py-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border bg-card p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Ask a question about your documents..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              maxLength={1000}
              disabled={
                documents.filter(
                  (doc) => doc.status === "processed" && doc.content
                ).length === 0 || isLoading
              }
            />
            <Button
              type="submit"
              disabled={
                !input.trim() ||
                isLoading ||
                documents.filter(
                  (doc) => doc.status === "processed" && doc.content
                ).length === 0
              }
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
