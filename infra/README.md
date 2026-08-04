# Pulse infra — Hetzner Cloud (Terraform)

Provisions the Hetzner Cloud server that hosts the Pulse `docker compose`
stack (`deploy/compose.yml`): Docker Engine + Portainer CE, a firewall
(22/80/443 only), an SSH key, and an optional Hetzner DNS `A` record.

**Nothing here is applied automatically.** `terraform apply` and supplying
real credentials are Felipe's manual steps — this config never embeds a
token, and no agent runs `plan`/`apply` on his behalf.

## Prerequisites

- Terraform >= 1.9 (tested with 1.10.5)
- A Hetzner Cloud API token (Hetzner Console -> Project -> Security -> API
  Tokens -> read+write)
- Your SSH public key (e.g. `~/.ssh/id_ed25519.pub`)
- Optional: a Hetzner DNS API token and zone ID, only if you want Terraform
  to manage a DNS record (`manage_dns = true`)

## Apply

```bash
cd infra

# 1. Credentials — environment only, never written to a file.
export TF_VAR_hcloud_token="<your Hetzner Cloud API token>"
# only if you set manage_dns = true below:
export TF_VAR_hetznerdns_token="<your Hetzner DNS API token>"

# 2. Your inputs — copy the example and fill in your SSH key (and DNS
#    settings if you want them). terraform.tfvars is gitignored.
cp terraform.tfvars.example terraform.tfvars
$EDITOR terraform.tfvars   # set ssh_public_key at minimum

# 3. Provision.
terraform init
terraform plan
terraform apply
```

After apply, read the outputs:

```bash
terraform output server_ipv4
terraform output portainer_url
```

Then deploy the app stack itself onto the new server (copy `deploy/` up and
run `docker compose -f deploy/compose.yml up -d`, or manage it through
Portainer) — that part is outside this Terraform config's scope.

## What gets created

- `hcloud_ssh_key` — your public key, installed as the server's only login
  method (no password auth).
- `hcloud_server` — `cx22` (default, override via `server_type`) in `nbg1`
  (default, override via `location`), Ubuntu 24.04, booted with cloud-init
  (`infra/cloud-init.yaml`) that installs Docker Engine via the official
  convenience script and starts Portainer CE (`portainer/portainer-ce`) with
  a named `portainer_data` volume.
- `hcloud_firewall` — inbound allowed on **22** (SSH), **80** and **443**
  (Caddy / Let's Encrypt) only. Nothing else is opened.
- Optional `hetznerdns_record` (`count = var.manage_dns ? 1 : 0`, off by
  default) — an `A` record for `var.domain` in the zone `var.dns_zone_id`,
  pointing at the server's IPv4.

## Portainer access model

Port **9443 is deliberately not opened** by the firewall — Portainer is
never exposed to the public internet. Reach it over an SSH tunnel instead:

```bash
ssh -L 9443:localhost:9443 root@<server_ipv4>
# then open https://localhost:9443 in your browser
```

If you decide you *do* want Portainer reachable directly (e.g. a
non-SSH-capable teammate needs UI access), add a `port = "9443"` rule to
the `hcloud_firewall` resource in `main.tf` — restrict `source_ips` to your
own IP(s) rather than opening it to `0.0.0.0/0`.

## Security posture

- **No credentials in the repo.** `hcloud_token` and `hetznerdns_token` are
  `sensitive = true` Terraform variables with no committed values — they
  come only from `TF_VAR_hcloud_token` / `TF_VAR_hetznerdns_token` at apply
  time.
- `.gitignore` excludes `*.tfvars` (real values), `.terraform/` (provider
  plugin cache), and `*.tfstate*` (state may contain resource attributes).
  `.terraform.lock.hcl` and `*.tfvars.example` ARE committed intentionally
  (provider version pinning; placeholder template).
- SSH key auth only — no root password is set anywhere in this config.
- Firewall is default-deny inbound aside from 22/80/443.
- DNS management is opt-in (`manage_dns = false` by default) since Felipe
  may manage DNS through a different registrar/provider.

## Verify without touching real infrastructure

```bash
cd infra
terraform init            # downloads providers, no credentials needed
terraform validate        # "Success! The configuration is valid."
terraform fmt -check      # no output = already formatted
```

`terraform plan`/`apply` were intentionally NOT run by the agent that wrote
this config — they require your real Hetzner token and would hit the
Hetzner API.
