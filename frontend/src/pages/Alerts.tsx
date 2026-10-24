import { useState } from "react";
import { Plus, Trash2, Loader2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from "lucide-react";
import { useAlerts, useAlertEvents, useCreateAlert, useUpdateAlert, useDeleteAlert } from "../hooks/useAlerts";
import type { BenchmarkType, Alert } from "../types";
import { format } from "date-fns";

const TYPES: BenchmarkType[] = ["nas", "smb", "docker", "kubernetes", "network"];
const CONDITIONS = ["lt", "gt", "lte", "gte"];

const defaultForm = {
  name: "",
  benchmark_type: "nas" as BenchmarkType,
  metric_name: "",
  condition: "lt",
  threshold: 0,
};

function AlertEvents({ alert }: { alert: Alert }) {
  const [open, setOpen] = useState(false);
  const { data: events } = useAlertEvents(open ? alert.id : 0);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        Events
      </button>
      {open && (
        <div className="mt-2 pl-4 space-y-1 border-l border-gray-800">
          {!events || events.length === 0 ? (
            <p className="text-xs text-gray-600">No events</p>
          ) : (
            events.slice(0, 5).map((e) => (
              <div key={e.id} className="text-xs text-gray-400">
                <span className="text-gray-600">{format(new Date(e.triggered_at), "MM/dd HH:mm")}</span>{" "}
                — {e.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Alerts() {
  const { data: alerts, isLoading } = useAlerts();
  const createMutation = useCreateAlert();
  const updateMutation = useUpdateAlert();
  const deleteMutation = useDeleteAlert();

  const [form, setForm] = useState(defaultForm);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = () => {
    createMutation.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        setForm(defaultForm);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alerts</h2>
          <p className="text-gray-500 text-sm mt-1">Threshold-based alerts with webhook support</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} /> New Alert
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-sm">New Alert</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Low NAS score"
              />
            </div>
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
              <label className="text-xs text-gray-400 mb-1 block">Metric Name</label>
              <input
                className="input"
                value={form.metric_name}
                onChange={(e) => setForm((f) => ({ ...f, metric_name: e.target.value }))}
                placeholder="score or seq_read_mb"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Condition</label>
              <select
                className="input"
                value={form.condition}
                onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
              >
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Threshold</label>
              <input
                className="input"
                type="number"
                value={form.threshold}
                onChange={(e) => setForm((f) => ({ ...f, threshold: parseFloat(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={handleCreate} disabled={createMutation.isPending}>
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
        ) : alerts && alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((a) => (
              <div key={a.id} className="border border-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{a.name}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {a.benchmark_type} · {a.metric_name} {a.condition} {a.threshold}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateMutation.mutate({ id: a.id, enabled: !a.enabled })}>
                      {a.enabled ? <ToggleRight size={20} className="text-blue-400" /> : <ToggleLeft size={20} className="text-gray-500" />}
                    </button>
                    <button onClick={() => deleteMutation.mutate(a.id)} className="text-gray-600 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {a.last_triggered && (
                  <p className="text-xs text-yellow-400">
                    Last triggered: {format(new Date(a.last_triggered), "MM/dd HH:mm")}
                  </p>
                )}
                <AlertEvents alert={a} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No alerts. Click "New Alert" to add one.</p>
        )}
      </div>
    </div>
  );
}
