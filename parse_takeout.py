import os, json, glob, re

DOWNLOADS = r"C:\Users\meeran\Downloads"
SUMMARY_FILE = r"k:\antigravity\takeout_summary.md"

def find_dirs():
    dirs = glob.glob(os.path.join(DOWNLOADS, "takeout-*", "Takeout"))
    return dirs

def parse():
    dirs = find_dirs()
    if not dirs: return "No takeout dirs found."
    
    keep_data, tasks_data, yt_data = [], [], []
    
    for d in dirs:
        # Keep
        for f in glob.glob(os.path.join(d, "Keep", "*.json")):
            try:
                with open(f, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                    if data.get('title') or data.get('textContent'):
                        keep_data.append(f"### {data.get('title', '')}\n{data.get('textContent', '')}\n")
            except: pass
            
        # Tasks
        tf = os.path.join(d, "Tasks", "Tasks.json")
        if os.path.exists(tf):
            try:
                with open(tf, 'r', encoding='utf-8') as file:
                    for item in json.load(file).get('items', []):
                        if item.get('title'): tasks_data.append(f"- [{item.get('status', '')}] {item.get('title')}")
            except: pass
            
        # YouTube
        yf = os.path.join(d, "YouTube and YouTube Music", "history", "watch-history.html")
        if os.path.exists(yf):
            try:
                with open(yf, 'r', encoding='utf-8') as file:
                    content = file.read()
                    matches = re.findall(r'<a href="https://www.youtube.com/watch\?v=[^>]+>([^<]+)</a>', content)
                    seen = set()
                    for m in matches:
                        if m not in seen and "music" not in m.lower():
                            seen.add(m)
                            yt_data.append(f"- {m}")
                            if len(yt_data) > 100: break
            except: pass

    with open(SUMMARY_FILE, 'w', encoding='utf-8') as f:
        f.write("# Google Takeout Summary\n\n## Keep Notes\n")
        f.writelines(keep_data)
        f.write("\n## Tasks\n")
        f.write('\n'.join(tasks_data))
        f.write("\n## YouTube History (Recent 100, No Music)\n")
        f.write('\n'.join(yt_data))

    return f"Done! Written to {SUMMARY_FILE}"

if __name__ == "__main__":
    print(parse())
