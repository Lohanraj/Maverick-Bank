import os

def search_files(directory):
    keywords = ["sleep", "delay", "wait"]
    results = []
    for root, dirs, files in os.walk(directory):
        if "bin" in dirs:
            dirs.remove("bin")
        if "obj" in dirs:
            dirs.remove("obj")
        for file in files:
            if file.endswith(".cs"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    for line_num, line in enumerate(f, 1):
                        for kw in keywords:
                            if kw in line.lower() and not line.strip().startswith("//"):
                                results.append((filepath, line_num, line.strip()))
    return results

if __name__ == "__main__":
    res = search_files("c:\\Users\\lohan\\OneDrive\\Documents\\New folder\\MaverickBank\\Backend\\MaverickBank.API")
    for r in res:
        print(f"File: {r[0]} | Line: {r[1]} | Content: {r[2]}")
