import dotenv from "dotenv";
import {
  convertPdfToImages,
  imageToMd,
  processPdfToMarkdown,
  organizeMarkdown,
} from "./fun.js";

dotenv.config();

async function api(fastify, options) {
  fastify.get("/", async (request, reply) => {
    return { hello: "world" };
  });

  fastify.get(
    "/protected",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      return request.user;
    }
  );

  // fastify.post("/signup", (req, reply) => {
  //   const { user } = req.body;
  //   const token = fastify.jwt.sign({ user });
  //   reply.send({ token });
  // });

  fastify.post(
    "/convertpdf",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { file } = request.body;
      const filepath = `./${file}`;
      const images = await convertPdfToImages(filepath);
      return images;
    }
  );

  fastify.post(
    "/imagetomd",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { file } = request.body;
      const md = await imageToMd(file);

      // remove the extension from the file
      const fileParts = file.split(".");
      fileParts.pop();
      const fileWithoutExt = fileParts.join(".");
      await writeToFile(md, `${fileWithoutExt}.md`);

      return { response: md };
    }
  );

  fastify.post(
    "/pdf2md",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        // stores files to tmp dir and return files
        const files = await request.saveRequestFiles({
          limits: { fileSize: 10000000 },
        });
        if (!files.length) return { response: "No files uploaded." }; // Early return if no files

        const file = files[0];

        console.log(file.mimetype); // "file"

        // Early return if the file is not a PDF file
        if (file.mimetype !== "application/pdf") {
          return { response: "File is not a PDF file." };
        }

        const res = await processPdfToMarkdown(file.filepath);

        return { response: res };
      } catch (error) {
        // error instanceof fastify.multipartErrors.RequestFileTooLargeError
        console.log(error);
      }
    }
  );

  fastify.post(
    "/organizemd",
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        // stores files to tmp dir and return files
        const files = await request.saveRequestFiles({
          limits: { fileSize: 10000000 },
        });
        if (!files.length) return { response: "No files uploaded." }; // Early return if no files

        const file = files[0];
        console.log(file.type); // "file"
        console.log(file.filepath);
        console.log(file.fieldname);
        console.log(file.filename);
        console.log(file.encoding);
        console.log(file.mimetype);
        console.log(file.fields); // other parsed parts

        //console.log(file.fields.json.value); // "data"

        // Early return if the file is not a markdown file
        if (file.mimetype !== "text/markdown") {
          return { response: "File is not a markdown file." };
        }

        const res = await organizeMarkdown(file.filepath);

        return { response: res };
      } catch (error) {
        // error instanceof fastify.multipartErrors.RequestFileTooLargeError
        console.log(error);
      }
    }
  );
}

export default api;
