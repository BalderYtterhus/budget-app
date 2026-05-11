import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Category } from "@/types/budget";

interface CategoryBadgeProps {
  category: Category | null;
  className?: string;
}

const colorMap: Record<string, string> = {
  dairy: "bg-category-dairy/15 text-category-dairy border-category-dairy/30",
  produce: "bg-category-produce/15 text-category-produce border-category-produce/30",
  meat: "bg-category-meat/15 text-category-meat border-category-meat/30",
  dry: "bg-category-dry/15 text-category-dry border-category-dry/30",
  snacks: "bg-category-snacks/15 text-category-snacks border-category-snacks/30",
  other: "bg-category-other/15 text-category-other border-category-other/30",
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  if (!category) {
    return (
      <Badge
        variant="outline"
        className={cn("bg-muted/50 text-muted-foreground", className)}
      >
        Uncategorized
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "border transition-colors",
        colorMap[category.color] || colorMap.other,
        className
      )}
    >
      {category.name}
    </Badge>
  );
}