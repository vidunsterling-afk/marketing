import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Globe from "react-globe.gl";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const navigate = useNavigate();

  const handleAuth = async (authFunction) => {
    setLoading(true);
    try {
      const { error } = await authFunction();
      if (error) {
        alert(error.message);
      } else {
        if (authFunction === signup) {
          alert("Check your email to verify your account");
        } else {
          navigate("/map");
        }
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signup = async () => {
    return await supabase.auth.signUp({ email, password });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAuth(mode === "login" ? login : signup);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 overflow-hidden">
      {/* Login Box */}
      <div className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-8 relative border border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1 text-center">
          GeoMapper
        </h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          {mode === "login" ? "Sign in to continue" : "Create a new account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black/20 outline-none bg-white"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black/20 outline-none bg-white"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-900 transition disabled:opacity-50"
          >
            {loading
              ? mode === "login"
                ? "Signing in..."
                : "Creating..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-5">
          {mode === "login" ? "No account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-black underline hover:opacity-70"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
