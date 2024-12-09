---
layout: "../../layouts/Notes.astro"
title: GCP notes
---

# GCP 


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
