import { Link } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import { LuKanban, LuZap, LuShieldCheck, LuUsers } from "react-icons/lu";

const Login = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Auth Column */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        {/* Brand link */}
        <div>
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img
              src="/main-logo.svg"
              alt="Project Pilot"
              className="w-11 h-11 object-contain group-hover:scale-105 transition-transform drop-shadow-sm"
            />
            <div className="flex items-center text-2xl sm:text-3xl font-extrabold tracking-tight">
              <span className="text-blue-600">Project</span>
              <span className="text-slate-900">Pilot</span>
            </div>
          </Link>
        </div>

        {/* Center Card */}
        <div className="my-auto py-8 flex justify-center">
          <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/60">
            <LoginForm />
          </div>
        </div>

        {/* Bottom microcopy */}
        <div className="text-xs text-slate-400 text-center lg:text-left">
          &copy; {new Date().getFullYear()} Project Pilot. All rights reserved.
        </div>
      </div>

      {/* Right Showcase Column (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        {/* Decorative ambient lighting */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white mt-6">
            Accelerate delivery with real-time sprint collaboration.
          </h1>
          <p className="text-slate-300 text-sm xl:text-base mt-4 max-w-lg leading-relaxed">
            Eliminate sync friction. Keep your entire team aligned with live Kanban status updates, structured role-based access, and complete project visibility.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-4 my-10 max-w-lg">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-blue-600/30 text-blue-400 flex-shrink-0">
              <LuZap size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Instant State Synchronization</h3>
              <p className="text-xs text-slate-300 mt-1">
                Kanban status transitions and task updates broadcast to connected team members in real time.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-600/30 text-emerald-400 flex-shrink-0">
              <LuShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Enterprise Data Governance</h3>
              <p className="text-xs text-slate-300 mt-1">
                Role-based access controls and encrypted sessions protect sensitive project assets across your organization.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-purple-600/30 text-purple-400 flex-shrink-0">
              <LuUsers size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Structured Team Roles</h3>
              <p className="text-xs text-slate-300 mt-1">
                Clear ownership with Workspace Owner, Engineering Manager, and Contributor permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom space placeholder */}
        <div className="relative z-10" />
      </div>
    </div>
  );
};

export default Login;
