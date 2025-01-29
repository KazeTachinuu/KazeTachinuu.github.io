---
title: "PW Crack 5"
cat: "chal"
solved: true
points: 100
solves: 24106
date: 2024-05-12T00:00:00Z
draft: false
---

### PW Crack 5   

**Category:** General Skills - **Points:** 100 - **Solves:** 24106   
**Description:**   
Can you crack the password to get the flag? Download the password checker here and you'll need the encrypted flag and the hash in the same directory too. Here's a dictionary with all possible passwords based on the password conventions we've seen so far.      

**Solution:**  
For the fift and final part of the PW Crack saga, we have yet again the same idea so our implementation will still work but we now need to think about how we display results, let's format the printed results so that we have a nice "animation" going on

Let's also modify a bit the code so that it will get the passwords from the txt file.

```python
content = open("dictionary.txt", "r").read()

pos_pw_list = content.split("\n")

i = 0
n = len(pos_pw_list)

print("Trying to match each password with provided hash")
hashed_pw = hash_pw(pos_pw_list[i])
while i < n and hashed_pw != correct_pw_hash:
    sys.stdout.write(
        f"\r{i+1}/{n} - {pos_pw_list[i]} {hashed_pw} != {correct_pw_hash}"
    )
    i += 1
    hashed_pw = hash_pw(pos_pw_list[i])
    
print()

if i < n:
    print("Password Matching Hash found ! : " + pos_pw_list[i])
    decryption = str_xor(flag_enc.decode(), pos_pw_list[i])
    print(decryption)

else:
    print("No password in the list matched the hash")
```
   
When we run it we get a nice one line that test every password hash:

```sh
>>> python solve.py
Trying to match each password with provided hash
38273/65537 - 9580 b'\x0c\xdb\xb4\xe6X\x15\xfb\xafyh\x9b\x15H.uu' != b'\x126P\xdd\x05`Xy\x18\xb3\xd7q\xcf\x0c\x01q'x0c\x01q'\x01q'1q'1q'
Password Matching Hash found ! : 9581
picoCTF{h45h_sl1ng1ng_36e992a6}
```

And just like that we are done with this series of challenges. Congrats. :)   

<details class="flag-container">
<summary>Flag</summary>
<pre><code>picoCTF{h45h_sl1ng1ng_36e992a6}</code></pre>
</details>