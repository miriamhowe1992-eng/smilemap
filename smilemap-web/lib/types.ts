// lib/types.ts
export type NHSStatus = "GREEN" | "AMBER" | "RED" | "UNKNOWN";

export interface Practice {
  id: string;
  name: string;
  address?: string;
  postcode?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  nhsUrl?: string | null;
  status: NHSStatus;
  statusNote?: string;
  services?: string[];
  accessibility?: string[];
}

export interface EnrichedPractice {
  id: string;
  name: string;
  addressLine?: string | null;
  address?: string | null;        // sometimes present
  postcode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  nhsUrl?: string | null;
  status?: "GREEN" | "AMBER" | "RED" | "UNKNOWN" | null;
  statusNote?: string | null;
  services?: string[] | null;
  accessibility?: string[] | null;
  lastUpdated?: string | null;
}
