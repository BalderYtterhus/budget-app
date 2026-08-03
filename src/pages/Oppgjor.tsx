import { SettlementOversikt } from "@/components/SettlementOversikt";
import { AppLayout } from "@/components/AppLayout";

/**
 * Read-only settlement view.
 *
 * TODO(balder): Settlement.tsx (326 lines, currently imported nowhere) holds
 * the split-ratio editor and the close-settlement flow. Mounting it here would
 * be the obvious next step, but it changes how money is divided between
 * members, so it needs your call rather than mine:
 *
 *   - Should the ratio editor live on this page, or stay behind a dialog?
 *   - Closing a settlement is irreversible from the UI — does it need a
 *     confirmation step beyond what Settlement.tsx already does?
 *   - Settlement.tsx predates the household-scoping migration; its queries
 *     should be re-checked against current RLS before it goes live.
 *
 * Until then this page shows the balances only, which is strictly more than
 * the route did before (it rendered the dashboard).
 */
const Oppgjor = () => (
  <AppLayout title="Oppgjør">
    <SettlementOversikt />
  </AppLayout>
);

export default Oppgjor;
