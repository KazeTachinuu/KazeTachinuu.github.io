---
title: "CSRF and Flask"
date: 2022-10-22T15:27:48-04:00
description: "How to prevent CSRF attack in Python Flask"
author: "Baichuan Li"
draft: true
---

## What is CSRF?

CSRF is short for Cross-Site Request Forgery. Here are the steps for CSRF:
- A victim user logs into a good website such as https://www.bank.com. Then the server will add a cookie (login token, usually a random string) to the browser, and store the user-token pair in the server-side database.
- The victim user then goes to a website set up by the attacker.
- The attacker's server sends the user an HTML page containing a JavaScript program that sends a request to https://www.bank.com/transfermoney/. Note that this request will be sent with the cookies of bank.com attached.
- The bank.com server verifies that the login token set in the request cookies is indeed valid. So the bank server decides to transfer the money.
- The Victim's money is gone.

## CSRF Mitigation

The key cause of CSRF is that the attacker's website can send HTTP requests with cookies (although it does not know the content of cookies). However, in the current scenario, the server cannot verify the authenticity of the request because it has valid cookies. So the main idea for CSRF mitigation is to provide a way for the server to verify that the request is indeed submitted from its site, not any other attacker's site.

The solution is to add a hidden field in the form submitted by the front-end. The hidden field contains a random string, called a CSRF token, that is linked with the user session in the server back-end database. When the user submits a form, the form will not only contain the normal contents, but also the random string in the hidden tag. Then the server verifies that the random CSRF token is linked with the correct user session. Note that according to SOP policy, JavaScripts on the attacker's website have no access to the hidden tag (they are in a separate domain). When the attacker tries to send a forged form request to the form, it does not know the CSRF token linked with the user session. So the server immediately detects that the request does not contain the correct CSRF token.


