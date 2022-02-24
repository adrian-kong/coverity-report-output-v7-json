import * as core from '@actions/core'
import * as inputs from './inputs'
import fs from 'fs'
import {CoverityIssuesView} from './json-v7-schema'
import {isPullRequest} from './github/github-context'
import {getPullRequestDiff} from './github/pull-request'
import {getReportableLinesFromDiff} from './reporting'

async function run(): Promise<void> {
  core.info(`Using JSON file path: ${inputs.JSON_FILE_PATH}`)

  // TODO validate file exists and is .json?
  const jsonV7Content = fs.readFileSync(inputs.JSON_FILE_PATH)
  const coverityIssues = JSON.parse(jsonV7Content.toString()) as CoverityIssuesView

  if (isPullRequest()) {
    const reportableLineMap = await getPullRequestDiff().then(getReportableLinesFromDiff)
    for (const issue of coverityIssues.issues) {
      const reportableHunks = reportableLineMap.get(issue.mainEventFilePathname)
      if (reportableHunks !== undefined) {
        for (const hunk of reportableHunks) {
          if (hunk.firstLine <= issue.mainEventLineNumber && issue.mainEventLineNumber <= hunk.lastLine) {
            // Comment on mainEventLineNumber
          }
        }
      } else {
        // Append to generic PR comment
      }
    }
  }

  core.info(`Found ${coverityIssues.issues.length} Coverity issues.`)
}

run()
