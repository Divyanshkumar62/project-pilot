import { Link } from "react-router-dom";
import SignupForm from "../../components/auth/SignupForm";
import { LuKanban, LuCircleCheck } from "react-icons/lu";

const Signup = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Showcase Column (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Brand header with enlarged size */}
          <Link to="/" className="inline-flex items-center gap-3 group mb-10">
            <img
              src="/main-logo.svg"
              alt="Project Pilot"
              className="w-11 h-11 object-contain group-hover:scale-105 transition-transform drop-shadow-sm"
            />
            <div className="flex items-center text-2xl sm:text-3xl font-extrabold tracking-tight">
              <span className="text-blue-400">Project</span>
              <span className="text-white">Pilot</span>
            </div>
          </Link>

          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white">
            Build, track, and ship high-velocity software.
          </h1>
          <p className="text-slate-300 text-sm xl:text-base mt-4 max-w-lg leading-relaxed">
            Create your account to launch agile workspaces with live Kanban sprint boards, distributed team invites, and complete project oversight.
          </p>

          {/* Feature Bullets directly below description */}
          <div className="space-y-3.5 mt-8 max-w-lg">
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <LuCircleCheck size={15} />
              </div>
              <span>Instant workspace setup with zero configuration needed</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-200">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <LuCircleCheck size={15} />
              </div>
              <span>Real-time Kanban boards with multi-member collaboration</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-200">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <LuCircleCheck size={15} />
              </div>
              <span>Granular project permissions and secure team invitations</span>
            </div>
          </div>
        </div>

        {/* Bottom space placeholder */}
        <div className="relative z-10" />
      </div>

      {/* Right Auth Column */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        {/* Mobile brand header */}
        <div className="lg:hidden mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <img
              src="/main-logo.svg"
              alt="Project Pilot"
              className="w-9 h-9 object-contain drop-shadow-sm"
            />
            <div className="flex items-center text-2xl font-bold tracking-tight">
              <span className="text-blue-600">Project</span>
              <span className="text-slate-900">Pilot</span>
            </div>
          </Link>
        </div>

        {/* Center Card */}
        <div className="my-auto py-8 flex justify-center">
          <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/60">
            <SignupForm />
          </div>
        </div>

        {/* Bottom microcopy */}
        <div className="text-xs text-slate-400 text-center lg:text-right">
          &copy; {new Date().getFullYear()} Project Pilot. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Signup;
