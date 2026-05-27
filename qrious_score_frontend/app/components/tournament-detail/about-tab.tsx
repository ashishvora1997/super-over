"use client";

import { Trophy, MapPin, User, Mail, Calendar } from "lucide-react";
import { Tournament } from "@/app/types/tournaments.types";

interface AboutTabProps {
  tournament: Tournament;
  onUpdate?: () => void;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getTournamentColor(id: number) {
  const gradients = [
    "from-indigo-600 to-indigo-800",
    "from-purple-600 to-purple-800",
    "from-teal-600 to-teal-800",
    "from-orange-500 to-orange-700",
    "from-pink-600 to-pink-800",
    "from-sky-600 to-sky-800",
  ];
  return gradients[id % gradients.length];
}

export function AboutTab({ tournament }: AboutTabProps) {
  const gradient = getTournamentColor(tournament.id);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className={`h-24 bg-gradient-to-r ${gradient}`} />
        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg -mt-12 ring-4 ring-white`}
            >
              <Trophy size={28} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-xl font-bold text-foreground">
                {tournament.name}
              </h2>
              <p className="text-sm text-muted mt-0.5">
                Organized by {tournament.organiser_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
            Tournament Details
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Trophy size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted">Tournament Name</p>
                <p className="font-medium text-foreground">{tournament.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <MapPin size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted">City</p>
                <p className="font-medium text-foreground">
                  {tournament.city || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Calendar size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted">Tournament Dates</p>
                <p className="font-medium text-foreground">
                  {formatDate(tournament.start_date)} —{" "}
                  {formatDate(tournament.end_date)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
            Organiser Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <User size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted">Organiser Name</p>
                <p className="font-medium text-foreground">
                  {tournament.organiser_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Mail size={18} className="text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-muted">Organiser Email</p>
                <p className="font-medium text-foreground">
                  {tournament.organiser_email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
