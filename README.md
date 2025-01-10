# UI Components RAG System with Vector Search

> NOTE: This test version is not ready for production use.

A Retrieval-Augmented Generation (RAG) system for efficient UI component search using vector embeddings and semantic similarity.

## Overview

This system helps developers find the right UI components by understanding their requirements through vector search. It combines:
- Vector embeddings of UI components
- Semantic search capabilities
- Qdrant vector database integration

## How It Works

### 1. Component Description to Vector Process

Components are processed through two main scripts:

1. **Vector Generation** (`generateEmbedding.ts`):
```bash
bun run vector --apiKey=sk-aitunnel-xxx
```
This script:
- Reads component descriptions from `qdrant-example/qdrantblocks-descriptions.json`
- Generates embeddings using OpenAI's API through a proxy tunnel
- Creates `qdrantblocks-vector.json` with vector embeddings

2. **Database Upload** (`qdrantDB.ts`):
```bash
bun run upload --apiKey=your-qdrant-key
```
This script:
- Initializes the Qdrant collection
- Uploads vectors to Qdrant database
- Handles batch processing for efficiency

### 2. Environment Configuration

Create a `.env` file in your project root:
```env
QDRANT_COLLECTION=buildy_collection
QDRANT_URL=your-qdrant-url
QDRANT_JSON_PATH=path-to-json
```

## Getting Started

1. Install dependencies:
```bash
bun install @qdrant/qdrant-js openai dotenv
```

2. Set up your environment variables in `.env`

3. Generate vectors:
```bash
bun run vector --apiKey=your-openai-key
```

4. Upload to Qdrant:
```bash
bun run upload --apiKey=your-qdrant-key
```

## Key Features

1. **Semantic Understanding**
   - Component purpose and functionality
   - Technical requirements
   - Usage context

2. **Vector Search**
   - Similarity-based component matching
   - Efficient retrieval
   - Batch processing support

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.