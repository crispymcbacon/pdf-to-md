import dotenv from "dotenv";
import {
  convertPdfToImages,
  imageToMd,
  writeMdToFile,
  processPdfToMarkdown,
} from "./fun.js";

dotenv.config();

async function api(fastify, options) {
  fastify.get("/", async (request, reply) => {
    return { hello: "world" };
  });

  fastify.post("/convertpdf", async (request, reply) => {
    const { file } = request.body;
    const filepath = `./${file}`;
    const images = await convertPdfToImages(filepath);
    return images;
  });

  fastify.post("/imagetomd", async (request, reply) => {
    const { file } = request.body;
    const md = await imageToMd(file);

    // remove the extension from the file
    const fileParts = file.split(".");
    fileParts.pop();
    const fileWithoutExt = fileParts.join(".");
    await writeMdToFile(md, fileWithoutExt);

    return { response: md };
  });

  fastify.post("/convertpdf2md", async (request, reply) => {
    const { file } = request.body;

    await processPdfToMarkdown(file, "output");

    return { response: "PDF converted to Markdown." };
  });
}

export default api;
