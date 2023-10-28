+++
categories = ["all"]
date = 2023-10-28T00:00:00Z
title = "Stage 03"
type = "post"
draft = false
+++

## Stage03

After the validation, we received the following message:

```bash
$ validate part1 IamAnHacker!
Ok ok... I don't understand what's going on.
Your IP doesn't seem to be legitimate, and yet you are validating all accesses for the moment...

Please logon : https://ctf.unit41.fr/logon
```

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%202.png)

We need a password. Let's check the source code for any useful information:

```html
<div style='text-align:center;margin-top:100px;'>
    <b>You need to enter the valid password to access to this private area. </b><br /><br />

    Password : <input type="password" value="" id='password'><br /><br />
    <input type="button" onclick="Validate()" value="Connect">
    <br />
</div>

<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script>
    function Validate() {
        const map = "abcdefghijklmnopqrstuvwxyz0123456789";
        const $p = $('#password').val();
        const $t = map.charAt(7) + map.charAt(4) + 'l' + map.charAt(11) + map.charAt(26);
        if ($p == $t) {
            alert("Profil unlocked.\nPlease type this password as a secret command on your terminal...");
        } else {
            alert("This is not a valid password.");
        }   
    }
</script>
```

We deciphered the code using Python:

```python
map = "abcdefghijklmnopqrstuvwxyz0123456789"
password = map[7] + map[4] + 'l' + map[11] + map[26]
print(password)

>>> hell0
```

The password is **`hell0`**. When entered in the interface, we were asked to type it in the terminal to continue.

---

In the terminal, we received a message:

```bash
$ hell0
I feel like I'm in a dream... Who wakes me up? Let me sleep... Please let me sleep...!
Please let me sleep... Don't say that to me anymore... Goodbye... Goodbye...
```

At first, it seemed like a coded message, but then I realized he asked not to repeat what we said, so obviously, I did.

```bash
$ hell0
LET ME SLEEP RIGHT NOW... DONT TRY AGAIN ! LAST CHANCE FOR YOU !

$ hell0
Okkkkkkkkkkk...........
I am the person in charge of the passwords of the platform.
I always try to enforce the best password complexity.

For example, the last generated one, I used the following method:

- A number representing the answer to everything,
- The name of the malware deployed via SolarWind since 2/20/2020, passed to the function ucfirst(),
- A number representing the maximum rights on a linux file system,
- A variant of A in Leet Speak,

-> Finally, concat all answers,

It seems to me that it was created for a new top secret access...
Yes, I know where to reach it, but I can't talk about it... I'm bugged... And I can't say too much about it because afterwards I dream about it at night (and it seems that I talk in my sleep!! LOL).

Go to hell, I'm going to sleep... ZZzzZZZzz
```

Now we’re talking !

After some internet research:

1. A number representing the answer to everything → **`42`**
2. The name of the malware deployed via SolarWind since 2/20/2020, passed to the function ucfirst()→ **sunburst** is the name of the malware and **ucfirst()** is a capitalize function. thus : **`Sunburst`**
3. A number representing the maximum rights on a linux file system→ **`777`**
4. A variant of A in Leet Speak → It could be either **`4`** or **`@`**, but they specified that it was a number for both 1) and 3), we can assume it’s **`@`**

Concatenated, this gives us the password : **`42Sunburst777@`** 

After an hour of trying every possible combination with other appellations of the malware (because we then assumed the password was wrong), we looked more closely at the text after the questions.

> It seems to me that it was created for a new top secret access...
Yes, I know where to reach it, but I can't talk about it... I'm bugged... And I can't say too much about it because afterwards I dream about it at night (and it seems that I talk in my sleep!! LOL).

> Go to hell, I'm going to sleep... ZZzzZZZzz


It seems that we needed to input this password in an interface somewhere, but where?

```bash
$ hell0
ZzzzZZZ ctf.unit41.fr/ZzzzzZZZ/ ZzzzZZZzzZZ http ZzzzZZZzzZZZ over ZZZZzzzZZZZ SSL ZzzzzZZZzzZ
```

Yeah… We were supposed to type hell0 to make him talk one last time… after punching myself in the face, I then went to the URL.

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%203.png)

We have an interface! So we typed our guessed password:

```text
// Under Maintenance //

// Todo list :
- Create the form to validate the part 2 if terminal is down
- Give access to all internet of things
- Permit to reboot every root routers

// Use the terminal while this page is being updated
Part Code = part42
Part Password = WeAreNotAlone

But do you remember the syntax command to validate?
```

Flag acquired! The syntax is `validate part42 WeAreNotAlone`
