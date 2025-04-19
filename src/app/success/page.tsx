export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-xl">
        <div className="flex justify-center mb-6">
          <div className="animate-bounce-slow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-green-500 animate-pop"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Payment Successful 🎉
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Thanks for your order! I’ll get started right away. Once payment is
          confirmed, I’ll reach out and ship your order. Got questions? Hit me
          up at{" "}
          <a
            href="mailto:jngatia@gmail.com"
            className="text-blue-500 hover:underline"
          >
            Gmail
          </a>
          .
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="/store"
            className="inline-block px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Back to Store
          </a>
          <a
            href="/"
            className="inline-block px-6 py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
