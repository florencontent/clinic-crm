import { useState, useEffect, useCallback } from "react";
import {
  fetchPatients,
  fetchConversations,
  fetchAppointments,
  fetchDashboardMetrics,
  fetchDashboardMetricsByRange,
  type DashboardData,
} from "@/lib/api";
import type { Lead, Conversation, Appointment } from "@/data/mock-data";

const POLL_INTERVAL = 30_000; // 30 seconds

// ── usePatients ──

export function usePatients() {
  const [patients, setPatients] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchPatients();
    setPatients(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { patients, loading, setPatients, refresh };
}

// ── useConversations ──

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchConversations();
    setConversations(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { conversations, loading, setConversations, refresh };
}

// ── useAppointments ──

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchAppointments();
    setAppointments(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { appointments, loading, setAppointments, refresh };
}

// ── useDashboardData ──

export interface PeriodComparison {
  totalLeads: number;
  agendados: number;
  compareceram: number;
  totalSales: number;
}

function getPeriodRange(filter: string): { from: string; to: string; prevFrom: string; prevTo: string } | null {
  const now = new Date();
  const toDate = new Date(now);
  let days = 0;
  if (filter === "hoje") days = 1;
  else if (filter === "7d") days = 7;
  else if (filter === "15d") days = 15;
  else if (filter === "30d") days = 30;
  else return null;

  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - days);

  const prevToDate = new Date(fromDate);
  prevToDate.setDate(prevToDate.getDate() - 1);
  const prevFromDate = new Date(prevToDate);
  prevFromDate.setDate(prevFromDate.getDate() - days);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return {
    from: fmt(fromDate),
    to: fmt(toDate),
    prevFrom: fmt(prevFromDate),
    prevTo: fmt(prevToDate),
  };
}

export function useDashboardData(activeFilter?: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevPeriod, setPrevPeriod] = useState<PeriodComparison | null>(null);
  const [currPeriod, setCurrPeriod] = useState<PeriodComparison | null>(null);

  const refresh = useCallback(async () => {
    const result = await fetchDashboardMetrics();
    setData(result);
    setLoading(false);

    if (activeFilter) {
      const range = getPeriodRange(activeFilter);
      if (range) {
        const [curr, prev] = await Promise.all([
          fetchDashboardMetricsByRange(range.from + "T00:00:00Z", range.to + "T23:59:59Z"),
          fetchDashboardMetricsByRange(range.prevFrom + "T00:00:00Z", range.prevTo + "T23:59:59Z"),
        ]);
        setCurrPeriod(curr);
        setPrevPeriod(prev);
      } else {
        setCurrPeriod(null);
        setPrevPeriod(null);
      }
    }
  }, [activeFilter]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    metrics: data?.metrics ?? { totalLeads: 0, totalSales: 0 },
    funnel: data?.funnel ?? [],
    source: data?.source ?? [],
    conversion: data?.conversion ?? [],
    currPeriod,
    prevPeriod,
    loading,
    refresh,
  };
}
