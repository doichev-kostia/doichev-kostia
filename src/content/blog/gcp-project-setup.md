---
title: "GCP project setup"
summary: "Setting up Google Cloud Platform for your project"
publishTime: "2024-11-19"
minutesToRead: 4
---

## Google Cloud CLI

Install the gcloud CLI by following the official [instructions](https://cloud.google.com/sdk/docs/install). <br/> 
Install the [direnv](https://direnv.net/) to automatically load the environment variables when opening the project
directory.

Disclaimer: The following steps are working in Google Cloud SDK v486.0.0. If you have a different version, please see
the [changelog](https://cloud.google.com/sdk/docs/release-notes)

Create a new configuration

```shell
gcloud config configurations create <project_name>
```

Set the project ID (can be found on the home page https://console.cloud.google.com/welcome)

```shell
gcloud config set project <project_id>
```

Authenticate with Google OAuth. This will attach the authenticated user to the created configuration and update the
Application Default Credentials (ADC) file.
Which will be stored in `~/.config/gcloud/application_default_credentials.json`

```shell
gcloud auth login --update-adc
```

Note: The google client libraries use the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to locate the Application Default Credentials file.
To use a default location, you can leave that variable unset. You can also specify a custom location (i.e. when mounting the credentials to the docker container).

Create `.envrc` file. <br/>
Note: this file should be ignored by VCS (i.e. Git)
```shell
# .envrc
export CLOUDSDK_ACTIVE_CONFIG_NAME=<project_name>
export GOOGLE_PROJECT=<project_id>
```

To automatically load the env vars into the shell when opening the project directory, run
```shell
direnv allow
```

## Cloud SQL Auth Proxy

To securely connect to your DB instance using GCP IAM, we will use the [cloud sql auth proxy](https://cloud.google.com/sql/docs/mysql/sql-proxy#mac-m1)

### Docker
```shell
# bind to the local port 5445, but you can use any other port
docker run -p 5445:5445 \
# mount the default application credentials into the /etc/config/gcp-credentials.json
-v ~/.config/gcloud/application_default_credentials.json:/etc/config/gcp-credentials.json \
# specify the path to the mounted credentials
-e GOOGLE_APPLICATION_CREDENTIALS=/etc/config/gcp-credentials.json \
 gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.14.0 \
  --address 0.0.0.0 \
  --port 5445 \
   <instance_name> # can be found at https://console.cloud.google.com/sql/instances/
```

### Shell

Install the [cloud-sql-proxy](https://cloud.google.com/sql/docs/mysql/sql-proxy#mac-m1)
```shell
# download the proxy binary (v2.14.0 in my case)
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.0/cloud-sql-proxy.darwin.arm64

# create a gcp dir
mkdir -p /usr/local/opt/gcp/bin/

# move the binary to the gcp dir
mv cloud-sql-proxy /usr/local/opt/gcp/bin/

# allow execution
chmod +x /usr/local/opt/gcp/bin/cloud-sql-proxy
```

Then you need to add the executable to the $PATH env variable
for zsh
```shell
echo 'export PATH="/usr/local/opt/gcp/bin:$PATH"' >> ~/.zshrc
```

Run the proxy
```shell
# bind to the local port 5445, but you can use any other port
cloud-sql-proxy --address 0.0.0.0 --port 5445 <instance_name>
```
