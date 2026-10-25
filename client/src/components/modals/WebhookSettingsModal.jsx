import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  listWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
} from "../../services/webhookService";
import {
  LuWebhook,
  LuSend,
  LuTrash2,
  LuPlus,
  LuCheck,
  LuCircleAlert,
  LuX,
  LuLoader,
  LuRadio,
} from "react-icons/lu";

const AVAILABLE_EVENTS = [
  { id: "task.created", label: "Task Created" },
  { id: "task.completed", label: "Task Completed" },
  { id: "task.updated", label: "Task Updated" },
  { id: "milestone.completed", label: "Milestone Completed" },
  { id: "project.archived", label: "Project Archived" },
];

const WebhookSettingsModal = ({ projectId, projectTitle, closeModal }) => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState([
    "task.created",
    "task.completed",
  ]);

  const loadWebhooks = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listWebhooks(projectId);
      setWebhooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load webhooks error:", err);
      setError(err?.message || "Failed to load webhooks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadWebhooks();
  }, [projectId]);

  const handleToggleEvent = (eventId) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    if (!targetUrl.trim() || !targetUrl.startsWith("http")) {
      setError("Please enter a valid HTTP/HTTPS webhook target URL.");
      return;
    }

    if (selectedEvents.length === 0) {
      setError("Please select at least one trigger event.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const created = await createWebhook(projectId, {
        targetUrl: targetUrl.trim(),
        secret: secret.trim(),
        events: selectedEvents,
      });

      setWebhooks((prev) => [created, ...prev]);
      setTargetUrl("");
      setSecret("");
      setSelectedEvents(["task.created", "task.completed"]);
      setShowAddForm(false);
      setSuccessMsg("Webhook integration registered successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Create webhook error:", err);
      setError(err?.message || "Failed to register webhook.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
    if (!window.confirm("Remove this webhook integration?")) return;

    try {
      await deleteWebhook(projectId, webhookId);
      setWebhooks((prev) => prev.filter((w) => w._id !== webhookId));
    } catch (err) {
      console.error("Delete webhook error:", err);
      setError(err?.message || "Failed to remove webhook.");
    }
  };

  const handleTestWebhook = async (webhookId) => {
    setTestingId(webhookId);
    setTestResult(null);

    try {
      const res = await testWebhook(projectId, webhookId);
      setTestResult({
        id: webhookId,
        success: res.success,
        message: res.message,
      });
      loadWebhooks();
    } catch (err) {
      setTestResult({
        id: webhookId,
        success: false,
        message: err?.message || "Test ping delivery failed.",
      });
    } finally {
      setTestingId(null);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-2xl overflow-hidden transition-all scale-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <LuWebhook size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Outbound Webhook Integrations
              </h2>
              <p className="text-xs text-slate-500">
                Stream real-time sprint events to Slack, Discord, or custom microservices
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <LuCircleAlert size={16} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <LuCheck size={16} className="shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Top Info & Action Strip */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Target Workspace: {projectTitle || "Active Workspace"}
              </p>
              <p className="text-[11px] text-slate-500">
                Dispatches HMAC-signed JSON event payloads automatically on task and sprint updates.
              </p>
            </div>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 ml-3"
              >
                <LuPlus size={14} />
                Add Webhook
              </button>
            )}
          </div>

          {/* Add Webhook Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateWebhook}
              className="bg-slate-50/70 border border-blue-200 rounded-xl p-4 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  New Webhook Endpoint
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Endpoint URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secret Key (Optional HMAC-SHA256 signing)
                </label>
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="e.g. whsec_sampleSecret123"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subscribed Event Triggers
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_EVENTS.map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev.id)}
                        onChange={() => handleToggleEvent(ev.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="truncate">{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !targetUrl.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <LuLoader size={13} className="animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Save Webhook"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Webhooks Listing */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Active Endpoints ({webhooks.length})
            </h3>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <LuLoader className="animate-spin mx-auto mb-2 text-blue-600" size={18} />
                Loading webhook endpoints...
              </div>
            ) : webhooks.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl">
                <LuRadio size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">No Webhooks Registered</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Connect Slack, Discord, or CI pipelines to receive real-time notifications.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map((hook) => (
                  <div
                    key={hook._id}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <p className="text-xs font-mono font-bold text-slate-900 truncate">
                            {hook.targetUrl}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {hook.events.map((ev) => (
                            <span
                              key={ev}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTestWebhook(hook._id)}
                          disabled={testingId === hook._id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-200"
                          title="Send test ping to endpoint"
                        >
                          {testingId === hook._id ? (
                            <LuLoader size={12} className="animate-spin" />
                          ) : (
                            <LuSend size={12} />
                          )}
                          Test Ping
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWebhook(hook._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete webhook"
                        >
                          <LuTrash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Delivery Status & Meta */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span>
                        Last Delivery:{" "}
                        {hook.lastTriggeredAt
                          ? new Date(hook.lastTriggeredAt).toLocaleTimeString()
                          : "Never"}
                      </span>
                      {hook.lastResponseStatus && (
                        <span
                          className={`font-semibold ${
                            hook.lastResponseStatus >= 200 &&
                            hook.lastResponseStatus < 300
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          Status {hook.lastResponseStatus}
                        </span>
                      )}
                    </div>

                    {/* Test result alert */}
                    {testResult && testResult.id === hook._id && (
                      <div
                        className={`p-2 rounded-lg text-xs font-medium ${
                          testResult.success
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {testResult.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default WebhookSettingsModal;
