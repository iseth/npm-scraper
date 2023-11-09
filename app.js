const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Function to fetch list of files from the directory
async function fetchFileList(packageName, packageVersion) {
    const route = `https://www.npmjs.com/package/${packageName}/v/${packageVersion}/index`;
    try {
        const response = await axios.get(route);
        return response.data.files; // Assuming the API returns the files in this structure
    } catch (error) {
        console.error('Error fetching file list:', error);
        return null;
    }
}

async function makeRequestWithRetry(url, retries = 5, backoff = 3000) {
    try {
        const response = await axios.get(url, {
            responseType: 'stream' // This ensures we get the data as a stream
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            if (retries) {
                console.log(`Attempt failed, retrying in ${backoff / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
                return makeRequestWithRetry(url, retries - 1, backoff * 2);
            } else {
                throw new Error('Too many retry attempts, please try again later.');
            }
        } else {
            throw error;
        }
    }
}

// Function to download a file
async function downloadFile(packageName, fileMetadata, downloadDirectory) {
    if (!fileMetadata || !fileMetadata.path) {
        console.log('Invalid file metadata, cannot download.');
        return;
    }

    // Make a GET request to the actual file download endpoint
    const url = `https://www.npmjs.com/package/${packageName}/file/${fileMetadata.hex}`;
    try {
        const response = makeRequestWithRetry(url);
        // console.log(response);

        // Ensure download directory exists
        fs.mkdirSync(downloadDirectory, { recursive: true });

        // Pipe the response data to a file
        const filePath = path.join(downloadDirectory, fileMetadata.path);
        const fileDir = path.dirname(filePath);
        fs.mkdirSync(fileDir, { recursive: true });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error downloading the file:', error);
    }
}

// Main function to orchestrate the fetching and downloading of files
async function scrapeFiles(packageName, packageVersion) {
    const fileList = await fetchFileList(packageName, packageVersion);

    if (fileList) {
        const downloadDirectory = `./downloads/${packageName}/${packageVersion}`;

        // Loop over each file and download it
        for (let file of Object.values(fileList)) {
            if (file.type !== 'folder') {
                // Only download if it's a file, not a folder
                await downloadFile(packageName, file, downloadDirectory);
            }
        }
    }
}

// Replace 'your-package-name' and 'your-package-version' with actual values
scrapeFiles('@github/alive-client', '1.0.2');
