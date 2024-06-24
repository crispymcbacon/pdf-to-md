# PDF to Markdown Converter

This project provides a tool to convert PDF documents into Markdown files.

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

## API

`/api/convertpdf2md` - Converts a PDF file to a Markdown file.
