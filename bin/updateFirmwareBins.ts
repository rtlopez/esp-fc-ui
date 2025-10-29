import './env'
import fs from 'fs/promises'
import path from 'path'
import { Octokit } from '@octokit/rest'
import { isZipFile, FirmwareVersion, packZipFile, calcChecksum, extractZipFile } from '../src/api/firmware'

const REPO_OWNER = 'rtlopez'
const REPO_NAME = 'esp-fc'
const PUBLIC_FW_DIR = './public/fw'
const VERSIONS_FILE = path.join(PUBLIC_FW_DIR, 'versions.json')
const FW_NAME_RE = /espfc_[vpr0-9.-]+_[a-z0-9]+_0x00\.bin(\.zip)?/
const PR_NUMS = [176, 175, 145]
const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN
})

const targetBoardMap: Record<string, string> = {
  esp32s2: 'esp32-s2',
  esp32s3: 'esp32-s3',
  esp32c3: 'esp32-c3',
}

interface ArtifactEntry {
  downloadUrl: string
  issueUrl?: string
  name: string
  version?: string
  group: 'released' | 'experimental'
  artifactId?: number
  assetId?: number
}

async function getReleases() {
  console.log('fetch releases')
  const { data: releases } = await octokit.repos.listReleases({
    owner: REPO_OWNER,
    repo: REPO_NAME
  })
  return releases
}

async function getPR(pull_number: number) {
  console.log('fetch pull', pull_number)
  const { data: pull } = await octokit.pulls.get({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number
  })
  return pull;
}

async function getPullRequestCommits(pull_number: number) {
  console.log('fetch pull commits', pull_number)
  const { data: commits } = await octokit.pulls.listCommits({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number,
  })
  return commits
}

let _workflowRunsCache: Awaited<ReturnType<typeof octokit.actions.listWorkflowRunsForRepo>> | null = null
async function getWorkflowRuns() {
  if (_workflowRunsCache === null) {
    console.log('fetch workflow runs')
    const result = await octokit.actions.listWorkflowRunsForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      per_page: 200,
      status: 'completed'
    })
    _workflowRunsCache = result
  }
  return _workflowRunsCache.data
}

async function getWorkflowRunArticacts(run_id: number) {
  console.log('fetch workflow run artifacts', run_id)
  const { data } = await octokit.actions.listWorkflowRunArtifacts({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    run_id,
  })
  return data.artifacts
}

async function downloadAsset(asset_id: number, name: string, url: string) {
  console.log('dnld asset', asset_id, name, url)
  const { data } = await octokit.rest.repos.getReleaseAsset({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    asset_id,
    headers: {
      Accept: 'application/octet-stream',
    }
  })
  return data as unknown as ArrayBuffer
}

async function downloadArtifact(artifact_id: number, name: string, url: string) {
  console.log('dnld artifact', name, artifact_id, url)
  const { data } = await octokit.actions.downloadArtifact({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    artifact_id,
    archive_format: 'zip'
  });
  return data as ArrayBuffer
}

async function saveArtifact(buffer: ArrayBuffer, targetPath: string) {
  const targetDir = path.dirname(targetPath)
  await fs.mkdir(targetDir, { recursive: true })
  console.log('save', targetPath)
  await fs.writeFile(targetPath, new Uint8Array(buffer))
}

function isArtifactNameValid(name: string) {
  return FW_NAME_RE.test(name)
}

async function getLatestPRArtifacts(pull_number: number) {
  const pull = await getPR(pull_number)
  if (pull.state !== 'open') {
    return []
  }
  const runs = await getWorkflowRuns()
  const commits = await getPullRequestCommits(pull_number)
  const commitShas = commits.map(c => c.sha)
  const prRuns = runs.workflow_runs
    .filter(run => commitShas.includes(run.head_sha))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (prRuns.length === 0) {
    return []
  }

  // Latest run
  const latestRun = prRuns[0];

  // get run artiacts
  const artifacts = await getWorkflowRunArticacts(latestRun.id)

  return artifacts.map(a => {
    console.log('PR', pull_number, a.name, isArtifactNameValid(a.name))
    return {
      name: a.name,
      version: `PR${pull_number}`,
      downloadUrl: a.archive_download_url,
      issueUrl: pull.html_url,
      group: 'experimental',
      artifactId: a.id,
    } as ArtifactEntry
  });
}

async function getReleasedArtifacts() {
  const releases = await getReleases()
  const result = [] as ArtifactEntry[]
  for (const release of releases) {
    const version = release.tag_name
    for (const asset of release.assets) {
      console.log('REL', version, asset.name, isArtifactNameValid(asset.name))
      result.push({
        downloadUrl: asset.browser_download_url,
        issueUrl: release.html_url,
        name: asset.name,
        version,
        group: 'released',
        assetId: asset.id,
      })
    }
  }
  return result
}

async function processArtifacts(artifacts: ArtifactEntry[]) {
  const versions: FirmwareVersion[] = []
  const validArtifacts = artifacts.filter(a => isArtifactNameValid(a.name))
  for (const a of validArtifacts) {
    try {
      let buffer = null
      if (a.artifactId) buffer = await downloadArtifact(a.artifactId, a.name, a.downloadUrl)
      if (a.assetId) buffer = await downloadAsset(a.assetId!, a.name, a.downloadUrl)
      if (buffer) {
        buffer = await packZipFile(buffer, a.name)
        const unzipped = await extractZipFile(buffer)
        const checksum = calcChecksum(unzipped)
        const [prefix, version, target] = a.name.split('_')
        const board = (targetBoardMap[target] || target).toUpperCase()
        const targetFile = `${prefix}_${version}_${target}_0x00.bin${isZipFile(buffer) ? '.zip' : ''}`
        const targetPath = path.join(PUBLIC_FW_DIR, version, targetFile)
        await saveArtifact(buffer, targetPath)
        versions.push({
          version: a.version || version,
          group: a.group,
          file: targetFile,
          checksum,
          board,
          url: a.issueUrl,
        })
      }
    } catch (err) {
      console.error(err)
    }
  }
  return versions
}

async function cleanupArtifacts() {
  try {
    const exists = await fs.access(PUBLIC_FW_DIR)
      .then(() => true)
      .catch(() => false)

    if (!exists) return

    const entries = await fs.readdir(PUBLIC_FW_DIR, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(PUBLIC_FW_DIR, entry.name)
      console.log('cleanup', fullPath)

      if (entry.isDirectory()) {
        await fs.rm(fullPath, { recursive: true, force: true })
      } else {
        await fs.unlink(fullPath)
      }
    }
  } catch (err) {
    console.error('cleanup error', err)
  }
}

async function main() {
  const artifacts: ArtifactEntry[] = []

  const releasedArtifacts = await getReleasedArtifacts()
  artifacts.push(...releasedArtifacts)

  for (const pr_num of PR_NUMS) {
    const prArtifacts = await getLatestPRArtifacts(pr_num)
    artifacts.push(...prArtifacts)
  }

  await cleanupArtifacts()
  const versions = await processArtifacts(artifacts)

  // Sort versions by version number (newest first)
  versions.sort((a, b) => b.version.localeCompare(a.version))

  // Add custom file option
  versions.push({
    version: 'Custom File',
    file: '',
    board: 'ALL',
    group: 'experimental'
  })

  // Save versions.json
  console.log('json', VERSIONS_FILE)
  await fs.writeFile(VERSIONS_FILE, JSON.stringify(versions, null, 4))
}

await main()
