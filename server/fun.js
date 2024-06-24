import { fromPath } from "pdf2pic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { CallbackHandler } from "langfuse-langchain";
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
    savePath: "./images",
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
    maxOutputTokens: 2048,
  });

  if (!filepath.toLowerCase().endsWith(".jpg")) {
    throw new Error("Invalid file format. Please provide a .jpg file.");
  }

  if (fs.existsSync(`./images/${filepath}`)) {
    const image = fs.readFileSync(`./images/${filepath}`).toString("base64");
    const input2 = [
      new HumanMessage({
        content: [
          {
            type: "text",
            text: `
    Instructions:
    
    Convert the following image to Markdown format.
    
    Specific Requirements:
  
    Do not add any introductory or concluding phrases.
    
    Math Equations:
    
    Display Equations: Convert all display math equations to LaTeX format enclosed in $$ equation $$.
    
    Inline Equations: Convert all inline math equations, math symbols, or elements that represent math to LaTeX format enclosed in $ equation $ or $ symbol $.
    
    Figures:
    
    Figure Description: Add a description of each figure in the format [figure]description of the figure[/figure].
    
    Text Extraction: Extract all text from figures and convert it to Markdown format. If the figure contains math, represent it using LaTeX math.
    
    Figure Tag: Create a tag for each figure with the extracted text in the format [textoffigure]text of figure $ latex math $ [/textoffigure].
    
    Input:
    
    Image: [Insert Image URL or upload image file]
    
    Output:
    
    Markdown: Markdown format of the image content with all the specified conversions.
    
    Example:
    
    Input Image:
    
    [Image containing a text paragraph with an inline equation x^2, a display equation y = mx + c, and a figure with text "Figure 1: Example Figure" and the equation z = a + b.]
    
    Output Markdown:
    
    This is a paragraph with an inline equation $x^2$.
    
    $$y = mx + c$$
    
    [figure]Example Figure[/figure]
    
    [textoffigure]Figure 1: Example Figure $z = a + b$[/textoffigure]
    content_copy`,
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
        console.error(
          "Recitation error encountered. Skipping image conversion."
        );
        return "[error] RECITATION ERROR [/error]"; // Example: Return an empty string
      } else {
        // Re-throw other errors for general handling
        throw error;
      }
    }
  } else {
    throw new Error("File not found.");
  }
}

// function to write the markdown to a file
export async function writeMdToFile(md, filename) {
  fs.writeFileSync(`./md/${filename}.md`, md);
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
export async function processPdfToMarkdown(pdfFilepath, markdownFilename) {
  try {
    // Step 2.1: Convert PDF to images
    const images = await convertPdfToImages(pdfFilepath);

    // Step 2.2: Chunk the images into batches of 50
    const imageChunks = chunkArray(images, 50);

    for (let chunkIndex = 0; chunkIndex < imageChunks.length; chunkIndex++) {
      const imageChunk = imageChunks[chunkIndex];
      console.log(
        `Processing chunk ${chunkIndex + 1} with ${imageChunk.length} images`
      );

      // Step 2.3: Process all images in parallel
      const markdownPromises = imageChunk.map(async (image) => {
        console.log(`Processing image: ${image.name}`);
        return imageToMd(image.name);
      });

      // Step 2.4: Wait for all promises to resolve
      const markdownContent = await Promise.all(markdownPromises);

      // Step 2.5: Join all markdown content into a single string
      const finalMarkdown = markdownContent.join("\n\n");

      console.log(`Final Markdown for chunk ${chunkIndex + 1}:`, finalMarkdown);

      // Step 2.6: Write the final markdown to a file
      const filename = `${markdownFilename}_part${chunkIndex + 1}`;
      await writeMdToFile(finalMarkdown, filename);
      console.log(`Markdown written to ${filename}.md`);
    }

    // delete all images
    images.forEach((image) => {
      console.log(`Deleting image: ${image.name}`);
      fs.unlinkSync(`./images/${image.name}`);
    });
  } catch (error) {
    console.error("Error processing PDF to Markdown:", error);
  }
}
