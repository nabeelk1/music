const fs = require('fs');
const path = require('path');
const NodeID3 = require('node-id3');
const sharp = require('sharp');
const csv = require('csv-parser');

// Function to resize and center crop the image to 300x300 pixels
async function resizeImage(imageFile) {
    try {
        const resizedImageBuffer = await sharp(imageFile)
            .resize(300, 300, {
                fit: sharp.fit.cover,  // Crop to center and ensure dimensions are exactly 300x300
                position: sharp.strategy.entropy,  // Focus on the most "interesting" part of the image
            })
            .toBuffer();

        return resizedImageBuffer;
    } catch (error) {
        console.error(`Error resizing image: ${error.message}`);
        throw error;
    }
}

// Function to add album art to MP3 files
async function addAlbumArtToMp3(mp3File, imageFile) {
    try {
        // Resize the image to standard 300x300 dimensions
        const resizedImageData = await resizeImage(imageFile);

        // Define ID3 tag updates including resized image
        const tags = {
            APIC: {
                mime: "image/png", // You can also use 'image/jpeg' if your image is a jpeg
                type: 3,           // 3 is for album cover (front)
                description: "Cover",
                imageBuffer: resizedImageData,
            },
        };

        // Add the album art to the MP3 file
        const success = NodeID3.update(tags, mp3File);

        if (success) {
            console.log(`Successfully added album art to '${path.basename(mp3File)}'`);
        } else {
            console.error(`Error adding album art to '${path.basename(mp3File)}'`);
        }
    } catch (error) {
        console.error(`Error processing file '${path.basename(mp3File)}': ${error.message}`);
    }
}

// Function to process all rows in the CSV file
function processCsvFile(csvFilePath) {
    // Check if the CSV file exists
    if (!fs.existsSync(csvFilePath)) {
        console.error(`Error: CSV file '${csvFilePath}' does not exist.`);
        return;
    }

    // Read the CSV file
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', async (row) => {
            const albumFolder = row.Album;
            const artistImage = row.Art;

            // Process each MP3 file in the album folder
            if (fs.existsSync(albumFolder) && fs.existsSync(artistImage)) {
                const mp3Files = fs.readdirSync(albumFolder).filter(file => path.extname(file).toLowerCase() === '.mp3');

                for (const mp3File of mp3Files) {
                    const mp3FilePath = path.join(albumFolder, mp3File);
                    await addAlbumArtToMp3(mp3FilePath, artistImage);
                }
            } else {
                console.error(`Error: Album folder '${albumFolder}' or image '${artistImage}' does not exist.`);
            }
        })
        .on('end', () => {
            console.log('CSV file processing completed.');
        });
}

// Example usage: Get CSV file path from user
const csvFilePath = path.resolve(process.argv[2]); // Path to the CSV file

if (!csvFilePath) {
    console.error('Please provide the CSV file path as an argument.');
    console.error('Usage: node addAlbumArt.js <CSV_FILE_PATH>');
    process.exit(1);
}

// Process the CSV file
processCsvFile(csvFilePath);
