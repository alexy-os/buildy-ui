import fs from 'fs/promises';
import path from 'path';
import glob from 'glob';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

type ComponentType = 'registry:block' | 'registry:component' | 'registry:ui';

// Updated interfaces for compatibility with shadcn
interface RegistryComponent {
  name: string;
  type: ComponentType;
  files: RegistryFile[];
  dependencies: string[];
  devDependencies: string[];
  cssVars?: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  tailwind?: {
    config: {
      theme: {
        extend: Record<string, unknown>;
      };
    };
  };
}

interface RegistryFile {
  path: string;
  content: string;
  type: string;
  target: string;
}

interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

// Added function for extracting CSS variables
function extractCssVars(content: string) {
  const cssVarRegex = /var\((--[^)]+)\)/g;
  const matches = content.match(cssVarRegex) || [];
  const vars = matches.map(match => match.slice(4, -1));
  
  return {
    light: Object.fromEntries(vars.map(v => [v, ''])),
    dark: {}
  };
}

// Added function for extracting Tailwind configuration
function extractTailwindConfig(content: string) {
  // Search for Tailwind classes in strings
  const tailwindClasses = content.match(/className=["'`][^"'`]+["'`]/g) || [];
  
  return {
    config: {
      theme: {
        extend: {
          // Here you can add automatic extraction of extend configuration
        }
      }
    }
  };
}

async function analyzeComponent(filePath: string): Promise<RegistryComponent | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    const imports: Set<string> = new Set();
    const devImports: Set<string> = new Set();
    const exports: string[] = [];
    const props: PropDefinition[] = [];

    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        if (!source.startsWith('.') && !source.startsWith('@/')) {
          // Determine dev dependencies by patterns
          if (source.startsWith('@types/') || source.includes('-dev-')) {
            devImports.add(source);
          } else {
            imports.add(source);
          }
        }
      },
      ExportNamedDeclaration(path) {
        if (path.node.declaration && t.isVariableDeclaration(path.node.declaration)) {
          path.node.declaration.declarations.forEach((dec) => {
            if (t.isIdentifier(dec.id)) {
              exports.push(dec.id.name);
            }
          });
        }
      },
      TSInterfaceDeclaration(path) {
        if (path.node.id.name.includes('Props')) {
          path.node.body.body.forEach((prop) => {
            if (t.isTSPropertySignature(prop) && t.isIdentifier(prop.key)) {
              props.push({
                name: prop.key.name,
                type: prop.typeAnnotation ? content.slice(prop.typeAnnotation.start!, prop.typeAnnotation.end!) : 'any',
                required: !prop.optional,
              });
            }
          });
        }
      },
    });

    const relativePath = filePath.replace(/\\/g, '/');
    const type = getComponentType(relativePath);
    const category = getComponentCategory(relativePath);
    const name = path.basename(filePath, path.extname(filePath));

    // Create a component in the new format
    return {
      name,
      type,
      files: [{
        path: relativePath,
        content: content,
        type: type,
        target: `components/${relativePath}`
      }],
      dependencies: Array.from(imports),
      devDependencies: Array.from(devImports),
      cssVars: extractCssVars(content),
      tailwind: extractTailwindConfig(content)
    };
  } catch (error) {
    console.error(`Error analyzing component ${filePath}:`, error);
    return null;
  }
}

function getComponentType(filePath: string): ComponentType {
  if (filePath.includes('/blocks/')) return 'registry:block';
  if (filePath.includes('/components/')) return 'registry:component';
  if (filePath.includes('/ui/')) return 'registry:ui';
  return 'registry:component';
}

function getComponentCategory(filePath: string): string | undefined {
  if (filePath.includes('/blocks/')) {
    const parts = filePath.split('/blocks/')[1].split('/');
    return parts.length > 1 ? parts[0] : undefined;
  }
  return undefined;
}

async function generateRegistry() {
  const componentPaths = {
    blocks: 'src/blocks/**/*.tsx',
    components: 'src/components/**/*.tsx',
    ui: 'src/ui/**/*.tsx'
  };

  const registry: Record<string, RegistryComponent[]> = {
    'registry:block': [],
    'registry:component': [],
    'registry:ui': []
  };

  for (const [type, pattern] of Object.entries(componentPaths)) {
    try {
      const files = glob.sync(pattern);
      for (const file of files) {
        const component = await analyzeComponent(file);
        if (component) {
          component.files = component.files.map(file => ({
            ...file,
            target: file.path.replace('src/', 'buildy/')
          }));
          registry[component.type].push(component);
        }
      }
    } catch (error) {
      console.error(`Error processing ${type} components:`, error);
    }
  }
  
  await fs.mkdir('public/buildy', { recursive: true });
  
  for (const components of Object.values(registry)) {
    for (const component of components) {
      await fs.writeFile(
        `public/buildy/${component.name}.json`,
        JSON.stringify(component, null, 2)
      );
    }
  }
}

generateRegistry().catch(console.error);