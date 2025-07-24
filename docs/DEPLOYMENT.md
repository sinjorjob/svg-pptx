# デプロイメントガイド

SVG-PPTX MCP Serverの本番環境デプロイメントガイドです。

## 配布戦略

### 1. npm レジストリ公開

#### 準備作業

1. **npmアカウント作成:**
```bash
npm adduser
# または既存アカウントでログイン
npm login
```

2. **パッケージ名確認:**
```bash
npm search svg-pptx-mcp
# 名前が利用可能か確認
```

3. **package.json最終確認:**
```json
{
  "name": "svg-pptx-mcp",
  "version": "1.0.0",
  "description": "MCP server for generating SVG slides and converting to PowerPoint",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "repository": {
    "type": "git",
    "url": "https://github.com/sinjorjob/svg-pptx-mcp.git"
  },
  "keywords": ["mcp", "claude-code", "svg", "powerpoint", "presentation"],
  "license": "MIT",
  "files": [
    "dist",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ]
}
```

#### 公開手順

```bash
# 1. ビルド
npm run clean
npm run build

# 2. テスト実行
npm test

# 3. バージョン更新
npm version patch  # または minor, major

# 4. パッケージ確認
npm pack
tar -tzf svg-pptx-mcp-1.0.0.tgz

# 5. 公開
npm publish

# 6. 公開確認
npm view svg-pptx-mcp
```

### 2. GitHub Releases

#### リリース準備

```bash
# 1. タグ作成
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 2. リリースノート準備
# CHANGELOG.mdから該当バージョンの内容をコピー
```

#### GitHub Actions でのリリース自動化

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        registry-url: 'https://registry.npmjs.org'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Publish to npm
      run: npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
    
    - name: Create Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: Release ${{ github.ref }}
        body: |
          Changes in this Release
          - SVG生成機能の改善
          - PowerPoint連携の安定化
          - バグ修正
        draft: false
        prerelease: false
```

### 3. Docker配布

#### Dockerfile作成

```dockerfile
# Dockerfile
FROM node:18-slim

# Puppeteer用の依存関係
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer設定
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# 依存関係インストール
COPY package*.json ./
RUN npm ci --only=production

# アプリケーションコピー
COPY dist/ ./dist/

# 実行ユーザー作成（セキュリティ向上）
RUN useradd --create-home --shell /bin/bash mcpuser
USER mcpuser

CMD ["node", "dist/index.js"]
```

#### Docker Compose例

```yaml
# docker-compose.yml
version: '3.8'

services:
  svg-pptx-mcp:
    build: .
    container_name: svg-pptx-mcp
    volumes:
      - ./output:/app/output
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## インストールガイド

### 1. npm経由でのインストール

#### グローバルインストール

```bash
# グローバルインストール
npm install -g svg-pptx-mcp

# Claude Code設定
# ~/.config/claude-code/mcp_settings.json
{
  "mcpServers": {
    "svg-pptx": {
      "command": "svg-pptx-mcp"
    }
  }
}
```

#### ローカルプロジェクトインストール

```bash
# プロジェクトディレクトリで
npm install svg-pptx-mcp

# Claude Code設定
{
  "mcpServers": {
    "svg-pptx": {
      "command": "node",
      "args": ["./node_modules/svg-pptx-mcp/dist/index.js"]
    }
  }
}
```

### 2. ソースからのインストール

```bash
# リポジトリクローン
git clone https://github.com/sinjorjob/svg-pptx-mcp.git
cd svg-pptx-mcp

# 依存関係インストール
npm install

# ビルド
npm run build

# グローバルリンク
npm link

# Claude Code設定
{
  "mcpServers": {
    "svg-pptx": {
      "command": "svg-pptx-mcp"
    }
  }
}
```

## 本番環境の設定

### 1. 環境変数設定

```bash
# .env ファイル作成
NODE_ENV=production
LOG_LEVEL=info
OUTPUT_DIR=/var/svg-pptx/output
TEMP_DIR=/var/svg-pptx/temp
MAX_CONCURRENT_OPERATIONS=5
POWERPOINT_TIMEOUT=60000

# Windows環境
POWERPOINT_PATH="C:\Program Files\Microsoft Office\root\Office16\POWERPNT.EXE"

# Linux/macOS環境  
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

### 2. systemd (Linux)

```ini
# /etc/systemd/system/svg-pptx-mcp.service
[Unit]
Description=SVG-PPTX MCP Server
After=network.target

[Service]
Type=simple
User=mcpuser
Group=mcpuser
WorkingDirectory=/opt/svg-pptx-mcp
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=svg-pptx-mcp

[Install]
WantedBy=multi-user.target
```

```bash
# サービス有効化
sudo systemctl daemon-reload
sudo systemctl enable svg-pptx-mcp
sudo systemctl start svg-pptx-mcp

# ステータス確認
sudo systemctl status svg-pptx-mcp
```

### 3. PM2 (Node.js プロセスマネージャー)

```bash
# PM2インストール
npm install -g pm2

# アプリケーション起動
pm2 start dist/index.js --name svg-pptx-mcp

# 起動スクリプト設定
pm2 startup
pm2 save
```

```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'svg-pptx-mcp',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    }
  }]
};
```

## 監視とメンテナンス

### 1. ヘルスチェック

```typescript
// src/health-check.ts
import * as http from 'http';

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    // 基本的なヘルスチェック
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

if (process.env.HEALTH_CHECK_PORT) {
  healthServer.listen(process.env.HEALTH_CHECK_PORT);
}
```

### 2. ログローテーション

```bash
# /etc/logrotate.d/svg-pptx-mcp
/opt/svg-pptx-mcp/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 mcpuser mcpuser
    postrotate
        systemctl reload svg-pptx-mcp
    endscript
}
```

### 3. バックアップ戦略

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backup/svg-pptx-mcp"
APP_DIR="/opt/svg-pptx-mcp"

# 日次バックアップ
tar -czf "${BACKUP_DIR}/svg-pptx-mcp-$(date +%Y%m%d).tar.gz" \
    "${APP_DIR}/dist" \
    "${APP_DIR}/package.json" \
    "${APP_DIR}/logs"

# 7日以上古いバックアップを削除
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +7 -delete
```

これらの配布・デプロイメント戦略により、SVG-PPTX MCP Serverを様々な環境で安定して運用できます。