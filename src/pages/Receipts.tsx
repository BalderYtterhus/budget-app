import { ReceiptList } from "@/components/ReceiptList";
import { AppLayout, useReceiptUpload } from "@/components/AppLayout";
import { Camera, Pencil } from "lucide-react";

const ReceiptsContent = () => {
  const { openUpload } = useReceiptUpload();

  return (
    <>
      <section>
        <div className="flex gap-2">
          <button
            onClick={() => openUpload(false)}
            className="flex-1 flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-brand/25 bg-brand/5 hover:bg-brand/10 hover:border-brand/40 active:scale-[0.99] transition-all group text-left"
          >
            <div className="p-2.5 rounded-xl bg-brand/10 group-hover:bg-brand/20 transition-colors flex-shrink-0">
              <Camera className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="font-semibold text-sm">Legg til kvittering</p>
              <p className="text-xs text-muted-foreground mt-0.5">Skann eller last opp bilde — vi fyller ut resten</p>
            </div>
            <div className="flex-1" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-[13px] font-medium">
              Skann
            </span>
          </button>
          <button
            onClick={() => openUpload(true)}
            className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent active:scale-[0.99] transition-all text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <Pencil className="h-4 w-4" />
            <span className="text-xs font-medium whitespace-nowrap">Manuelt</span>
          </button>
        </div>
      </section>

      {/* Full width here, unlike the dashboard where it shares a 3-column grid */}
      <ReceiptList />
    </>
  );
};

const Receipts = () => (
  <AppLayout title="Kvitteringer">
    <ReceiptsContent />
  </AppLayout>
);

export default Receipts;
