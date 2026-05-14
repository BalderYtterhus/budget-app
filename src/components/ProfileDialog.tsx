import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, Check, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth();
  const { members, refetchHousehold } = useHousehold();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMember = members.find(m => m.user_id === user?.id);
  const initials = (currentMember?.profile?.display_name || user?.email || "??")
    .slice(0, 2).toUpperCase();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setDisplayName(currentMember?.profile?.display_name || "");
    setAvatarUrl(currentMember?.profile?.avatar_url || null);
    setNewEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setNameSaved(false);
  }, [open, user]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Bildet er for stort (maks 2 MB)", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      await refetchHousehold();
      toast({ title: "Profilbilde oppdatert!" });
    } catch (err) {
      console.error(err);
      toast({ title: "Kunne ikke laste opp bilde", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("user_id", user.id);
    setSavingName(false);
    if (error) {
      toast({ title: "Kunne ikke lagre navn", variant: "destructive" });
      return;
    }
    await refetchHousehold();
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setSavingEmail(false);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
      return;
    }
    setNewEmail("");
    toast({ title: "Bekreftelseslenke sendt til ny e-post" });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Passord må være minst 6 tegn", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passordene stemmer ikke overens", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "Passord oppdatert!" });
  };

  const passwordStrength = (pw: string): { label: string; color: string } => {
    if (!pw) return { label: "", color: "" };
    if (pw.length < 6) return { label: "For kort", color: "text-destructive" };
    if (pw.length < 8) return { label: "Svakt", color: "text-warning" };
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { label: "Sterkt", color: "text-green-600 dark:text-green-400" };
    return { label: "OK", color: "text-muted-foreground" };
  };

  const strength = passwordStrength(newPassword);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Min profil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <button
              className="relative group"
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
            >
              <Avatar className="h-20 w-20">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-colors">
                {uploadingAvatar
                  ? <Loader2 className="h-6 w-6 text-white animate-spin opacity-0 group-hover:opacity-100" />
                  : <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                }
              </div>
            </button>
            <p className="text-xs text-muted-foreground">Klikk for å endre bilde (maks 2 MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <Separator />

          {/* Display name */}
          <div className="space-y-2">
            <Label htmlFor="display-name">Visningsnavn</Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setNameSaved(false); }}
                placeholder="Skriv inn navn"
                onKeyDown={e => e.key === "Enter" && handleSaveName()}
              />
              <Button
                size="icon"
                onClick={handleSaveName}
                disabled={savingName || !displayName.trim()}
                className="shrink-0"
              >
                {savingName
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : nameSaved
                    ? <Check className="h-4 w-4 text-green-500" />
                    : <Check className="h-4 w-4" />
                }
              </Button>
            </div>
          </div>

          <Separator />

          {/* Email change */}
          <div className="space-y-2">
            <Label htmlFor="new-email">Endre e-post</Label>
            <p className="text-xs text-muted-foreground">
              Nåværende: <span className="font-medium">{user?.email}</span>
            </p>
            <div className="flex gap-2">
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="ny@epost.no"
              />
              <Button
                size="sm"
                onClick={handleChangeEmail}
                disabled={savingEmail || !newEmail.trim()}
                className="shrink-0"
              >
                {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              En bekreftelseslenke sendes til den nye adressen.
            </p>
          </div>

          <Separator />

          {/* Password change */}
          <div className="space-y-2">
            <Label>Endre passord</Label>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nytt passord"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {strength.label && (
                <p className={`text-xs ${strength.color}`}>{strength.label}</p>
              )}
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Bekreft passord"
                onKeyDown={e => e.key === "Enter" && handleChangePassword()}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Passordene stemmer ikke overens</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleChangePassword}
              disabled={savingPassword || !newPassword || newPassword !== confirmPassword}
            >
              {savingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Endre passord
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
