# エラーハンドリングとテスト戦略

SVG-PPTX MCP Serverの堅牢性を確保するためのエラーハンドリング戦略とテスト実装について説明します。

## エラーハンドリング戦略

### 1. エラーの分類

```typescript
// src/errors/index.ts
export class SVGPPTXError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SVGPPTXError';
  }
}

export class SVGGenerationError extends SVGPPTXError {
  constructor(message: string, details?: any) {
    super(message, 'SVG_GENERATION_ERROR', details);
    this.name = 'SVGGenerationError';
  }
}

export class PowerPointError extends SVGPPTXError {
  constructor(message: string, details?: any) {
    super(message, 'POWERPOINT_ERROR', details);
    this.name = 'PowerPointError';
  }
}

export class FileSystemError extends SVGPPTXError {
  constructor(message: string, details?: any) {
    super(message, 'FILESYSTEM_ERROR', details);
    this.name = 'FileSystemError';
  }
}

export class ValidationError extends SVGPPTXError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}
```

### 2. 入力値検証

```typescript
// src/validators/index.ts
import { ValidationError } from '../errors/index.js';

export function validateSlideInput(title: string, content: string[], template?: string): void {
  if (!title || typeof title !== 'string') {
    throw new ValidationError('タイトルは必須で文字列である必要があります', { title });
  }

  if (title.length > 100) {
    throw new ValidationError('タイトルは100文字以内で入力してください', { titleLength: title.length });
  }

  if (!Array.isArray(content)) {
    throw new ValidationError('コンテンツは配列である必要があります', { content });
  }

  if (content.length === 0) {
    throw new ValidationError('コンテンツは最低1項目必要です');
  }

  if (content.length > 10) {
    throw new ValidationError('コンテンツは10項目以内で入力してください', { contentLength: content.length });
  }

  content.forEach((item, index) => {
    if (typeof item !== 'string') {
      throw new ValidationError(`コンテンツの${index + 1}項目目は文字列である必要があります`, { index, item });
    }

    if (item.length > 200) {
      throw new ValidationError(`コンテンツの${index + 1}項目目は200文字以内で入力してください`, { 
        index, 
        itemLength: item.length 
      });
    }
  });

  const validTemplates = ['basic', 'diagram', 'chart'];
  if (template && !validTemplates.includes(template)) {
    throw new ValidationError(`テンプレートは次のいずれかを選択してください: ${validTemplates.join(', ')}`, { 
      template, 
      validTemplates 
    });
  }
}

export function validateFilePath(filePath: string, extension?: string): void {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('ファイルパスは必須で文字列である必要があります', { filePath });
  }

  if (extension && !filePath.toLowerCase().endsWith(extension.toLowerCase())) {
    throw new ValidationError(`ファイル拡張子は${extension}である必要があります`, { filePath, extension });
  }

  // 危険な文字の検証
  const dangerousChars = /[<>:"|?*]/;
  if (dangerousChars.test(filePath)) {
    throw new ValidationError('ファイルパスに無効な文字が含まれています', { filePath });
  }
}
```

## テスト戦略

### 1. ユニットテスト

```typescript
// tests/unit/svg-generator.test.ts
import { generateSVGSlide } from '../../src/svg-generator.js';
import { ValidationError } from '../../src/errors/index.js';

describe('SVG Generator', () => {
  describe('generateSVGSlide', () => {
    test('正常なスライド生成', async () => {
      const result = await generateSVGSlide(
        'テストタイトル',
        ['項目1', '項目2'],
        'basic'
      );

      expect(result.path).toBeDefined();
      expect(result.content).toContain('テストタイトル');
      expect(result.content).toContain('項目1');
      expect(result.size).toBeGreaterThan(0);
    });

    test('無効なタイトルでエラー', async () => {
      await expect(generateSVGSlide('', ['項目1'])).rejects.toThrow(ValidationError);
    });

    test('空のコンテンツでエラー', async () => {
      await expect(generateSVGSlide('タイトル', [])).rejects.toThrow(ValidationError);
    });
  });
});
```

### 2. Jest設定

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

これにより、堅牢で信頼性の高いMCPサーバーを構築できます。