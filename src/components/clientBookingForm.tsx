"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, Mail, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const serviceOptions = [
  {
    label: "Consultation",
    value: "consultation",
    basePrice: 20,
    pricePerMinute: 0.33, // $20 for 60 mins ≈ $0.33/min
    description: "One-on-one strategy session to discuss your content goals",
    icon: <User className="w-5 h-5" />,
  },
  {
    label: "Workshop",
    value: "workshop",
    basePrice: 50,
    pricePerMinute: 0.83, // $50 for 60 mins ≈ $0.83/min
    description: "Interactive group session to learn content creation skills",
    icon: <Info className="w-5 h-5" />,
  },
  {
    label: "Mentoring",
    value: "mentoring",
    basePrice: 30,
    pricePerMinute: 0.5, // $30 for 60 mins ≈ $0.5/min
    description: "Ongoing guidance and feedback for your content journey",
    icon: <User className="w-5 h-5" />,
  },
  {
    label: "Custom",
    value: "custom",
    basePrice: 0,
    pricePerMinute: 1, // $1/min for custom
    description: "Tailored service based on your specific needs",
    icon: <Info className="w-5 h-5" />,
  },
];

const BookingSchema = z.object({
  client_name: z.string().min(2, "Name must be at least 2 characters"),
  client_email: z.string().email("Please enter a valid email"),
  service_type: z.enum(["consultation", "workshop", "mentoring", "custom"]),
  booking_date: z.string().refine((val) => new Date(val) > new Date(), {
    message: "Booking date must be in the future",
  }),
  booking_time: z.string().refine((val) => val !== "", {
    message: "Please select a time",
  }),
  duration_minutes: z.number().min(15, "Minimum booking is 15 minutes"),
  notes: z.string().optional(),
  agree_terms: z.boolean().refine((val) => val, {
    message: "You must agree to the terms and conditions",
  }),
});

type BookingFormValues = z.infer<typeof BookingSchema>;

export default function PublicBookingForm() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(0);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(BookingSchema),
    defaultValues: {
      service_type: serviceOptions[0].value as any,
      booking_date: format(addDays(new Date(), 1), "yyyy-MM-dd'T'10:00"),
      booking_time: "10:00",
      duration_minutes: 60,
      agree_terms: false,
    },
    mode: "onChange",
  });

  const selectedService =
    serviceOptions.find((service) => service.value === watch("service_type")) ||
    serviceOptions[0];

  const calculatePrice = (duration: number, service = selectedService) => {
    // Round to nearest 15 minutes for pricing
    const roundedDuration = Math.ceil(duration / 15) * 15;
    return (roundedDuration * service.pricePerMinute).toFixed(2);
  };

  const currentPrice = calculatePrice(watch("duration_minutes"));

  // Simulate loading available times
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      setIsLoadingTimes(true);
      // In a real app, you'd fetch this from your API based on creator's availability
      await new Promise((resolve) => setTimeout(resolve, 500));
      const times = [];
      for (let i = 9; i < 17; i++) {
        times.push(`${i < 10 ? "0" + i : i}:00`);
        if (i !== 16) times.push(`${i < 10 ? "0" + i : i}:30`);
      }
      setAvailableTimes(times);
      setIsLoadingTimes(false);
    };

    fetchAvailableTimes();
  }, [watch("booking_date")]);

  const onSubmit = async (data: BookingFormValues) => {
    const bookingData = {
      ...data,
      price: currentPrice,
      creator_id: process.env.NEXT_PUBLIC_BOOKING_CREATOR_ID,
      booking_date: new Date(data.booking_date).toISOString(),
      status: "pending",
    };

    try {
      const res = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!res.ok) throw new Error("Booking failed");

      toast.success("Booking confirmed! Check your email for details.");
      router.push("/thanks");
    } catch (error) {
      toast.error("Failed to submit booking. Please try again.");
    }
  };

  const handleTabChange = (index: number) => {
    setSelectedTab(index);
    setValue("service_type", serviceOptions[index].value as any);
    trigger("service_type");
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-800">
        Book Your Session
      </h2>

      {/* Swiping Tabs */}
      <div className="relative mb-8">
        <div className="flex overflow-x-auto pb-2 scrollbar-hide justify-evenly">
          {serviceOptions.map((service, index) => (
            <button
              key={service.value}
              onClick={() => handleTabChange(index)}
              className={`flex-shrink-0 px-4 py-2 mx-1 rounded-full transition-all ${selectedTab === index ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              <div className="flex items-center gap-2">
                {service.icon}
                {service.label}
              </div>
            </button>
          ))}
        </div>
        <AnimatePresence>
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-blue-600 rounded-full"
            initial={false}
            animate={{
              width: `${100 / serviceOptions.length}%`,
              x: `${selectedTab * 100}%`,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </AnimatePresence>
      </div>

      {/* Service Description */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-1">
          {selectedService.label} - ${currentPrice}
        </h3>
        <p className="text-gray-600">{selectedService.description}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              Your Name
            </label>
            <input
              {...register("client_name")}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="John Doe"
              required
            />
            {errors.client_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.client_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              {...register("client_email")}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
              required
            />
            {errors.client_email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.client_email.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <input
              type="date"
              {...register("booking_date", {
                onChange: () => trigger("booking_date"),
              })}
              min={format(new Date(), "yyyy-MM-dd")}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.booking_date && (
              <p className="mt-1 text-sm text-red-600">
                {errors.booking_date.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time & Duration
            </label>
            <div className="flex gap-2">
              <Controller
                name="booking_time"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={field.onChange}
                    disabled={isLoadingTimes}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Time" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingTimes ? (
                        <option>Loading available times...</option>
                      ) : (
                        availableTimes.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />

              <Controller
                name="duration_minutes"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                      <SelectItem value="120">120 min</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {errors.duration_minutes && (
              <p className="mt-1 text-sm text-red-600">
                {errors.duration_minutes.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes (Optional)
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tell me about your project or specific needs..."
          />
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="agree_terms"
              type="checkbox"
              {...register("agree_terms")}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <label htmlFor="agree_terms" className="ml-3 text-sm text-gray-700">
            I agree to the{" "}
            <a href="/terms" className="text-blue-600 hover:underline">
              terms and conditions
            </a>{" "}
            and understand my booking may be subject to cancellation policies.
          </label>
        </div>
        {errors.agree_terms && (
          <p className="text-sm text-red-600">{errors.agree_terms.message}</p>
        )}

        <div className="flex justify-end">
          <motion.button
            type="submit"
            disabled={isSubmitting || !isValid}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Book ${selectedService.label} - $${currentPrice}`
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
