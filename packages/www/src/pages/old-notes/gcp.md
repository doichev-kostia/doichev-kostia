---
layout: "../../layouts/Markdown.astro"
title: GCP notes
---

# GCP

### VM & Container
No-one is buying a 2vCPU machine specifically for you. The cloud providers buy beasts with 64 CPU cores (128 vCPU), 512 MB RAM, 2 TB SSD, but then
they create a virual machine (VMware, KVM) that has only the resources you paid for. So, one physical machine, runs several virtual machines.

The "virtual" comes from
- Hardware Virtualization
  - Physical resources are shared and partitioned
  - Each VM thinks it's running on its own dedicated hardware
  - The Hypervisor (software like VMware or KVM) manages this illusion

- Resource Management
  - CPU time is scheduled
  - Memory is partitioned
  - Storage is allocated
  - Network is shared

Containers run on top of VMs
```plaintext
Physical Server Hardware
└── Hypervisor (VMware, KVM)
    └── Virtual Machines
        └── Operating System
            └── Container Runtime (Docker, containerd)
                └── Containers
```

Key differences between VMs and containers:

VMs virtualize the hardware
- Each VM has its own full OS
- Heavy isolation through hypervisor
- More resource overhead

Containers virtualize the OS layer
- Share the host OS kernel
- Lightweight isolation through Linux namespaces
- Less resource overhead
- Start up much faster

### CPU

A vCPU (Virtual CPU) is a virtual processor that represents a share of an actual physical CPU core.
1 Physical CPU Core → With Hyperthreading → 2 vCPUs.
If you have a server with one physical CPU that has 4 cores and supports hyperthreading, it can provide 8 vCPUs total (4 cores × 2 threads).
Because it's a hardware hyperthread, you can share the time, therefore 0.25 vCPU means your workload gets 25% of a hyperthread's capacity

### RAM
MiB (Mebibyte) vs MB (Megabyte)
MiB - uses Base 2
MB - uses Base 10

Binary progression:
- 1 byte
- 1 KiB (kibibyte) = 1024 bytes (2¹⁰)
- 1 MiB (mebibyte) = 1024 KiB = 1024 * 1024 = 1,048,576 bytes (2²⁰)
- 1 GiB (gibibyte) = 1024 MiB = 1024 * 1024 * 1024 = 1,073,741,824 bytes (2³⁰)

Versus decimal:
- 1 byte
- 1 KB (kilobyte) = 1000 bytes (10³)
- 1 MB (megabyte) = 1000 KB = 1,000,000 bytes (10⁶)
- 1 GB (gigabyte) = 1000 MB = 1,000,000,000 bytes (10⁹)

### Cloud Run

Cloud Run instances expose a metadata server that you can use to retrieve details about your containers.
To access metadata, call `http://metadata.google.internal` with `Metadata-Flavor: Google` header
https://cloud.google.com/run/docs/container-contract#metadata-server

There is some project.toml file

#### Service

A Cloud Run instance always has __one__ single ingress container that listens for requests. Optionally, you can add sidecar containers.
Ingress container listens on 0.0.0.0 and default port is 8080 ($PORT env var).

TLS is handled by the Cloud Run, the container should accept HTTP/1 requests (https://cloud.google.com/run/docs/container-contract#tls)

There is a default request timeout, if there is no reply the request is ended with 504 status code and an error.

Default env vars can be seen (https://cloud.google.com/run/docs/container-contract#env-vars). From interesting ones:
- PORT
- K_REVISION

The filesystem is in-memory (writing to it increases the instance memory) and not persisted. Mount NFS/GCS for persistent storage

Before shutting down an instance, Cloud Run sends a __SIGTERM__ signal to all the containers in an instance indicating the start of a 10 second period before the actual shutdown occurs,
at which point Cloud Run sends a __SIGKILL__ signal.

#### Job
Job must exit with status code "0" to be "successful".
Can schedule up to 10K tasks that can be executed in parallel for one job.

#### Testing

Mount the __APPLICATION_DEFAULT_CREDENTIALS__ into the docker container
```
-v $GOOGLE_APPLICATION_CREDENTIALS:/tmp/keys/<FILE_NAME>.json:ro
```

Google Cloud Emulator https://cloud.google.com/code?hl=en
Local Dev Env `gcloud beta code dev`

#### Volume mounts

I can mount different volumes to my cloud run instance. An example would be a privatly hosted static website. My files can be stored in the GCS Bucket,
I can mount that bucket to `/usr/share/ngnix/html` and run the nxinx container. If custom config needed,
I can mount my ngnix config from the GCS into `/etc/nginx/conf.d`

#### Health checks
Liveness and Startup probes


#### ENV vars
The env variables are for configurations, not for secrets. For secrets it's recommended to use Secret Manager

### Application Load Balancer

I can create a proxy Cloudflare worker that will handle the caching/CDN and DDOS protection. I will assign a custom domain, let's say `api.example.com` to it,
then I will create an Application Load Balancer that will handle the internal routing of all my GCP infrastructure.

User -> Cloudflare Workers -> Application Load Balancer -> Cloud Run

I can add firewall protection rules to the load balancer to only allow traffic from Cloudflare IPs.

The load balancer needs some rules to know where to redirect the traffic to. It can be host, path, header or any other rule.

A very simple example would be
```typescript
async function route(request: Request) {
  const host = request.headers.get("host");
  let backend: string;

  if (host.startsWith("api.")) {
    backend = "10.0.1.1";
  } else if (host.startsWith("auth.")) {
    backend = "10.0.1.2";
  }

  const response = await fetch(`http://${backend}`, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    // Preserve original request properties
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers
  });
}
```

### Pulumi
You can wait for resource provisioning/execution with `time.index.Sleep` from `@pulumi/time`.

For instance:
```ts
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as time from "@pulumi/time";

