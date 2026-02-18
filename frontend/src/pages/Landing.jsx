import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-950 text-gray-200">
      <h1 className="text-5xl font-semibold mb-6">
        DevLens AI
      </h1>
      <p className="text-gray-400 mb-8 text-center max-w-lg">
        AI-powered developer intelligence engine. Analyze technical depth, consistency, and readiness in seconds.
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-lg transition"
      >
        Get Started
      </button>
    </div>
  );
}
