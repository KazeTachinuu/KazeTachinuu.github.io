+++
categories = ["all"]
date = 2023-10-28T00:00:00Z
title = "Stage 02"
type = "post"
draft = false
+++

## **Stage 02**

After validating in the terminal, we received this output:

```bash
$ validate part0 w00t
Thanks for this validation.

Now I can share a little more about myself.
I am part of a special team called "Unit41".
You will know more when the time comes. It is not very important...

I need your help again; my team intercepted a secure communication.
Do you know what it is? Seems to be a little strange...

U2F2ZWQgZWxlbWVudCA6IGh0dHBzOi8vcGFzdGViaW4uY29tL2pMTUhFc01B
```

It looked like base64 encoding, so we used [CyberChef](https://gchq.github.io/CyberChef/) to decode it:

```text

Chef, I recovered a dark email.
I'm afraid to delve into this strange world.
Can you please help me!?

What about this webmail: 4mz5f5szcdkkurlecmghsqppxasbbtj7sqlumwoicj3mgkvfxrrbqwid

I know that the username is: unit41
To not write the password in clear, please find the information below:

An integer just after the 3
An integer just after the ² (not the 2) - Doesn't work on Mac ;)
Then reverse tinu
```

We were asked to connect to a webmail using the username **`unit41`**. The password could be deduced from the provided information:

- An integer just after the 3: **`4`**
- An integer just after the ² (not the 2) - Assuming AZERTY keyboard: **`1`**
- Reverse "tinu" gives: **`unit`**

So, the username was **`unit41`**, and the password was **`41unit`**.

Now, to connect to the webmail, the only information provided was this weird sequence:

**4mz5f5szcdkkurlecmghsqppxasbbtj7sqlumwoicj3mgkvfxrrbqwid**

Using a [cipher identifier tool](https://www.dcode.fr/cipher-identifier) to help, it suggested a TOR link. 

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled.png)

With the mention of a “dark email,” this pointed directly to the deep web. The weird sequence was, in fact, a .onion domain.

We connected through TOR to this domain, leading us to a mail interface. Using the acquired credentials, we obtained the flag.

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%201.png)

```text
Nice buddy ! This is a fake email service.

Pour valider, retourne sur le terminal de recrutement, et valide cette première partie avec la commande :
validate part1 IamAnHacker!
```