"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLLMStore } from "@/lib/stores/llm-store";
import { useToast } from "@/hooks/use-toast";
import { Brain, Key, X, Cloud, Check, AlertCircle } from "lucide-react";

const models = [
  { value: "gpt-4", label: "GPT-4", provider: "openai" },
  { value: "claude-3-opus", label: "Claude 3 Opus", provider: "anthropic" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet", provider: "anthropic" },
  { value: "ollama-3.2", label: "Ollama 3.2", provider: "ollama" },
  { value: "qwen-2.5", label: "Qwen 2.5", provider: "qwen" },
] as const;

export function LLMSettings() {
  const {
    configs,
    endpoints,
    activeModels,
    setConfig,
    setEndpoint,
    validateEndpoint,
    deployToCloud,
    addActiveModel,
    removeActiveModel,
  } = useLLMStore();

  const [openaiKey, setOpenaiKey] = useState(configs.openai || "");
  const [anthropicKey, setAnthropicKey] = useState(configs.anthropic || "");
  const [ollamaUrl, setOllamaUrl] = useState(endpoints.ollama?.url || "");
  const [qwenUrl, setQwenUrl] = useState(endpoints.qwen?.url || "");
  const { toast } = useToast();

  const handleSaveKeys = () => {
    setConfig("openai", openaiKey);
    setConfig("anthropic", anthropicKey);
    toast({
      title: "API Keys Saved",
      description: "Your API keys have been securely saved.",
    });
  };

  const handleSetEndpoint = async (model: string, url: string) => {
    setEndpoint(model, url);
    await validateEndpoint(model);
  };

  const handleDeployToCloud = async (model: string) => {
    try {
      await deployToCloud(model);
      toast({
        title: "Deployment Successful",
        description: `${model} has been deployed to Google Cloud.`,
      });
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddModel = (model: string) => {
    addActiveModel(model as any);
    toast({
      title: "Model Added",
      description: `${models.find((m) => m.value === model)?.label} is now active.`,
    });
  };

  const handleRemoveModel = (model: string) => {
    removeActiveModel(model as any);
    toast({
      title: "Model Removed",
      description: `${models.find((m) => m.value === model)?.label} has been deactivated.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <div>
            <CardTitle>Language Models</CardTitle>
            <CardDescription>
              Configure your AI language model settings
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Models Section */}
        <div className="space-y-2">
          <Label>Active Models</Label>
          <div className="flex flex-wrap gap-2">
            {activeModels.map((model) => (
              <Badge key={model} variant="secondary" className="flex items-center gap-1">
                {models.find((m) => m.value === model)?.label}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => handleRemoveModel(model)}
                />
              </Badge>
            ))}
          </div>
          <Select onValueChange={handleAddModel}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Add model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => {
                const provider = model.provider;
                const hasProviderModel = activeModels.some(m => 
                  models.find(mod => mod.value === m)?.provider === provider
                );
                const isActive = activeModels.includes(model.value as any);

                return (
                  <SelectItem
                    key={model.value}
                    value={model.value}
                    disabled={isActive || (!configs[provider] && !hasProviderModel)}
                  >
                    {model.label}
                    {isActive && " (Active)"}
                    {!configs[provider] && " (API Key Required)"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* API Keys Section */}
        <div className="space-y-4">
          <div>
            <Label>OpenAI API Key</Label>
            <div className="flex space-x-2">
              <Input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="Enter OpenAI API key"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpenaiKey("")}
              >
                <Key className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Anthropic API Key</Label>
            <div className="flex space-x-2">
              <Input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="Enter Anthropic API key"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAnthropicKey("")}
              >
                <Key className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Endpoints Section */}
        <div className="space-y-4">
          <div>
            <Label>Ollama Endpoint</Label>
            <div className="flex space-x-2">
              <Input
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="Enter Ollama endpoint URL"
              />
              <Button
                variant="outline"
                onClick={() => handleSetEndpoint('ollama', ollamaUrl)}
              >
                {endpoints.ollama?.validated ? (
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                )}
                Validate
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDeployToCloud('ollama')}
                disabled={!endpoints.ollama?.validated}
              >
                <Cloud className="h-4 w-4 mr-2" />
                Deploy
              </Button>
            </div>
          </div>

          <div>
            <Label>Qwen Endpoint</Label>
            <div className="flex space-x-2">
              <Input
                value={qwenUrl}
                onChange={(e) => setQwenUrl(e.target.value)}
                placeholder="Enter Qwen endpoint URL"
              />
              <Button
                variant="outline"
                onClick={() => handleSetEndpoint('qwen', qwenUrl)}
              >
                {endpoints.qwen?.validated ? (
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                )}
                Validate
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDeployToCloud('qwen')}
                disabled={!endpoints.qwen?.validated}
              >
                <Cloud className="h-4 w-4 mr-2" />
                Deploy
              </Button>
            </div>
          </div>
        </div>

        <Button onClick={handleSaveKeys}>Save API Keys</Button>
      </CardContent>
    </Card>
  );
}