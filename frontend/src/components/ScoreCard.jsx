export default function ScoreCard({ title, value, highlight }) {
  const getColor = () => {
    if (value >= 75) return "text-green-400";
    if (value >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div
      className={`p-6 rounded-xl border ${
        highlight
          ? "bg-indigo-600/20 border-indigo-500"
          : "bg-gray-900 border-gray-800"
      }`}
    >
      <h2 className="text-xs uppercase tracking-wider opacity-60">
        {title}
      </h2>
      <p className={`text-3xl font-semibold mt-3 ${getColor()}`}>
        {value}
      </p>
    </div>
  );
}
