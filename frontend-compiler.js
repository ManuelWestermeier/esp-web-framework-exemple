const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");

// Define directories
const frontendDir = "./frontend";
const frontendOutDir = "./frontend-out";
const includeFile = path.join(frontendOutDir, "include.hpp");

// Function to escape content for C++ string format
function escapeString(content) {
  return content
    .replace(/\\/g, "\\\\") // Escape backslashes
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, "\\n") // Escape newlines
    .replace(/\t/g, "\\t") // Escape tabs
    .replace(/\r/g, "\\r") // Escape carriage returns
    .replace(/'/g, "\\'"); // Escape single quotes (optional)
}

var functionNames = [];

function compileDir(pathName) {
  fs.readdirSync(pathName).forEach((file) => {
    const filePath = path.join(pathName, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) return compileDir(filePath);

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const filePathCppName = filePath
      .replace(frontendDir, "")
      .replace(/[./\\]/g, "_")
      .toUpperCase()
      .replace("FRONTEND_", "");

    const outputPath = path.join(frontendOutDir, filePathCppName + ".cpp");

    const fileParts = fileContent.split(/(?<!\\)##/);
    const fnArguments = fileParts
      .filter((v, i) => {
        return i % 2 === 1;
      })
      .map((arg) => `const String& ${arg}`)
      .join(", ");

    const fnCreationCode = fileParts
      .map((v, i) => {
        if (i % 2 === 1) return v;
        return `String("${escapeString(v)}")`;
      })
      .join(" + ");

    const functionName = `String frontend::${filePathCppName}(${fnArguments})`;
    functionNames.push(functionName);

    fs.writeFileSync(
      outputPath,
      `#ifndef FILE_${filePathCppName}
#define FILE_${filePathCppName}

${functionName} {
    return ${fnCreationCode};
}

#endif // FILE_${filePathCppName}`,
      "utf-8"
    );
  });
}

function killDir(pathName) {
  fs.readdirSync(pathName).forEach((file) => {
    const filePath = path.join(pathName, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) return killDir(filePath);
    fs.unlinkSync(filePath);
  });
  fs.rmdirSync(pathName);
}

function cleanUpDir(pathName) {
  if (fs.existsSync(pathName))
    fs.readdirSync(pathName).forEach((file) => {
      const filePath = path.join(pathName, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) return killDir(filePath);
      fs.unlinkSync(filePath);
    });
}

function compileAll(_) {
  functionNames = [];
  // Ensure the ./frontend directory exists
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  //cleanup
  cleanUpDir(frontendOutDir);

  compileDir(frontendDir);

  const outputFiles = fs.readdirSync(frontendOutDir);

  fs.writeFileSync(
    includeFile,
    `#ifndef FRONTEND_INCLUDEFILE
#define FRONTEND_INCLUDEFILE
#include <Arduino.h>

namespace frontend {
  ${functionNames
    .map((fnName) => fnName.replace("frontend::", ""))
    .join(";\n  ")};
}

${outputFiles.map((filePath) => `#include "./${filePath}"`).join("\n")}
#endif //FRONTEND_INCLUDEFILE`
  );
}

// Watch ./frontend recursively for changes
chokidar
  .watch(frontendDir, { ignoreInitial: true })
  .on("add", compileAll)
  .on("change", compileAll)
  .on("unlink", compileAll);

compileAll();
console.log("Watching for file changes in ./frontend...");
