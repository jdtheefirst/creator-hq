"use client";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEffect, useState, use, useCallback } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Loader,
  MailOpen,
  MousePointerClick,
  Send,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";

const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-muted animate-pulse rounded-md" />
  ),
});

const campaignSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").max(100),
  subject: z.string().min(1, "Subject is required").max(150),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["draft", "scheduled", "sending", "sent", "failed"]),
  scheduled_for: z.string().nullable().optional(),
  sent_at: z.string().nullable().optional(),
  stats: z
    .object({
      sent: z.number(),
      opened: z.number(),
      clicked: z.number(),
    })
    .optional(),
});

type Campaign = z.infer<typeof campaignSchema>;

export default function CampaignEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user, supabase } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date>();
  const [stats, setStats] = useState<Campaign["stats"]>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, isValid, isDirty, errors },
    reset,
  } = useForm<Campaign>({
    resolver: zodResolver(campaignSchema),
    mode: "onChange",
  });

  const formValues = watch();

  const fetchCampaign = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .eq("id", resolvedParams.id)
        .eq("creator_id", user?.id)
        .single();

      if (error) throw error;

      const parsedData = campaignSchema.parse(data);
      reset(parsedData);
      setStats(parsedData.stats);

      if (parsedData.scheduled_for) {
        setDate(new Date(parsedData.scheduled_for));
      }
    } catch (err) {
      toast.success("Failed to fetch campaign");
      console.log("Error fetching campaign:", err);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchCampaign();
  }, [resolvedParams.id, fetchCampaign]);

  const onSubmit = async (data: Campaign) => {
    try {
      const { error } = await supabase
        .from("newsletter_campaigns")
        .update(data)
        .eq("id", resolvedParams.id)
        .eq("creator_id", user?.id);

      if (error) throw error;

      toast.success("Campaign saved successfully");
    } catch (err) {
      toast.error("Failed to save campaign");
    }
  };

  const handleSchedule = async () => {
    if (!date) return;

    try {
      await onSubmit({
        ...formValues,
        status: "scheduled",
        scheduled_for: date.toISOString(),
      });

      toast.success(`Campaign scheduled for ${format(date, "PPPpp")}`);
    } catch (err) {
      toast.error("Failed to schedule campaign");
    }
  };

  const handleSend = async () => {
    try {
      await onSubmit({
        ...formValues,
        status: "sending",
        sent_at: new Date().toISOString(),
      });

      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: resolvedParams.id }),
      });

      if (!response.ok) throw new Error("Failed to send campaign");

      toast.success("Campaign is being sent to subscribers");
      router.push("/dashboard/subscribers");
    } catch (err) {
      toast.error("Failed to send campaign");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  console.log("Form errors:", errors);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8">
        <h1 className="text-2xl font-bold">Edit Campaign</h1>
        {stats && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Send className="h-4 w-4" />
              <span>Sent: {stats.sent}</span>
            </div>
            <div className="flex items-center gap-1">
              <MailOpen className="h-4 w-4" />
              <span>Opened: {stats.opened}</span>
            </div>
            <div className="flex items-center gap-1">
              <MousePointerClick className="h-4 w-4" />
              <span>Clicked: {stats.clicked}</span>
            </div>
          </div>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Campaign Title
              </label>
              <Input
                id="title"
                {...register("title")}
                className="text-md font-bold"
                placeholder="Your campaign title"
              />
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium mb-1"
              >
                Email Subject
              </label>
              <Input
                id="subject"
                {...register("subject")}
                className="text-lg"
                placeholder="Your email subject line"
              />
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              Email Content
            </label>
            <Editor
              value={formValues.content}
              onChange={(value) =>
                setValue("content", value, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
            <div className="flex flex-wrap items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                onClick={handleSchedule}
                disabled={
                  !date || formValues.status !== "draft" || isSubmitting
                }
                variant="outline"
              >
                {isSubmitting ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Schedule
              </Button>

              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleSend}
              disabled={
                formValues.status !== "draft" || isSubmitting || !isValid
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Send Now
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
