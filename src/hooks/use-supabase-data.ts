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

const POLL_INTERVAL = 15_000; // 15 seconds

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
  totalRevenue: number;
}

function getPeriodRange(filter: string, since?: string, until?: string): { from: string; to: string; prevFrom: string; prevTo: string } | null {
  if (filter === "custom" && since && until) {
    const days = Math.round((new Date(until).getTime() - new Date(since).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const prevTo = new Date(since);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - days + 1);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return { from: since, to: until, prevFrom: fmt(prevFrom), prevTo: fmt(prevTo) };
  }

  const now = new Date();
  const toDate = new Date(now);
  let days = 0;
  if (filter === "last_7d") days = 7;
  else if (filter === "last_14d") days = 14;
  else if (filter === "last_30d") days = 30;
  else if (filter === "maximum") days = 365;
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

export function useDashboardData(activeFilter?: string, since?: string, until?: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevPeriod, setPrevPeriod] = useState<PeriodComparison | null>(null);
  const [currPeriod, setCurrPeriod] = useState<PeriodComparison | null>(null);

  const refresh = useCallback(async () => {
    const result = await fetchDashboardMetrics();
    setData(result);
    setLoading(false);

    if (activeFilter) {
      const range = getPeriodRange(activeFilter, since, until);
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
  }, [activeFilter, since, until]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    metrics: data?.metrics ?? { totalLeads: 0, totalSales: 0, followUp: 0, perdidos: 0, totalRevenue: 0 },
    funnel: data?.funnel ?? [],
    source: data?.source ?? [],
    sourceAgendamentos: data?.sourceAgendamentos ?? [],
    sourceVendas: data?.sourceVendas ?? [],
    conversion: data?.conversion ?? [],
    currPeriod,
    prevPeriod,
    loading,
    refresh,
  };
}
