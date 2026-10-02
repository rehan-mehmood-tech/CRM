"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { subscribeLeads } from "@/lib/db/leads";
import { subscribeContacts } from "@/lib/db/contacts";
import { subscribeCompanies } from "@/lib/db/companies";
import { subscribeDeals } from "@/lib/db/deals";
import { subscribeTasks } from "@/lib/db/tasks";
import { subscribePipelines } from "@/lib/db/pipelines";
import { subscribeActivities } from "@/lib/db/activities";
import type { Activity, Company, Contact, Deal, Lead, Pipeline, Task } from "@/lib/types";

interface DataContextValue {
  leads: Lead[];
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  tasks: Task[];
  pipelines: Pipeline[];
  activities: Activity[];
  defaultPipeline: Pipeline | null;
  loading: boolean;
  error: string | null;
}

const EMPTY: DataContextValue = {
  leads: [],
  contacts: [],
  companies: [],
  deals: [],
  tasks: [],
  pipelines: [],
  activities: [],
  defaultPipeline: null,
  loading: true,
  error: null,
};

const DataContext = createContext<DataContextValue>(EMPTY);

/**
 * Holds one realtime subscription per collection for the active workspace so
 * every page reads the same live data instead of opening its own listeners.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const { orgId } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    setReady({});
    setError(null);

    const markReady = (key: string) => setReady((current) => ({ ...current, [key]: true }));
    const fail = (err: Error) => setError(err.message);

    const unsubscribers = [
      subscribeLeads(
        orgId,
        (rows) => {
          setLeads(rows);
          markReady("leads");
        },
        fail,
      ),
      subscribeContacts(
        orgId,
        (rows) => {
          setContacts(rows);
          markReady("contacts");
        },
        fail,
      ),
      subscribeCompanies(
        orgId,
        (rows) => {
          setCompanies(rows);
          markReady("companies");
        },
        fail,
      ),
      subscribeDeals(
        orgId,
        (rows) => {
          setDeals(rows);
          markReady("deals");
        },
        fail,
      ),
      subscribeTasks(
        orgId,
        (rows) => {
          setTasks(rows);
          markReady("tasks");
        },
        fail,
      ),
      subscribePipelines(
        orgId,
        (rows) => {
          setPipelines(rows);
          markReady("pipelines");
        },
        fail,
      ),
      subscribeActivities(
        orgId,
        (rows) => {
          setActivities(rows);
          markReady("activities");
        },
        fail,
      ),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      setLeads([]);
      setContacts([]);
      setCompanies([]);
      setDeals([]);
      setTasks([]);
      setPipelines([]);
      setActivities([]);
    };
  }, [orgId]);

  const value = useMemo<DataContextValue>(() => {
    const required = ["leads", "contacts", "companies", "deals", "tasks", "pipelines"];
    return {
      leads,
      contacts,
      companies,
      deals,
      tasks,
      pipelines,
      activities,
      defaultPipeline: pipelines.find((pipeline) => pipeline.isDefault) ?? pipelines[0] ?? null,
      loading: !required.every((key) => ready[key]),
      error,
    };
  }, [leads, contacts, companies, deals, tasks, pipelines, activities, ready, error]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  return useContext(DataContext);
}
