import os
import base64
import re
from urllib.parse import unquote

manual_md_path = r'c:\Users\jtw\Euro JTW\Archivi\JTW\Programmi\jobs-report-complete\manuale_uso.md'
output_html_path = r'c:\Users\jtw\Euro JTW\Archivi\JTW\Programmi\jobs-report-complete\MANUALE_JOBS_REPORT.html'

with open(manual_md_path, 'r', encoding='utf-8') as f:
    md_content = f.read()

def image_to_base64(file_url):
    try:
        path = unquote(file_url.replace('file:///', ''))
        if path.startswith('/') and path[2] == ':':
            path = path[1:]
        
        path = os.path.normpath(path)
        with open(path, 'rb') as f:
            encoded_string = base64.b64encode(f.read()).decode('utf-8')
            return f"data:image/png;base64,{encoded_string}"
    except Exception as e:
        print(f"Error processing {file_url}: {e}")
        return ""

def replace_image(match):
    alt = match.group(1)
    src = match.group(2)
    b64 = image_to_base64(src)
    return f'<div class="img-container"><img alt="{alt}" src="{b64}"><p class="caption">{alt}</p></div>'

# Basic MD to HTML conversion
html_content = md_content
html_content = re.sub(r'^# (.*)$', r'<h1>\1</h1>', html_content, flags=re.MULTILINE)
html_content = re.sub(r'^## (.*)$', r'<h2>\1</h2>', html_content, flags=re.MULTILINE)
html_content = re.sub(r'^### (.*)$', r'<h3>\1</h3>', html_content, flags=re.MULTILINE)
html_content = re.sub(r'^#### (.*)$', r'<h4>\1</h4>', html_content, flags=re.MULTILINE)
html_content = re.sub(r'^- (.*)$', r'<li>\1</li>', html_content, flags=re.MULTILINE)
html_content = re.sub(r'!\[(.*?)\]\((.*?)\)', replace_image, html_content)
html_content = html_content.replace('\n---\n', '<hr>')
html_content = html_content.replace('\n\n', '<p></p>')

# Basic list wrap
html_content = re.sub(r'(<li>.*?</li>)+', lambda m: f'<ul>{m.group(0)}</ul>', html_content, flags=re.DOTALL)

final_html = f"""
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manuale Utente Jobs Report</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #f4f7f9;
        }}
        h1 {{ color: #1a56db; text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1a56db; padding-bottom: 10px; }}
        h2 {{ color: #1e429f; margin-top: 50px; border-left: 5px solid #1e429f; padding-left: 15px; }}
        h3 {{ color: #233876; margin-top: 30px; }}
        p {{ margin-bottom: 20px; }}
        .img-container {{
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin: 30px 0;
            text-align: center;
        }}
        img {{
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            border: 1px solid #ddd;
        }}
        .caption {{
            font-size: 0.9em;
            color: #666;
            margin-top: 10px;
            font-style: italic;
        }}
        hr {{ border: 0; height: 1px; background: #ccc; margin: 40px 0; }}
        ul {{ margin-bottom: 20px; }}
        li {{ margin-bottom: 10px; }}
        .footer {{ text-align: center; font-size: 0.8em; color: #888; margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; }}
    </style>
</head>
<body>
    <div class="header">
        <img src="https://jobs-report.vercel.app/logo.png" style="width: 80px; display: block; margin: 0 auto 20px; border: none; box-shadow: none;" onerror="this.style.display='none'">
    </div>
    {html_content}
    <div class="footer">
        &copy; 2026 Jobs Report App - Tutti i diritti riservati
    </div>
</body>
</html>
"""

with open(output_html_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

print(f"Standalone HTML generated successfully at: {output_html_path}")
