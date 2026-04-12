import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("import ProfileView")) {
    content = content.replace("import HelpView from './pages/HelpView';", 
        "import HelpView from './pages/HelpView';\nimport ProfileView from './pages/ProfileView';");
}

// 2. Remove the block using a regex
// The block starts with const ProfileView: React.FC<{ user: User, onUpdate?: (u: User) => void }> = ({ user, onUpdate }) => {
// and ends with }; before the next comment or component
const blockRegex = /const ProfileView: React\.FC<\{ user: User, onUpdate\?: \(u: User\) => void \}>[\s\S]*?\n\};(?=\s*\n\s*\/\/)/;

if (blockRegex.test(content)) {
    content = content.replace(blockRegex, "");
} else {
    // Try a simpler match if the first one fails
    const secondTry = /const ProfileView: React\.FC<\{ user: User, onUpdate\?: \(u: User\) => void \}>[\s\S]*?\n\};/;
    if (secondTry.test(content)) {
        content = content.replace(secondTry, "");
    } else {
        console.error("Could not find the ProfileView block");
        process.exit(1);
    }
}

// 3. Update Route
const routeTarget = /<Route path="\/profile" element=\{<ProfileView user=\{user\} onUpdate=\{\(updated\) => \{ setUser\(updated\); localStorage\.setItem\('ws_auth', JSON\.stringify\(updated\)\); \} \} \/>\} \/>/;
const routeReplacement = '<Route path="/profile" element={<ProfileView user={user} onUpdate={(updated) => { setUser(updated); localStorage.setItem(\'ws_auth\', JSON.stringify(updated)); }} t={t} />} />';

if (content.match(routeTarget)) {
    content = content.replace(routeTarget, routeReplacement);
} else {
    // Try literal match without regex escape if above fails
    const literalTarget = `<Route path="/profile" element={<ProfileView user={user} onUpdate={(updated) => { setUser(updated); localStorage.setItem('ws_auth', JSON.stringify(updated)); }} />} />`;
    if (content.includes(literalTarget)) {
        content = content.replace(literalTarget, routeReplacement);
    } else {
        console.log("Could not find Route path=\"/profile\" exactly. Check spacing.");
    }
}

fs.writeFileSync(filePath, content);
console.log("App.tsx updated successfully (ProfileView)");
