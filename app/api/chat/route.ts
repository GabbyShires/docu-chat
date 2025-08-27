import { NextRequest } from "next/server";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// In a real implementation, you would:
// 1. Set up a vector database (Pinecone, Weaviate, etc.)
// 2. Store document embeddings when files are uploaded
// 3. Use vector search to find relevant document chunks
// 4. Pass those chunks as context to the AI

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { message, documents } = await request.json();

    // Generate actual document context from extracted content
    const documentContext = generateDocumentContext(documents);

    const result = streamText({
      model: openai("gpt-3.5-turbo"),
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant that answers questions about uploaded documents. 
          
          Available documents: ${documents.length} document(s)
          
          Document context: ${documentContext}
          
          Instructions:
          - Always reference the documents when answering questions
          - If asked about specific content, mention which documents contain that information
          - Be helpful but honest about what you can and cannot find in the documents
          - If you don't have enough context, ask for clarification
          - Keep responses conversational and engaging
          - Use specific quotes or references from the documents when possible
          - If a question is about a specific document type (Word, text, etc.), mention it in your response`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      maxOutputTokens: 500,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes("API key")) {
      return new Response(
        JSON.stringify({
          error: "Invalid OpenAI API key. Please check your configuration.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

function generateDocumentContext(documents: any[]): string {
  if (documents.length === 0) {
    return "No documents have been uploaded yet.";
  }

  let context = `The user has uploaded ${documents.length} document(s):\n\n`;

  documents.forEach((doc, index) => {
    if (doc.status === "processed" && doc.content) {
      // Truncate very long content to avoid token limits
      const maxLength = 2000;
      const content =
        doc.content.length > maxLength
          ? doc.content.substring(0, maxLength) + "... [truncated]"
          : doc.content;

      context += `Document ${index + 1}: ${doc.name}\n`;
      context += `Type: ${doc.type}\n`;
      context += `Content: ${content}\n\n`;
    } else {
      context += `Document ${index + 1}: ${doc.name} (Error: ${
        doc.error || "Processing failed"
      })\n\n`;
    }
  });

  return context;
}
