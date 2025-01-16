

# Техническое задание: Registry Parser с AST анализом для Vercel Blob Components

## 1. Основные компоненты системы

### 1.1 Структура проекта
```bash
project/
├── src/
│   ├── parser/
│   │   ├── ast.ts            # AST анализатор
│   │   ├── dependencies.ts   # Извлечение зависимостей
│   │   └── registry.ts       # Сборка registry
│   ├── utils/
│   │   ├── file-system.ts    # Работа с файлами
│   │   └── validation.ts     # Валидация
│   └── types/
│       └── registry.d.ts     # Типы
├── scripts/
│   └── build-registry.ts     # Точка входа
└── tsconfig.json
```

### 1.2 Основные типы
```typescript
interface RegistryComponent {
  name: string;
  type: ComponentType;
  files: RegistryFile[];
  dependencies: {
    external: string[];      // npm пакеты
    registry: string[];      // внутренние компоненты
  };
  metadata: {
    exports: string[];      // Экспортируемые сущности
    props: PropDefinition[];
    cssVars?: CSSVariables;
    tailwind?: TailwindConfig;
  };
}

type ComponentType = 'registry:block' | 'registry:component' | 'registry:ui';

interface RegistryFile {
  path: string;
  content: string;
  type: string;
  target: string;
}
```

## 2. AST Парсинг

### 2.1 Парсер зависимостей
```typescript
// src/parser/ast.ts
interface ASTAnalyzer {
  // Анализ импортов
  analyzeImports(content: string): {
    imports: Import[];
    exports: Export[];
    props: PropDefinition[];
  };

  // Извлечение типов
  extractTypes(content: string): {
    interfaces: Interface[];
    types: Type[];
  };

  // Анализ использования стилей
  analyzeStyles(content: string): {
    cssVars: string[];
    tailwindClasses: string[];
  };
}

interface Import {
  source: string;
  specifiers: string[];
  isExternal: boolean;
}
```

### 2.2 Конфигурация парсера
```typescript
// src/parser/config.ts
const parserConfig = {
  syntax: {
    jsx: true,
    typescript: true,
    decorators: true
  },
  plugins: [
    'typescript',
    'jsx',
    'decorators-legacy'
  ]
};
```

## 3. Процесс сборки

### 3.1 Сканирование компонентов
```typescript
async function scanComponents() {
  const componentPaths = {
    blocks: 'src/blocks/**/*.tsx',
    components: 'src/components/**/*.tsx',
    ui: 'src/ui/**/*.tsx'
  };

  return {
    blocks: await globby(componentPaths.blocks),
    components: await globby(componentPaths.components),
    ui: await globby(componentPaths.ui)
  };
}
```

### 3.2 Анализ компонента
```typescript
async function analyzeComponent(filePath: string): Promise<RegistryComponent> {
  const content = await fs.readFile(filePath, 'utf-8');
  const ast = await parseToAST(content);

  const analysis = {
    imports: await analyzer.analyzeImports(ast),
    types: await analyzer.extractTypes(ast),
    styles: await analyzer.analyzeStyles(ast)
  };

  return transformToRegistry(analysis);
}
```

## 4. Валидация

### 4.1 Схема валидации
```typescript
const registrySchema = z.object({
  name: z.string(),
  type: z.enum(['registry:block', 'registry:component', 'registry:ui']),
  files: z.array(fileSchema),
  dependencies: z.object({
    external: z.array(z.string()),
    registry: z.array(z.string())
  }),
  metadata: z.object({
    exports: z.array(z.string()),
    props: z.array(propSchema),
    cssVars: cssVarsSchema.optional(),
    tailwind: tailwindSchema.optional()
  })
});
```

### 4.2 Проверки
```typescript
async function validateComponent(component: RegistryComponent) {
  await Promise.all([
    validateDependencies(component.dependencies),
    validateExports(component.metadata.exports),
    validateProps(component.metadata.props),
    validateStyles(component.metadata.cssVars)
  ]);
}
```

## 5. CLI интерфейс

```bash
# Сборка registry
pnpm registry build [--watch] [--verbose]

# Валидация компонентов
pnpm registry validate

# Анализ зависимостей
pnpm registry analyze-deps

# Генерация документации
pnpm registry docs
```

## 6. Конфигурация

```typescript
// registry.config.ts
interface RegistryConfig {
  input: {
    blocks: string;
    components: string;
    ui: string;
  };
  output: string;
  validation: {
    strict: boolean;
    ignoredDependencies: string[];
  };
  parser: {
    typescript: boolean;
    jsx: boolean;
  };
}
```

## 7. Требования к реализации

### 7.1 Производительность
- Параллельная обработка файлов
- Кэширование результатов AST анализа
- Инкрементальная сборка

### 7.2 Обработка ошибок
```typescript
class RegistryError extends Error {
  constructor(
    message: string,
    public component: string,
    public type: 'parse' | 'validate' | 'build'
  ) {
    super(message);
  }
}
```

### 7.3 Логирование
```typescript
interface Logger {
  info(message: string): void;
  warn(message: string, component?: string): void;
  error(error: RegistryError): void;
}
```

## 8. Зависимости

```json
{
  "devDependencies": {
    "@babel/parser": "^7.x",
    "@babel/traverse": "^7.x",
    "@babel/types": "^7.x",
    "glob": "^8.x",
    "zod": "^3.x",
    "typescript": "^5.x"
  }
}
```

## 9. Результат

После выполнения скрипта для каждого компонента создается JSON файл:

```json
{
  "name": "component-name",
  "type": "registry:ui",
  "files": [...],
  "dependencies": {
    "external": ["lucide-react", "framer-motion"],
    "registry": ["button", "input"]
  },
  "metadata": {
    "exports": ["ComponentName"],
    "props": [...],
    "cssVars": {...},
    "tailwind": {...}
  }
}
```

## 10. Дополнительные возможности

- Генерация TypeScript типов
- Автоматическое обновление README.md
- Анализ использования компонентов
- Проверка совместимости версий
- Статистика по компонентам
