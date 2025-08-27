"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Users, Menu, X } from "lucide-react"
import usePartySocket from "partysocket/react"

interface Message {
  id: string
  text: string
  username: string
  timestamp: number
  isOwn?: boolean
}

interface ConnectedUser {
  id: string
  username: string
}

export function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [username, setUsername] = useState("")
  const [isUsernameSet, setIsUsernameSet] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
    party: "main",
    room: "anonymous-chat",
    onOpen() {
      console.log("[client] Connected to PartyKit")
      setConnectionStatus("connected")
    },
    onClose() {
      console.log("[client] Disconnected from PartyKit")
      setConnectionStatus("disconnected")
    },
    onError(error) {
      console.log("[client] PartyKit connection error:", error)
      setConnectionStatus("disconnected")
    },
    onMessage(event) {
      console.log("[client] Received message:", event.data)

      if (event.data === "hello from server") {
        console.log("[client] Received default PartyKit message - custom server may not be running")
        return
      }

      try {
        const data = JSON.parse(event.data)
        console.log("[client] Parsed data:", data)

        if (data.type === "message") {
          setMessages((prev) => [
            ...prev,
            {
              id: data.id,
              text: data.text,
              username: data.username,
              timestamp: data.timestamp,
              isOwn: data.username === username,
            },
          ])
        } else if (data.type === "user-count") {
          setOnlineCount(data.count)
        } else if (data.type === "user-list") {
          setConnectedUsers(data.users || [])
        }
      } catch (error) {
        console.log("[client] Failed to parse message as JSON:", error)
        console.log("[client] Raw message data:", event.data)
      }
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateUsername = () => {
    const adjectives = ["Anonymous", "Mystery", "Secret", "Hidden", "Silent", "Quiet", "Phantom", "Shadow"]
    const nouns = ["User", "Person", "Guest", "Visitor", "Stranger", "Friend", "Chatter", "Voice"]
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
    const randomNumber = Math.floor(Math.random() * 1000)
    return `${randomAdjective}${randomNoun}${randomNumber}`
  }

  const handleSetUsername = () => {
    if (username.trim()) {
      setIsUsernameSet(true)
      socket.send(
        JSON.stringify({
          type: "join",
          username: username.trim(),
        }),
      )
    }
  }

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      const message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        username,
        timestamp: Date.now(),
      }

      socket.send(
        JSON.stringify({
          type: "message",
          message,
        }),
      )

      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (isUsernameSet) {
        handleSendMessage()
      } else {
        handleSetUsername()
      }
    }
  }

  if (!isUsernameSet) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md p-8 bg-card">
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Anonymous Chat</h1>
              <p className="text-muted-foreground">Choose a username to start chatting</p>
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Enter your username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-center"
                maxLength={20}
              />

              <div className="flex gap-2">
                <Button onClick={handleSetUsername} disabled={!username.trim()} className="flex-1">
                  Join Chat
                </Button>
                <Button variant="outline" onClick={() => setUsername(generateUsername())} className="px-4">
                  Random
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background">
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            Online ({onlineCount})
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {connectedUsers.length > 0 ? (
              connectedUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-2 rounded-lg text-sm ${
                    user.username === username
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {user.username}
                  {user.username === username && " (you)"}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No users online</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="lg:hidden">
                <Menu className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Anonymous Chat</h1>
                <p className="text-sm text-muted-foreground">Connected as {username}</p>
                {connectionStatus !== "connected" && (
                  <p className="text-xs text-amber-600">
                    {connectionStatus === "connecting" ? "Connecting..." : "Disconnected - Start PartyKit server"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground lg:hidden">
              <Users className="w-4 h-4" />
              <span className="text-sm">{onlineCount} online</span>
            </div>
          </div>
        </div>

        {connectionStatus === "disconnected" && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 m-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  <strong>PartyKit Server Not Running</strong>
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  To enable real-time chat, run:{" "}
                  <code className="bg-amber-100 px-1 rounded">npx partykit dev party/server.ts</code>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground border border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium opacity-75">{message.username}</span>
                    <span className="text-xs opacity-50">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm break-words">{message.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border bg-card p-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              maxLength={500}
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
