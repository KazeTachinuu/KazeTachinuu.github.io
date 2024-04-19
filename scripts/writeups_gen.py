import json
import os
from urllib.parse import unquote
from datetime import datetime, timedelta


def load_data(file_path):
    with open(file_path, "r") as file:
        data = json.load(file)
    return data


def load_template(template_path):
    with open(template_path, "r") as file:
        template = file.read()
    return template


def create_challenge_files(challenge, template, ctf_name, year):
    name_decoded = unquote(challenge["name"])
    name_with_dash = name_decoded.lower().replace(" ", "-")
    challenge_file_path = os.path.join(
        "content",
        "writeups",
        ctf_name,
        str(year),
        challenge["category"].lower().replace(" ", "-"),
        f"{name_with_dash}.md",
    )
    solved_by_me = challenge["solved_by_me"]

    content = template.format(
        solved_by_me=solved_by_me,
        challenge_title=name_decoded,
        points_value=challenge["value"],
        number_of_solves=challenge["solves"],
        current_date=(datetime.now() - timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")
,
        flag=challenge["flag"],
    )

    with open(challenge_file_path, "w") as f:
        f.write(content)


def create_category_index(category, challenges, ctf_name, year):
    category_dir = os.path.join(
        "content", "writeups", ctf_name, str(year), category.lower().replace(" ", "-")
    )
    os.makedirs(category_dir, exist_ok=True)

    with open(os.path.join(category_dir, "_index.md"), "w") as index_file:
        index_file.write(f"---\n")
        index_file.write(f'title: "{category.capitalize()}"\n')
        index_file.write(f"type: categories\n")  # Add type information
        index_file.write(f"---\n\n")
        index_file.write(f"List of challenges in the {category} category:\n\n")
        for challenge in challenges:
            name_decoded = unquote(challenge["name"])
            name_with_dash = name_decoded.lower().replace(" ", "-")
            index_file.write(
                f"- [{name_decoded}]({category.lower().replace(' ', '-')}/{name_with_dash}/) - Solves: {challenge['solves']}\n"
            )


def generate_writeup(data, year):
    categories = {}
    ctf_name = data.get(
        "CTF", "UnknownCTF"
    )  # Default to "UnknownCTF" if "CTF" field is missing
    template = load_template("layouts/_default/template.md")

    for challenge in data["data"]:
        category = challenge["category"]
        if category not in categories:
            categories[category] = []
        categories[category].append(challenge)

    for category, challenges in categories.items():
        create_category_index(category, challenges, ctf_name, year)
        for challenge in challenges:
            create_challenge_files(challenge, template, ctf_name, year)

    create_year_index(categories, ctf_name, year)

    create_ctf_index(ctf_name)  # Create the CTF index


def create_year_index(categories, ctf_name, year):
    with open(
        os.path.join("content", "writeups", ctf_name, str(year), "_index.md"), "w"
    ) as year_index_file:
        year_index_file.write(f"---\n")
        year_index_file.write(f'title: "{ctf_name} {year}"\n')
        year_index_file.write(f"type: year\n")  # Add type information
        year_index_file.write(f"---\n\n")

        for category, challenges in categories.items():
            year_index_file.write(f"## {category.capitalize()}\n\n")
            for challenge in challenges:
                name_decoded = unquote(challenge["name"])
                name_with_dash = name_decoded.lower().replace(" ", "-")
                year_index_file.write(
                    f"- [{name_decoded}]({category.lower().replace(' ', '-')}/{name_with_dash}/) ({challenge['value']} points) - Solved: {'✔' if challenge['solved_by_me'] else '❌'} - Solves: {challenge['solves']}\n\n"
                )


def create_ctf_index(ctf_name):
    ctf_index_path = os.path.join("content", "writeups", ctf_name, "_index.md")
    with open(ctf_index_path, "w") as ctf_index_file:
        ctf_index_file.write(f"---\n")
        ctf_index_file.write(f"title: {ctf_name}\n")
        ctf_index_file.write(f"type: ctf\n")  # Add type information
        ctf_index_file.write(f"---\n\n")


def main():
    data = load_data("data.json")
    year = data.get("year", datetime.now().year)
    generate_writeup(data, year)

    print("Writeup directory structure created successfully.")


if __name__ == "__main__":
    main()
