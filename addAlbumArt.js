const fs = require('fs');
const path = require('path');
const NodeID3 = require('node-id3');

// Function to add album art to MP3 files
function addAlbumArtToMp3(mp3File, imageFile) {
    // Read the image file
    const imageData = fs.readFileSync(imageFile);

    // Define ID3 tag updates including image
    const tags = {
        APIC: {
            mime: "image/png", // You can also use 'image/jpeg' if your image is a jpeg
            type: 3,           // 3 is for album cover (front)
            description: "Cover",
            imageBuffer: imageData,
        },
    };

    // Add the album art to the MP3 file
    const success = NodeID3.update(tags, mp3File);

    if (success) {
        console.log(`Successfully added album art to '${path.basename(mp3File)}'`);
    } else {
        console.error(`Error adding album art to '${path.basename(mp3File)}'`);
    }
}

// Function to process all MP3 files in the folder
function processMp3Files(folderPath, artistImagePath) {
    // Check if the folder exists
    if (!fs.existsSync(folderPath)) {
        console.error(`Error: Folder '${folderPath}' does not exist.`);
        return;
    }

    // Check if the artist image exists
    if (!fs.existsSync(artistImagePath)) {
        console.error(`Error: Artist image '${artistImagePath}' does not exist.`);
        return;
    }

    // Get list of MP3 files from the folder
    const mp3Files = fs.readdirSync(folderPath).filter(file => path.extname(file).toLowerCase() === '.mp3');

    if (mp3Files.length === 0) {
        console.error(`No MP3 files found in the folder '${folderPath}'`);
        return;
    }

    // Process each MP3 file
    mp3Files.forEach((mp3File) => {
        const mp3FilePath = path.join(folderPath, mp3File);
        addAlbumArtToMp3(mp3FilePath, artistImagePath);
    });
}

// Example usage: Get folder and image from user
const mp3FolderPath = path.resolve(process.argv[2]); // Folder path containing MP3 files
const artistImagePath = path.resolve(process.argv[3]); // Path to the artist image (PNG)

if (!mp3FolderPath || !artistImagePath) {
    console.error('Please provide the folder path with MP3 files and the artist image path as arguments.');
    console.error('Usage: node addAlbumArt.js <MP3_FOLDER_PATH> <ARTIST_IMAGE_PATH>');
    process.exit(1);
}

// Process the MP3 files
processMp3Files(mp3FolderPath, artistImagePath);
