import axios from "axios";
import simpleGit from "simple-git";
const git = simpleGit();

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
  const apiKey = process.env.OPENAI_API_KEY;
  const url = "https://api.openai.com/v1/completions";
  const response = await axios.post(
    url,
    {
      model: "text-davinci-003",
      prompt: `Analyze the following code diff and provide code review comments:\n\n${diff}`,
      max_tokens: 150,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.choices[0].text;
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
