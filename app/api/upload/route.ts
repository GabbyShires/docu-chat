import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const processedDocuments = [];

    for (const file of files) {
      try {
        // Convert File to Buffer for processing
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let extractedText = "";
        let processingError: string | null = null;

        try {
          // Extract text based on file type - focus on reliable formats first
          if (
            file.type ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.type === "application/msword"
          ) {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
            console.log(
              `Successfully extracted ${extractedText.length} characters from Word document: ${file.name}`
            );
          } else if (
            file.type === "text/plain" ||
            file.type === "text/markdown"
          ) {
            extractedText = buffer.toString("utf-8");
            console.log(
              `Successfully extracted ${extractedText.length} characters from text file: ${file.name}`
            );
          } else {
            // For unsupported file types, provide a helpful error
            processingError = `File type '${file.type}' is not supported. Please upload Word documents or text files.`;
            console.warn(
              `Unsupported file type: ${file.type} for file: ${file.name}`
            );
          }
        } catch (extractError) {
          console.error(
            `Error extracting text from ${file.name}:`,
            extractError
          );
          processingError = `Failed to extract text: ${
            extractError instanceof Error
              ? extractError.message
              : "Unknown error"
          }`;
        }

        // Create document object with extracted content
        const document = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          status: processingError ? "error" : "processed",
          content: extractedText,
          contentLength: extractedText.length,
          error: processingError,
          uploadedAt: new Date().toISOString(),
        };

        processedDocuments.push(document);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        processedDocuments.push({
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          status: "error",
          content: "",
          contentLength: 0,
          error: `Failed to process file: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          uploadedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      documents: processedDocuments,
      message: `Successfully processed ${
        processedDocuments.filter((doc) => doc.status === "processed").length
      } document(s)`,
    });
  } catch (error) {
    console.error("Error in upload API:", error);
    return NextResponse.json(
      { error: "Failed to process uploads" },
      { status: 500 }
    );
  }
}
