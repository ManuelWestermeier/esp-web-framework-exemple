const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");

// Define directories
const frontendDir = "./frontend";
const frontendOutDir = "./frontend-out";
const includeFile = path.join(frontendOutDir, "include.hpp");

// Ensure the ./frontend directory exists
if (!fs.existsSync(frontendDir)) {
  fs.mkdirSync(frontendDir, { recursive: true });
}

// Ensure the ./frontend-out directory exists
if (!fs.existsSync(frontendOutDir)) {
  fs.mkdirSync(frontendOutDir, { recursive: true });
}

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

// Function to format filename to C++ naming convention
function formatCppName(filePath) {
  const extName = path.extname(filePath).slice(1).toUpperCase(); // Get the extension name without the dot
  const baseName = path
    .basename(filePath, path.extname(filePath))
    .toUpperCase(); // Get the base name without extension

  return baseName + `_${extName}`; // Combine base name and extension
}

// Function to compile a file to .cpp with placeholders as function parameters
function compileToCpp(filePath) {
  const cppName = formatCppName(filePath);
  const outputPath = path.join(frontendOutDir, `${cppName}.cpp`); // Output file named using cppName

  // Ensure the output directory exists, preserving the structure
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read file content
  let content = fs.readFileSync(filePath, "utf-8");

  // Find all placeholders in the format ##name##
  const placeholders = [
    ...new Set([...content.matchAll(/##(\w+)##/g)].map((match) => match[1])),
  ];

  // Generate C++ code for the function
  let cppContent = `#ifndef ${cppName}
#define ${cppName}
  
String frontend::${cppName}(${placeholders
    .map((p) => `const String& ${p}`)
    .join(", ")}) {
  return String("${escapeString(content).replace(/##(\w+)##/g, '" + $1 + "')}");
}
    
#endif`;

  // Write the .cpp file if it does not already exist
  fs.writeFileSync(outputPath, cppContent);
  console.log(
    `Compiled ${filePath} to ${outputPath} with embedded parameters.`
  );

  // Update the include.hpp file
  updateIncludeFile(cppName);
}

// Function to update include.hpp
function updateIncludeFile(cppName) {
  const includeStatement = `#include "${cppName}.cpp"`;

  // If include.hpp does not exist, create it
  if (!fs.existsSync(includeFile)) {
    fs.writeFileSync(includeFile, `// Auto-generated include file\n`);
  }

  // Check if the include statement already exists
  let includes = fs.readFileSync(includeFile, "utf-8");
  if (!includes.includes(includeStatement)) {
    // Append the include statement to the include file
    fs.appendFileSync(includeFile, `${includeStatement}\n`);
    console.log(`Updated ${includeFile} with ${includeStatement}`);
  }
}

// Function to initialize and compile all files in the frontend directory recursively
function initializeAndCompileAllFiles(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      initializeAndCompileAllFiles(fullPath); // Recurse into subdirectory
    } else {
      compileToCpp(fullPath); // Compile the file
    }
  });
}

// Initialize and compile all files on startup
initializeAndCompileAllFiles(frontendDir);

// Watch ./frontend recursively for changes
chokidar
  .watch(frontendDir, { ignoreInitial: true })
  .on("add", compileToCpp)
  .on("change", compileToCpp)
  .on("unlink", (filePath) => {
    const cppName = formatCppName(filePath);
    const outputPath = path.join(frontendOutDir, `${cppName}.cpp`);
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
      console.log(`Deleted ${outputPath}`);
      updateIncludeFile(cppName);
    }
  });

// Output the namespace block in include.hpp file
function wrapIncludeWithNamespace() {
  let includes = fs.readFileSync(includeFile, "utf-8");
  if (!includes.includes("namespace frontend {")) {
    includes = `namespace frontend {\n` + includes + `}\n`;
    fs.writeFileSync(includeFile, includes);
    console.log(`Wrapped ${includeFile} with namespace frontend.`);
  }
}

// Initialize and wrap include file with namespace
wrapIncludeWithNamespace();

console.log("Watching for file changes in ./frontend...");
