import React from "react";
import Navbar from "../../components/Navbar";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import RotatingTypewriter from "../../components/ui/RotatingTypewriter";
import {
  LuZap,
  LuShieldCheck,
  LuUsers,
  LuActivity,
  LuCircleCheck,
  LuArrowRight,
  LuPaperclip,
  LuMessageSquare,
  LuClock,
  LuLayers,
} from "react-icons/lu";

const LandingPage = () => {
  const navigate = useNavigate();

  const headlinePhrases = [
    "zero sync friction.",
    "complete team visibility.",
    "faster sprint velocity.",
    "effortless execution.",
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-700">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Subtle decorative background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
        >
          {/* Product Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Modern Agile Workspace for Engineering Teams</span>
          </div>

          {/* Heading with Dynamic Looping Typewriter */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15] min-h-[140px] sm:min-h-[160px] md:min-h-[190px] flex flex-col justify-center">
            <span>Manage projects and sprint workflows with</span>
            <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent mt-1">
              <RotatingTypewriter words={headlinePhrases} />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 mt-6 max-w-2xl mx-auto leading-relaxed">
            Project Pilot unifies real-time Kanban boards, instant team synchronization, role-based governance, and organized task attachments into a single cohesive workspace.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/signup")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all cursor-pointer"
            >
              <span>Get Started Free</span>
              <LuArrowRight size={16} />
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl border border-slate-300 shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <LuZap size={16} className="text-blue-600" />
              <span>Explore Demo Workspace</span>
            </button>
          </div>

          {/* Customer-centric trust markers */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <LuCircleCheck size={14} className="text-blue-600" />
              Real-time multi-user synchronization
            </span>
            <span className="inline-flex items-center gap-1.5">
              <LuCircleCheck size={14} className="text-blue-600" />
              Granular role-based workspace permissions
            </span>
            <span className="inline-flex items-center gap-1.5">
              <LuCircleCheck size={14} className="text-blue-600" />
              Instant workspace setup with zero configuration
            </span>
          </div>
        </motion.div>

        {/* Live Visual Kanban Board Mockup */}
        <motion.div
          id="board-preview"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 relative z-10"
        >
          <div className="rounded-2xl border border-slate-300/80 bg-white shadow-2xl shadow-slate-300/60 overflow-hidden">
            {/* Mockup Window Topbar */}
            <div className="px-5 py-3.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <span className="font-semibold text-slate-700 ml-2">
                  Engineering Platform Modernization (Sprint 14)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  Live Board Synced
                </span>
                <span className="text-slate-400 font-medium">Auto-updates active</span>
              </div>
            </div>

            {/* Kanban Columns Grid */}
            <div className="p-4 sm:p-6 bg-slate-50/70 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: To Do */}
              <div className="bg-slate-100/80 rounded-xl p-3.5 border border-slate-200">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      To Do
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-[11px] font-semibold">
                    2
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 bg-white rounded-lg border border-slate-200/90 shadow-sm hover:border-blue-400 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">
                        High
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <LuClock size={11} /> 7d left
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      Implement Idempotency Filter for Payment Webhooks
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      Enforce distributed locking and unique request hash validation.
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <LuPaperclip size={12} /> 2 specs
                      </span>
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                        AD
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                        Medium
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <LuClock size={11} /> 10d left
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      Configure automated user onboarding notifications
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <LuMessageSquare size={12} /> 1 comment
                      </span>
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center">
                        EM
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="bg-slate-100/80 rounded-xl p-3.5 border border-slate-200">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      In Progress
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-[11px] font-semibold">
                    1
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 bg-white rounded-lg border-2 border-blue-400 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">
                        High
                      </span>
                      <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        Active
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      Optimize database query performance and indexes
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Analyze query execution plans and add compound indexes for project membership lookups.
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <LuPaperclip size={12} /> 1 report
                      </span>
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                        AD
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Completed */}
              <div className="bg-slate-100/80 rounded-xl p-3.5 border border-slate-200">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Completed
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-[11px] font-semibold">
                    2
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 bg-white/90 rounded-lg border border-slate-200/90 shadow-sm opacity-90">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        Verified
                      </span>
                      <span className="text-[11px] text-emerald-600 font-medium">
                        Done
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 line-through">
                      Enforce HTTP security headers across all endpoints
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-emerald-700 font-medium text-[10px]">
                        Sprint 13
                      </span>
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center">
                        AD
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/90 rounded-lg border border-slate-200/90 shadow-sm opacity-90">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        Verified
                      </span>
                      <span className="text-[11px] text-emerald-600 font-medium">
                        Done
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 line-through">
                      Deploy automated staging verification pipeline
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-emerald-700 font-medium text-[10px]">
                        Sprint 13
                      </span>
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center">
                        CI
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Core Feature Pillars */}
      <section id="features" className="py-16 md:py-24 bg-white border-y border-slate-200">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Engineered for velocity, designed for clarity.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Give your team the structure they need to move from backlog to shipped software without communication overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <LuZap size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Real-Time Kanban Sync
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Task creations, column moves, and priority updates broadcast instantly across the team without manual page refreshes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <LuUsers size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Role-Based Governance
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clear permissions for Workspace Owners, Project Managers, and Contributors ensure safe delegation and access control.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <LuShieldCheck size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Protected Project Assets
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Keep requirements, design specifications, and task attachments isolated and secure within your verified project team.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <LuActivity size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Sprint Activity Stream
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chronological activity tracking documents every status transition, assignment change, and team discussion.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3-Step Sprint Workflow Section (Replaces Architecture) */}
      <section id="workflow" className="py-16 md:py-24 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Sprint Execution
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              From backlog to production in three steps.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              A streamlined workflow built to keep developers in flow and eliminate status-check meetings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-7 bg-white rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center mb-5 border border-blue-100">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Plan and Prioritize
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Break work into clear, actionable cards. Set priority tags, assign deadlines, attach technical specs, and delegate owners before the sprint kicks off.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-7 bg-white rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center mb-5 border border-blue-100">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Collaborate in Real Time
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Drag cards from To Do to In Progress as work begins. Real-time updates keep everyone in sync simultaneously so nobody works on outdated context.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-7 bg-white rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center mb-5 border border-blue-100">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Ship with Visibility
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Complete tasks with full audit trails. Keep stakeholders updated with instant visibility across project velocity and completed sprint goals.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to experience frictionless sprint delivery?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-4 max-w-xl mx-auto">
            Try the demo workspace in one click or set up your agile team in seconds.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Open Demo Workspace
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/main-logo.svg"
              alt="Project Pilot"
              className="w-7 h-7 object-contain drop-shadow-sm"
            />
            <span className="text-white font-semibold text-sm">Project Pilot</span>
            <span className="text-slate-500 ml-2">Agile Sprint Management Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/signup" className="hover:text-white transition-colors">
              Sign Up
            </Link>
            <span className="text-slate-600">&bull;</span>
            <span>&copy; {new Date().getFullYear()} Project Pilot</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
