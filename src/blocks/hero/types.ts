import type { ButtonProps } from "@/components/ui/button";
import type { BadgeProps } from "@/components/ui/badge";

// Base content type that can be extended by specific hero components
export interface BaseHeroContent {
  badge?: BadgeProps & {
    text: string;
  };
  title: string;
  description: string;
  buttons?: (ButtonProps & {
    id: string;
    text: string;
    icon?: React.ReactNode;
  })[];
} 