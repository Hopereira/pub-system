'use client';

import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export interface Category {
  id: string;
  nome: string;
  count?: number;
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryTabs({ 
  categories, 
  activeCategory, 
  onSelectCategory 
}: CategoryTabsProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                'border-2 whitespace-nowrap',
                'active:scale-95',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-background text-foreground border-border hover:border-primary/50'
              )}
            >
              {category.nome}
              {category.count !== undefined && (
                <span className={cn(
                  'ml-1.5 text-xs',
                  isActive ? 'opacity-90' : 'opacity-60'
                )}>
                  ({category.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
