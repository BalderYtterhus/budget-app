import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useMonth } from "@/contexts/MonthContext";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MONTHS = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Desember"
];

export function MonthSelector() {
  const { selectedMonth, selectedYear, setMonth, goToPreviousMonth, goToNextMonth, isCurrentMonth } = useMonth();

  const date = new Date(selectedYear, selectedMonth - 1);
  const monthLabel = format(date, "MMMM yyyy", { locale: nb });

  // Generate list of months for dropdown (current year +/- 1 year)
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  
  const monthOptions = years.flatMap(year => 
    MONTHS.map((name, index) => ({
      month: index + 1,
      year,
      label: `${name} ${year}`,
    }))
  );

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={goToPreviousMonth}
        className="h-8 w-8 shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[100px] sm:min-w-[160px] gap-1.5 sm:gap-2 capitalize text-xs sm:text-sm px-2 sm:px-3">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">{monthLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0 max-h-64 overflow-y-auto" align="center">
          <div className="p-1">
            {monthOptions.map((option) => (
              <Button
                key={`${option.month}-${option.year}`}
                variant={
                  option.month === selectedMonth && option.year === selectedYear
                    ? "secondary"
                    : "ghost"
                }
                size="sm"
                className="w-full justify-start capitalize"
                onClick={() => setMonth(option.month, option.year)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={goToNextMonth}
        className="h-8 w-8 shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isCurrentMonth && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const now = new Date();
            setMonth(now.getMonth() + 1, now.getFullYear());
          }}
          className="text-xs hidden sm:inline-flex"
        >
          I dag
        </Button>
      )}
    </div>
  );
}
