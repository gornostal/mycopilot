import OpenAI from "openai";
import dotenv from "dotenv";
import { writeFileSync } from "fs";
import {
  findGitRoot,
  getLinesBetweenDelimiters,
  replaceFileNamesWithContents,
} from "./utils.ts";

dotenv.config();

const main = async (filepath: string) => {
  const rootDir = findGitRoot(filepath);
  const promptSource = getLinesBetweenDelimiters(filepath);
  const prompt = replaceFileNamesWithContents(promptSource, rootDir);

  console.log(prompt);
  console.log("Running prompt 👆");

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Carefully heed the user's instructions. \nRespond using Markdown.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 1,
    top_p: 1,
    presence_penalty: 0,
    frequency_penalty: 0,
    stream: true,
  });

  for await (const message of chatCompletion) {
    const delta = message.choices[0].delta;
    if (delta && delta.content) {
      // process.stdout.write(delta.content);
      writeFileSync(filepath, delta.content, { flag: "a" });
    }
  }
};

main(process.argv[2]);
