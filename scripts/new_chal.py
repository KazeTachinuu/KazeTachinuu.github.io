import json
import argparse


def get_valid_input(prompt, validation_func, error_message):
    while True:
        user_input = input(prompt).strip()
        if validation_func(user_input):
            return user_input
        else:
            print(error_message)


def get_challenge_name():
    return get_valid_input(
        "Name of the challenge: ", lambda x: len(x) > 0, "Name cannot be empty."
    )


def get_challenge_value():
    return int(
        get_valid_input(
            "Value of the challenge: ",
            lambda x: x.isdigit() and int(x) > 0,
            "Value must be a positive integer.",
        )
    )


def get_challenge_solves():
    return int(
        get_valid_input(
            "Number of solves for the challenge: ",
            lambda x: x.isdigit() and int(x) >= 0,
            "Number of solves must be a non-negative integer.",
        )
    )


def get_solved_by_me():
    solved_input = input("Have you solved this challenge? (Y/n): ").strip().lower()
    return solved_input in {"yes", "y", ""}


def get_flag():
    return input("Enter the flag for the challenge: ").strip()


def get_category():
    return get_valid_input(
        "Category of the challenge: ", lambda x: len(x) > 0, "Category cannot be empty."
    )


def reset_data():
    ctf_name = get_valid_input(
        "Enter the name of the CTF: ",
        lambda x: len(x) > 0,
        "CTF name cannot be empty.",
    )
    ctf_year = int(
        get_valid_input(
            "Enter the Year for the CTF: ",
            lambda x: x.isdigit() and int(x) >= 0,
            "Year must be a non-negative integer.",
        )
    )
    return {"CTF": ctf_name, "year": ctf_year, "data": []}


def main():
    parser = argparse.ArgumentParser(description="Add challenges to data.json")
    parser.add_argument("-n", "--new", action="store_true", help="Reset data.json")
    args = parser.parse_args()

    if args.new:
        data = reset_data()
    else:
        try:
            with open("data.json", "r") as file:
                data = json.load(file)
        except FileNotFoundError:
            data = reset_data()

    challenges = data["data"]

    print(f"Writing up new challenges for {data['CTF']} {data['year']}")

    while True:
        choice = input("Do you want to add a new challenge? (Y/n): ").strip().lower()
        if choice in {"yes", "y", ""}:
            add_challenge(challenges)
        else:
            break

    with open("data.json", "w") as file:
        json.dump(data, file, indent=2)

    print("Challenges added successfully.")


def add_challenge(challenges):
    print("Enter the details for the new challenge:")
    name = get_challenge_name()
    value = get_challenge_value()
    solves = get_challenge_solves()
    solved_by_me = get_solved_by_me()
    flag = get_flag() if solved_by_me else ""
    category = get_category()

    challenges.append(
        {
            "name": name,
            "value": value,
            "solves": solves,
            "solved_by_me": solved_by_me,
            "flag": flag,
            "category": category,
        }
    )


if __name__ == "__main__":
    main()
