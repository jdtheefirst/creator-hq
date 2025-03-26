# Creator HQ

A comprehensive platform for creators to showcase their work, sell products, and connect with their audience. Built with Next.js 14, Tailwind CSS, and modern web technologies.

## Features

- 🎨 Beautiful, responsive landing page
- 🛍️ E-commerce store with Stripe integration
- 📝 Markdown-based blog system
- 📅 Booking system for consultations and workshops
- 💰 Donation system with multiple payment options
- 📊 Admin dashboard for analytics and management
- 🔐 Authentication with Firebase/Supabase
- 📧 Newsletter signup system
- 📱 Mobile-first design

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Firebase/Supabase (Authentication & Database)
- Stripe (Payments)
- TypeScript
- Server Components
- API Routes

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/creator-hq.git
   cd creator-hq
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your environment variables:

   ```env
   # Authentication
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   # ... (see .env.local.example for all required variables)
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
creator-hq/
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── dashboard/    # Admin dashboard
│   │   ├── store/        # E-commerce pages
│   │   ├── blog/         # Blog pages
│   │   └── page.tsx      # Landing page
│   ├── components/       # Reusable components
│   ├── lib/             # Utilities & API calls
│   └── styles/          # Global styles
├── public/              # Static assets
└── .env.local          # Environment variables
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

This project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import your repository on Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@creatorhq.com or join our Discord community.
