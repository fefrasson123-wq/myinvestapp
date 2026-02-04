import { memo } from 'react';
import { Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { InvestmentTag, tagLabels, tagColors } from '@/components/InvestmentsByTag';

interface TagSelectorProps {
  currentTag: InvestmentTag | null;
  onTagChange: (tag: InvestmentTag | null) => void;
}

export const TagSelector = memo(function TagSelector({ currentTag, onTagChange }: TagSelectorProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-primary hover:bg-primary/10 btn-interactive h-7 w-7 sm:h-8 sm:w-8"
          title="Definir Tag"
        >
          <Tag 
            className="w-3.5 h-3.5 sm:w-4 sm:h-4" 
            style={currentTag ? { color: tagColors[currentTag] } : undefined}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.entries(tagLabels) as [InvestmentTag, string][]).map(([tag, label]) => (
          <DropdownMenuItem
            key={tag}
            onClick={() => onTagChange(tag)}
            className="flex items-center gap-2"
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tagColors[tag] }}
            />
            <span>{label}</span>
            {currentTag === tag && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
        {currentTag && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onTagChange(null)}
              className="text-destructive"
            >
              Remover Tag
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
