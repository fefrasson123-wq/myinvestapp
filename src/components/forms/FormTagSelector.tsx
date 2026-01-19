import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvestmentTag, tagLabels, tagColors } from '@/components/InvestmentsByTag';

interface FormTagSelectorProps {
  selectedTag: InvestmentTag | null;
  onTagChange: (tag: InvestmentTag | null) => void;
}

export function FormTagSelector({ selectedTag, onTagChange }: FormTagSelectorProps) {
  const tags: InvestmentTag[] = ['short-term', 'long-term', 'passive-income', 'speculation'];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Tag (opcional)</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onTagChange(selectedTag === tag ? null : tag)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all",
              "border",
              selectedTag === tag
                ? "border-transparent text-white shadow-sm"
                : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:text-card-foreground"
            )}
            style={selectedTag === tag ? { backgroundColor: tagColors[tag] } : undefined}
          >
            <div 
              className={cn(
                "w-2 h-2 rounded-full",
                selectedTag === tag && "bg-white/30"
              )}
              style={selectedTag !== tag ? { backgroundColor: tagColors[tag] } : undefined}
            />
            {tagLabels[tag]}
          </button>
        ))}
      </div>
    </div>
  );
}
