import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import ScoreCard from "../components/ScoreCard";

export default function Dashboard() {
  const [github, setGithub] = useState("");
  const [leetcode, setLeetcode] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchEvaluation = async () => {
    if (!github || !leetcode) return;

    try {
      setLoading(true);
      const res = await axios.get(
        `http://127.0.0.1:8000/devlens-evaluate/${github}/${leetcode}`
      );
      setData(res.data);
      localStorage.setItem("devlensData", JSON.stringify(res.data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const radarData = data
    ? [
        { subject: "Engineering", value: data.engineering_score },
        { subject: "DSA", value: data.dsa_score },
        { subject: "Consistency", value: data.consistency_score },
        { subject: "Collaboration", value: data.collaboration_score },
      ]
    : [];

  const leetcodeChartData = data
    ? [
        { name: "Easy", solved: data.leetcode_breakdown?.easy },
        { name: "Medium", solved: data.leetcode_breakdown?.medium },
        { name: "Hard", solved: data.leetcode_breakdown?.hard },
      ]
    : [];

  return (
    <div className="min-h-screen p-10 bg-gray-950 text-gray-200 relative">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-3xl font-semibold mb-8">
          Developer Dashboard
        </h1>

        {/* Input Section */}
        <div className="flex gap-4 mb-8">
          <input
            placeholder="GitHub Username"
            className="p-3 bg-gray-900 border border-gray-800 rounded-lg w-64"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
          />
          <input
            placeholder="LeetCode Username"
            className="p-3 bg-gray-900 border border-gray-800 rounded-lg w-64"
            value={leetcode}
            onChange={(e) => setLeetcode(e.target.value)}
          />
          <button
            onClick={fetchEvaluation}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg transition"
          >
            Analyze
          </button>
        </div>

        {loading && <p className="text-gray-400">Analyzing profile...</p>}

        {data && (
          <>
            {/* Category */}
            <div className="mb-6 text-indigo-400 font-medium">
              Category: {data.category}
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
              <ScoreCard title="Engineering" value={data.engineering_score} />
              <ScoreCard title="DSA" value={data.dsa_score} />
              <ScoreCard title="Consistency" value={data.consistency_score} />
              <ScoreCard title="Collaboration" value={data.collaboration_score} />
              <ScoreCard title="Final Score" value={data.final_score} highlight />
            </div>

            {/* Radar + LeetCode Chart */}
            <div className="grid md:grid-cols-2 gap-10 mb-12">

              {/* Radar */}
              <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 flex justify-center">
                <RadarChart outerRadius={120} width={400} height={350} data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" />
                  <Radar
                    dataKey="value"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </div>

              {/* LeetCode Line Chart */}
              <div className="bg-gray-900 p-8 rounded-xl border border-gray-800">
                <h2 className="mb-4 text-lg">LeetCode Problem Distribution</h2>
                <LineChart width={400} height={300} data={leetcodeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="solved"
                    stroke="#6366f1"
                    strokeWidth={3}
                  />
                </LineChart>
              </div>

            </div>

            {/* Skills Section */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 mb-12">
              <h2 className="text-lg mb-4">Tech Stack</h2>
              <div className="flex flex-wrap gap-3">
                {data.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-full border border-indigo-500"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Repository List */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h2 className="text-lg mb-4">Repositories</h2>
              <div className="space-y-4 max-h-72 overflow-y-auto">
                {data.repositories?.map((repo, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="font-semibold">{repo.name}</h3>
                    <p className="text-sm text-gray-400">
                      {repo.description || "No description"}
                    </p>
                    <div className="text-xs mt-2 flex gap-4 text-gray-500">
                      <span>{repo.language}</span>
                      <span>⭐ {repo.stars}</span>
                      <span>Size: {repo.size}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </>
        )}
      </div>

      {/* Floating AI Button */}
      <button
        onClick={() => navigate("/chat")}
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 w-16 h-16 rounded-full text-2xl shadow-lg transition"
      >
        🤖
      </button>
    </div>
  );
}
