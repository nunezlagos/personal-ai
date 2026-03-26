---
name: ssh
description: >
  SSH patterns for remote connections, key management, and tunneling.
  Trigger: When connecting to remote servers, setting up SSH keys, or creating tunnels.
license: Apache-2.0
metadata:
  author: personal-ai
  version: "1.0"
---

## When to Use

Use this skill when:
- Connecting to remote servers via SSH
- Managing SSH keys
- Setting up SSH tunnels
- Configuring SSH config

---

## Critical Patterns

### Pattern 1: Connection

```bash
ssh user@host
ssh -p 2222 user@host
ssh -i ~/.ssh/custom_key user@host
```

### Pattern 2: Key Management

```bash
ssh-keygen -t ed25519 -C "description"
ssh-keygen -t rsa -b 4096 -C "description"
ssh-copy-id user@host
```

### Pattern 3: Tunneling

```bash
ssh -L 8080:localhost:80 user@host
ssh -R 9090:localhost:3000 user@host
ssh -N -L 8080:localhost:80 user@host
```

### Pattern 4: SSH Config

```bash
cat ~/.ssh/config

Host server1
    HostName 192.168.1.100
    User admin
    Port 22
    IdentityFile ~/.ssh/id_rsa

Host server2
    HostName example.com
    User deploy
    ForwardAgent yes
```

---

## Common Commands

| Acción | Comando |
|--------|---------|
| Conexión básica | `ssh user@host` |
| Con key específica | `ssh -i key user@host` |
| Tunnel local | `ssh -L port:host:port user@host` |
| Tunnel remoto | `ssh -R port:host:port user@host` |
| Ejecutar comando | `ssh user@host "command"` |
| Copy key | `ssh-copy-id user@host` |