import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("import HelpView")) {
    content = content.replace("import CommunicationsHub from './components/CommunicationsHub';", 
        "import CommunicationsHub from './components/CommunicationsHub';\nimport HelpView from './pages/HelpView';");
}

// 2. Remove the block using a regex to handle whitespace/CRLF
const blockRegex = /const ArticleCard: React\.FC<\{ title: string; children: React\.ReactNode; icon: React\.ReactNode \}>[\s\S]*?\n\};(?=\s*\n\s*\/\/ --- Personnel View ---)/;

if (blockRegex.test(content)) {
    content = content.replace(blockRegex, "");
} else {
    console.error("Could not find the ArticleCard/HelpView block with regex");
    // Let's try to find just a part of it to debug
    console.log("Snippet match check:", content.includes("const ArticleCard"));
    process.exit(1);
}

// 3. Update Route
const routeTarget = /<Route path="\/help" element=\{<HelpView user=\{user\} isMobile=\{isMobile\} \/>\} \/>/;
const routeReplacement = '<Route path="/help" element={<HelpView user={user} isMobile={isMobile} t={t} />} />';
content = content.replace(routeTarget, routeReplacement);

fs.writeFileSync(filePath, content);
console.log("App.tsx updated successfully");
