"use client";

import { useEffect, useState } from "react";
import { getMyProfile, upsertProfile } from "@/app/services/profile.service";
import { logoutAllDevices } from "@/app/services/auth.service";
import { useAuthStore } from "@/app/store/auth.store";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select } from "@/app/components/ui/select";
import { ConfirmModal } from "@/app/components/ui/modal/confirm-modal";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";
import {
  UserCircle,
  Loader2,
  AlertCircle,
  Pencil,
  MapPin,
  Calendar,
  Activity,
  ChevronRight,
  Shield,
  LogOut,
} from "lucide-react";
import {
  PLAYING_ROLE_OPTIONS,
  BATTING_STYLE_OPTIONS,
  BOWLING_STYLE_OPTIONS,
  GENDER_OPTIONS,
  profileLabel,
  type ProfileData,
  type Gender,
  type PlayingRole,
  type BattingStyle,
  type BowlingStyle,
} from "@/app/types/profile.types";
import { AxiosError } from "axios";

type BackendErrorResponse = {
  message?: string | string[] | { message?: string };
  error?: string;
};

function getBackendError(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as BackendErrorResponse | undefined;

    if (!data) {
      return "Something went wrong. Please try again.";
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    if (Array.isArray(data.message)) {
      return data.message[0] ?? "Something went wrong. Please try again.";
    }

    if (
      typeof data.message === "object" &&
      data.message !== null &&
      typeof data.message.message === "string"
    ) {
      return data.message.message;
    }

    if (typeof data.error === "string") {
      return data.error;
    }

    return "Something went wrong. Please try again.";
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "Something went wrong. Please try again.";
}

function StatChip({
  label,
  value,
  empty,
}: {
  label: string;
  value: string;
  empty?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 bg-gray-50 border border-border rounded-xl px-4 py-3 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-sm font-semibold truncate ${empty ? "text-muted-foreground italic font-normal" : "text-foreground"}`}
      >
        {value || "Not set"}
      </span>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  empty = false,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  empty?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 group hover:bg-gray-50/70 transition-colors rounded-xl">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
          ${
            accent
              ? "bg-primary/10 group-hover:bg-primary/15"
              : "bg-gray-100 group-hover:bg-gray-150"
          }`}
      >
        <Icon
          className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p
          className={`text-sm font-semibold truncate ${empty ? "text-muted-foreground font-normal italic" : "text-foreground"}`}
        >
          {value || "Not set"}
        </p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  color = "primary",
}: {
  icon: React.ElementType;
  title: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-5 pt-5 pb-1">
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center ${color === "cricket" ? "bg-emerald-100" : "bg-primary/10"}`}
      >
        <Icon
          className={`w-3.5 h-3.5 ${color === "cricket" ? "text-emerald-600" : "text-primary"}`}
        />
      </div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [dob, setDob] = useState("");
  const [loc, setLoc] = useState("");
  const [gen, setGen] = useState<Gender>("male");
  const [role, setRole] = useState<PlayingRole>("none");
  const [bat, setBat] = useState<BattingStyle>("none");
  const [bowl, setBowl] = useState<BowlingStyle>("none");

  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllDevices();
      clearAuth();
      router.replace("/login");
      toast.success("Logged out from all devices successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoggingOutAll(false);
      setShowLogoutAllModal(false);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyProfile();
      setProfile(res.data);
    } catch (err) {
      setError(getBackendError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const startEdit = () => {
    if (!profile) return;
    setDob(profile.date_of_birth?.split("T")[0] || "");
    setLoc(profile.location || "");
    setGen(profile.gender || "male");
    setRole(profile.playing_role || "none");
    setBat(profile.batting_style || "none");
    setBowl(profile.bowling_style || "none");
    setEditError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setEditError("");
    try {
      const res = await upsertProfile({
        date_of_birth: dob,
        location: loc.trim(),
        gender: gen,
        playing_role: role,
        batting_style: bat,
        bowling_style: bowl,
      });
      setProfile(res.data);
      updateUser({ is_profile_complete: res.data.user.is_profile_complete });
      setEditing(false);
    } catch (err) {
      setEditError(getBackendError(err));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "Not set";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
        <p className="text-base font-semibold text-foreground mb-1">
          Failed to load profile
        </p>
        <p className="text-sm text-muted-foreground mb-5">{error}</p>
        <Button onClick={fetchProfile} variant="secondary">
          Try Again
        </Button>
      </div>
    );
  }

  if (!profile) return null;

  const fields = [
    profile.date_of_birth,
    profile.location,
    profile.gender,
    profile.playing_role !== "none" && profile.playing_role,
    profile.batting_style !== "none" && profile.batting_style,
    profile.bowling_style !== "none" && profile.bowling_style,
  ];
  const filled = fields.filter(Boolean).length;
  const completePct = Math.round((filled / fields.length) * 100);

  const initials =
    profile.name
      ?.split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="max-w-2xl mx-auto py-2 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight">
            My Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and manage your cricket identity
          </p>
        </div>
        {!editing && (
          <Button
            variant="secondary"
            onClick={startEdit}
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 h-10"
          >
            <Pencil className="w-4 h-4" />
            <span className="font-semibold">Edit Profile</span>
          </Button>
        )}
      </div>

      <div className="relative bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-primary/60" />

        <div className="flex items-center gap-5 px-6 py-5">
          <div className="relative flex-shrink-0">
            <div className="w-[68px] h-[68px] rounded-2xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/25 select-none">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate leading-tight">
              {profile.name}
            </h2>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {user?.email}
            </p>
            {profile.location && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {profile.location}
              </p>
            )}
          </div>

          <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {completePct}% complete
              </span>
            </div>
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${completePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {editing ? (
        <div className="bg-white border border-border rounded-2xl shadow-sm">
          <div className="p-6 space-y-6">
            {editError && (
              <div className="flex items-start gap-3 p-4 bg-destructive/8 border border-destructive/20 rounded-xl text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    Personal Info
                  </h3>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <Input
                    label="Location"
                    placeholder="City / Town"
                    value={loc}
                    onChange={(e) => setLoc(e.target.value)}
                  />
                  <Select
                    label="Gender"
                    value={gen}
                    onChange={(v) => setGen(v as Gender)}
                    options={GENDER_OPTIONS}
                    placeholder="Select gender"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    Cricket Profile
                  </h3>
                </div>
                <div className="space-y-4">
                  <Select
                    label="Playing Role"
                    value={role}
                    onChange={(v) => setRole(v as PlayingRole)}
                    options={PLAYING_ROLE_OPTIONS}
                    placeholder="Select playing role"
                  />
                  <Select
                    label="Batting Style"
                    value={bat}
                    onChange={(v) => setBat(v as BattingStyle)}
                    options={BATTING_STYLE_OPTIONS}
                    placeholder="Select batting style"
                  />
                  <Select
                    label="Bowling Style"
                    value={bowl}
                    onChange={(v) => setBowl(v as BowlingStyle)}
                    options={BOWLING_STYLE_OPTIONS}
                    placeholder="Select bowling style"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-11"
              >
                {saving ? "Saving…" : "Save Changes"}
              </Button>
              <Button
                variant="secondary"
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <SectionHeader icon={Calendar} title="Personal Info" />
            <div className="p-2 mt-1 space-y-0.5">
              <InfoRow
                icon={Calendar}
                label="Date of Birth"
                value={formatDate(profile.date_of_birth)}
                empty={!profile.date_of_birth}
              />
              <InfoRow
                icon={MapPin}
                label="Location"
                value={profile.location || ""}
                empty={!profile.location}
              />
              <InfoRow
                icon={UserCircle}
                label="Gender"
                value={profileLabel.gender(profile.gender)}
                empty={!profile.gender}
              />
            </div>
            <div className="h-4" />
          </div>

          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <SectionHeader
              icon={Activity}
              title="Cricket Profile"
              color="cricket"
            />
            <div className="p-2 mt-1 space-y-0.5">
              <InfoRow
                icon={Shield}
                label="Playing Role"
                value={profileLabel.playingRole(profile.playing_role)}
                empty={!profile.playing_role || profile.playing_role === "none"}
                accent
              />
              <InfoRow
                icon={Activity}
                label="Batting Style"
                value={profileLabel.battingStyle(profile.batting_style)}
                empty={
                  !profile.batting_style || profile.batting_style === "none"
                }
                accent
              />
              <InfoRow
                icon={Activity}
                label="Bowling Style"
                value={profileLabel.bowlingStyle(profile.bowling_style)}
                empty={
                  !profile.bowling_style || profile.bowling_style === "none"
                }
                accent
              />
            </div>
            <div className="h-4" />
          </div>

          <div className="sm:col-span-2 grid grid-cols-3 gap-3">
            <StatChip
              label="Role"
              value={profileLabel.playingRole(profile.playing_role)}
              empty={!profile.playing_role || profile.playing_role === "none"}
            />
            <StatChip
              label="Batting"
              value={profileLabel.battingStyle(profile.batting_style)}
              empty={!profile.batting_style || profile.batting_style === "none"}
            />
            <StatChip
              label="Bowling"
              value={profileLabel.bowlingStyle(profile.bowling_style)}
              empty={!profile.bowling_style || profile.bowling_style === "none"}
            />
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <SectionHeader icon={Shield} title="Security" />
        <div className="p-5 pt-3">
          <div className="flex items-center justify-between gap-4 p-4 bg-red-50/60 border border-red-100 rounded-xl">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Logout from all devices
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  End all active sessions on other devices and browsers
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              onClick={() => setShowLogoutAllModal(true)}
              className="flex-shrink-0 px-4 py-2 h-9 text-xs"
            >
              Logout All
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showLogoutAllModal}
        onClose={() => setShowLogoutAllModal(false)}
        onConfirm={handleLogoutAllDevices}
        title="Logout from all devices?"
        description="You will be logged out from all active sessions on other devices and browsers. You will need to login again everywhere."
        confirmText="Logout All Devices"
        loading={loggingOutAll}
        variant="danger"
      />
    </div>
  );
}
