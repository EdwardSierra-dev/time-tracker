"use client";

import { useState } from "react";
import { format, startOfWeek, isWithinInterval, parseISO } from "date-fns";
import type { TimeEntry, Profile } from "@/lib/types";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Modal } from "./ui/Modal";
import { TimeEntryForm } from "./TimeEntryForm";
import { createClient } from "@/lib/supabase/client";

interface TimeEntriesTableProps {
  entries: TimeEntry[];
  currentUser: Profile;
  onRefetch: () => void;
}

function isEditableEntry(entry: TimeEntry): boolean {
  const entryDate = parseISO(entry.date);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
}

export function TimeEntriesTable({ entries, currentUser, onRefetch }: TimeEntriesTableProps) {
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta entrada?")) return;
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("time_entries").delete().eq("id", id);
    setDeletingId(null);
    onRefetch();
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">No hay entradas registradas</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Analista</th>
              <th className="px-4 py-3">Proyecto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Horas</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry) => {
              const isOwn = entry.user_id === currentUser.id;
              const editable = isOwn && isEditableEntry(entry);

              return (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {entry.profiles?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.projects?.name ? (
                      <Badge variant="blue">{entry.projects.name}</Badge>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{entry.client || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {format(parseISO(entry.date), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {Number(entry.hours).toFixed(1)}h
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {entry.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {editable && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditEntry(entry)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={deletingId === entry.id}
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editEntry}
        onClose={() => setEditEntry(null)}
        title="Editar entrada"
      >
        {editEntry && (
          <TimeEntryForm
            userId={currentUser.id}
            entry={editEntry}
            onSuccess={() => {
              setEditEntry(null);
              onRefetch();
            }}
            onCancel={() => setEditEntry(null)}
          />
        )}
      </Modal>
    </>
  );
}
