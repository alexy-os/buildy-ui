import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { ComponentAnalyzer, ComponentInfo } from './componentAnalyzer';
import { SemanticStructure } from './types';

interface ComponentMapData {
  name: string;
  path: string;
  dependencies: {
    imports: string[];
    packages: string[];
  };
  content: any;
  llmContent: Record<string, any>;
  sourceCode: string;
  semantic: {
    structure: SemanticStructure;
    llmSource: string;
  };
}

export class ComponentMapper {
  private analyzer: ComponentAnalyzer;
  private outputDir: string;

  constructor(outputDir: string = 'component-maps') {
    this.analyzer = new ComponentAnalyzer();
    this.outputDir = path.resolve(process.cwd(), outputDir);
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private stringifyContent(content: any): string {
    return JSON.stringify(content, null, 2)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  private createLLMContent(content: any): Record<string, any> {
    if (!content || typeof content !== 'object') {
      return {};
    }

    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(content)) {
      if (Array.isArray(value)) {
        result[key] = value.length > 0 ? this.createLLMContent(value[0]) : [];
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.createLLMContent(value);
      } else {
        result[key] = typeof value;
      }
    }

    return result;
  }

  private formatComponentData(component: ComponentInfo): ComponentMapData {
    if (!component.sourceCode || !component.llmSource || !component.semanticStructure) {
      throw new Error(`Invalid component data for ${component.name}`);
    }

    return {
      name: component.name,
      path: component.path,
      dependencies: component.dependencies,
      content: component.content,
      llmContent: this.createLLMContent(component.content),
      sourceCode: component.sourceCode,
      semantic: {
        structure: component.semanticStructure,
        llmSource: component.llmSource
      }
    };
  }

  private getCategoryFromPath(filePath: string): string {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    const blocksIndex = parts.indexOf('blocks');
    
    if (blocksIndex !== -1 && blocksIndex + 1 < parts.length) {
      return parts[blocksIndex + 1];
    }
    
    return 'uncategorized';
  }

  private categorizeComponents(components: ComponentInfo[]): Record<string, ComponentMapData[]> {
    const categories: Record<string, ComponentMapData[]> = {};
    
    components.forEach(component => {
      const category = this.getCategoryFromPath(component.path);
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(this.formatComponentData(component));
    });

    return categories;
  }

  async generateComponentMap(): Promise<void> {
    try {
      const files = await this.analyzer.getComponentFiles('./src/blocks/**/*.tsx');
      const components = await Promise.all(
        files.map(file => this.analyzer.analyzeComponent(file))
      );

      const categorizedComponents = this.categorizeComponents(components);

      const componentMap = {
        generated: new Date().toISOString(),
        totalComponents: components.length,
        categories: categorizedComponents,
        semanticIndex: this.generateSemanticIndex(components)
      };

      this.saveMapToFile('component-map.json', componentMap);

      Object.entries(categorizedComponents).forEach(([category, components]) => {
        this.saveMapToFile(`${category}-components.json`, {
          category,
          components,
          generated: new Date().toISOString()
        });
      });

      this.saveMapToFile('semantic-index.json', {
        generated: new Date().toISOString(),
        index: this.generateSemanticIndex(components)
      });

      console.log(`✅ Component map generated with ${components.length} components`);
    } catch (error) {
      console.error('❌ Error generating component map:', error);
      if (error instanceof Error) {
        console.error('Details:', error.message);
      }
    }
  }

  private generateSemanticIndex(components: ComponentInfo[]): Record<string, string[]> {
    const index: Record<string, string[]> = {
      layouts: [],
      sections: [],
      elements: [],
      useCases: []
    };

    components.forEach(component => {
      if (!component.semanticStructure || !component.llmSource) {
        console.warn(`Missing semantic data for component ${component.name}`);
        return;
      }

      const structure = component.semanticStructure;

      if (structure.layout.type) {
        if (!index.layouts.includes(structure.layout.type)) {
          index.layouts.push(structure.layout.type);
        }
      }

      structure.layout.sections.forEach(section => {
        if (!index.sections.includes(section)) {
          index.sections.push(section);
        }
      });

      Object.values(structure.elements).flat().forEach(element => {
        if (!index.elements.includes(element)) {
          index.elements.push(element);
        }
      });

      const useCases = component.llmSource
        .split('\n')
        .find(line => line.startsWith('Suggested Uses:'))
        ?.replace('Suggested Uses:', '')
        .split(',')
        .map(useCase => useCase.trim())
        .filter((useCase): useCase is string => Boolean(useCase)) || [];

      useCases.forEach(useCase => {
        if (!index.useCases.includes(useCase)) {
          index.useCases.push(useCase);
        }
      });
    });

    return index;
  }

  private saveMapToFile(filename: string, data: any): void {
    try {
      const filePath = path.join(this.outputDir, filename);
      writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`📝 Saved map to ${filePath}`);
    } catch (error) {
      console.error(`❌ Error saving file ${filename}:`, error);
    }
  }
}