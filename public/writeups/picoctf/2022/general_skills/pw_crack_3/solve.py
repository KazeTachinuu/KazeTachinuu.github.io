import hashlib


### THIS FUNCTION WILL NOT HELP YOU FIND THE FLAG --LT ########################
def str_xor(secret, key):
    # extend key to secret length
    new_key = key
    i = 0
    while len(new_key) < len(secret):
        new_key = new_key + key[i]
        i = (i + 1) % len(key)
    return "".join(
        [
            chr(ord(secret_c) ^ ord(new_key_c))
            for (secret_c, new_key_c) in zip(secret, new_key)
        ]
    )


###############################################################################

flag_enc = open("level3.flag.txt.enc", "rb").read()
correct_pw_hash = open("level3.hash.bin", "rb").read()


def hash_pw(pw_str):
    pw_bytes = bytearray()
    pw_bytes.extend(pw_str.encode())
    m = hashlib.md5()
    m.update(pw_bytes)
    return m.digest()


def main():
    pos_pw_list = ["6997", "3ac8", "f0ac", "4b17", "ec27", "4e66", "865e"]

    i = 0
    n = len(pos_pw_list)

    print("Trying to match each password with provided hash")
    hashed_pw = hash_pw(pos_pw_list[i])
    while i < n and hashed_pw != correct_pw_hash:
        print(f"{i+1}/{n} - {pos_pw_list[i]} {hashed_pw} != {correct_pw_hash}")
        i += 1
        hashed_pw = hash_pw(pos_pw_list[i])

    if i < n:
        print("Password Matching Hash found ! : " + pos_pw_list[i])
        decryption = str_xor(flag_enc.decode(), pos_pw_list[i])
        print(decryption)

    else:
        print("No password in the list matched the hash")


if __name__ == "__main__":
    main()
