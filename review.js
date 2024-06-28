import simpleGit from 'simple-git'
import OpenAI from 'openai'
import fs from 'fs'
import 'dotenv/config'
import { promisify } from 'util'

const writeFileAsync = promisify(fs.writeFile)

const git = simpleGit()

const openai = new OpenAI({ apiKey: process.env.OPENAI_TOKEN })

const getCommitDiff = async () => {
  try {
    const log = await git.log(['-n', '2'])

    if (log.total === 0) {
      throw new Error('No commits found in the repository.')
    } else if (log.total === 1) {
      throw new Error('Only one commit found in the repository.')
    }

    const commit1 = log.latest.hash
    const commit2 = log.all[1].hash

    const diff = await git.diff([`${commit2}..${commit1}`])
    return diff
  } catch (error) {
    throw new Error(`Error getting commit diff: ${error}`)
  }
}

const getReviewComments = async (diff) => {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `(l'analyse devra être tres courte et sous forme de liste sans phrase longue) Analyser le code diff suivant et donne des conseil sur le CLEAN CODE :\n\n${diff}`,
      },
    ],
    model: 'gpt-3.5-turbo',
  })
  console.log(completion.choices[0])
  return completion.choices[0]
}

const writeCompletionToFile = async (commitTitle, date, completionText) => {
  const markdownContent = `# ${commitTitle}\n\nDate: ${date}\n\n${completionText}\n\n---\n\n`

  try {
    await writeFileAsync('README.md', markdownContent, { flag: 'a' })
    console.log(`Added review for commit '${commitTitle}' to README.md`)
  } catch (error) {
    throw new Error(`Error writing to file: ${error}`)
  }
}

const main = async () => {
  try {
    const diff = await getCommitDiff()
    const reviewComments = await getReviewComments(diff)

    const log = await git.log(['-n', '1'])
    const commitTitle = log.latest.message
    const commitDate = log.latest.date

    await writeCompletionToFile(
      commitTitle,
      commitDate,
      reviewComments.message.content
    )
  } catch (error) {
    console.error('Error during code review:', error)
  }
}

main()
