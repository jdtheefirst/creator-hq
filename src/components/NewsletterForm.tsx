"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

export default function NewsletterForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { supabase } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);

  const onSubmit = async (data: FormData) => {
    const now = Date.now();
    if (now - lastSubmissionTime < 5000) {
      return setNotification({
        message: "Hold up! Try again in a few seconds.",
        type: "info",
      });
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert([{ email: data.email }]);

      if (error) {
        if (error.code === "23505") {
          setNotification({
            message: "You already subscribed, superstar!",
            type: "info",
          });
        } else {
          throw error;
        }
      } else {
        setNotification({
          message: "You're in! Watch your inbox 🎉",
          type: "success",
        });
        reset();
        setLastSubmissionTime(now);
      }
    } catch (err) {
      setNotification({
        message: "Whoops! Something went wrong.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 sm:flex justify-center"
    >
      <div className="min-w-0 flex-1">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register("email")}
          className={`block w-full rounded-md border px-4 py-3 text-base placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 ${
            errors.email ? "border-red-500" : "border-gray-300"
          }`}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>
      <div className="mt-3 sm:mt-0 sm:ml-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`block w-full rounded-md bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSubmitting ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-white rounded-full mr-2" />
              Subscribing...
            </div>
          ) : (
            "Subscribe"
          )}
        </button>
      </div>

      {notification && (
        <div className="w-full text-center mt-4 text-sm text-gray-600">
          <p
            className={`${
              notification.type === "success"
                ? "text-green-600"
                : notification.type === "error"
                  ? "text-red-600"
                  : "text-blue-600"
            }`}
          >
            {notification.message}
          </p>
        </div>
      )}
    </form>
  );
}
