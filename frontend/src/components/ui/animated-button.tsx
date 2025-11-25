'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';

interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  successDuration?: number;
  onSuccess?: () => void;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, children, onClick, successDuration = 1500, onSuccess, variant, size, ...props }, ref) => {
    const [isSuccess, setIsSuccess] = React.useState(false);

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        const result = onClick(e) as unknown;
        
        // Se retornar uma Promise, aguarda resolução
        if (result && typeof result === 'object' && 'then' in result) {
          try {
            await result;
            // Micro-animação de sucesso
            setIsSuccess(true);
            setTimeout(() => {
              setIsSuccess(false);
              onSuccess?.();
            }, successDuration);
          } catch (error) {
            // Mantém estado normal em caso de erro
            setIsSuccess(false);
          }
        }
      }
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'transition-all duration-200',
          'active:scale-95',
          isSuccess && 'scale-110 bg-green-500 hover:bg-green-600',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <span className={cn(
          'transition-opacity duration-200',
          isSuccess && 'opacity-0'
        )}>
          {children}
        </span>
        {isSuccess && (
          <span className="absolute inset-0 flex items-center justify-center">
            ✓
          </span>
        )}
      </Button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';
