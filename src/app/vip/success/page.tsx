import { CheckCircle } from "lucide-react";

export default function Success() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-zinc-900 to-zinc-800 px-4 text-white">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="animate-bounce-slow">
            <CheckCircle className="w-16 h-16 text-yellow-500 animate-pop" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
          🎉 VIP Unlocked!
        </h1>
        <p className="text-lg sm:text-xl text-zinc-300 mb-6">
          You’re officially in. Exclusive content is now yours — forever. 🔐
        </p>
        <a
          href="/vip"
          className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-2xl shadow-lg hover:bg-zinc-100 transition-all duration-200"
        >
          Access VIP Content
        </a>
      </div>
    </div>
  );
}
