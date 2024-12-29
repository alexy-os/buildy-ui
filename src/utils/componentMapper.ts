import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { ComponentAnalyzer, ComponentInfo } from './componentAnalyzer';

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

  private formatComponentData(component: ComponentInfo) {
    return {
      name: component.name,
      path: component.path,
      dependencies: component.dependencies,
      content: component.content,
      sourceCode: component.sourceCode
    };
  }

  private getCategoryFromPath(filePath: string): string {
    // Нормализуем путь для кроссплатформенности
    const normalizedPath = filePath.replace(/\\/g, '/');
    // Извлекаем части пути
    const parts = normalizedPath.split('/');
    // Ищем индекс 'blocks'
    const blocksIndex = parts.indexOf('blocks');
    
    if (blocksIndex !== -1 && blocksIndex + 1 < parts.length) {
      // Возвращаем следующую часть после 'blocks'
      return parts[blocksIndex + 1];
    }
    
    return 'uncategorized';
  }

  private categorizeComponents(components: ComponentInfo[]): Record<string, any[]> {
    const categories: Record<string, any[]> = {};
    
    components.forEach(component => {
      // Используем новый метод для получения категории
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

      // Создаем основную карту
      const componentMap = {
        generated: new Date().toISOString(),
        totalComponents: components.length,
        categories: categorizedComponents
      };

      this.saveMapToFile('component-map.json', componentMap);

      // Создаем отдельные файлы для каждой категории
      Object.entries(categorizedComponents).forEach(([category, components]) => {
        this.saveMapToFile(`${category}-components.json`, {
          category,
          components,
          generated: new Date().toISOString()
        });
      });

      console.log(`✅ Component map generated with ${components.length} components`);
    } catch (error) {
      console.error('❌ Error generating component map:', error);
      if (error instanceof Error) {
        console.error('Details:', error.message);
      }
    }
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