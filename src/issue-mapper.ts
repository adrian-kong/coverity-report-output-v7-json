import {debug, info} from '@actions/core'
import {CoverityApiService, IIssuesSearchResponse, IResponseCell, KEY_ACTION, KEY_CID, KEY_CLASSIFICATION, KEY_FIRST_SNAPSHOT_ID, KEY_LAST_SNAPSHOT_ID, KEY_MERGE_KEY} from './coverity-api'
import {COVERITY_URL, COVERITY_USERNAME, COVERITY_PASSWORD, COVERITY_PROJECT_NAME} from './inputs'

const PAGE_SIZE = 500

export class ProjectIssue {
  cid: string
  mergeKey: string | null
  action: string
  classification: string
  firstSnapshotId: string
  lastSnapshotId: string

  constructor(cid: string, mergeKey: string | null, action: string, classification: string, firstSnapshotId: string, lastSnapshotId: string) {
    this.cid = cid
    this.mergeKey = mergeKey
    this.action = action
    this.classification = classification
    this.firstSnapshotId = firstSnapshotId
    this.lastSnapshotId = lastSnapshotId
  }
}

// FIXME This is very inefficient for projects with lots of issues. When filtering by mergeKey is fixed, we should use that instead.
export async function mapMatchingMergeKeys(relevantMergeKeys: Set<string>): Promise<Map<string, ProjectIssue>> {
  info('Checking Coverity server for existing issues...')
  const apiService = new CoverityApiService(COVERITY_URL, COVERITY_USERNAME, COVERITY_PASSWORD)

  let totalRows = 0
  let offset = 0

  const mergeKeyToProjectIssue = new Map<string, ProjectIssue>()

  while (offset <= totalRows && mergeKeyToProjectIssue.size < relevantMergeKeys.size) {
    try {
      const covProjectIssues = await apiService.findIssues(COVERITY_PROJECT_NAME, offset, PAGE_SIZE)
      totalRows = covProjectIssues.totalRows
      debug(`Found ${covProjectIssues?.rows.length} potentially matching issues on the server`)

      covProjectIssues.rows
        .map(row => toProjectIssue(row))
        .filter(projectIssue => projectIssue.mergeKey != null)
        .filter(projectIssue => relevantMergeKeys.has(projectIssue.mergeKey as string))
        .forEach(projectIssue => mergeKeyToProjectIssue.set(projectIssue.mergeKey as string, projectIssue))
    } catch (error: any) {
      throw new Error("project dosen't exists or please check the name used in workflow :" + error);
      return Promise.reject(error)
    }
    offset += PAGE_SIZE
  }

  info(`Found ${mergeKeyToProjectIssue.size} existing issues`)
  return mergeKeyToProjectIssue
}

function toProjectIssue(issueRows: IResponseCell[]): ProjectIssue {
  let cid = ''
  let mergeKey = null
  let action = ''
  let classification = ''
  let firstSnapshotId = ''
  let lastSnapshotId = ''
  for (const issueCol of issueRows) {
    if (issueCol.key == KEY_CID) {
      cid = issueCol.value
    } else if (issueCol.key == KEY_MERGE_KEY) {
      mergeKey = issueCol.value
    } else if (issueCol.key == KEY_ACTION) {
      action = issueCol.value
    } else if (issueCol.key == KEY_CLASSIFICATION) {
      classification = issueCol.value
    } else if (issueCol.key == KEY_FIRST_SNAPSHOT_ID) {
      firstSnapshotId = issueCol.value
    } else if (issueCol.key == KEY_LAST_SNAPSHOT_ID) {
      lastSnapshotId = issueCol.value
    }
  }
  return new ProjectIssue(cid, mergeKey, action, classification, firstSnapshotId, lastSnapshotId)
}
