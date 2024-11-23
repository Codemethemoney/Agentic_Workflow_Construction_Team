"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, RotateCcw } from "lucide-react";

interface InstructionsEditorProps {
  defaultInstructions: string;
  onInstructionsChange: (instructions: string) => void;
}

export function InstructionsEditor({
  defaultInstructions,
  onInstructionsChange,
}: InstructionsEditorProps) {
  const [instructions, setInstructions] = useState(defaultInstructions);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    onInstructionsChange(instructions);
    toast({
      title: "Instructions Updated",
      description: "System instructions have been updated successfully.",
    });
    setOpen(false);
  };

  const handleReset = () => {
    setInstructions(defaultInstructions);
    toast({
      title: "Instructions Reset",
      description: "System instructions have been reset to default.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="absolute top-4 right-4">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>System Instructions Editor</DialogTitle>
          <DialogDescription>
            Customize the guidance system's behavior by modifying its instructions
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
            placeholder="Enter system instructions..."
          />
        </ScrollArea>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Instructions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}