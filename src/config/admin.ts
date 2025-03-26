export const ADMIN_EMAILS = [
  "admin@creatorhq.com", // Replace with your admin email
  "jngatia045@gmail.com",
  // Add more admin emails as needed
];

export const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
