import { useState } from "react";
import { Plus, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { useSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule } from "../hooks/useSchedules";
import type { BenchmarkType } from "../types";
import { format } from "date-fns";

const TYPES: BenchmarkType[] = ["nas", "smb", "docker", "kubernetes", "network"];

const CRON_PRESETS = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Weekly (Sunday)", value: "0 0 * * 0" },
];

export default function Schedules() {
  const { data: schedules, isLoading } = useSchedules();
  const createMutation = useCreateSchedule();
  const updateMutation = useUpdateSchedule();
  const deleteMutation = useDeleteSchedule();

  const [form, setForm] = useState({ benchmark_type: "nas" as BenchmarkType, cron_expression: "0 * * * *" });
  const [showForm, setShowForm] = useState(false);

  const handleCreate = () => {
    createMutation.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        setForm({ benchmark_type: "nas", cron_expression: "0 * * * *" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schedules</h2>
          <p className="text-gray-500 text-sm mt-1">Automated benchmark scheduling via cron</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} /> New Schedule
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-sm">New Schedule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Benchmark Type</label>
              <select
                className="input"
                value={form.benchmark_type}
                onChange={(e) => setForm((f) => ({ ...f, benchmark_type: e.target.value as BenchmarkType }))}
              >
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Cron Expression</label>
              <input
                className="input"
                value={form.cron_expression}
                onChange={(e) => setForm((f) => ({ ...f, cron_expression: e.target.value }))}
                placeholder="0 * * * *"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {CRON_PRESETS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setForm((f) => ({ ...f, cron_expression: value }))}
                    className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-400 hover:text-white"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-primary"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
              Create
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : schedules && schedules.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase">
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Cron</th>
                <th className="pb-2 pr-4">Last Run</th>
                <th className="pb-2 pr-4">Enabled</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-b border-gray-900">
                  <td className="py-2 pr-4 font-medium">{s.benchmark_type}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-gray-300">{s.cron_expression}</td>
                  <td className="py-2 pr-4 text-gray-400 text-xs">
                    {s.last_run ? format(new Date(s.last_run), "MM/dd HH:mm") : "Never"}
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      onClick={() => updateMutation.mutate({ id: s.id, enabled: !s.enabled })}
                      className="text-gray-400 hover:text-blue-400"
                    >
                      {s.enabled ? <ToggleRight size={20} className="text-blue-400" /> : <ToggleLeft size={20} />}
                    </button>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => deleteMutation.mutate(s.id)}
                      className="text-gray-600 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-sm">No schedules yet. Click "New Schedule" to add one.</p>
        )}
      </div>
    </div>
  );
}
