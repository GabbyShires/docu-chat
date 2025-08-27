# AI Document Chat Assistant

A Next.js application that allows users to upload documents and chat with an AI assistant about their content. The system provides an intuitive interface for document-based question answering using Vercel's AI SDK.

## Features

- **Document Upload**: Support for PDF, DOC, DOCX, TXT, and MD files
- **AI Chat Interface**: Clean, modern chat UI for asking questions about documents
- **Real-time Processing**: Immediate feedback during document upload and processing
- **Streaming AI Responses**: Real-time streaming responses using Vercel AI SDK
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Document Management**: View uploaded documents and remove them as needed

## Current Implementation

This is a **production-ready** implementation that includes:

- Frontend UI components with document upload and chat interface
- Vercel AI SDK integration with OpenAI GPT models
- Streaming AI responses for better user experience
- File upload handling with API endpoints
- Responsive design using Tailwind CSS and shadcn/ui components

## Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- OpenAI API key (get one from [OpenAI Platform](https://platform.openai.com/api-keys))

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd anon-chat
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```bash
# OpenAI API Key - Get one from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Set a different model
# OPENAI_MODEL=gpt-4o-mini
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload Documents**: Click the upload button to select and upload your documents
2. **Wait for Processing**: The system will process your documents through the API
3. **Start Chatting**: Ask questions about your documents using natural language
4. **Get AI Responses**: Receive streaming, context-aware answers based on your document content

## Example Questions

- "What are the main points in these documents?"
- "Can you summarize the key findings?"
- "What does the document say about [specific topic]?"
- "Compare the different approaches mentioned in the documents"
- "Find information about [specific term or concept]"

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **AI Integration**: Vercel AI SDK, OpenAI GPT models
- **Styling**: Tailwind CSS, shadcn/ui components
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useEffect, useRef)
- **Streaming**: Real-time AI response streaming

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # AI chat responses with streaming
│   │   └── upload/route.ts    # Document upload handling
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── components/
│   ├── ai-chat.tsx            # Main AI chat component
│   ├── chat-room.tsx          # Original chat room (unused)
│   └── ui/                    # shadcn/ui components
├── lib/                       # Utility functions
├── styles/                    # Additional styles
└── package.json               # Dependencies and scripts
```

## API Endpoints

### `/api/chat`
- **Method**: POST
- **Purpose**: Generate AI responses about uploaded documents
- **Features**: Streaming responses, document context awareness
- **Body**: `{ message: string, documents: Document[] }`

### `/api/upload`
- **Method**: POST
- **Purpose**: Handle document uploads and processing
- **Features**: Multiple file support, file validation
- **Body**: FormData with files

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `OPENAI_MODEL` | OpenAI model to use (default: gpt-3.5-turbo) | No |

## Future Enhancements

To make this even more powerful, you could add:

### 1. Document Processing
- **Text Extraction**: Libraries like `pdf-parse`, `mammoth` for actual document content
- **Vector Database**: Pinecone, Weaviate, or Chroma for semantic search
- **Embeddings**: Store document vectors for better context retrieval

### 2. Advanced AI Features
- **Multi-modal Support**: Handle images, charts, and diagrams
- **Tool Calling**: Allow AI to use external tools and APIs
- **Memory**: Persistent conversation history across sessions

### 3. Backend Services
- **Authentication**: User management and document access control
- **Rate Limiting**: API usage limits and cost management
- **Monitoring**: Logging, analytics, and performance tracking

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Make sure you have a `.env.local` file with your `OPENAI_API_KEY`
   - Restart your development server after adding environment variables

2. **"Failed to get AI response"**
   - Check your OpenAI API key is valid
   - Ensure you have sufficient API credits
   - Check the browser console for detailed error messages

3. **Document upload fails**
   - Verify file types are supported (.pdf, .doc, .docx, .txt, .md)
   - Check file size limits
   - Ensure the upload API endpoint is accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues, please open an issue on GitHub or contact the development team.

## Supported File Types

The system can extract text content from the following file formats:

| File Type | Extension | Processing | Notes |
|-----------|-----------|------------|-------|
| **PDF** | `.pdf` | ✅ Full text extraction | Uses pdf-parse library |
| **Word Document** | `.docx` | ✅ Full text extraction | Uses mammoth library |
| **Word Document (Legacy)** | `.doc` | ✅ Full text extraction | Uses mammoth library |
| **Text File** | `.txt` | ✅ Direct text reading | UTF-8 encoding |
| **Markdown** | `.md` | ✅ Direct text reading | Preserves formatting |
| **Other Formats** | Various | ❌ Not supported | Will show helpful error message |

**Note**: Processing success depends on file format and content. Some files may fail to process due to corruption, password protection, or unsupported formats. The system now focuses on reliable, well-tested extraction methods.
