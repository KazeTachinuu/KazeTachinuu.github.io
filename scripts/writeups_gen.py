import os
import json
import argparse
from urllib.parse import unquote
from datetime import datetime, timedelta
import re

def parse_writeup(writeup):
    lines = writeup.split("\n")
    challenge_info = {}

    for line in lines:
        if "**Category:**" in line:
            category_match = re.search(r"\*\*Category:\*\* (.+?) - \*\*Points:\*\* (\d+) - \*\*Solves:\*\* (\d+)", line)
            if category_match:
                challenge_info["category"] = category_match.group(1).strip()
                challenge_info["value"] = int(category_match.group(2).strip())
                challenge_info["solves"] = int(category_match.group(3).strip())
        elif "###" in line:
            challenge_info["name"] = line.split("### ")[1].strip()

    return challenge_info

def create_challenge_file(challenge_info, ctf_name, year, writeup_content):
    name = challenge_info["name"]
    category = challenge_info["category"]
    value = challenge_info["value"]
    solves = challenge_info["solves"]

    # Prepare directory path
    ctf_dir = os.path.join("content", "writeups", ctf_name.replace(" ", "_"))
    os.makedirs(ctf_dir, exist_ok=True)

    # Create or update _index.md in CTF directory
    ctf_index_path = os.path.join(ctf_dir, "_index.md")
    if not os.path.exists(ctf_index_path):
        with open(ctf_index_path, "w") as index_file:
            index_file.write(f"---\n")
            index_file.write(f"title: {ctf_name}\n")
            index_file.write(f"type: ctf\n")
            index_file.write(f"draft: false\n")
            index_file.write(f"---\n\n")

    # Prepare category directory path
    category_dir = os.path.join(ctf_dir, str(year), category.lower().replace(" ", "_"))
    os.makedirs(category_dir, exist_ok=True)

    # Prepare file path
    file_name = name.lower().replace(" ", "_") + ".md"
    file_path = os.path.join(category_dir, file_name)

    # Prepare frontmatter
    frontmatter = f"""---
title: "{name}"
type: "chal"
solved: true
points: {value}
solves: {solves}
date: {(datetime.now() - timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")}
draft: false
---\n\n"""

    # Write frontmatter and writeup content to file
    with open(file_path, "w") as f:
        f.write(frontmatter)
        f.write(writeup_content)

    print(f"Challenge file created: {file_path}")

def create_year_index(ctf_name, year):
    # Prepare directory path
    year_dir = os.path.join("content", "writeups", ctf_name.replace(" ", "_"), str(year))
    os.makedirs(year_dir, exist_ok=True)

    # Prepare file path
    year_index_path = os.path.join(year_dir, "_index.md")

    # Prepare frontmatter
    frontmatter = f"""---
title: "{ctf_name} {year}"
type: year
draft: false
---\n"""

    # Write frontmatter to file
    with open(year_index_path, "w") as f:
        f.write(frontmatter)

    print(f"Year index file created: {year_index_path}")

def main():
    parser = argparse.ArgumentParser(description="Generate challenge writeup file.")
    parser.add_argument("-n", "--name", type=str, help="Name of the CTF")
    parser.add_argument("-y", "--year", type=int, help="Year of the CTF")
    parser.add_argument("file", type=str, help="Path to the challenge writeup file")
    args = parser.parse_args()

    # Get CTF name
    ctf_name = args.name or input("Enter the CTF name: ")
    ctf_name = ctf_name.strip()

    # Get year
    year = args.year or int(input("Enter the year: "))

    # Load challenge data
    with open(args.file, "r") as file:
        writeup_content = file.read()

    # Parse writeup to JSON
    challenge_info = parse_writeup(writeup_content)

    # Create challenge file
    create_challenge_file(challenge_info, ctf_name, year, writeup_content)

    # Create year index file
    create_year_index(ctf_name, year)

if __name__ == "__main__":
    main()
