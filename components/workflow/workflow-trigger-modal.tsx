"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/lib/stores/workflow-store";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const triggerSchema = z.object({
  type: z.enum(["agent-output", "schedule", "event"]),
  config: z.object({
    eventType: z.string().optional(),
    schedule: z.string().optional(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(["equals", "contains", "gt", "lt"]),
      value: z.string(),
    })).optional(),
  }),
});

export function WorkflowTriggerModal() {
  const [open, setOpen] = useState(false);
  const { selectedWorkflow, addTrigger } = useWorkflowStore();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(triggerSchema),
    defaultValues: {
      type: "event",
      config: {
        conditions: [],
      },
    },
  });

  const onSubmit = (data: z.infer<typeof triggerSchema>) => {
    if (!selectedWorkflow) {
      toast({
        title: "No Workflow Selected",
        description: "Please select a workflow first",
        variant: "destructive",
      });
      return;
    }

    addTrigger(selectedWorkflow, {
      ...data,
      id: Math.random().toString(36).substring(7),
    });

    toast({
      title: "Trigger Added",
      description: "The trigger has been added to the workflow",
    });

    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Trigger
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Workflow Trigger</DialogTitle>
          <DialogDescription>
            Configure a trigger to automatically start this workflow
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trigger Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="event">Event Based</SelectItem>
                      <SelectItem value="schedule">Schedule Based</SelectItem>
                      <SelectItem value="agent-output">Agent Output</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("type") === "event" && (
              <FormField
                control={form.control}
                name="config.eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event type" {...field} />
                    </FormControl>
                    <FormDescription>
                      e.g., file_uploaded, data_received
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("type") === "schedule" && (
              <FormField
                control={form.control}
                name="config.schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule (Cron Expression)</FormLabel>
                    <FormControl>
                      <Input placeholder="*/5 * * * *" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter a cron expression for scheduling
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit">Add Trigger</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}