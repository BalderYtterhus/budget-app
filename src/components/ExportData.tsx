import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { useMonthlyReceipts } from "@/hooks/useBudgetData";
import { useMonth } from "@/contexts/MonthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export function ExportData() {
  const { data: receipts } = useMonthlyReceipts();
  const { selectedMonth, selectedYear } = useMonth();
  const { toast } = useToast();

  const monthDate = new Date(selectedYear, selectedMonth - 1);
  const monthLabel = format(monthDate, "MMMM-yyyy", { locale: nb });

  const exportToCSV = () => {
    if (!receipts || receipts.length === 0) {
      toast({
        title: "Ingen data å eksportere",
        description: "Legg til noen kvitteringer først.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Dato", "Butikk", "Totalbeløp", "Vare", "Pris", "Kategori"];
    const rows: string[][] = [];

    receipts.forEach((receipt) => {
      if (receipt.items && receipt.items.length > 0) {
        receipt.items.forEach((item) => {
          rows.push([
            format(new Date(receipt.receipt_date), "yyyy-MM-dd"),
            receipt.store_name || "",
            receipt.total_amount.toString(),
            item.raw_text,
            item.price.toString(),
            item.category?.name || "Ukategorisert",
          ]);
        });
      } else {
        rows.push([
          format(new Date(receipt.receipt_date), "yyyy-MM-dd"),
          receipt.store_name || "",
          receipt.total_amount.toString(),
          "",
          "",
          "",
        ]);
      }
    });

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `matbudsjett-${monthLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Eksport fullført",
      description: `Lastet ned matbudsjett-${monthLabel}.csv`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Eksporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={exportToCSV}
          disabled={!receipts || receipts.length === 0}
        >
          Eksporter til CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
