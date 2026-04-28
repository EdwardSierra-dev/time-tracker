"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import type { Profile, TimeEntryFilters } from "@/lib/types";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { TimeEntriesTable } from "@/components/TimeEntriesTable";
import { FiltersBar } from "@/components/FiltersBar";
import { TimeEntryForm } from "@/components/TimeEntryForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";

interface Props {
  profile: Profile;
}

function defaultFilters(userId: string): TimeEntryFilters {
  const today = format(new Date(), "yyyy-MM-dd");
  const sevenDaysAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");
  return {
    dateFrom: sevenDaysAgo,
    dateTo: today,
    analystId: userId, // both ANALYST and LEAD see only their own entries here
  };
}

export function EntriesClient({ profile }: Props) {
  const [filters, setFilters] = useState<TimeEntryFilters>(defaultFilters(profile.id));
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { entries, total, pageSize, loading, error, refetch } = useTimeEntries(filters, page);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function handleFiltersChange(f: TimeEntryFilters) {
    // Always lock analystId to current user (both roles see only their own entries here)
    setFilters({ ...f, analystId: profile.id });
    setPage(1);
  }

  // Strip analystId from what FiltersBar sees (it's internal)
  const visibleFilters: TimeEntryFilters = { ...filters, analystId: undefined };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mis entradas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} {total === 1 ? "entrada" : "entradas"}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Nueva entrada</Button>
      </div>

      <FiltersBar
        role={profile.role}
        filters={visibleFilters}
        onChange={handleFiltersChange}
      />

      <Card>
        {loading ? (
          <PageSpinner />
        ) : error ? (
          <p className="px-6 py-8 text-sm text-red-500">{error}</p>
        ) : (
          <TimeEntriesTable
            entries={entries}
            currentUser={profile}
            onRefetch={refetch}
          />
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <p className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nueva entrada">
        <TimeEntryForm
          userId={profile.id}
          onSuccess={() => {
            setShowForm(false);
            setPage(1);
            refetch();
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
