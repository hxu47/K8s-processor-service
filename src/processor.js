const express = require('express');
const fs = require('fs').promises;
const { parse } = require('csv-parse/sync');

const app = express();
app.use(express.json());

// Default to port 3000 if not specified
const PORT = process.env.PORT || 3000;

// The mounted persistent volume will be at this path
// Update this path later to match your Kubernetes setup
const DATA_DIR = '/huidong_PV_dir'; // Replace 'your_name' with your first name

app.post('/process', async (req, res) => {
    const {file, product} = req.body;
    try {
        // Read and parse the CSV file
        const fileContent = await fs.readFile(`${DATA_DIR}/${file}`, 'utf8');
        const records = parse(fileContent, {
            columns: true, // Use first row as headers
            skip_empty_lines: true,
            trim: true     // Trim whitespace from values
        });

        // Validate CSV format
        if (!records.length || !records[0].hasOwnProperty('product') || !records[0].hasOwnProperty('amount')) {
            return res.json({
                file: file,
                error: "Input file not in CSV format."
            });
        };

        // Calculate sum for the specified product
        const sum = records
            .filter(record => record.product === product)
            .reduce((acc, record) => acc + parseInt(record.amount), 0);

        // Return the result
        return res.json({
            file: file, 
            sum: sum
        });
    } catch (error) {
        console.error('Error processing file:', error);
        // Any parsing error indicates incorrect CSV format
        return res.json({
            file: file,
            error: "Input file not in CSV format."
        });
    }
});

// Health check endpoint for Kubernetes
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Processor service listening on port ${PORT}`);
    console.log(`Using data directory: ${DATA_DIR}`);
});