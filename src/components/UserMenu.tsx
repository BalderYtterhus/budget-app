import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Users, Home, Settings, Edit2, Save, X, Check, Sun, Moon, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HouseholdInvite } from "@/components/HouseholdInvite";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { household, members } = useHousehold();
  const [showHouseholdSettings, setShowHouseholdSettings] = useState(false);
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  const initials = user.email
    ? user.email.substring(0, 2).toUpperCase()
    : "??";

  const currentMember = members.find(m => m.user_id === user.id);
  const displayName = currentMember?.profile?.display_name || user.email?.split("@")[0];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              {household && (
                <p className="text-xs leading-none text-muted-foreground flex items-center gap-1 pt-1">
                  <Home className="h-3 w-3" />
                  {household.name}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowHouseholdSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Husholdningsinnstillinger
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/prisdatabase">
              <Database className="mr-2 h-4 w-4" />
              Prisdatabase
            </Link>
          </DropdownMenuItem>

          {members.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                Medlemmer ({members.length})
              </DropdownMenuLabel>
              {members.map((member) => (
                <DropdownMenuItem key={member.id} className="text-sm pl-6">
                  {member.profile?.display_name || member.profile?.email?.split("@")[0] || "Medlem"}
                  {member.user_id === user.id && (
                    <span className="ml-1 text-xs text-muted-foreground">(deg)</span>
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {theme === "dark" ? "Lyst tema" : "Mørkt tema"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logg ut
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Household Settings Dialog */}
      <HouseholdSettingsDialog 
        open={showHouseholdSettings} 
        onOpenChange={setShowHouseholdSettings} 
      />
    </>
  );
}

function HouseholdSettingsDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const { household, members, refetchHousehold } = useHousehold();
  const { toast } = useToast();
  const [isEditingHousehold, setIsEditingHousehold] = useState(false);
  const [householdName, setHouseholdName] = useState(household?.name || "");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberName, setEditingMemberName] = useState("");
  const [priceSharing, setPriceSharing] = useState<boolean | null>(null);

  // Load current consent preference when dialog opens
  const handleOpen = (isOpen: boolean) => {
    if (isOpen && user) {
      supabase
        .from("profiles")
        .select("price_sharing_enabled")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => setPriceSharing(data?.price_sharing_enabled ?? null));
    }
    onOpenChange(isOpen);
  };

  const handleTogglePriceSharing = async (enabled: boolean) => {
    if (!user) return;
    await supabase.from("profiles").update({ price_sharing_enabled: enabled }).eq("user_id", user.id);
    setPriceSharing(enabled);
    toast({ title: enabled ? "Prisdeling aktivert" : "Prisdeling deaktivert" });
  };

  const handleSaveHouseholdName = async () => {
    if (!household || !householdName.trim()) return;

    try {
      const { error } = await supabase
        .from("households")
        .update({ name: householdName.trim() })
        .eq("id", household.id);

      if (error) throw error;

      await refetchHousehold();
      setIsEditingHousehold(false);
      toast({ title: "Husholdningsnavn oppdatert!" });
    } catch (error) {
      console.error("Error updating household:", error);
      toast({
        title: "Feil ved oppdatering",
        variant: "destructive",
      });
    }
  };

  const handleStartEditMember = (member: typeof members[0]) => {
    setEditingMemberId(member.user_id);
    setEditingMemberName(member.profile?.display_name || "");
  };

  const handleSaveMemberName = async (userId: string) => {
    if (!editingMemberName.trim()) {
      setEditingMemberId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: editingMemberName.trim() })
        .eq("user_id", userId);

      if (error) throw error;

      await refetchHousehold();
      setEditingMemberId(null);
      toast({ title: "Navn oppdatert!" });
    } catch (error) {
      console.error("Error updating member name:", error);
      toast({
        title: "Feil ved oppdatering",
        variant: "destructive",
      });
    }
  };

  const getMemberName = (member: typeof members[0]) => {
    return member.profile?.display_name || member.profile?.email?.split("@")[0] || "Ukjent";
  };

  const canEditMember = (member: typeof members[0]) => {
    // Users can edit their own name
    return member.user_id === user?.id;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Husholdningsinnstillinger
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Household Name Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Navn på husholdning</Label>
            {isEditingHousehold ? (
              <div className="flex gap-2">
                <Input
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="f.eks. Balder og Alani"
                  className="flex-1"
                />
                <Button size="icon" variant="ghost" onClick={() => setIsEditingHousehold(false)}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={handleSaveHouseholdName} disabled={!householdName.trim()}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <span className="font-medium">{household?.name || "Laster..."}</span>
                <Button size="icon" variant="ghost" onClick={() => {
                  setHouseholdName(household?.name || "");
                  setIsEditingHousehold(true);
                }}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Invite Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Inviter andre</Label>
            <HouseholdInvite
              inviteToken={household?.invite_token || null}
              inviteEnabled={household?.invite_enabled ?? true}
              onUpdate={refetchHousehold}
            />
          </div>

          {/* Members Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Medlemmer</Label>
            </div>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                >
                  {editingMemberId === member.user_id ? (
                    <div className="flex gap-2 flex-1">
                      <Input
                        value={editingMemberName}
                        onChange={(e) => setEditingMemberName(e.target.value)}
                        placeholder="Skriv inn navn"
                        className="flex-1 h-8"
                        autoFocus
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => setEditingMemberId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleSaveMemberName(member.user_id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{getMemberName(member)}</span>
                        {member.profile?.email && member.profile.display_name && (
                          <span className="text-xs text-muted-foreground">
                            {member.profile.email}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                          {member.role === "owner" ? "Eier" : "Medlem"}
                        </span>
                        {canEditMember(member) && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => handleStartEditMember(member)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Price sharing consent */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              Anonym prisdeling
            </Label>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div>
                <p className="text-sm font-medium">
                  {priceSharing ? "Aktivert" : priceSharing === false ? "Deaktivert" : "Ikke valgt"}
                </p>
                <p className="text-xs text-muted-foreground">Del anonyme prisdata</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={priceSharing === false ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleTogglePriceSharing(false)}
                >
                  Nei
                </Button>
                <Button
                  size="sm"
                  variant={priceSharing === true ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleTogglePriceSharing(true)}
                >
                  Ja
                </Button>
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
