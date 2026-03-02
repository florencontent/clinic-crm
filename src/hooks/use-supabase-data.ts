import { useState, useEffect, useCallback } from "react";
import {
  fetchPatients,
  fetchConversations,
  fetchAppointments,
  fetchDashboardMetrics,
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

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const result = await fetchDashboardMetrics();
    setData(result);
    setLoading(false);
  }, []);

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
    loading,
    refresh,
  };
}
