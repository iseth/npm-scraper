# NPM Package File Scraper

This script, `scraper.js`, is a Node.js application that fetches and downloads files from a specified NPM package version. It uses the `axios` library to make HTTP requests and the `fs` and `path` modules to handle file system operations.

## How it Works

1. The script first fetches the list of files for a given package and version from the NPM website.

2. It then iterates over the list of files, and for each file that is not a folder, it downloads the file.

3. The downloaded files are saved in a directory structure that mirrors the package's structure on NPM.

## Functions

- `fetchFileList(packageName, packageVersion)`: Fetches the list of files for a given package and version.

- `makeRequestWithRetry(url, retries = 5, backoff = 3000)`: Makes a GET