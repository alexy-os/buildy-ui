export interface SemanticStructure {
  layout: {
    type: string;
    sections: string[];
    spacing: string[];
  };
  elements: {
    primary: string[];
    secondary: string[];
    media: string[];
  };
  interactivity: {
    forms: string[];
    buttons: string[];
    navigation: string[];
  };
}

export interface ComponentPattern {
  type: string;
  indicators: {
    classNames: string[];
    elements: string[];
    attributes?: Record<string, string[]>;
  };
}

export interface UseCasePattern {
  name: string;
  requirements: {
    layout?: string[];
    elements?: string[];
    interactivity?: string[];
  };
  priority: number;
}

export interface ConfigType {
  layouts: {
    patterns: ComponentPattern[];
  };
  sections: {
    patterns: ComponentPattern[];
  };
  elements: {
    primary: {
      patterns: ComponentPattern[];
    };
    media: {
      patterns: ComponentPattern[];
    };
  };
  useCases: UseCasePattern[];
} 