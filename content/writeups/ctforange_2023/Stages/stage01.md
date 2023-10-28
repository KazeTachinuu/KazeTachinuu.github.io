+++
categories = ["all"]
date = 2023-10-28T00:00:00Z
title = "Stage 01"
type = "post"
draft = false
+++

## **Stage 01**

We were instructed to enter **`stage1`** in the command line interface (CLI) to initiate the challenges.

Upon executing the command, we received the following output in binary:

```bash
$ stage1
01011111 01101101 01100001 01101001 01101110 01011111
00100000 01111011 00001010 01000011 01101111 01101110
01101110 01100101 01100011 01110100 00101000 00100111
01101000 01110100 01110100 01110000 01110011 00111010
00101111 00101111 01100011 01110100 01100110 00101110
01110101 01101110 01101001 01110100 00110100 00110001
00101110 01100110 01110010 00101111 01101001 01100100
01100101 01101110 01110100 00100111 00101001 00001010
01111101

```

It appeared to be in binary format, so we decoded it using a tool like [CyberChef](https://gchq.github.io/CyberChef/) to get a URL:

```bash

_main_ {
Connect('https://ctf.unit41.fr/ident')
}
```

Upon visiting the URL, we found the password already entered. We checked the page source and found the password hidden in the code.

```html
Reveal this password to continue : <br /><br />
Password : <input type="password" value="Go to https://ctf.unit41.fr/ident/next.html">
```

BINGO! We proceeded to the next URL.

```text
Nice job, guys! I think I can trust you.
Go back to the terminal and validate this stage with the command:

validate part0 w00t
```
