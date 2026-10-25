import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { LuArrowRight } from "react-icons/lu";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      const navOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      window.history.pushState(null, "", `#${targetId}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/main-logo.svg"
              alt="Project Pilot"
              className="w-9 h-9 object-contain group-hover:scale-105 transition-transform drop-shadow-sm"
            />
            <div className="flex items-center text-xl font-bold tracking-tight">
              <span className="text-blue-600">Project</span>
              <span className="text-slate-900">Pilot</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a
              href="#features"
              onClick={(e) => handleScrollTo(e, "features")}
              className="hover:text-blue-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#board-preview"
              onClick={(e) => handleScrollTo(e, "board-preview")}
              className="hover:text-blue-600 transition-colors"
            >
              Live Preview
            </a>
            <a
              href="#workflow"
              onClick={(e) => handleScrollTo(e, "workflow")}
              className="hover:text-blue-600 transition-colors"
            >
              Workflow
            </a>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <LuArrowRight size={14} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
              className="text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-lg animate-fadeIn">
          <div className="flex flex-col space-y-2 pt-2 pb-3 border-b border-slate-100 text-sm font-medium text-slate-700">
            <a
              href="#features"
              onClick={(e) => handleScrollTo(e, "features")}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Features
            </a>
            <a
              href="#board-preview"
              onClick={(e) => handleScrollTo(e, "board-preview")}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Live Preview
            </a>
            <a
              href="#workflow"
              onClick={(e) => handleScrollTo(e, "workflow")}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Workflow
            </a>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                navigate("/login");
                setIsMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 text-center text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                navigate("/signup");
                setIsMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 text-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
