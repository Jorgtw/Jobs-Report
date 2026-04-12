import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add import
const importTarget = "import CommunicationsHub from './components/CommunicationsHub';";
const importReplacement = "import CommunicationsHub from './components/CommunicationsHub';\nimport HelpView from './pages/HelpView';";
content = content.replace(importTarget, importReplacement);

// Remove ArticleCard and HelpView
// We search for the start of ArticleCard and the end of HelpView closing brace
const articleCardStart = "const ArticleCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }>";
const helpViewEnd = "              <X size={24} className=\"text-slate-600 group-hover:text-slate-900\" />\n            </button>\n          </div>\n          \n          <div className=\"flex-1 overflow-y-auto w-full max-w-5xl mx-auto md:px-10 py-10\" id=\"manual-container\">\n            <div \n              id=\"manual-inner-container\"\n              className=\"prose prose-slate max-w-none px-6 md:px-0\"\n              dangerouslySetInnerHTML={{ __html: manualHtml }} \n              onClick={handleManualClick}\n            />\n          </div>\n        </div>\n      )}\n    </div>\n  );\n};";

// Since it's a huge block, we'll try to find the start and end and slice them out
const startIndex = content.indexOf(articleCardStart);
const endIndex = content.indexOf(helpViewEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const totalEndIndex = endIndex + helpViewEnd.length;
    content = content.slice(0, startIndex) + content.slice(totalEndIndex);
} else {
    console.error("Could not find ArticleCard or HelpView block");
    process.exit(1);
}

// Update Route
const routeTarget = "<Route path=\"/help\" element={<HelpView user={user} isMobile={isMobile} />} />";
const routeReplacement = "<Route path=\"/help\" element={<HelpView user={user} isMobile={isMobile} t={t} />} />";
content = content.replace(routeTarget, routeReplacement);

fs.writeFileSync(filePath, content);
console.log("App.tsx updated successfully");
