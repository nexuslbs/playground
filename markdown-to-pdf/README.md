# Markdown to PDF Converter

Convert Markdown files to professional PDF documents using **Pandoc** and **WeasyPrint** in a Dockerized environment.

## Features

- Renders GitHub-Flavored Markdown (GFM) with smart extensions
- Professional typography using DejaVu fonts (Serif body, Sans headers)
- Automatic page numbering
- Syntax-highlighted code blocks with inline code styling
- Styled tables with alternating rows and dark headers
- Blockquotes, lists, images, and horizontal rules
- Page-break management for clean document flow
- Title automatically extracted from the first `# Heading` in your document

## Requirements

- [Docker](https://docs.docker.com/get-docker/) with [Compose V2](https://docs.docker.com/compose/)
- A `docker-compose.yml` (or `compose.yml`) file with a `md-pdf` service

### Expected Service Configuration

Your `compose.yml` should define a service named `md-pdf`:

```yaml
services:
  md-pdf:
    image: pandoc/extra:latest
    volumes:
      - .:/data
      - ./assets:/assets
    working_dir: /data
    entrypoint: /data/entrypoint.sh
```

The container mounts:
- The current directory (containing your Markdown files) to `/data`
- The `assets/` folder (with `style.css`) to `/assets`

## Usage

### Via Docker Compose

```bash
docker compose run --rm md-pdf <input.md> <output.pdf>
```

**Examples:**

```bash
# Convert a specific file
docker compose run --rm md-pdf README.md readme.pdf

# Convert a file in a subdirectory
docker compose run --rm md-pdf docs/guide.pdf
```

### Via the Test Script

A convenience script is included for quick testing:

```bash
# Using the default test file
./test.sh

# Using a custom input file
./test.sh path/to/your/document.md
```

The test script generates a timestamped PDF in the current directory and reports the file size.

## Project Structure

```
├── assets/
│   └── style.css         # PDF stylesheet (WeasyPrint)
├── docker-compose.yml    # Docker Compose configuration
├── entrypoint.sh         # Conversion entrypoint script
├── README.md             # This file
└── test.sh               # Test/run script
```

## Styling Highlights

| Element            | Style                                                    |
| ------------------ | -------------------------------------------------------- |
| **Body**           | DejaVu Serif 11pt, 1.6 line-height, justified            |
| **Headings**       | DejaVu Sans, h1 starts a new page, h2 has bottom border  |
| **Code (inline)**  | `#e74c3c` red color                                      |
| **Code (blocks)**  | `#f5f5f5` gray background, border, monospace             |
| **Tables**         | Collapsed borders, `#2c3e50` header with white text      |
| **Blockquotes**    | Left `#2c3e50` border, italic, gray text                 |
| **Images**         | Max-width 100%                                           |
| **Page numbers**   | Bottom center on every page                              |
| **Margins**        | 2.5cm on all sides                                       |

## Troubleshooting

- **"Input file does not exist"**: Ensure the file path is relative to the container's working directory (`/data`), not your host absolute path.
- **Pandoc errors**: Run without `--rm` to inspect the container, or check that your Markdown file is valid.
- **Missing fonts**: The `pandoc/extra` image includes DejaVu fonts. If using a different image, install fonts or adjust the CSS accordingly.
