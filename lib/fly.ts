/**
 * Fly.io API client — wraps Machines REST API + GraphQL API.
 *
 * Machines REST: https://api.machines.dev/v1
 * GraphQL (for secrets + IPs): https://api.fly.io/graphql
 */

const MACHINES_API = 'https://api.machines.dev/v1'
const GRAPHQL_API = 'https://api.fly.io/graphql'

function getToken(): string {
  const token = process.env.FLY_API_TOKEN
  if (!token) throw new Error('FLY_API_TOKEN is not set')
  return token
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  }
}

// ─── Apps ────────────────────────────────────────────────────────────

export async function createApp(appName: string, orgSlug: string) {
  const res = await fetch(`${MACHINES_API}/apps`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ app_name: appName, org_slug: orgSlug }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to create app "${appName}": ${res.status} ${body}`)
  }
  return res.json()
}

// ─── Secrets (GraphQL only) ──────────────────────────────────────────

export async function setSecrets(appName: string, secrets: Record<string, string>) {
  const secretsInput = Object.entries(secrets).map(([key, value]) => ({ key, value }))

  const res = await fetch(GRAPHQL_API, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      query: `
        mutation($input: SetSecretsInput!) {
          setSecrets(input: $input) {
            app { name }
          }
        }
      `,
      variables: {
        input: {
          appId: appName,
          secrets: secretsInput,
        },
      },
    }),
  })

  const data = await res.json()
  if (data.errors) {
    throw new Error(`Failed to set secrets on "${appName}": ${JSON.stringify(data.errors)}`)
  }
  return data
}

// ─── IP Allocation (GraphQL) ─────────────────────────────────────────

export async function allocateIpv4(appName: string): Promise<string> {
  const res = await fetch(GRAPHQL_API, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      query: `
        mutation($input: AllocateIPAddressInput!) {
          allocateIpAddress(input: $input) {
            ipAddress {
              id
              address
              type
            }
          }
        }
      `,
      variables: {
        input: {
          appId: appName,
          type: 'v4',
        },
      },
    }),
  })

  const data = await res.json()
  if (data.errors) {
    throw new Error(`Failed to allocate IPv4 for "${appName}": ${JSON.stringify(data.errors)}`)
  }
  return data.data.allocateIpAddress.ipAddress.address
}

export async function allocateIpv6(appName: string): Promise<string> {
  const res = await fetch(GRAPHQL_API, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      query: `
        mutation($input: AllocateIPAddressInput!) {
          allocateIpAddress(input: $input) {
            ipAddress {
              id
              address
              type
            }
          }
        }
      `,
      variables: {
        input: {
          appId: appName,
          type: 'v6',
        },
      },
    }),
  })

  const data = await res.json()
  if (data.errors) {
    throw new Error(`Failed to allocate IPv6 for "${appName}": ${JSON.stringify(data.errors)}`)
  }
  return data.data.allocateIpAddress.ipAddress.address
}

// ─── Machines ────────────────────────────────────────────────────────

export async function getAppImage(appName: string): Promise<string> {
  const res = await fetch(`${MACHINES_API}/apps/${appName}/machines`, {
    method: 'GET',
    headers: headers(),
  })
  if (!res.ok) {
    throw new Error(`Failed to list machines for "${appName}": ${res.status}`)
  }
  const machines = await res.json()
  if (!machines.length) {
    throw new Error(`No machines found for "${appName}"`)
  }
  return machines[0].config.image
}

export async function createMachine(
  appName: string,
  image: string,
  env: Record<string, string>,
  region = 'syd'
) {
  const res = await fetch(`${MACHINES_API}/apps/${appName}/machines`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      region,
      config: {
        image,
        env: {
          ...env,
          NODE_ENV: 'production',
          PORT: '3000',
          HOSTNAME: '0.0.0.0',
        },
        services: [
          {
            ports: [
              { port: 80, handlers: ['http'] },
              { port: 443, handlers: ['tls', 'http'] },
            ],
            protocol: 'tcp',
            internal_port: 3000,
            autostop: 'stop',
            autostart: true,
            min_machines_running: 0,
            force_instance_key: null,
          },
        ],
        guest: {
          cpu_kind: 'shared',
          cpus: 1,
          memory_mb: 512,
        },
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to create machine in "${appName}": ${res.status} ${body}`)
  }
  return res.json()
}

// ─── Certificates ────────────────────────────────────────────────────

export async function addCertificate(appName: string, hostname: string) {
  const res = await fetch(`${MACHINES_API}/apps/${appName}/certificates`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ hostname }),
  })

  // 409 = certificate already exists, which is fine
  if (!res.ok && res.status !== 409) {
    const body = await res.text()
    throw new Error(`Failed to add certificate for "${hostname}" on "${appName}": ${res.status} ${body}`)
  }
  return res.json()
}

export async function checkCertificate(appName: string, hostname: string) {
  const res = await fetch(`${MACHINES_API}/apps/${appName}/certificates/${hostname}`, {
    method: 'GET',
    headers: headers(),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to check certificate for "${hostname}" on "${appName}": ${res.status} ${body}`)
  }
  return res.json()
}
