// main
const fs = require('fs');
const readline = require('readline');
const args = process.argv;

// files
const inputFileFolder = args[2];
const inputFile = inputFileFolder + args[3];
const outputFile = args[4];

// streams
const readableStream = fs.createReadStream(inputFile, 'utf-8');
const writableStream = fs.createWriteStream(outputFile);

// errors handling
readableStream.on('error', function (error) {
    console.log(`error: ${error.message}`);
})
writableStream.on('error', function (error) {
    console.log(`An error occured while writing to the file. Error: ${error.message}`);
});

async function getRequiredFileContent(file) {
    var fileContent = '';
    // read stream
    const readableStreamForRequired = fs.createReadStream(inputFileFolder + file, 'utf-8');
    const requiredRl = readline.createInterface({
        input: readableStreamForRequired
    });

    for await (const line of requiredRl) {
        var l = line;
        var br = false;
        if (line.includes('require')) {
            let start = line.indexOf('require') + 9;
            let requireFilePath = line.substring(start);
            let end = requireFilePath.indexOf(')')-1;
            requireFilePath = requireFilePath.substring(0, end);
            let requiredFileContent = await getRequiredFileContent(requireFilePath);
            l = line.replace('require(\'' + requireFilePath + '\');', requiredFileContent);
            br = true;
        }
        var lineToAdd = br ? l : l  + '\n';
        fileContent += lineToAdd;
    }
    
    return fileContent;
}

async function processLine(line) {
    var newLine = line;
    var br = false;
    if (line.includes('require')) {
        let start = line.indexOf('require') + 9;
        let requireFilePath = line.substring(start);
        let end = requireFilePath.indexOf(')')-1;
        requireFilePath = requireFilePath.substring(0, end);
        let requiredFileContent = await getRequiredFileContent(requireFilePath);
        newLine = line.replace('require(\'' + requireFilePath + '\');', requiredFileContent);
        br = true;
    }
    var lineToAdd = br ? newLine : newLine  + '\n';
    writableStream.write(lineToAdd);
}

async function processLineByLine() {
    const rl = readline.createInterface({
        input: readableStream
    });

    for await (const line of rl) {
        await processLine(line);
    }
}

processLineByLine();