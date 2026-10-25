import React, { useState, useEffect, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import { AuthContext } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useProjects } from "../hooks/useProjects";
import { useUserTasks } from "../hooks/useTasks";
import api from "../services/api";
import {
  FiUser,
  FiLock,
  FiBell,
  FiCpu,
  FiUpload,
  FiCheck,
  FiAlertCircle,
  FiCalendar,
  FiCopy,
  FiRefreshCw,
  FiExternalLink
} from "react-icons/fi";
import { FaLinkedin, FaGithub, FaTwitter } from "react-icons/fa";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney"
];

export default function Settings() {
  const { auth, loginUser } = useContext(AuthContext);
  const { me, loadMe, updateProfile } = useProfile();

  // Metrics from hooks
  const { data: projects = [] } = useProjects();
  const { data: userTasks = [] } = useUserTasks();

  const totalProjects = Array.isArray(projects) ? projects.length : 0;
  const completedTasks = Array.isArray(userTasks) ? userTasks.filter(t => t.status === "completed" || t.status === "Completed").length : 0;
  const activeTasks = Array.isArray(userTasks) ? userTasks.filter(t => t.status !== "completed" && t.status !== "Completed").length : 0;
  
  const [activeTab, setActiveTab] = useState("account");
  
  // Account Form State
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [social, setSocial] = useState({ linkedin: "", github: "", twitter: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  
  // Avatar Upload State
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Notification Preferences State
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailInvites: true,
    emailTaskAssigned: true,
    emailMentions: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState("");

  // Webhooks State
  const [webhooks, setWebhooks] = useState([]);
  const [webhooksLoading, setWebhooksLoading] = useState(false);
  const [webhookTestingId, setWebhookTestingId] = useState(null);
  const [webhookTestMessage, setWebhookTestMessage] = useState("");
  const [copiedUrlId, setCopiedUrlId] = useState(null);

  // Sync state from profile context
  useEffect(() => {
    loadMe();
  }, [loadMe]);

  useEffect(() => {
    if (me) {
      setName(me.name || auth.user?.name || "");
      setBio(me.bio || "");
      setTimezone(me.timezone || "UTC");
      if (me.social) {
        setSocial({
          linkedin: me.social.linkedin || "",
          github: me.social.github || "",
          twitter: me.social.twitter || ""
        });
      }
      if (me.notificationPrefs) {
        setNotificationPrefs(prev => ({
          ...prev,
          ...me.notificationPrefs
        }));
      }
    } else if (auth.user) {
      setName(auth.user.name || "");
    }
  }, [me, auth.user]);

  // Load Webhooks for Workspace Tab
  const loadUserWebhooks = async () => {
    setWebhooksLoading(true);
    try {
      const res = await api.get("/webhooks");
      setWebhooks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch webhooks:", err);
    } finally {
      setWebhooksLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "integrations") {
      loadUserWebhooks();
    }
  }, [activeTab]);

  // Handle Profile Details Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      const updated = await updateProfile({
        name,
        bio,
        timezone,
        social
      });
      if (auth.user) {
        loginUser(auth.token, { ...auth.user, name: updated.name || name });
      }
      setProfileSuccess("Profile and social details updated successfully.");
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err) {
      setProfileError(err?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Avatar Image Upload
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image file size must be less than 2MB.");
      return;
    }

    setAvatarUploading(true);
    setAvatarSuccess("");
    setAvatarError("");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await api.put("/users/me/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const newAvatarUrl = response.data.avatarUrl;
      const updatedUser = { ...auth.user, avatarUrl: newAvatarUrl };
      loginUser(auth.token, updatedUser);
      await loadMe();

      setAvatarSuccess("Avatar updated successfully.");
      setTimeout(() => setAvatarSuccess(""), 4000);
    } catch (err) {
      setAvatarError(err?.response?.data?.message || err?.message || "Failed to upload avatar.");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      setPasswordSaving(false);
      return;
    }

    try {
      await api.put("/users/me/password", {
        currentPassword,
        newPassword
      });
      setPasswordSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (err) {
      setPasswordError(err?.response?.data?.message || err?.message || "Password update failed.");
    } finally {
      setPasswordSaving(false);
    }
  };

  // Handle Notification Preferences Submit
  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setNotifSaving(true);
    setNotifSuccess("");

    try {
      await updateProfile({
        notificationPrefs: {
          emailInvites: notificationPrefs.emailInvites,
          emailTaskAssigned: notificationPrefs.emailTaskAssigned,
          emailMentions: notificationPrefs.emailMentions
        }
      });
      setNotifSuccess("Notification preferences saved.");
      setTimeout(() => setNotifSuccess(""), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setNotifSaving(false);
    }
  };

  // Handle Webhook Test Ping
  const handleTestWebhook = async (webhookId) => {
    setWebhookTestingId(webhookId);
    setWebhookTestMessage("");

    try {
      const res = await api.post(`/webhooks/${webhookId}/test`);
      setWebhookTestMessage(res.data.message || "Test ping dispatched successfully.");
      await loadUserWebhooks();
    } catch (err) {
      setWebhookTestMessage(err?.response?.data?.message || "Failed to dispatch test ping.");
    } finally {
      setWebhookTestingId(null);
      setTimeout(() => setWebhookTestMessage(""), 5000);
    }
  };

  // Copy Webhook URL to clipboard
  const handleCopyUrl = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlId(id);
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  const currentAvatar = me?.avatarUrl || auth.user?.avatarUrl || "/profile.jpg";

  // Formatted Member Since date
  const memberSinceDate = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "October 2026";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
            <p className="text-slate-600 mt-1">
              Manage your personal credentials, social profiles, account security, and workspace webhooks.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 mb-8 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab("account")}
              className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "account"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <FiUser className="w-4 h-4" />
              Account & Profile
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "security"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <FiLock className="w-4 h-4" />
              Security & Credentials
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "notifications"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <FiBell className="w-4 h-4" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "integrations"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <FiCpu className="w-4 h-4" />
              Workspace & Webhooks
            </button>
          </div>

          {/* TAB 1: Account & Profile (Consolidated with Profile View) */}
          {activeTab === "account" && (
            <div className="space-y-8">
              {/* Member Profile Overview Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="relative group flex-shrink-0">
                      <img
                        src={currentAvatar}
                        alt="Current Avatar"
                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                      />
                      {avatarUploading && (
                        <div className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          Uploading...
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl font-bold text-slate-900">{me?.name || auth.user?.name}</h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          {me?.role || auth.user?.role || "Member"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{me?.email || auth.user?.email}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                        <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Member since {memberSinceDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Social Media Link Badges */}
                  <div className="flex items-center gap-3">
                    {social.linkedin && (
                      <a
                        href={social.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        title="LinkedIn Profile"
                        className="p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <FaLinkedin className="w-5 h-5" />
                      </a>
                    )}
                    {social.github && (
                      <a
                        href={social.github}
                        target="_blank"
                        rel="noreferrer"
                        title="GitHub Profile"
                        className="p-2.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
                      >
                        <FaGithub className="w-5 h-5" />
                      </a>
                    )}
                    {social.twitter && (
                      <a
                        href={social.twitter}
                        target="_blank"
                        rel="noreferrer"
                        title="Twitter / X Profile"
                        className="p-2.5 rounded-lg bg-sky-50 text-sky-500 hover:bg-sky-100 transition-colors"
                      >
                        <FaTwitter className="w-5 h-5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm ml-2"
                    >
                      <FiUpload className="w-3.5 h-3.5 text-slate-500" />
                      {avatarUploading ? "Uploading..." : "Change Photo"}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleAvatarFileSelect}
                      disabled={avatarUploading}
                    />
                  </div>
                </div>

                {/* Activity Stats Strip */}
                <div className="grid grid-cols-3 gap-4 pt-6">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-2xl font-extrabold text-blue-600 block">{totalProjects}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-2xl font-extrabold text-amber-600 block">{activeTasks}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Tasks</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-2xl font-extrabold text-emerald-600 block">{completedTasks}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Tasks</span>
                  </div>
                </div>

                {avatarSuccess && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-2">
                    <FiCheck className="w-4 h-4 text-emerald-600" /> {avatarSuccess}
                  </div>
                )}
                {avatarError && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-center gap-2">
                    <FiAlertCircle className="w-4 h-4 text-rose-600" /> {avatarError}
                  </div>
                )}
              </div>

              {/* Profile Details Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Personal & Social Details</h2>
                <p className="text-sm text-slate-500 mb-6">
                  Update your contact details, biography, and professional social profiles.
                </p>

                {profileSuccess && (
                  <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium flex items-center gap-2">
                    <FiCheck className="w-4 h-4 text-emerald-600" /> {profileSuccess}
                  </div>
                )}
                {profileError && (
                  <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm font-medium flex items-center gap-2">
                    <FiAlertCircle className="w-4 h-4 text-rose-600" /> {profileError}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={100}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g. Alex Dev"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Work Email
                      </label>
                      <input
                        type="email"
                        value={me?.email || auth.user?.email || ""}
                        disabled
                        className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Active Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        LinkedIn Profile
                      </label>
                      <input
                        type="url"
                        value={social.linkedin}
                        onChange={(e) => setSocial(prev => ({ ...prev, linkedin: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        GitHub Profile
                      </label>
                      <input
                        type="url"
                        value={social.github}
                        onChange={(e) => setSocial(prev => ({ ...prev, github: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="https://github.com/username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Twitter / X Profile
                      </label>
                      <input
                        type="url"
                        value={social.twitter}
                        onChange={(e) => setSocial(prev => ({ ...prev, twitter: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="https://x.com/username"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-slate-700">
                        Bio / Headline
                      </label>
                      <span className="text-xs text-slate-400">
                        {bio.length} / 500 characters
                      </span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Brief summary of your role, focus areas, or engineering background..."
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                    >
                      {profileSaving ? "Saving..." : "Save Profile Details"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Security & Credentials */}
          {activeTab === "security" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Change Password</h2>
              <p className="text-sm text-slate-500 mb-6">
                Ensure your account uses a secure password containing at least 8 characters.
              </p>

              {((me?.email || auth.user?.email || "").toLowerCase().includes("alex.dev@project")) && (
                <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium flex items-center gap-2">
                  <FiAlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Demo account credentials are read-only in public preview mode to preserve shared access.</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-emerald-600" /> {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm font-medium flex items-center gap-2">
                  <FiAlertCircle className="w-4 h-4 text-rose-600" /> {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {passwordSaving ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === "notifications" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Notification Preferences</h2>
              <p className="text-sm text-slate-500 mb-6">
                Choose which events trigger notification badges and dispatch emails.
              </p>

              {notifSuccess && (
                <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-emerald-600" /> {notifSuccess}
                </div>
              )}

              <form onSubmit={handleNotificationSubmit} className="space-y-6 max-w-xl">
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.emailInvites}
                      onChange={(e) =>
                        setNotificationPrefs((p) => ({ ...p, emailInvites: e.target.checked }))
                      }
                      className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Project Invitations</div>
                      <div className="text-xs text-slate-500">
                        Receive alert emails when you are invited to collaborate on a new agile project.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.emailTaskAssigned}
                      onChange={(e) =>
                        setNotificationPrefs((p) => ({ ...p, emailTaskAssigned: e.target.checked }))
                      }
                      className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Task Assignments</div>
                      <div className="text-xs text-slate-500">
                        Receive alerts when new tasks in a sprint board are assigned to your profile.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.emailMentions}
                      onChange={(e) =>
                        setNotificationPrefs((p) => ({ ...p, emailMentions: e.target.checked }))
                      }
                      className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Comment Thread Mentions</div>
                      <div className="text-xs text-slate-500">
                        Notify when teammates mention you or comment on tasks you are tracking.
                      </div>
                    </div>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={notifSaving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {notifSaving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: Workspace & Webhooks (Simplified Live Table) */}
          {activeTab === "integrations" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Active Webhooks</h2>
                    <p className="text-sm text-slate-500">
                      View all registered webhook endpoints across your agile projects and check their delivery health.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadUserWebhooks}
                      disabled={webhooksLoading}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                      title="Refresh Webhooks"
                    >
                      <FiRefreshCw className={`w-4 h-4 ${webhooksLoading ? "animate-spin text-blue-600" : ""}`} />
                    </button>
                    <Link
                      to="/projects"
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      Configure via Projects
                    </Link>
                  </div>
                </div>

                {webhookTestMessage && (
                  <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                    <FiCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>{webhookTestMessage}</span>
                  </div>
                )}

                {webhooksLoading ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    Loading registered webhooks...
                  </div>
                ) : webhooks.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                      <FiCpu className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">No Webhooks Registered Yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                      Webhooks send live HTTP notifications when tasks are created or completed. Open any project board and click the Webhook button in the header to register your first endpoint.
                    </p>
                    <Link
                      to="/projects"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                    >
                      Select a Project to Add Webhook <FiExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                          <th className="py-3 px-4">Project</th>
                          <th className="py-3 px-4">Webhook Endpoint</th>
                          <th className="py-3 px-4">Subscribed Events</th>
                          <th className="py-3 px-4">Status & Last Response</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {webhooks.map((w) => (
                          <tr key={w._id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Project Name */}
                            <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                              <Link
                                to={`/projects/${w.project}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                              >
                                {w.projectTitle}
                                <FiExternalLink className="w-3 h-3 text-slate-400" />
                              </Link>
                            </td>

                            {/* Target URL */}
                            <td className="py-3 px-4 font-mono text-slate-700 max-w-xs truncate">
                              <div className="flex items-center gap-2">
                                <span className="truncate" title={w.targetUrl}>
                                  {w.targetUrl}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUrl(w._id, w.targetUrl)}
                                  className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                                  title="Copy URL"
                                >
                                  {copiedUrlId === w._id ? (
                                    <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <FiCopy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Events */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {Array.isArray(w.events) && w.events.map((evt) => (
                                  <span
                                    key={evt}
                                    className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200"
                                  >
                                    {evt}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    w.lastResponseStatus >= 200 && w.lastResponseStatus < 300
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : w.lastResponseStatus
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      w.lastResponseStatus >= 200 && w.lastResponseStatus < 300
                                        ? "bg-emerald-500"
                                        : w.lastResponseStatus
                                        ? "bg-rose-500"
                                        : "bg-blue-500 animate-pulse"
                                    }`}
                                  />
                                  {w.lastResponseStatus ? `HTTP ${w.lastResponseStatus}` : "Active"}
                                </span>
                                {w.lastTriggeredAt && (
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(w.lastTriggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleTestWebhook(w._id)}
                                disabled={webhookTestingId === w._id}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-lg font-semibold text-slate-700 transition-colors disabled:opacity-50"
                              >
                                {webhookTestingId === w._id ? "Pinging..." : "Test Ping"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
