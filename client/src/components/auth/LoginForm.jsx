import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { login } from "../../services/authService";
import { validateEmail } from "../../utils/Helper";
import PasswordInput from "../Input/PasswordInput";
import api from "../../services/api";
import { LuMail, LuLock, LuCircleAlert, LuSparkles, LuArrowRight } from "react-icons/lu";

const LoginForm = () => {
  const { auth, loginUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  if (auth.token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    if (error) setError("");
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      if (value && !validateEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  };

  const executeLogin = async (credentials) => {
    setError("");

    if (!validateEmail(credentials.email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const data = await login(credentials);
      const token = data.token;

      // Save token to localStorage first so API calls work
      const tempUser = { email: credentials.email };
      loginUser(token, tempUser);

      // Fetch complete user data
      try {
        const userResponse = await api.get("/users/me");
        loginUser(token, userResponse.data);
      } catch (profileErr) {
        console.warn("Could not fetch full user profile, using basic payload:", profileErr);
        loginUser(token, data.user || tempUser);
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Login process failed:", err);
      const serverMsg = err.message || err.response?.data?.message || err.response?.data?.errors?.[0]?.msg;
      const isNetworkError = err.message === "Network Error" || err.code === "ERR_NETWORK";
      const displayMsg = isNetworkError
        ? "Cannot connect to server. Check server status or CORS."
        : (serverMsg || "Invalid email or password. Please try again.");
      setError(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    executeLogin(formData);
  };

  const handleFillDemo = (e) => {
    e.preventDefault();
    const demoCredentials = {
      email: "alex.dev@projectpilot.test",
      password: "Password123!",
    };
    setFormData(demoCredentials);
    setEmailError("");
    executeLogin(demoCredentials);
  };

  return (
    <div className="w-full">
      {/* Clean Header without subtitle */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Welcome back
        </h2>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm animate-fadeIn">
          <LuCircleAlert size={18} className="flex-shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Work Email
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="alex@company.com"
              className={`w-full text-sm text-slate-800 bg-white border ${
                emailError ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
              } rounded-lg px-4 py-2.5 pl-10 outline-none transition-all duration-150 focus:ring-2 placeholder:text-slate-400`}
              value={formData.email}
              onChange={handleChange}
              required
            />
            <LuMail
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
          {emailError && (
            <p className="text-red-500 text-xs mt-1 pl-1">{emailError}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
          </div>
          <div className="relative">
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </button>
      </form>

      {/* Footer link */}
      <div className="mt-6 pt-5 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-600">
          Not registered yet?{" "}
          <Link
            to="/signup"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Register
          </Link>
        </p>
      </div>

      {/* Demo Account Quick Pill (Relocated to bottom) */}
      <div className="mt-5 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg flex-shrink-0">
            <LuSparkles size={15} />
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-800 truncate">
              Demo Workspace
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              alex.dev@projectpilot.test
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleFillDemo}
          disabled={loading}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <span>One-Click Login</span>
          <LuArrowRight size={13} className="text-blue-600" />
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
