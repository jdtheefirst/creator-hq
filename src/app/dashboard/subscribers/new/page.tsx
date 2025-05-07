"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { Switch } from "@/components/ui/switch";

// Lazy load the editor to avoid SSR issues
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

const schema = z.object({
  title: z.string().min(3, "Title is too short"),
  subject: z.string().min(3, "Subject is too short"),
  content: z.string().min(10, "Content is too short"),
  scheduled_for: z.date().optional().nullable(),
  status: z.enum(["draft", "scheduled"]),
});

type FormData = z.infer<typeof schema>;

export default function CreateNewsletterCampaign() {
  const router = useRouter();
  const { user, supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

  const form = useForm<FormData, any, FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      subject: "",
      content: "",
      scheduled_for: null,
      status: "draft",
    },
  });
  const { control } = form;

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .insert([
          {
            creator_id: user?.id,
            title: values.title,
            subject: values.subject,
            content: values.content,
            status: isScheduled ? "scheduled" : "draft",
            scheduled_for: isScheduled ? values.scheduled_for : null,
            stats: { sent: 0, opened: 0, clicked: 0 },
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Campaign created successfully!");
      router.push(`/dashboard/subscribers/campaigns/${data.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create Newsletter Campaign</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <Label>Title *</Label>
                  <FormControl>
                    <Input placeholder="Campaign Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <Label>Subject *</Label>
                  <FormControl>
                    <Input placeholder="Subject Line" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <Label>Content *</Label>
                <FormControl>
                  <Editor
                    value={field.value}
                    onChange={(content) => field.onChange(content)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center space-x-4">
            <Switch
              id="schedule-toggle"
              checked={isScheduled}
              onCheckedChange={(checked) => {
                setIsScheduled(checked);
                if (!checked) {
                  form.setValue("scheduled_for", null);
                }
              }}
            />
            <Label htmlFor="schedule-toggle">Schedule for later</Label>
          </div>

          {isScheduled && (
            <FormField
              control={form.control}
              name="scheduled_for"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Label>Scheduled Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="w-[240px] pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/subscribers/campaigns")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Campaign"}
            </Button>
            {isScheduled && (
              <Button
                type="submit"
                variant="secondary"
                disabled={loading}
                onClick={() => form.setValue("status", "scheduled")}
              >
                {loading ? "Scheduling..." : "Schedule"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
