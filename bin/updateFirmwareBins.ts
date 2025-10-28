// bin/updateFirmwareBins.ts

// requirements: npm install @octokit/rest node-fetch jszip crypto-js @types/crypto-js

import { Octokit } from '@octokit/rest'
import fs from 'fs/promises'
import path from 'path'
import fetch from 'node-fetch'
import JSZip from 'jszip'
import CryptoJS from 'crypto-js'
import { isZipFile, FirmwareVersion } from '../src/api/firmware'

const REPO_OWNER = 'rtlopez'
const REPO_NAME = 'esp-fc'
const PUBLIC_FW_DIR = './public/fw'
const VERSIONS_FILE = path.join(PUBLIC_FW_DIR, 'versions.json')
const FW_NAME_RE = /espfc_[vpr0-9.-]+_[a-z0-9]+_0x00\.bin(\.zip)?/
const octokit = new Octokit()
const PR_NUMS = [176, 175, 145]

const targetBoardMap: Record<string, string> = {
  esp32s2: 'esp32-s2',
  esp32s3: 'esp32-s3',
  esp32c3: 'esp32-c3',
}

interface ArtifactEntry {
  download_url: string,
  issue_url?: string,
  name: string,
  version?: string
  group: 'released' | 'experimental'
}

async function getReleases() {
  console.log('fetch releases')
  const { data: releases } = await octokit.repos.listReleases({
    owner: REPO_OWNER,
    repo: REPO_NAME
  })
  return releases
}

// async function getActivePRs() {
//   console.log('fetch pulls')
//   const { data: pulls } = await octokit.pulls.list({
//     owner: REPO_OWNER,
//     repo: REPO_NAME,
//     state: "open",
//     per_page: 100,
//   })
//   return pulls;
// }

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


async function fetchArtifact(url: string, name: string) {
  console.log('fetch', name, url)
  const response = await fetch(url)
  return await response.arrayBuffer()
  //return Buffer.from(await response.arrayBuffer()) as ArrayBuffer
}

async function unzipArtifact(zipBuffer: ArrayBuffer, name: string) {
  if (!isZipFile(zipBuffer)) return zipBuffer
  const zip = new JSZip()
  await zip.loadAsync(zipBuffer)
  for (const [filename, file] of Object.entries(zip.files)) {
    if (!filename.endsWith('.bin')) continue
    console.log('unzip', name, filename)
    return (await file.async('nodebuffer')).buffer as ArrayBuffer
  }
  return null
}

function getChecksum(buffer: ArrayBuffer): string {
  // Convert Buffer to WordArray that crypto-js understands
  const words = CryptoJS.lib.WordArray.create(buffer)
  //const words = Array.from(buffer).map(byte => byte.toString(16).padStart(2, '0')).join('')
  return CryptoJS.MD5(words).toString()
}

async function saveArtifact(buffer: ArrayBuffer, targetPath: string) {
  // Create directory
  const targetDir = path.dirname(targetPath)
  //console.log('mkdir', targetDir)
  await fs.mkdir(targetDir, { recursive: true })

  // Write target file
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
      download_url: a.archive_download_url,
      issue_url: pull.html_url,
      group: 'experimental',
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
        download_url: asset.browser_download_url,
        issue_url: release.html_url,
        name: asset.name,
        version,
        group: 'released'
      })
    }
  }
  return result
}

async function processArtifacts(artifacts: ArtifactEntry[]) {
  const versions: FirmwareVersion[] = []
  const valid = artifacts.filter(a => isArtifactNameValid(a.name))
  for (const a of valid) {
    try {
      const zipBuffer = await fetchArtifact(a.download_url, a.name)
      const buffer = await unzipArtifact(zipBuffer, a.name)
      if (buffer) {
        const checksum = getChecksum(buffer)
        const [prefix, version, target] = a.name.split('_')
        const board = (targetBoardMap[target] || target).toUpperCase()
        const file = `${prefix}_${version}_${target}_0x00.bin`
        const targetPath = path.join(PUBLIC_FW_DIR, version, file)
        await saveArtifact(buffer, targetPath)

        versions.push({
          version: a.version || version,
          group: a.group,
          file,
          checksum,
          board,
          url: a.issue_url,
        })
      }
    } catch (e) {
      console.error(e)
    }
  }
  return versions
}

async function main() {
  const artifacts: ArtifactEntry[] = []

  const releasedArtifacts = await getReleasedArtifacts()
  artifacts.push(...releasedArtifacts)

  for(const pr_num of PR_NUMS) {
    const prArtifacts = await getLatestPRArtifacts(pr_num)
    artifacts.push(...prArtifacts)
  }

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
