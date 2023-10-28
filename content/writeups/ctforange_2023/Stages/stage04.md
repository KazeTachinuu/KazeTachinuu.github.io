+++
categories = ["all"]
date = 2023-10-28T00:00:00Z
title = "Stage 04"
type = "post"
draft = false
+++

## Stage04

After validating we get the following:

```bash
$ validate part42 WeAreNotAlone
Hey! Are you still there? Top!
You really don't look bad to me. I think we'll work well together in the future...
But let's figure out what we're doing here first...

I received a message that seems to be addressed to you. But I don't understand it.
Can you give me a hand?

Zyeb myxdsxeob, sv do pkenbk kxkvicob vo psmrsob nsczyxslvo sms :
Boqkbno vo lsox, no zbod, cyec dyedoc coc myedeboc...
Sv i'k pybmowoxd aeovaeo mryco à v'sxdobsoeb, nkxc ck dêdo.
mdp.
exsd41.
pb
/Wkvgkbo/
WkiloXydKWkvgkbo.
jsz
```

This clearly looks like a rot cipher, but let’s make computer do the heavy work for us.

[Dcode rot cipher](https://www.dcode.fr/rot-cipher) decipher this :

```text
Pour continuer, il te faudra analyser le fichier disponible ici :
Regarde le bien, de pret, sous toutes ses coutures...
Il y'a forcement quelque chose q l'interieur, dans sa tute.
ctf.
unit41.
fr
/Malware/
MaybeNotAMalware.
zip
```

We get a new file : 

[MaybeNotAMalware.zip](/writeups/OrangeCTF-2023/Files/MaybeNotAMalware.zip)

Upon unzipping the file, we discovered what seemed to be a Windows executable. This was confirmed by using the **`file`** command:

```bash
$ file MaybeNotAMalware.Exe
MaybeNotAMalware.Exe: PE32 executable (console) Intel 80386, for MS Windows, 5 sections
```

At first, I attempted to examine the disassembled executable code using Ghidra, hoping to find something insightful. However, after spending some time exploring the code, it started to seem unusual. All the previous challenges were relatively simple, and this one appeared to require reverse engineering skills. I doubted if that was the intended approach, so I decided to simplify my approach.

Instead of delving into the code, I opted to check the properties of the file in a Windows environment. To my surprise, this straightforward step revealed the crucial information:

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%204.png)

Indeed, the solution was as simple as inspecting the file properties.

Upon typing the word in the terminal we get this message:

```bash
$ callmeplease
Dring... Dring... Sorry but i'm not a phone server.
So you need to send a Discord Message to someone you can trust. Go on it, and find he.
Do not give your name or any sensitive informations.
Just say, 'I know who you are!'

If OK, the contact must respond with a secret.
If no response on the next 24h, or any other reason, please send a Discord message again

Then type this word as a secret command.
```

As written we have to send a message to one of the organizers of the ctf.

After a few minutes i got the password : 

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%205.png)

```bash
$ microsoc
Do you think joining the UNIT41 team is that easy?
I don't think so... It's going to take a little more effort!

Someone give me an encrypted string, many of Microsoc expert now what to do.

The person who sent me this is called Joan Daemen. He was very close to the U.S. government in 2000.
He just passed me a piece of paper with the word 'microsoc' attached twice. Maybe a hint?

F8dmeMlB+TyOSKZvcl1sVV8ZikqGUZZqSDxwH/80qKI=
```

Upon encountering the encrypted string and consulting the **`dcode`** cipher identifier

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%206.png)

It suggested a possible base64 encoding. However, decoding it yielded a seemingly random set of characters.

```text
�ÇfxÉAù<�H¦or]lU_��J�Q�jH<p�ÿ4¨¢
```

Taking a closer look at the challenge text and considering the person who shared the encrypted string, Joan Daemen, a notable cryptographer known for co-designing the Rijndael cipher (selected as AES), provided an important clue (Thanks Wikipedia). Joan Daemen handed over a piece of paper with the word 'microsoc' repeated twice, hinting towards the encryption key.

Realizing this, we used 'microsocmicrosoc' as the potential key to unlock the encrypted string, and as expected, it led to a new URL.

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%207.png)

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%208.png)

Following the link, we encountered another interface, prompting us to examine the source code for potential clues. Hidden within the source code was an error message, subtly camouflaged to blend with the background color.

```html
ERROR 1 : An error occured somewhere.
<br /><br />
<body style='background-color:black;'>
    <div style='text-align:center; color:cornsilk; width:300px; margin:auto;'>
        Connect to the administration :<br /><br />
        <form action="" method="POST">
        <table style='color:cornsilk;'>
            <tr>
                <td width='150px'>Login : </td><td><input type='text' name='user' /><br /></td>
            </tr>
            <tr>
                <td>Pass : </td><td><input type='password' name='pass' /><br /></td>
            </tr>
            <tr>
                <td></td><td><br /><br /><input type='submit' value='Connect' /><br /></td>
            </tr>
            <tr>
                <td></td><td><br /><br /><span style="color:red">Unable to connect</span></td>
            </tr>
        </table>
        </form>
    </div>
</body>
```

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%209.png)

This concealed error message provided us with a username and password, but the password seems to be hashed.

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%2010.png)

Thanks  to [CrackStation](https://crackstation.net/) we get the password → **`cyberdefense`**

So using the credentials we can move on

```html
BINGO ! !
You can now validate this part with the common command on your terminal :
part name : part33
password : PleaseHelpMe
```

Flag : **`validate part33 PleaseHelpMe`**