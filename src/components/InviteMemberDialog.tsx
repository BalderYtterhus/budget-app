import { HouseholdInvite } from "@/components/HouseholdInvite";
import { useHousehold } from "@/contexts/HouseholdContext";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The invite flow, openable from anywhere that has its own trigger.
 *
 * `HouseholdInvite` needs the household's token and enabled flag, which every
 * caller would otherwise have to thread through itself — that is why the
 * sidebar's "Inviter medlem" button ended up with no handler at all. This pulls
 * them from context so a trigger only has to own a boolean.
 */
export function InviteMemberDialog({ open, onOpenChange }: InviteMemberDialogProps) {
  const { household, refetchHousehold } = useHousehold();

  if (!household) return null;

  return (
    <HouseholdInvite
      inviteToken={household.invite_token}
      inviteEnabled={household.invite_enabled ?? true}
      onUpdate={refetchHousehold}
      open={open}
      onOpenChange={onOpenChange}
      hideTrigger
    />
  );
}
