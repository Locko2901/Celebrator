const fs = require('fs');
const path = require('path');

function loadConfig() {
    try {
        const configPath = path.join(__dirname, '..', '..', 'config.json');
        const rawData = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(rawData);
        console.log(`Loaded config: ${JSON.stringify(config)}`);
        return config;
    } catch (error) {
        console.error('Failed to load or parse the config.json file.', error);
        process.exit(1);
    }
}

module.exports = { loadConfig };