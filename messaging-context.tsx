"use client"

import type React from "react"
import { createContext, useState, useContext } from "react"

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  read: boolean
}

interface Conversation {
  id: string
  participants: string[]
  messages: Message[]
  lastMessage?: Message
  lastActivity: Date
}

interface MessagingContextType {
  messages: Message[]
  conversations: Conversation[]
  sendMessage: (receiverId: string, content: string, senderId: string) => void
  markAsRead: (conversationId: string, userId: string) => void
  getConversation: (userId1: string, userId2: string) => Conversation | null
  getUnreadCount: (userId: string) => number
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "2",
      receiverId: "1",
      content: "Hi Sarah! I saw your application for the Nike internship. Would love to chat about it!",
      timestamp: new Date("2024-01-21T10:30:00"),
      read: false,
    },
    {
      id: "2",
      senderId: "1",
      receiverId: "2",
      content: "Hi Mike! Thank you for reaching out. I'm very excited about this opportunity!",
      timestamp: new Date("2024-01-21T11:15:00"),
      read: true,
    },
    {
      id: "3",
      senderId: "4",
      receiverId: "3",
      content: "Jessica, your background in finance looks great for our analyst position. Let's schedule a call!",
      timestamp: new Date("2024-01-20T14:20:00"),
      read: false,
    },
  ])

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      participants: ["1", "2"],
      messages: [
        {
          id: "1",
          senderId: "2",
          receiverId: "1",
          content: "Hi Sarah! I saw your application for the Nike internship. Would love to chat about it!",
          timestamp: new Date("2024-01-21T10:30:00"),
          read: false,
        },
        {
          id: "2",
          senderId: "1",
          receiverId: "2",
          content: "Hi Mike! Thank you for reaching out. I'm very excited about this opportunity!",
          timestamp: new Date("2024-01-21T11:15:00"),
          read: true,
        },
      ],
      lastActivity: new Date("2024-01-21T11:15:00"),
    },
    {
      id: "2",
      participants: ["3", "4"],
      messages: [
        {
          id: "3",
          senderId: "4",
          receiverId: "3",
          content: "Jessica, your background in finance looks great for our analyst position. Let's schedule a call!",
          timestamp: new Date("2024-01-20T14:20:00"),
          read: false,
        },
      ],
      lastActivity: new Date("2024-01-20T14:20:00"),
    },
  ])

  const sendMessage = (receiverId: string, content: string, senderId: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId,
      receiverId,
      content,
      timestamp: new Date(),
      read: false,
    }

    // Find existing conversation
    const existingConvIndex = conversations.findIndex(
      (conv) => conv.participants.includes(senderId) && conv.participants.includes(receiverId),
    )

    if (existingConvIndex >= 0) {
      // Update existing conversation
      setConversations((convs) =>
        convs.map((conv, index) =>
          index === existingConvIndex
            ? {
                ...conv,
                messages: [...conv.messages, newMessage],
                lastMessage: newMessage,
                lastActivity: new Date(),
              }
            : conv,
        ),
      )
    } else {
      // Create new conversation
      const newConv: Conversation = {
        id: Date.now().toString(),
        participants: [senderId, receiverId],
        messages: [newMessage],
        lastMessage: newMessage,
        lastActivity: new Date(),
      }
      setConversations([...conversations, newConv])
    }
  }

  const getConversation = (userId1: string, userId2: string): Conversation | null => {
    return (
      conversations.find((conv) => conv.participants.includes(userId1) && conv.participants.includes(userId2)) || null
    )
  }

  const markAsRead = (conversationId: string, userId: string) => {
    setConversations((convs) =>
      convs.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: conv.messages.map((msg) => (msg.receiverId === userId ? { ...msg, read: true } : msg)),
            }
          : conv,
      ),
    )
  }

  const getUnreadCount = (userId: string): number => {
    let unread = 0
    conversations.forEach((conversation) => {
      conversation.messages.forEach((message) => {
        if (message.receiverId === userId && !message.read) {
          unread++
        }
      })
    })
    return unread
  }

  const value: MessagingContextType = {
    messages,
    conversations,
    sendMessage,
    markAsRead,
    getConversation,
    getUnreadCount,
  }

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>
}

export const useMessaging = () => {
  const context = useContext(MessagingContext)
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider")
  }
  return context
}
