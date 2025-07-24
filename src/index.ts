import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createPowerPointSlide } from './pptx-handler';

const server = new Server(
  {
    name: 'svg-pptx-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール一覧の提供
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'create_pptx_slide',
      description: 'SVGからPowerPointスライドを作成する',
      inputSchema: {
        type: 'object',
        properties: {
          svgPath: { 
            type: 'string', 
            description: 'SVGファイルのパス' 
          },
          outputPath: { 
            type: 'string', 
            description: '出力PPTXファイルパス' 
          }
        },
        required: ['svgPath', 'outputPath']
      }
    }
  ]
}));

// ツール実行ハンドラ  
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'create_pptx_slide') {
      if (!args || typeof args !== 'object') {
        throw new Error('Invalid arguments provided');
      }
      
      const svgPath = args['svgPath'] as string;
      const outputPath = args['outputPath'] as string;
      
      if (!svgPath || !outputPath) {
        throw new Error('SVG path and output path are required');
      }
      
      const result = await createPowerPointSlide(svgPath, outputPath);
      return { 
        content: [{ 
          type: 'text', 
          text: `PowerPoint作成完了: ${result.path}` 
        }] 
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `エラーが発生しました: ${(error as Error).message}`
      }],
      isError: true
    };
  }
});

// サーバー開始
const transport = new StdioServerTransport();
server.connect(transport);

console.log('SVG-PPTX MCP Server started');