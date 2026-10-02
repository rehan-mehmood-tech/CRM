"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  getFirebaseAuth,
  googleProvider,
  isFirebaseConfigured,
} from "@/lib/firebase/client";
import {
  ensureUserProfile,
  getMember,
  subscribeMembers,
  subscribeOrganization,
  subscribeUserProfile,
} from "@/lib/db/orgs";
import type { Member, Organization, Role, UserProfile } from "@/lib/types";
import type { Actor } from "@/lib/db/activities";

const ORG_STORAGE_KEY = "rehan-crm:org";

export type AuthStatus = "loading" | "unauthenticated" | "no-workspace" | "ready";

interface AuthContextValue {
  configured: boolean;
  status: AuthStatus;
  user: User | null;
  profile: UserProfile | null;
  org: Organization | null;
  orgId: string | null;
  members: Member[];
  role: Role | null;
  actor: Actor | null;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchOrg: (orgId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured;
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!configured);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auth session
  useEffect(() => {
    if (!configured) return;
    return onAuthStateChanged(getFirebaseAuth(), async (next) => {
      setUser(next);
      setAuthReady(true);
      if (next) {
        try {
          await ensureUserProfile(next);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not load your profile.");
        }
      } else {
        setProfile(null);
        setProfileReady(true);
        setOrgId(null);
        setOrg(null);
        setMembers([]);
        setRole(null);
      }
    });
  }, [configured]);

  // User profile document
  useEffect(() => {
    if (!configured || !user) return;
    setProfileReady(false);
    return subscribeUserProfile(
      user.uid,
      (next) => {
        setProfile(next);
        setProfileReady(true);
      },
      (err) => {
        setError(err.message);
        setProfileReady(true);
      },
    );
  }, [configured, user]);

  // Pick the active workspace: last used, then profile default, then first available.
  useEffect(() => {
    if (!profile) return;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(ORG_STORAGE_KEY) : null;
    const candidates = profile.orgIds ?? [];
    const next =
      (stored && candidates.includes(stored) && stored) ||
      (profile.defaultOrgId && candidates.includes(profile.defaultOrgId) && profile.defaultOrgId) ||
      candidates[0] ||
      null;
    setOrgId(next);
  }, [profile]);

  // Active organization document
  useEffect(() => {
    if (!configured || !orgId) {
      setOrg(null);
      return;
    }
    return subscribeOrganization(orgId, setOrg, (err) => setError(err.message));
  }, [configured, orgId]);

  // Team members of the active organization
  useEffect(() => {
    if (!configured || !orgId) {
      setMembers([]);
      return;
    }
    return subscribeMembers(orgId, setMembers, () => setMembers([]));
  }, [configured, orgId]);

  // The role of the signed-in user inside the active organization
  useEffect(() => {
    if (!orgId || !user) {
      setRole(null);
      return;
    }
    const fromList = members.find((member) => member.id === user.uid);
    if (fromList) {
      setRole(fromList.role);
      return;
    }
    let cancelled = false;
    getMember(orgId, user.uid)
      .then((member) => {
        if (!cancelled) setRole(member?.role ?? null);
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, user, members]);

  const status: AuthStatus = useMemo(() => {
    if (!configured) return "unauthenticated";
    if (!authReady) return "loading";
    if (!user) return "unauthenticated";
    if (!profileReady) return "loading";
    if (!orgId) return "no-workspace";
    if (!org) return "loading";
    return "ready";
  }, [configured, authReady, user, profileReady, orgId, org]);

  const switchOrg = useCallback((next: string) => {
    if (typeof window !== "undefined") window.localStorage.setItem(ORG_STORAGE_KEY, next);
    setOrgId(next);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  }, []);

  const signUpWithEmail = useCallback(async (name: string, email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
    await ensureUserProfile(credential.user);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(getFirebaseAuth(), googleProvider());
    await ensureUserProfile(credential.user);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  }, []);

  const signOut = useCallback(async () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(ORG_STORAGE_KEY);
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const actor: Actor | null = useMemo(() => {
    if (!user) return null;
    return { id: user.uid, name: profile?.name || user.displayName || user.email || "Teammate" };
  }, [user, profile]);

  const value: AuthContextValue = {
    configured,
    status,
    user,
    profile,
    org,
    orgId,
    members,
    role,
    actor,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
    signOut,
    switchOrg,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

/** Convenience hook for pages that only render once a workspace is loaded. */
export function useWorkspace() {
  const { orgId, org, actor, role, members } = useAuth();
  return {
    orgId: orgId as string,
    org: org as Organization,
    actor: actor as Actor,
    role,
    members,
    currency: org?.currency ?? "USD",
  };
}
