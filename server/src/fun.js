import { fromPath } from "pdf2pic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { CallbackHandler } from "langfuse-langchain";
import { StringOutputParser } from "@langchain/core/output_parsers";

import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const langfuseHandler = new CallbackHandler({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: "https://cloud.langfuse.com",
});

export async function convertPdfToImages(
  filepath,
  alignment = "vertical",
  pages = -1
) {
  const options = {
    density: 100,
    saveFilename: "img",
    savePath: "./tmp",
    format: "jpg",
    preserveAspectRatio: "true",
    ...(alignment === "vertical" ? { width: "1000" } : { height: "1000" }),
  };
  const convert = fromPath(filepath, options);

  return await convert.bulk(pages, { responseType: "image" }); // -1 for all pages
}

export async function imageToMd(filepath) {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
  });

  // Check if the file is a .jpg file
  if (!filepath.toLowerCase().endsWith(".jpg")) {
    throw new Error("Invalid file format. Please provide a .jpg file.");
  }

  // Check if the file exists
  if (!fs.existsSync(`./tmp/${filepath}`)) {
    throw new Error("File not found.");
  }

  const image = fs.readFileSync(`./tmp/${filepath}`).toString("base64");

  // Check if the prompt file exists
  if (!fs.existsSync(`./public/prompt_image2md.md`)) {
    throw new Error(
      "Prompt file not found. Create ./public/prompt_image2md.md and try again."
    );
  }

  const prompt = fs.readFileSync(`./public/prompt_image2md.md`, "utf8");

  const input2 = [
    new HumanMessage({
      content: [
        {
          type: "text",
          text: prompt,
        },
        {
          type: "image_url",
          image_url: `data:image/jpeg;base64,${image}`,
        },
      ],
    }),
  ];

  try {
    // Use chain.invoke instead of model.invoke
    const prompt = ChatPromptTemplate.fromMessages(input2);
    const chain = prompt.pipe(model);
    const res = await chain.invoke({ callbacks: [langfuseHandler] });

    // Extract and return only the content from the response
    return res.content;
  } catch (error) {
    if (error instanceof Error && error.message.includes("RECITATION")) {
      console.error("Recitation error encountered. Skipping image conversion.");
      return "[error] RECITATION ERROR [/error]"; // Example: Return an empty string
    } else {
      // Re-throw other errors for general handling
      throw error;
    }
  }
}

// Function to chunk an array into smaller arrays of a specified size
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Define the main function to process the PDF
export async function processPdfToMarkdown(pdfFilepath) {
  try {
    // Convert PDF to images
    const images = await convertPdfToImages(pdfFilepath);

    // Chunk the images into batches of 50
    const imageChunks = chunkArray(images, 50);

    // Get the timestamp
    const timestamp = new Date().toISOString().replace(/:/g, "-");

    let totalMarkdown = "";

    for (let chunkIndex = 0; chunkIndex < imageChunks.length; chunkIndex++) {
      const imageChunk = imageChunks[chunkIndex];
      console.log(
        `Processing chunk ${chunkIndex + 1} with ${imageChunk.length} images`
      );

      // Process all images in parallel
      const markdownPromises = imageChunk.map(async (image) => {
        console.log(`Processing image: ${image.name}`);
        return imageToMd(image.name);
      });

      // Wait for all promises to resolve
      const markdownContent = await Promise.all(markdownPromises);

      // Join all markdown content into a single string
      const finalMarkdown = markdownContent.join("\\n\\n");

      // Append the final markdown to the total markdown
      totalMarkdown += finalMarkdown;

      console.log(`Final Markdown for chunk ${chunkIndex + 1}:`, finalMarkdown);

      // Write the final markdown to a file
      const filename = `out_${timestamp}_part${chunkIndex + 1}.md`;
      fs.writeFileSync(`./out/${filename}`, finalMarkdown);
      console.log(`Markdown written to ${filename}`);
    }

    // delete all images
    images.forEach((image) => {
      fs.unlinkSync(`./tmp/${image.name}`);
    });

    return totalMarkdown;
  } catch (error) {
    console.error("Error processing PDF to Markdown:", error);
  }
}

export async function organizeMarkdown(filepath) {
  // Check if the file exists
  if (!fs.existsSync(filepath)) {
    throw new Error("File not found.");
  }

  const md = fs.readFileSync(filepath, "utf8");

  // initialize the model
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
  });

  // Check if the prompt file exists
  if (!fs.existsSync(`./public/prompt_organize.md`)) {
    throw new Error(
      "Prompt file not found. Create ./public/prompt_organize.md and try again."
    );
  }

  const systemTemplate = fs.readFileSync(`./public/prompt_organize.md`, "utf8");

  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["user", "### The text to transform:\n{markdown}"],
  ]);

  const parser = new StringOutputParser();
  const chain = promptTemplate.pipe(model).pipe(parser);

  const res = await chain.invoke(
    { markdown: md },
    { callbacks: [langfuseHandler] }
  );

  // Get the timestamp
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  // Write the final markdown to a file
  fs.writeFileSync(`./out/org_${timestamp}.md`, res);

  return res;
}
