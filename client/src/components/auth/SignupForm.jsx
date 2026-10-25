import React, { useContext, useState } from "react";
import PasswordInput from "../Input/PasswordInput";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { validateEmail } from "../../utils/Helper";
import { signup } from "../../services/authService";
import { LuUser, LuMail, LuBriefcase, LuCircleAlert } from "react-icons/lu";

const SignupForm = () => {
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    if (error) setError("");
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      if (value && !validateEmail(value)) {
        setEmailError("Please enter a valid work email address");
      } else {
        setEmailError("");
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(formData.email)) {
      setEmailError("Please enter a valid work email address");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const data = await signup(formData);
      if (!data || !data.token) {
        setError("Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      const token = data.token;
      const user = data.user || { name: formData.name, email: formData.email, role: formData.role };
      loginUser(token, user);
      navigate("/dashboard");
    } catch (err) {
      console.error("Signup Error:", err.response?.data || err.message);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg;
      setError(serverMsg || "Registration failed. An account with this email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header without extra subheading */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Create an account
        </h2>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm animate-fadeIn">
          <LuCircleAlert size={18} className="flex-shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <input
              type="text"
              name="name"
              placeholder="Alex Johnson"
              className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-lg px-4 py-2.5 pl-10 outline-none transition-all duration-150 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <LuUser
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

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
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password (min 6 characters)
          </label>
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Workspace Role
          </label>
          <div className="relative">
            <select
              name="role"
              className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-lg px-4 py-2.5 pl-10 outline-none transition-all duration-150 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="member">Team Member (Contributor)</option>
              <option value="manager">Engineering Manager (Project Lead)</option>
              <option value="owner">Workspace Owner (Admin)</option>
            </select>
            <LuBriefcase
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
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
              <span>Registering...</span>
            </>
          ) : (
            <span>Register</span>
          )}
        </button>
      </form>

      {/* Footer link */}
      <div className="mt-6 pt-5 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
