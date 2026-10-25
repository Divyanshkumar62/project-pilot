import React, { useContext } from "react";
import { IoGridOutline, IoSettingsOutline } from "react-icons/io5";
import { TbLogout2 } from "react-icons/tb";
import { FaDiagramProject } from "react-icons/fa6";
import { FaClipboardList } from "react-icons/fa";
import { BsListTask } from "react-icons/bs";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, logoutUser } = useContext(AuthContext);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-16 sm:w-20 h-screen flex flex-col justify-between items-center py-2 sm:py-4 bg-white shadow-sm">
      <img
        className="w-9 sm:w-11 h-auto mb-2 cursor-pointer hover:scale-105 transition-transform"
        src="/main-logo.svg"
        alt="Project Pilot Logo"
        onClick={() => navigate("/dashboard")}
        title="Project Pilot"
      />
      <div className="text-gray-700 flex flex-col items-center justify-center gap-4 sm:gap-6">
        <span 
          className={`cursor-pointer transition-colors p-2 rounded-lg hover:bg-blue-50 ${isActive('/dashboard') ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700'}`}
          onClick={() => navigate("/dashboard")}
          title="Dashboard"
        >
          <IoGridOutline size={24} className="sm:text-3xl" />
        </span>
        <span 
          className={`cursor-pointer transition-colors p-2 rounded-lg hover:bg-blue-50 ${isActive('/projects') ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700'}`}
          onClick={() => navigate("/projects")}
          title="Projects"
        >
          <FaDiagramProject size={24} className="sm:text-3xl" />
        </span>
        <span 
          className={`cursor-pointer transition-colors p-2 rounded-lg hover:bg-blue-50 ${isActive('/templates') ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700'}`}
          onClick={() => navigate("/templates")}
          title="Templates"
        >
          <FaClipboardList size={24} className="sm:text-3xl" />
        </span>
        <span 
          className={`cursor-pointer transition-colors p-2 rounded-lg hover:bg-blue-50 ${isActive('/my-tasks') ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700'}`}
          onClick={() => navigate("/my-tasks")}
          title="My Tasks"
        >
          <BsListTask size={24} className="sm:text-3xl" />
        </span>
        <span 
          className={`cursor-pointer transition-colors p-2 rounded-lg hover:bg-blue-50 ${isActive('/settings') ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700'}`}
          onClick={() => navigate("/settings")}
          title="Settings"
        >
          <IoSettingsOutline size={24} className="sm:text-3xl" />
        </span>
        <span
          className="cursor-pointer hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
          onClick={() => {
            logoutUser();
            navigate("/login");
          }}
          title="Logout"
        >
          <TbLogout2 size={24} className="sm:text-3xl" />
        </span>
      </div>
      <div>
        <img
          className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
          src={auth.user?.avatarUrl || "/profile.jpg"}
          alt="Profile"
          onClick={() => navigate("/settings")}
          title="Account Settings"
        />
      </div>
    </div>
  );
};

export default Sidebar;
