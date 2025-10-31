// /lib/practices.ts
import type { NHSStatus } from "@/components/StatusBadge";
import type { Practice } from "@/components/PracticeCard";

// Seed practices (replace with real data/API later)
export const practices: Practice[] = [
  {
    id: "city-dental-care",
    name: "City Dental Care",
    address: "12 Queen Street, London SW1A",
    phone: "020 7946 0999",
    email: "hello@citydental.example",
    status: "GREEN" as NHSStatus,
    statusNote: "Accepting new NHS patients (adults and children).",
    accessibility: ["Wheelchair access"],
    nhsLink: "#",
    isSponsored: true,
  },
  {
    id: "bristol-smile-studio",
    name: "Bristol Smile Studio",
    address: "5 Park Lane, Bristol BS1",
    phone: "0117 000 1234",
    email: "reception@bristolsmile.example",
    status: "AMBER" as NHSStatus,
    statusNote: "Limited NHS availability (children only / waiting list).",
    accessibility: ["Not specified"],
    nhsLink: "#",
  },
  {
    id: "manchester-dental-centre",
    name: "Manchester Dental Centre",
    address: "42 King Street, Manchester M2",
    phone: "0161 123 4567",
    email: "hello@manchesterdental.example",
    status: "RED" as NHSStatus,
    statusNote: "Not accepting new NHS patients (private or referral only).",
    accessibility: ["Not specified"],
    nhsLink: "#",
  },
export const practices: Practice[] = [
  {
    id: "city-dental-care",
    name: "City Dental Care",
    address: "12 Queen Street, London SW1A",
    phone: "020 7946 0999",
    email: "hello@citydental.example",
    status: "GREEN",
    statusNote: "Accepting new NHS patients (adults and children).",
    accessibility: ["Wheelchair access"],
    nhsLink: "#",
    isSponsored: true,
    lat: 51.5033,
    lng: -0.1276,
  },
  {
    id: "manchester-dental-centre",
    name: "Manchester Dental Centre",
    address: "42 King Street, Manchester M2",
    phone: "0161 123 4567",
    email: "hello@manchesterdental.example",
    status: "RED",
    statusNote: "Not accepting new NHS patients (private or referral only).",
    accessibility: ["Not specified"],
    nhsLink: "#",
    lat: 53.4810,
    lng: -2.2426,
  },
];
