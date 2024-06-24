# PDF to Markdown Converter

~_This project is a work in progress._~
~_If langfuse gives errors, just remove all the langfuse code since its not mandatory to run the code._~

This project provides a tool to convert PDF documents into Markdown files.
For now it uses the Google Cloud Vision API to extract text from the PDF file.

## Installation

To get started, clone this repository and install the dependencies:

```sh
git clone <repository-url>
cd pdf-to-md
pnpm install
```

The package `pdf2pic` requires `ghostscript` and `graphicsmagick` to be installed on your system. You can install them using the following commands:

```bash
# Linux
$ sudo apt-get update
$ sudo apt-get install ghostscript
$ sudo apt-get install graphicsmagick

# MacOS
brew update
brew install gs graphicsmagick
```

Setup your environment variables:

```sh
GOOGLE_API_KEY=<your-google-api-key>
```

## API

`/api/convertpdf2md` - Converts a local PDF file to a Markdown file, the pdf must be in the root folder of the project.

example:

```sh
curl -X POST http://localhost:3001/api/convertpdf2md -H "Content-Type: application/json" -d '{"file": "example.pdf"}'
```
