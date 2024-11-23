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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Folder, File, Tag, Plus, Search, Upload } from 'lucide-react';

const documentSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['text', 'pdf', 'code']),
  tags: z.array(z.string()),
  folder: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

export function DocumentManager() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      tags: [],
    },
  });

  const onSubmit = async (data: DocumentFormValues) => {
    try {
      // Here you would integrate with your knowledge management system
      console.log('Adding document:', data);
      
      toast({
        title: "Document Added",
        description: "The document has been successfully stored.",
      });
      
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[300px]"
          />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Document</DialogTitle>
              <DialogDescription>
                Add a new document to the knowledge base
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter document title" {...field} />
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
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="code">Code</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter document content"
                          className="h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="folder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Folder</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select folder" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="workflows">Workflows</SelectItem>
                          <SelectItem value="agents">Agents</SelectItem>
                          <SelectItem value="documentation">Documentation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => {
                              const newTags = field.value.filter((_, i) => i !== index);
                              field.onChange(newTags);
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                        <Input
                          placeholder="Add tag..."
                          className="w-[150px]"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const newTag = input.value.trim();
                              if (newTag && !field.value.includes(newTag)) {
                                field.onChange([...field.value, newTag]);
                                input.value = '';
                              }
                            }
                          }}
                        />
                      </div>
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
                  <Button type="submit">Add Document</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1 space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-2">Folders</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm cursor-pointer hover:text-primary">
                <Folder className="h-4 w-4" />
                <span>Workflows</span>
              </div>
              <div className="flex items-center space-x-2 text-sm cursor-pointer hover:text-primary">
                <Folder className="h-4 w-4" />
                <span>Agents</span>
              </div>
              <div className="flex items-center space-x-2 text-sm cursor-pointer hover:text-primary">
                <Folder className="h-4 w-4" />
                <span>Documentation</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">workflow</Badge>
              <Badge variant="outline">agent</Badge>
              <Badge variant="outline">documentation</Badge>
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <ScrollArea className="h-[600px] rounded-lg border p-4">
            <div className="space-y-4">
              {/* Example document items */}
              <DocumentItem
                title="Workflow Documentation"
                type="text"
                tags={['workflow', 'documentation']}
                updatedAt="2024-01-20"
              />
              <DocumentItem
                title="Agent Configuration"
                type="code"
                tags={['agent', 'configuration']}
                updatedAt="2024-01-19"
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function DocumentItem({ title, type, tags, updatedAt }: {
  title: string;
  type: string;
  tags: string[];
  updatedAt: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary transition-colors">
      <div className="flex items-center space-x-4">
        <File className="h-8 w-8 text-muted-foreground" />
        <div>
          <h4 className="font-medium">{title}</h4>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{type}</span>
            <span>•</span>
            <span>Updated {updatedAt}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}