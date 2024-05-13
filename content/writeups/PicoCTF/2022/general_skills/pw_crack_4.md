---
title: "PW Crack 4"
cat: "chal"
solved: true
points: 100
solves: 27962
date: 2024-05-12T00:00:00Z
draft: false
---

### PW Crack 4   
**Category:** General Skills - **Points:** 100 - **Solves:** 27962   
**Description:**   
Description
Can you crack the password to get the flag? Download the password checker here and you'll need the encrypted flag and the hash in the same directory too. There are 100 potential passwords with only 1 being correct. You can find these by examining the password checker script.   

**Solution:**  
This is basically the same challenge as the previous one only this time, it's not really convenient to test all password by hand

 Thankfully we already implemented an automatic test for the last challenge, let's simply change it a little to include all 100 passwords:

```python
pos_pw_list = ["6288", "6152", "4c7a", "b722", "9a6e", "6717", "4389", "1a28", "37ac", "de4f", "eb28", "351b", "3d58", "948b", "231b", "973a", "a087", "384a", "6d3c", "9065", "725c", "fd60", "4d4f", "6a60", "7213", "93e6", "8c54", "537d", "a1da", "c718", "9de8", "ebe3", "f1c5", "a0bf", "ccab", "4938", "8f97", "3327", "8029", "41f2", "a04f", "c7f9", "b453", "90a5", "25dc", "26b0", "cb42", "de89", "2451", "1dd3", "7f2c", "8919", "f3a9", "b88f", "eaa8", "776a", "6236", "98f5", "492b", "507d", "18e8", "cfb5", "76fd", "6017", "30de", "bbae", "354e", "4013", "3153", "e9cc", "cba9", "25ea", "c06c", "a166", "faf1", "2264", "2179", "cf30", "4b47", "3446", "b213", "88a3", "6253", "db88", "c38c", "a48c", "3e4f", "7208", "9dcb", "fc77", "e2cf", "8552", "f6f8", "7079", "42ef", "391e", "8a6d", "2154", "d964", "49ec"]


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
```   

Let's run it to get the flag :
```sh
>>> python solve.py
Trying to match each password with provided hash
1/100 - 6288 b' \xba\x7f\x85\xc0\\^[u\xab\xce\xd9\xec\xe6z\xc9' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
2/100 - 6152 b'\x92\xae\\\xfe\xf5}\x9e\xf9\xa5#u>E\xfc\x9b\x0b' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
3/100 - 4c7a b'\xcb\xc2F\x00\x90\xaf\x04\n\xa0T\xacXP\xb3\\\xbe' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
4/100 - b722 b'\xaeH\xf4E{V?\xac\xc5\xe3\x8adC\xfbLo' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
5/100 - 9a6e b'\xf1\xa0\x18|\xea|\xb6\x80\x86\x9d\xb0\xe4\x89\x95\x92\x0b' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
6/100 - 6717 b'1\x98\xdf\xd0\xae\xf2q\xd2/{\xcd\xddo\x12\xf5\xcb' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
7/100 - 4389 b"\r'h\x8ca\xc5\xa1r\xe8\xe4YV\xcdp\xcb\xa2" != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
8/100 - 1a28 b'P\x9c[;*\x96m9\x02\x10\x07\xfaH\xed\xbe\x89' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
9/100 - 37ac b"\xe6iR\xce\xaa'\x860\xa8~\xa2\xc1c\xf1'1" != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
10/100 - de4f b'H0%\x00bn\xactk\x1db\xa4\x1b\xb4\xdb\x9b' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
11/100 - eb28 b'\x0e\x9e\xb2ck\x83\x13\x1d\xc6\x86\xa4\x94\x07)\xa8\xab' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
12/100 - 351b b'\xd9D\xb0\x89\xe4\xcb\x8d\xe8\xd3}\xbcyt\xe2\xce ' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
13/100 - 3d58 b'\x04\xf4\xc4/\xea\x90\xf0\xd5\xdf\xfd\xc6\t!\x04\xd9\t' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
14/100 - 948b b'$0\x9cI&W#&\x89\xd1\x85\x13l\t\x87\x05' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
15/100 - 231b b',\xde\xfe6\x16\x0b\x18\x19\xcd\x17\xf7\xea\x0bt\xe7R' != b'\x1c\x92A_/\xc0\x8b\x0e\x8a\x0e\xbbo?!\xcd\xcc'
Password Matching Hash found ! : 973a
picoCTF{fl45h_5pr1ng1ng_ae0fb77c}
```


<details><summary>🚩 FLAG</summary>  

```  
picoCTF{fl45h_5pr1ng1ng_ae0fb77c}
```  
</details>