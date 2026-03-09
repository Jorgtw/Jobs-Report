const fs = require('fs');
const path = require('path');

const manualMdPath = 'c:/Users/jtw/Euro JTW/Archivi/JTW/Programmi/jobs-report-complete/manuale_uso.md';
const outputHtmlPath = 'c:/Users/jtw/Euro JTW/Archivi/JTW/Programmi/jobs-report-complete/MANUALE_JOBS_REPORT.html';

const mdContent = fs.readFileSync(manualMdPath, 'utf-8');

function imageToBase64(filePath) {
    try {
        console.log('Processing image:', filePath);
        let absolutePath = decodeURIComponent(filePath.replace('file:///', ''));
        if (absolutePath.startsWith('/') && absolutePath.charAt(2) === ':') {
            absolutePath = absolutePath.substring(1);
        }
        console.log('Resolved path:', absolutePath);
        const bitmap = fs.readFileSync(absolutePath);
        return 'data:image/png;base64,' + Buffer.from(bitmap).toString('base64');
    } catch (e) {
        console.error('Error reading image:', filePath, e.message);
        return '';
    }
}

let htmlContent = mdContent
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
        const b64 = imageToBase64(src);
        return `<div class="img-container"><img alt="${alt}" src="${b64}"><p class="caption">${alt}</p></div>`;
    })
    .replace(/\n---\n/g, '<hr>')
    .replace(/\n\n/g, '<p></p>')
    .replace(/#### (.*)$/gm, '<h4>$1</h4>');

// Wrap lists
htmlContent = htmlContent.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

const finalHtml = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manuale Utente Jobs Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #f4f7f9;
        }
        h1 { color: #1a56db; text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1a56db; padding-bottom: 10px; }
        h2 { color: #1e429f; margin-top: 50px; border-left: 5px solid #1e429f; padding-left: 15px; }
        h3 { color: #233876; margin-top: 30px; }
        p { margin-bottom: 20px; }
        .img-container {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin: 30px 0;
            text-align: center;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        .caption {
            font-size: 0.9em;
            color: #666;
            margin-top: 10px;
            font-style: italic;
        }
        hr { border: 0; height: 1px; background: #ccc; margin: 40px 0; }
        ul { margin-bottom: 20px; }
        li { margin-bottom: 10px; }
        .footer { text-align: center; font-size: 0.8em; color: #888; margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://jobs-report.vercel.app/logo.png" style="width: 80px; display: block; margin: 0 auto 20px; border: none; box-shadow: none;" onerror="this.style.display='none'">
    </div>
    ${htmlContent}
    <div class="footer">
        &copy; 2026 Jobs Report App - Tutti i diritti riservati
    </div>
</body>
</html>
`;

fs.writeFileSync(outputHtmlPath, finalHtml);
console.log('Standalone HTML generated successfully at:', outputHtmlPath);
