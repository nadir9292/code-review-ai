import simpleGit from "simple-git";
import OpenAI from "openai";
import "dotenv/config";

const git = simpleGit();

const openai = new OpenAI({ apiKey: process.env.OPENAI_TOKEN });

const getCommitDiff = async () => {
  try {
    const log = await git.log(["-n", "2"]);

    if (log.total === 0) {
      throw new Error("No commits found in the repository.");
    } else if (log.total === 1) {
      throw new Error("Only one commit found in the repository.");
    }

    const commit1 = log.latest.hash;
    const commit2 = log.all[1].hash;

    const diff = await git.diff([`${commit2}..${commit1}`]);
    return diff;
  } catch (error) {
    throw new Error(`Error getting commit diff: ${error}`);
  }
};

const getReviewComments = async (diff) => {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `(l'analyse devra être courte et sous forme de liste sans phrase longue) Analyser le code diff suivant et donne des conseil sur le CLEAN CODE :\n\n${diff}`,
      },
    ],
    model: "gpt-3.5-turbo",
  });
  return completion.choices[0];
};

const main = async () => {
  try {
    const diff = await getCommitDiff();
    const reviewComments = await getReviewComments(diff);
    console.log("Code Review Comments:", reviewComments);
  } catch (error) {
    console.error("Error during code review:", error);
  }
};

main();
