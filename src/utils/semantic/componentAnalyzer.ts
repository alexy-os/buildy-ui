import { readFileSync } from 'fs';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { glob } from 'glob';
import * as t from '@babel/types';
import { SemanticAnalyzer } from './SemanticAnalyzer';
import { SemanticStructure } from './types';

export interface ComponentInfo {
  name: string;
  path: string;
  dependencies: {
    imports: string[];
    packages: string[];
  };
  content: any;
  sourceCode: string;
  semanticStructure: SemanticStructure;
  llmSource: string;
}

export class ComponentAnalyzer {
  private semanticAnalyzer: SemanticAnalyzer;

  constructor() {
    this.semanticAnalyzer = new SemanticAnalyzer();
  }

  // Get all component files
  async getComponentFiles(pattern: string): Promise<string[]> {
    return glob(pattern);
  }

  private extractJSXElement(node: t.JSXElement | t.JSXFragment): any {
    if (t.isJSXFragment(node)) {
      return { type: 'Fragment' };
    }

    const openingElement = node.openingElement;
    if (t.isJSXIdentifier(openingElement.name)) {
      const props: Record<string, any> = {};
      
      openingElement.attributes.forEach(attr => {
        if (t.isJSXAttribute(attr)) {
          if (t.isJSXIdentifier(attr.name)) {
            const name = attr.name.name;
            if (attr.value) {
              if (t.isStringLiteral(attr.value)) {
                props[name] = attr.value.value;
              } else if (t.isJSXExpressionContainer(attr.value)) {
                props[name] = this.extractValueFromNode(attr.value.expression);
              }
            } else {
              props[name] = true;
            }
          }
        }
      });

      return {
        type: 'Component',
        name: openingElement.name.name,
        ...(Object.keys(props).length > 0 && { props })
      };
    }

    return { type: 'Unknown' };
  }

  private extractValueFromNode(node: t.Node): any {
    if (t.isTSAsExpression(node)) {
      return this.extractValueFromNode(node.expression);
    }

    if (t.isObjectExpression(node)) {
      const obj: Record<string, any> = {};
      for (const prop of node.properties) {
        if (t.isObjectProperty(prop)) {
          const key = t.isIdentifier(prop.key) ? prop.key.name :
                     t.isStringLiteral(prop.key) ? prop.key.value :
                     `[${prop.key.type}]`;
          obj[key] = this.extractValueFromNode(prop.value);
        }
      }
      return obj;
    }

    if (t.isArrayExpression(node)) {
      return node.elements.map(element => 
        element ? this.extractValueFromNode(element) : null
      );
    }

    if (t.isStringLiteral(node)) {
      return node.value;
    }

    if (t.isNumericLiteral(node)) {
      return node.value;
    }

    if (t.isBooleanLiteral(node)) {
      return node.value;
    }

    if (t.isNullLiteral(node)) {
      return null;
    }

    if (t.isJSXElement(node)) {
      return this.extractJSXElement(node);
    }

    if (t.isJSXFragment(node)) {
      return this.extractJSXElement(node);
    }

    return `[${node.type}]`;
  }

  // Parse single component
  async analyzeComponent(filePath: string): Promise<ComponentInfo> {
    // Read file content
    const code = readFileSync(filePath, 'utf-8');
    
    // Parse AST
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });
    
    const componentInfo: ComponentInfo = {
      name: '',
      path: filePath,
      dependencies: {
        imports: [],
        packages: []
      },
      content: undefined,
      sourceCode: code,
      semanticStructure: {
        layout: { type: '', sections: [], spacing: [] },
        elements: { primary: [], secondary: [], media: [] },
        interactivity: { forms: [], buttons: [], navigation: [] }
      },
      llmSource: ''
    };
    
    const extractValueFromNode = this.extractValueFromNode.bind(this);

    // Traverse AST
    traverse(ast, {
      ImportDeclaration(path) {
        const importPath = path.node.source.value;
        if (importPath.startsWith('.')) {
          componentInfo.dependencies.imports.push(importPath);
        } else {
          componentInfo.dependencies.packages.push(importPath);
        }
      },

      VariableDeclarator(path) {
        const id = path.node.id;
        if ('name' in id && id.name === 'content') {
          try {
            componentInfo.content = path.node.init 
              ? extractValueFromNode(path.node.init)
              : undefined;
          } catch (error) {
            console.warn(`Could not parse content for ${filePath}`, error);
          }
        }
      },

      ExportNamedDeclaration(path) {
        if (path.node.declaration?.type === 'VariableDeclaration') {
          const declaration = path.node.declaration.declarations[0];
          if (declaration.type === 'VariableDeclarator' && 
              'name' in declaration.id) {
            componentInfo.name = declaration.id.name;
          }
        }
      }
    });
    
    traverse(ast, {
      JSXElement: (path) => {
        const elementStructure = this.semanticAnalyzer.analyzeElement(path.node);

        componentInfo.semanticStructure.layout.type = elementStructure.layout.type || componentInfo.semanticStructure.layout.type;
        componentInfo.semanticStructure.layout.sections.push(...elementStructure.layout.sections);
        componentInfo.semanticStructure.layout.spacing.push(...elementStructure.layout.spacing);
        
        componentInfo.semanticStructure.elements.primary.push(...elementStructure.elements.primary);
        componentInfo.semanticStructure.elements.secondary.push(...elementStructure.elements.secondary);
        componentInfo.semanticStructure.elements.media.push(...elementStructure.elements.media);
        
        componentInfo.semanticStructure.interactivity.forms.push(...elementStructure.interactivity.forms);
        componentInfo.semanticStructure.interactivity.buttons.push(...elementStructure.interactivity.buttons);
        componentInfo.semanticStructure.interactivity.navigation.push(...elementStructure.interactivity.navigation);
      }
    });
    
    componentInfo.semanticStructure.layout.sections = [...new Set(componentInfo.semanticStructure.layout.sections)];
    componentInfo.semanticStructure.layout.spacing = [...new Set(componentInfo.semanticStructure.layout.spacing)];
    componentInfo.semanticStructure.elements.primary = [...new Set(componentInfo.semanticStructure.elements.primary)];
    componentInfo.semanticStructure.elements.secondary = [...new Set(componentInfo.semanticStructure.elements.secondary)];
    componentInfo.semanticStructure.elements.media = [...new Set(componentInfo.semanticStructure.elements.media)];
    componentInfo.semanticStructure.interactivity.forms = [...new Set(componentInfo.semanticStructure.interactivity.forms)];
    componentInfo.semanticStructure.interactivity.buttons = [...new Set(componentInfo.semanticStructure.interactivity.buttons)];
    componentInfo.semanticStructure.interactivity.navigation = [...new Set(componentInfo.semanticStructure.interactivity.navigation)];

    componentInfo.llmSource = this.semanticAnalyzer.generateLLMSource(
      componentInfo.name,
      componentInfo.semanticStructure,
      componentInfo.content
    );

    return componentInfo;
  }
} 