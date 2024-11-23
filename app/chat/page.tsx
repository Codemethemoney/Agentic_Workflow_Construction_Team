"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Bot, User, AlertCircle } from "lucide-react";
import { useAgentStore } from "@/lib/stores/agent-store";

interface Message {
  id: string;
  type: "user" | "agent" | "system";
  content: string;
  agentId?: string;
  timestamp: number;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const agents = useAgentStore((state) => state.agents);
  const activeAgents = agents.filter((agent) => agent.status === "active");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      type: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // Simulate agent response
    setTimeout(() => {
      const agentResponse: Message = {
        id: Math.random().toString(36).substring(7),
        type: "agent",
        content: `Processing your request: "${input}"`,
        agentId: selectedAgent || undefined,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, agentResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground">
          Communicate with your AI agents
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardContent className="p-4">
            <Select
              value={selectedAgent || "all"}
              onValueChange={(value) => setSelectedAgent(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an agent to chat with" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {activeAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="h-[600px] flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Bot className="h-12 w-12 mb-4" />
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.type === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {message.type === "user" ? (
                      <User className="h-8 w-8 p-1 rounded-full bg-primary text-primary-foreground" />
                    ) : message.type === "agent" ? (
                      <Bot className="h-8 w-8 p-1 rounded-full bg-secondary" />
                    ) : (
                      <AlertCircle className="h-8 w-8 p-1 rounded-full bg-muted" />
                    )}
                    <div
                      className={`rounded-lg p-3 max-w-[80%] ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.agentId && (
                        <p className="text-xs font-medium mb-1">
                          {agents.find((a) => a.id === message.agentId)?.name ||
                            "Unknown Agent"}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!selectedAgent && activeAgents.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                No agent selected. Message will be broadcast to all active agents.
              </p>
            )}
            {activeAgents.length === 0 && (
              <p className="text-xs text-destructive mt-2">
                No active agents available. Please activate an agent to start chatting.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}