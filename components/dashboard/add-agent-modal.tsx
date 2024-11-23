"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgentStore } from '@/lib/stores/agent-store';
import { useToast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';

const agentFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['system-design', 'code-generation', 'data-processing', 'workflow-automation']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  capabilities: z.array(z.string()).min(1, 'Select at least one capability'),
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

const agentCapabilities = {
  'system-design': [
    'Architecture Planning',
    'Cost Analysis',
    'Integration Design',
  ],
  'code-generation': [
    'Workflow Generation',
    'Testing',
    'Deployment',
  ],
  'data-processing': [
    'Document Processing',
    'Data Extraction',
    'Schema Mapping',
  ],
  'workflow-automation': [
    'Task Orchestration',
    'Error Handling',
    'Status Monitoring',
  ],
};

export function AddAgentModal() {
  const [open, setOpen] = useState(false);
  const { addAgent } = useAgentStore();
  const { toast } = useToast();
  
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: '',
      type: 'system-design',
      description: '',
      capabilities: [],
    },
  });

  const onSubmit = async (data: AgentFormValues) => {
    try {
      addAgent({
        name: data.name,
        type: data.type,
        description: data.description,
        capabilities: data.capabilities,
      });
      
      toast({
        title: "Agent Created",
        description: `${data.name} has been successfully created.`,
      });
      
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create agent. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleCapability = (capability: string) => {
    const currentCapabilities = form.getValues('capabilities');
    const newCapabilities = currentCapabilities.includes(capability)
      ? currentCapabilities.filter(cap => cap !== capability)
      : [...currentCapabilities, capability];
    form.setValue('capabilities', newCapabilities);
  };

  const removeCapability = (capability: string) => {
    const currentCapabilities = form.getValues('capabilities');
    form.setValue(
      'capabilities',
      currentCapabilities.filter(cap => cap !== capability)
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Agent</DialogTitle>
          <DialogDescription>
            Create a new AI agent by defining its parameters and capabilities.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter agent name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('capabilities', []);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="system-design">System Design</SelectItem>
                      <SelectItem value="code-generation">Code Generation</SelectItem>
                      <SelectItem value="data-processing">Data Processing</SelectItem>
                      <SelectItem value="workflow-automation">Workflow Automation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter agent description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capabilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capabilities</FormLabel>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {form.watch('type') &&
                        agentCapabilities[form.watch('type')].map((capability) => (
                          <Badge
                            key={capability}
                            variant={field.value.includes(capability) ? "default" : "outline"}
                            className="cursor-pointer hover:opacity-80"
                            onClick={() => toggleCapability(capability)}
                          >
                            {capability}
                          </Badge>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((capability) => (
                        <Badge
                          key={capability}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {capability}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => removeCapability(capability)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <FormDescription>
                    Click capabilities to select/deselect them
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit">Create Agent</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}