import * as t from '@babel/types';
import { SemanticStructure, ComponentPattern, ConfigType, UseCasePattern } from './types';
import { ConfigStructure } from './config';

export class SemanticAnalyzer {
  private config: ConfigType;

  constructor(config: ConfigType = ConfigStructure) {
    this.config = config;
  }

  private matchPattern(
    element: t.JSXElement, 
    pattern: ComponentPattern
  ): boolean {
    const tagName = this.getElementName(element);
    const className = this.getElementClassName(element);

    return (
      pattern.indicators.elements.includes(tagName) &&
      pattern.indicators.classNames.some(cls => className.includes(cls))
    );
  }

  private getElementName(element: t.JSXElement): string {
    const name = element.openingElement.name;
    return t.isJSXIdentifier(name) ? name.name : '';
  }

  private getElementClassName(element: t.JSXElement): string {
    const classAttr = element.openingElement.attributes.find(
      attr => t.isJSXAttribute(attr) && attr.name.name === 'className'
    );

    if (classAttr && t.isJSXAttribute(classAttr) && t.isStringLiteral(classAttr.value)) {
      return classAttr.value.value;
    }

    return '';
  }

  public analyzeElement(element: t.JSXElement): SemanticStructure {
    const structure: SemanticStructure = {
      layout: { type: '', sections: [], spacing: [] },
      elements: { primary: [], secondary: [], media: [] },
      interactivity: { forms: [], buttons: [], navigation: [] }
    };
    
    this.config.layouts.patterns.forEach(pattern => {
      if (this.matchPattern(element, pattern)) {
        structure.layout.type = pattern.type;
      }
    });
    
    this.config.sections.patterns.forEach(pattern => {
      if (this.matchPattern(element, pattern)) {
        structure.layout.sections.push(pattern.type);
      }
    });
    
    Object.entries(this.config.elements).forEach(([category, { patterns }]) => {
      patterns.forEach(pattern => {
        if (this.matchPattern(element, pattern)) {
          if (category === 'primary') {
            structure.elements.primary.push(pattern.type);
          } else if (category === 'media') {
            structure.elements.media.push(pattern.type);
          }
        }
      });
    });

    return structure;
  }

  public suggestUseCases(structure: SemanticStructure): string[] {
    return this.config.useCases
      .filter(useCase => this.matchesUseCase(structure, useCase))
      .sort((a, b) => a.priority - b.priority)
      .map(useCase => useCase.name);
  }

  private matchesUseCase(
    structure: SemanticStructure, 
    useCase: UseCasePattern
  ): boolean {
    const { requirements } = useCase;
    
    return (
      (!requirements.layout || 
        requirements.layout.some(l => structure.layout.type === l)) &&
      (!requirements.elements ||
        requirements.elements.every(e => 
          Object.values(structure.elements).flat().includes(e))) &&
      (!requirements.interactivity ||
        requirements.interactivity.every(i => 
          Object.values(structure.interactivity).flat().includes(i)))
    );
  }

  public generateLLMSource(
    name: string,
    structure: SemanticStructure,
    content: any
  ): string {
    const useCases = this.suggestUseCases(structure);
    
    return `Component: ${name}
Type: ${structure.layout.type}
Layout: ${structure.layout.sections.join(', ')}
Elements: ${Object.values(structure.elements).flat().join(', ')}
Interactivity: ${Object.values(structure.interactivity).flat().join(', ')}
Content Sample: ${this.summarizeContent(content)}
Suggested Uses: ${useCases.join(', ')}`;
  }

  private summarizeContent(content: any): string {
    if (!content) return 'No content';
    return Object.entries(content)
      .map(([key, value]) => `${key}: ${this.truncate(JSON.stringify(value))}`)
      .join(', ');
  }

  private truncate(str: string, length: number = 50): string {
    return str.length > length ? str.substring(0, length) + '...' : str;
  }
}