"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Stethoscope, ArrowRight, Loader2 } from "lucide-react";

export default function Onboarding() {
  const [selected, setSelected] = useState<"admin" | "dentist" | null>(null);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!selected || !dob || !gender) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/set-profile", {
      method: "POST",
      body: JSON.stringify({ role: selected, dob, gender }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      console.error("Failed to set profile", await res.text());
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const roles = [
    {
      id: "admin" as const,
      title: "Admin",
      description: "Manage the clinic, staff, and appointments across the platform.",
      icon: ShieldCheck,
      badge: "Full Access",
    },
    {
      id: "dentist" as const,
      title: "Dentist",
      description: "View your schedule, manage patients, and track treatments.",
      icon: Stethoscope,
      badge: "Clinical Access",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome — let's get you set up</h1>
          <p className="text-muted-foreground text-base">
            Tell us a bit about yourself to get started.
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select your role</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roles.map(({ id, title, description, icon: Icon, badge }) => (
              <Card
                key={id}
                onClick={() => setSelected(id)}
                className={`cursor-pointer transition-all border-2 hover:shadow-md ${
                  selected === id
                    ? "border-primary shadow-md"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-md bg-primary/10 w-fit">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary">{badge}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {selected === id && (
                    <p className="text-xs text-primary font-medium">✓ Selected</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* DOB + Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select onValueChange={setGender}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <Button
          className="w-full"
          size="lg"
          disabled={!selected || !dob || !gender || loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting up your account...</>
          ) : (
            <><ArrowRight className="mr-2 h-4 w-4" />Continue as {selected ?? "..."}</>
          )}
        </Button>
      </div>
    </div>
  );
}