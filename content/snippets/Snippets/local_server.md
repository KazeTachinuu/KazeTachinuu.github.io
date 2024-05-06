+++
title = "Local Server Commands"
description= ""
language = "http"
date = 2024-05-05T17:41:36-04:00
+++


## Python HTTP Server
{{< copy_code >}}
{{< highlight bash "linenos=inline" >}}
python3 -m http.server 8000
{{< /highlight >}}
{{< /copy_code >}}


## Netcat HTTP Server
{{< copy_code >}}
{{< highlight bash "linenos=inline" >}}
nc -l 8000
{{< /highlight >}}
{{< /copy_code >}}
