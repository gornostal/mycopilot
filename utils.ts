import fs from "fs";
import path, { resolve, parse, join, dirname, extname } from "path";

const delimiter = "~~";

export function findGitRoot(filePath: string): string {
  let currentDir: string = resolve(filePath);

  while (currentDir !== parse(currentDir).root) {
    const gitDir: string = join(currentDir, ".git");
    try {
      const stat: fs.Stats = fs.statSync(gitDir);
      if (stat.isDirectory()) {
        return currentDir;
      }
    } catch (err) {
      currentDir = dirname(currentDir);
    }
  }

  throw new Error("No .git directory found in the project hierarchy");
}

function findFileAndReadContents(
  rootDir: string,
  fileName: string
): { relativePath: string; ext: string; fileContents: string } {
  function searchDirectory(directory: string): string | null {
    try {
      const entries: fs.Dirent[] = fs.readdirSync(directory, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        const fullPath: string = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          const result = searchDirectory(fullPath);
          if (result) return result;
        } else if (entry.isFile() && entry.name.includes(fileName)) {
          return fullPath;
        }
      }
    } catch (err) {
      console.error(`Error reading directory: ${directory}`, err);
      throw err;
    }

    return null;
  }

  const filePath: string | null = searchDirectory(rootDir);
  if (!filePath) {
    throw new Error(`File named "${fileName}" not found`);
  }

  const relativePath: string = path.relative(rootDir, filePath);
  const ext: string = extname(filePath).slice(1);
  const fileContents: string = removeMarkdownComments(
    removeDelimitedSections(fs.readFileSync(filePath, "utf-8")),
    ext
  );

  return { relativePath, ext, fileContents };
}

function removeMarkdownComments(input: string, ext: string): string {
  if (ext !== "md") {
    return input;
  }

  return input
    .split("\n")
    .filter((line) => !line.startsWith(";;"))
    .join("\n");
}

function removeCommentSymbols(input: string): string {
  const lines: string[] = input.split("\n");
  const commentRegex: RegExp = /^\s*(\/\/|#)\s*/;
  const strippedLines: string[] = lines.map((line) =>
    line.replace(commentRegex, "")
  );

  return strippedLines.join("\n");
}

function removeDelimitedSections(fileContent: string): string {
  const lines: string[] = fileContent.split("\n");

  let result: string[] = [];
  let capturing: boolean = false;

  for (const line of lines) {
    if (line.includes(delimiter)) {
      capturing = !capturing;
    } else if (!capturing) {
      result.push(line);
    }
  }

  return result.join("\n");
}

export function getLinesBetweenDelimiters(filePath: string): string {
  try {
    const data: string = fs.readFileSync(filePath, "utf-8");
    const lines: string[] = data.split("\n");

    let result: string[] = [];
    let capturing: boolean = false;

    for (const line of lines) {
      if (line.includes(delimiter)) {
        capturing = !capturing;
      } else if (capturing) {
        result.push(line);
      }
    }

    return removeCommentSymbols(result.join("\n"));
  } catch (err) {
    console.error("Error reading the file:", err);
    return "";
  }
}

export function replaceFileNamesWithContents(
  prompt: string,
  rootDir: string
): string {
  const lines: string[] = prompt.split("\n");

  const modifiedLines: string[] = lines.map((line) => {
    const matched: RegExpMatchArray | null = line.match(/@(\S+)/);

    if (matched) {
      const fileName: string = matched[1];
      const file = findFileAndReadContents(rootDir, fileName);

      if (file.ext === "md") {
        return file.fileContents;
      }

      return `
${file.relativePath}:
\`\`\`${file.ext}
${file.fileContents}
\`\`\`
`;
    }

    return line;
  });

  return modifiedLines.join("\n");
}
