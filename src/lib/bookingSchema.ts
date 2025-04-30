import { id } from "date-fns/locale";
import parsePhoneNumberFromString from "libphonenumber-js";
import { z } from "zod";

export const BookingSchema = z.object({
  id: z.string().optional(),
  creator_id: z.string().optional(),
  price: z.number().optional(),
  payment_status: z.enum(["pending", "paid", "refunded"]).optional(),
  client_name: z.string().min(2, "Name must be at least 2 characters"),
  client_email: z.string().email("Please enter a valid email"),
  phone: z.string().refine(
    (val) => {
      const phone = parsePhoneNumberFromString(val);
      return phone?.isValid();
    },
    {
      message: "Please enter a valid phone number",
    }
  ),
  payment_method: z.string().optional(),
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

export type BookingFormValues = z.infer<typeof BookingSchema>;
