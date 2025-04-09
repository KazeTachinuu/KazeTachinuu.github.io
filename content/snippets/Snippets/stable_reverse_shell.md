+++
title = "Stable Reverse Shell"
description= ""
language = "bash"
date = 2025-04-08T11:14:36-04:00
+++


### Step one: first connection

The first thing to do is use this python script to spawn a slighly better and prettier shell:
{{< copy_code >}}
{{< highlight bash "linenos=inline" >}}
python3 -c 'import pty;pty.spawn("/bin/bash")'
{{< /highlight >}}
{{< /copy_code >}}

We still have to do one more thing to do to have autocompletion, arrow keys and good CTRL+C...

### Step two: setup the export TERM

The first thing to do is use this python script to spawn a slighly better and prettier shell:
{{< copy_code >}}
{{< highlight bash "linenos=inline" >}}
export TERM=xterm
{{< /highlight >}}
{{< /copy_code >}}

This will give us access to term commands such as clear.

### Final Step

We will background the shell using `CTRL + Z`.
Back in our own terminal we will use:

The first thing to do is use this python script to spawn a slighly better and prettier shell:
{{< copy_code >}}
{{< highlight bash "linenos=inline" >}}
stty raw -echo;fg
{{< /highlight >}}
{{< /copy_code >}}

This does two things :

1. `-echo` turns off our own terminal echo (which gives us access to tab autocompletes), the arrow keys, and CTRL+C.
2. `fg` foregrounds the shell, thus completing the process.
