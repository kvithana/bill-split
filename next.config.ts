import withSerwistInit from "@serwist/next"

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
})

// starts a command line process to get the git hash
const commitHash = require("child_process")
  .execSync('git log --pretty=format:"%h" -n1')
  .toString()
  .trim()

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    COMMIT_HASH: commitHash,
  },
}

export default withSerwist(nextConfig)
