"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function ProfilePage() {
  const { user, token, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    country: "",
    postalCode: "",
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        street: user.address?.street || "",
        city: user.address?.city || "",
        country: user.address?.country || "",
        postalCode: user.address?.postalCode || "",
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateProfile(
        {
          name: profileForm.name,
          phone: profileForm.phone,
          address: {
            street: profileForm.street,
            city: profileForm.city,
            country: profileForm.country,
            postalCode: profileForm.postalCode,
          },
        },
        token
      );
      showToast("Profile updated ✅", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError("");
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    setSavingPw(true);
    try {
      await api.changePassword(
        { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword },
        token
      );
      showToast("Password changed successfully ✅", "success");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwError(err.message);
      showToast(err.message, "error");
    } finally {
      setSavingPw(false);
    }
  };

  if (authLoading || !user) {
    return <p className="max-w-2xl mx-auto px-4 py-16 text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold mb-6">My Profile</h1>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input value={user.email} disabled className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-500" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="+923001234567"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <h3 className="text-sm font-semibold text-gray-500 pt-2">Address</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Street"
              value={profileForm.street}
              onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
              className="col-span-2 border rounded px-3 py-2"
            />
            <input
              placeholder="City"
              value={profileForm.city}
              onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              placeholder="Postal Code"
              value={profileForm.postalCode}
              onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              placeholder="Country"
              value={profileForm.country}
              onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
              className="col-span-2 border rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="bg-brand text-white px-6 py-2 rounded font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      <div className="border-t pt-8">
        <h2 className="font-display text-xl font-bold mb-6">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Current Password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="password"
            placeholder="New Password (min 6 characters)"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            required
            minLength={6}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
          {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
          <button
            type="submit"
            disabled={savingPw}
            className="bg-brand text-white px-6 py-2 rounded font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {savingPw ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
