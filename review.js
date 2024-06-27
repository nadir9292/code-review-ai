import axios from "axios";
import simpleGit from "simple-git";
const git = simpleGit();

const getCommitDiff = async () => {
  const diff = await git.diff(["HEAD^", "HEAD"]);
  return diff;
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
