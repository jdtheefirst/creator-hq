"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// 1. Define schema with Zod
const waitlistSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .min(1, "Email is required"),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

export default function WaitlistForm() {
  // 2. Initialize react-hook-form with Zod resolver
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
  });
  const router = useRouter();

  const onSubmit = async ({ email }: WaitlistFormData) => {
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Something went wrong");

      toast.success(result.message, {
        description: result.isNew
          ? "We'll notify you when we launch!"
          : "Thanks for your continued interest!",
      });

      if (result.isNew) {
        reset(); // Only reset form if it was a new signup
      }
      router.push("/packages");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-yellow-400 text-black rounded-xl p-6 md:p-10 max-w-2xl mx-auto text-center shadow-xl"
    >
      <h3 className="text-3xl font-extrabold mb-2">Join the Waitlist</h3>
      <p className="mb-4 text-sm md:text-base">
        Be the first to unlock the new CreatorHQ Monthly. Perks, tools, and
        clout included.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col md:flex-row items-center gap-4 justify-center"
      >
        <div className="w-full md:w-auto">
          <Input
            type="email"
            placeholder="you@creator.com"
            className="px-4 py-2 rounded-lg bg-white text-black placeholder-gray-600"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600 text-left">
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-yellow-400 font-semibold px-6 py-2 rounded-xl hover:bg-gray-900 transition"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            "Join Waitlist"
          )}
        </Button>
      </form>
    </motion.div>
  );
}
