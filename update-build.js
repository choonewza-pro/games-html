const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  // Get commit count (add 1 because this runs before the new commit is created in pre-commit hook)
  let commitCount = 0;
  try {
    commitCount = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10);
  } catch (e) {
    // Fallback if git is not initialized or has no commits yet
    commitCount = 0;
  }
  
  // We add +1 because this script is run in the pre-commit hook, 
  // so the commit we are about to make will be the next one.
  const nextCommitCount = commitCount + 1;

  // Get short commit SHA of the current HEAD
  let commitHash = 'dev';
  try {
    commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {}

  // Format date: YYYYMMDD
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const formattedDate = `${yyyy}${mm}${dd}`;

  const buildVersion = `v1.0.${nextCommitCount}-${formattedDate} (${commitHash})`;
  
  const htmlPath = path.join(__dirname, 'games', 'ar-balloon-brust-game', 'index.html');
  if (fs.existsSync(htmlPath)) {
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Replace the build number in <p id="build-version" ...>Build: ...</p>
    const regex = /(id="build-version"[^>]*>)[^<]*/g;
    htmlContent = htmlContent.replace(regex, `$1Build: ${buildVersion}`);
    
    // Auto-update script tags with cache-busting version query parameter (?v=nextCommitCount)
    const scriptRegex = /(src="js\/[^"?]+)(\?v=[^"]*)?(")/g;
    htmlContent = htmlContent.replace(scriptRegex, `$1?v=${nextCommitCount}$3`);
    
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log(`[Build System] Updated build version to: ${buildVersion} and applied cache-busting to script tags`);
  } else {
    console.error(`[Build System] File not found: ${htmlPath}`);
  }
} catch (error) {
  console.error('[Build System] Error updating build version:', error.message);
}