const mesh = new gcp.networkservices.Mesh("mesh", {name: "network-services-mesh"});
const waitForMesh = new time.index.Sleep("wait_for_mesh", {createDuration: "1m"}, {
    dependsOn: [mesh],
});
const _default = new gcp.cloudrunv2.Service("default", {
    name: "cloudrun-service",
    deletionProtection: false,
    location: "us-central1",
    launchStage: "BETA",
    template: {
        containers: [{
            image: "us-docker.pkg.dev/cloudrun/container/hello",
        }],
        serviceMesh: {
            mesh: mesh.id,
        },
    },
}, {
    dependsOn: [waitForMesh],
});
```

If some config needs to be mounted, you can create a bucket object in pulumi
```ts
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ngnixConfig = new gcp.storage.BucketObject("WebNginxConfig", {
    name: "fe/nginx/conf.d",
    source: new pulumi.asset.FileAsset("./nginx/conf.d"),
    bucket: "<my_bucket>",
});

const www = new gcp.cloudrunv2.Service("StaticWebsite", {
  name: "website",
  template: {
    containers: [{
      image: "nginx",
      volumeMounts: [{
        name: "bucket",
        mountPath: "/var/www",
      }, {
        name: "config",
        mountPath: "/etc/nginx/conf.d",
      }],
    }],
    volumes: [{
      name: "bucket",
      gcs: {
        bucket: bucket.name,
        readOnly: false,
      },
    }, {
      name: "config",
      gcs: {
        bucket: ngnixConfig.bucket,
        object: ngnixConfig.name,
        readOnly: true,
      },
    }],
  }
})
```


### Networking
IPv4 192.168.1.1 (32 bits, 4 bytes)
IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334 (128 bits, 16 bytes)

IPv4 - each segment is a byte (0 - 255)
IPv6 - each segment is 16 bits (2 bytes), and it's written in hexadecimal
Some special cases (IPv4):

0.0.0.0 | :: - typically means "any address" or unassigned
127.0.0.1 ::1 - localhost (your own machine)
192.168.x.x - typically used for private networks
10.x.x.x - also used for private networks
224.0.0.0/4 | ff00::/8 - multicast
255.255.255.255 - broadcast address

Subnets are chunks of your network

```plaintext
VPC (10.0.0.0/16)
├── Subnet A (10.0.1.0/24) - 256 addresses
│   ├── 10.0.1.1 - Database
│   ├── 10.0.1.2 - Auth Service
│   └── ... (up to 10.0.1.255)
└── Subnet B (10.0.2.0/24) - 256 addresses
    ├── 10.0.2.1 - API Server
    └── ... (up to 10.0.2.255)
```

the `/24` is __CIDR__ notation (Classless Inter-Domain Routing) means the first 24 bits of the IP address are fixed for the network, and the last 8 bits can vary for individual hosts

Example:
192.168.1.0/24
First 24 bits (first 3 bytes) define the network
Last 8 bits (last byte) can be used for hosts
Network part: 192.168.1
Hosts can be 0-255

So a /24 gives you 256 possible addresses (though typically 254 usable as .0 and .255 are reserved).
```plaintext
192.168.1.0   (network address)
192.168.1.1   (first usable)
192.168.1.2
...
192.168.1.254
192.168.1.255 (broadcast address)
```

For internal subnets IPv4 is sufficient enough (10.0.0.0/8) gives you 16.7 million addresses

#### NAT
NAT (Network Address Translation) is like a mail forwarding service for IP addresses
```plaintext
Private Network (10.0.0.0/8)           Internet
├── Device A (10.0.1.1) ─┐
├── Device B (10.0.1.2) ─┼─→ NAT Gateway (34.xx.xx.xx) ─→ Internet
└── Device C (10.0.1.3) ─┘
```
The NAT gateway:

- Has a public IP address
- Translates private IPs to its public IP
- Keeps track of connections to route responses back

common integration with the load balancer
```plaintext
Internet
   ↓
Load Balancer (for incoming traffic)
   ↓
Private Services
   ↓
NAT Gateway (for outgoing traffic)
   ↓
Internet
```
The Load Balancer controls who can get in, while NAT controls how internal services get out.


### Compute engine
Same as VM or Virtual Machine
