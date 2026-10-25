// src/pages/Dashboard.jsx
import React from "react";
import Sidebar from "../components/dashboard/Sidebar";
import MainContent from "../components/dashboard/MainContent";
import ProjectStats from "../components/dashboard/ProjectStats";
import MobileNavbar from "../components/navigation/MobileNavbar";

const Dashboard = () => {
  return (
    <div className="flex flex-col h-screen">
      {/* Mobile Navigation */}
      <MobileNavbar />
      
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden bg-slate-50">
        {/* Sidebar - Hidden on mobile, shown on large screens */}
        <div className="hidden lg:block border-r border-slate-200/80 bg-white">
          <Sidebar />
        </div>
        
        {/* Main Content Area - Full width on mobile */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
          <div className="flex-1 overflow-auto">
            <MainContent />
          </div>
          
          {/* Project Stats - Bottom on mobile, side on desktop */}
          <div className="xl:w-80 xl:flex-shrink-0 overflow-auto">
            <ProjectStats />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
