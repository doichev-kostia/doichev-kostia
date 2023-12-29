---
title: "App Engine deployment pipelines"
summary: "Using GitHub Actions pipelines to deploy client-side applications to App Engine"
publishedAt: "2023-12-29"
minutesToRead: 12
draft: true
---

## Introduction

In the following blog post, I will show how to deploy client-side applications (static websites/web apps) to Google
App Engine using GitHub Actions pipelines.
Additionally, we will go through the process of setting up the temporary environments for major features that require a
separate environment for testing.
All the code used in this blog post is available on [GitHub](https://github.com/doichev-kostia/git-flow-poc).

## Prerequisites

You need to create a GCP project and enable the App Engine API.
Also, we are going to use the Workload Identity Provider to authenticate to GCP via GitHub actions.
You can read the setup instructions
in [this article](https://cloud.google.com/blog/products/identity-security/enabling-keyless-authentication-from-github-actions).

In the end, you should have the following secrets and variables:
WORKLOAD_IDENTITY_PROVIDER: projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider
SERVICE_ACCOUNT: my-service-account@my-project.iam.gserviceaccount.com
GCP_PROJECT_ID: my-project

You can already add them to your GitHub actions secrets and variables.

## Project

For the sake of simplicity, I created a simple Astro app with a few pages that will be deployed to the App Engine.
The app engine requires the configuration file to be present during the deployment. Usually, it's the same file but with
different service names for different environments.
It can be beneficial to automatically generate that file during the pipeline execution.

So, let's begin with the GitHub actions pipelines.

## GitHub actions pipelines

#### Re-usable App Engine config action

First, we will create a re-usable action called `app-engine-config` that will generate the app engine config file based
on the service we are deploying.

```shell
mkdir -p .github/actions/app-engine-config
```

Then let's create a template file for the app engine config

```shell
touch .github/actions/app-engine-config/template.yml
```

The template file should look like this:

```yaml
runtime: nodejs20
service: {{service}}

handlers:
  - url: /
    static_files: dist/index.html
    upload: dist/index.html

  - url: /(.*)
    static_files: dist/\1
    upload: dist/(.*)
```

Note! The node.js 20 is the lts version of node.js at the time of writing this article. You may need to change it to the
latest version.

Then we need to create a utility shell script that will generate the app engine config file based on the template and
the service name.

```shell
touch .github/actions/app-engine-config/generate-config.sh
```

```shell
#!/usr/bin/env bash

# exit when any command fails
set -e

required_env_vars=(
  service_name
  filename
)

for env_var in "${required_env_vars[@]}"; do
  if [[ -z "${!env_var}" ]]; then
    printf "Error: Required environment variable %s is not set.\n" "$env_var"
    exit 1
  fi
done

current_dir=$(dirname "$(realpath "$0")")
template="$current_dir/template.yml"

printf "Generating %s\n" "$filename"

sed "s/{{service}}/$service_name/g" "$template" > "$filename"
```

Lastly, we need to create a re-usable GitHub action that will use the utility script to generate the app engine config
file.

```shell
touch .github/actions/app-engine-config/action.yml
```

```yaml
name: "Create app engine config"
description: "Create app engine config"
inputs:
  service_id:
    description: 'The service id to be used for app engine config'
    required: true
  filename:
    description: 'The name of the config file'
    required: true

runs:
  using: 'composite'
  steps:
    - name: create config file
      shell: bash
      run: ./.github/actions/app-engine-config/generate-config.sh
      env:
        service_name: ${{ inputs.service_id }}
        filename: ${{ inputs.filename }}
```

### Deployment workflow

The deployment workflow is coupled with the git flow. In my experience, the best way to manage the git flow is to only
have a `master` branch and short-lived branches for features, hotfixes and major features.

We usually want to have at least 2 environments - staging and production. The staging environment should be nearly
identical to the real-world production environment.
To achieve that we will set the following triggers:
on push to master - deploy to staging
on release publish - deploy to production

So, let's create the deployment workflow. We will create a reusable workflow that can be used for both staging and
production deployments.

```shell
mkdir -p .github/workflows
touch .github/workflows/deploy.yml
```

```yaml
on:
  workflow_call:
    inputs:
      # the environment name that will be used for the deployment
      env:
        type: string
        required: true
      # the environment url
      url:
        type: string
        required: true
      # version of the app to deploy, if not specified, the ref will be used
      version:
        type: string
        required: false
      # Google Cloud App Engine service id that will be used for the deployment
      service_id:
        type: string
        required: true
    secrets:
      # 'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider'
      WORKLOAD_IDENTITY_PROVIDER:
        required: true
      # 'my-service-account@my-project.iam.gserviceaccount.com'
      SERVICE_ACCOUNT:
        required: true
      GCP_PROJECT_ID:
        required: true

jobs:
  deploy:
    permissions:
      contents: 'read'
      id-token: 'write'
    runs-on: ubuntu-latest
    environment:
      name: ${{ inputs.env }}
      url: ${{ inputs.url }}
    timeout-minutes: 20
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version || github.ref }}

      - uses: pnpm/action-setup@v2

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run build

      - name: Generate app engine config
        uses: ./.github/actions/app-engine-config
        with:
          filename: ${{ inputs.env }}.yml
          service_id: ${{ inputs.service_id }}

      - name: Deploy to app engine
        uses: Panenco/gcp-deploy-action@v2
        with:
          workload_identity_provider: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.SERVICE_ACCOUNT }}
          service_id: ${{ inputs.service_id }}
          project_id: ${{ vars.GCP_PROJECT_ID }}
          app_yaml_path: ${{ inputs.env }}.yml
```

A small explanation of the workflow:

```
on:
  workflow_call:
    inputs:
```

means that the workflow can be triggered by another workflow using the `workflow_call` event. The `inputs` are the
parameters that the workflow accepts.

env and url are needed to set the environment name and url for the deployment, so github automatically creates the
environment for us.

```
 - name: Checkout
   uses: actions/checkout@v4
   with:
     ref: ${{ github.event.inputs.version || github.ref }}
```

In this step we checkout either to the specified version or latest commit in the current branch

```
  - uses: pnpm/action-setup@v2

  - uses: actions/setup-node@v4
    with:
      node-version-file: '.nvmrc'
      cache: 'pnpm'
```

will setup pnpm taking the version from the `package.json` file and setup node.js taking the version from the `.nvmrc`
file. Moreover, the pnpm dependencies will be cached between the workflow runs.

```
  - name: Install dependencies
    run: pnpm install --frozen-lockfile

  - name: Build
    run: pnpm run build
```

will install the dependencies and build the app. Note that we are specifying the `--frozen-lockfile` flag to make sure
that the lockfile is not updated during the installation.

```
  - name: Generate app engine config
    uses: ./.github/actions/app-engine-config
    with:
      filename: ${{ inputs.env }}.yml
      service_id: ${{ inputs.service_id }}
```

We use the `app-engine-config` action to generate the app engine config file. The `env` input is the environment name (
production/staging)

```
  - name: Deploy to app engine
    uses: Panenco/gcp-deploy-action@v2
    with:
      workload_identity_provider: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
      service_account: ${{ secrets.SERVICE_ACCOUNT }}
      service_id: ${{ inputs.service_id }}
      project_id: ${{ vars.GCP_PROJECT_ID }}
      app_yaml_path: ${{ inputs.env }}.yml
```

This is a reusable action that I and my colleagues created at Panenco. It will deploy the app to the app engine using the
provided configuration.
You can see its source code at [Panenco/gcp-deploy-action](https://github.com/Panenco/gcp-deploy-action).

Next, we need to create the workflows for staging and production deployments.

```shell
touch .github/workflows/staging.yml
```

```yaml
name: staging-deployment

concurrency:
  group: deploy-staging
  cancel-in-progress: true

on:
  workflow_dispatch:
  push:
    branches:
      - master

jobs:
  deploy_staging:
    uses: ./.github/workflows/deploy.yml
    with:
      env: staging
      url: https://staging.myapp.dev
      service_id: staging
    secrets:
      WORKLOAD_IDENTITY_PROVIDER: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
      SERVICE_ACCOUNT: ${{ secrets.SERVICE_ACCOUNT }}
      GCP_PROJECT_ID: ${{ vars.GCP_PROJECT_ID }}
```

As you can see, we are using the `deploy.yml` workflow and passing the required parameters to it.

The `concurrency` section is needed to make sure that only one staging deployment is running at a time.

Additionally, I would always recommend using the `workflow_dispatch` event to trigger the workflow manually. This is
useful during debugging the workflows.

```shell
touch .github/workflows/production.yml
```

```yaml
name: production-deployment

concurrency:
  group: deploy-production
  cancel-in-progress: true

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version (commit tag)'
        required: false
  release:
    types:
      - published

jobs:
  deploy_production:
    uses: ./.github/workflows/deploy.yml
    with:
      env: production
      url: https://app.myapp.dev
      version: ${{ github.event.inputs.version }}
      service_id: production
    secrets:
      WORKLOAD_IDENTITY_PROVIDER: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
      SERVICE_ACCOUNT: ${{ secrets.SERVICE_ACCOUNT }}
      GCP_PROJECT_ID: ${{ vars.GCP_PROJECT_ID }}
```

In the production workflow, we are using the github release to trigger the deployment. This way the app remains in
similar state
as the latest staging deployment due to the same git branch.

For `workflow_dispatch` we allow to specify the app version to deploy. This is useful when we want to roll back to a previous version.

### Temporary environments

Sometimes 2 environments are not enough. We have several use cases for temporary environments:

- major features that require a separate environment for testing and verification with the client
- hotfixes that need to be deployed to production ASAP

There are several examples I can give to explain the use cases of the above-mentioned ideas.

Imagine you decided to change the colour palette of the application, before rolling it out to the customers, you want to
have the verification from the client that these are the correct colours. We could wrap it up in feature flags, push to
prod and enable it for the client, or you could just give a proper name to your branch, push and voila, it's up and
running. Grab the url and send it to the stakeholders.

Another use case – a critical bug in prod and your staging is not yet ready to be published. Yeah, I know, in the ideal
world your staging should always be ready, but let's be honest, shit happens. So, it's either we
rollback the master to the previous tag, merge the fix and then move the staging changes back, or we checkout from the
latest release for a branch named `hotfix/<my-fix-name>`, fix the issue, push the changes, verify and create a GitHub
release on this hotfix branch.

The prod is fixed, and everyone is saved. Now we can merge our hotfix to master and continue working on other problems.

These workflows are not meant to be used every day, they are created to help in specific situations.

### Setup temporary environments

Alright, I hope I convinced you to set up the temporary environments as well

We will have 2 workflows:

- deployment
- cleanup

```shell
touch .github/workflows/temp-env-deployment.yml 
```

```yaml
name: temp-env-deployment

concurrency:
  group: temp-env-deployment-${{ github.ref }}
  cancel-in-progress: true

on:
  workflow_dispatch:
  push:
    branches:
      - major/*
      - hotfix/*

jobs:
  deploy:
    permissions:
      contents: 'read'
      id-token: 'write'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run build

      - name: Create a feature name
        id: feature
        uses: Panenco/git-flow/feature@master
        with:
          delimiter: '-'

      - name: Generate app engine config
        uses: ./.github/actions/app-engine-config
        with:
          filename: ${{ steps.feature.outputs.feature_name }}.yml
          service_id: ${{ steps.feature.outputs.feature_name }}

      - name: Deploy to app engine
        uses: Panenco/gcp-deploy-action@v2
        with:
          workload_identity_provider: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.SERVICE_ACCOUNT }}
          service_id: ${{ steps.feature.outputs.feature_name }}
          project_id: ${{ vars.GCP_PROJECT_ID }}
          app_yaml_path: ${{ steps.feature.outputs.feature_name }}.yml

      # get the service name and url for a better workflow summary
      - name: Set metadata
        id: service_metadata
        run: |
          url=$(gcloud app browse --service=${{ steps.feature.outputs.feature_name }} --no-launch-browser)
          echo "service_name=${{ steps.feature.outputs.feature_name }}" >> $GITHUB_OUTPUT
          echo "service_url=$url" >> $GITHUB_OUTPUT

      - name: Generate Summary
        run: |
          echo "
            ## Summary

            Service name: ${{ steps.service_metadata.outputs.service_name }}
            Service url: ${{ steps.service_metadata.outputs.service_url }}
          " > $GITHUB_STEP_SUMMARY
```

Again, let's go step-by-step through the file

```
on:
  workflow_dispatch:
  push:
    branches:
      - major/*
      - hotfix/*
```

This means that we are going to create a temporary environment only when the branches with prefixes `major` and `hotfix` are
pushed.

```
- name: Create a feature name
  id: feature
  uses: Panenco/git-flow/feature@master
  with:
    delimiter: '-'
```

This step will create a feature name based on the branch. You can check this workflow on
GitHub [Panenco/git-flow/feature](https://github.com/Panenco/git-flow/tree/master/feature/action.yml)

If your branch is `major/calendar` the feature name would be `major-calendar`

```
 - name: Generate app engine config
   uses: ./.github/actions/app-engine-config
   with:
       filename: ${{ steps.feature.outputs.feature_name }}.yml
       service_id: ${{ steps.feature.outputs.feature_name }}
```

Here we again generate the App Engine config, but this time the service name is based on the feature name that the
previous step generated

```
  # get the service name and url for better workflow summary
  - name: Set metadata
    id: service_metadata
    run: |
      url=$(gcloud app browse --service=${{ steps.feature.outputs.feature_name }} --no-launch-browser)
      echo "service_name=${{ steps.feature.outputs.feature_name }}" >> $GITHUB_OUTPUT
      echo "service_url=$url" >> $GITHUB_OUTPUT

  - name: Generate Summary
    run: |
      echo "
        ## Summary

        Service name: ${{ steps.service_metadata.outputs.service_name }}
        Service url: ${{ steps.service_metadata.outputs.service_url }}
      " > $GITHUB_STEP_SUMMARY
```

These steps create a nice summary of the created App Engine service

Now, it's important to clean up those environments after the branch is removed.

for that, we will create the cleanup workflow

```shell
touch ./.github/workflows/temp-env-cleanup.yml
```

```yaml
name: temp-env-cleanup

concurrency:
  group: temp-env-cleanup-${{ github.event.ref }}
  cancel-in-progress: true

on:
  workflow_dispatch:
  # unfortunately, branch filters are not working for delete events
  delete:

jobs:
  cleanup:
    if: ${{ contains(github.event.ref, 'major/') || contains(github.event.ref, 'hotfix/') }}
    permissions:
      contents: 'read'
      id-token: 'write'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Cleanup
        uses: Panenco/git-flow/cleanup@master
        with:
          workload_identity_provider: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.SERVICE_ACCOUNT }}
          delimiter: '-'
```

Let's dive into it

```
on:
  workflow_dispatch:
  # unfortunately, branch filters are not working for delete events
  delete:
```

as mentioned in the comment, the branch filters are not working for the delete events, so we will have to use an if
statement before the job
`if: ${{ contains(github.event.ref, 'major/') || contains(github.event.ref, 'hotfix/') }}` does all the branch filtering

```
 - name: Cleanup
   uses: Panenco/git-flow/cleanup@master
   with:
     workload_identity_provider: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
     service_account: ${{ secrets.SERVICE_ACCOUNT }}
     delimiter: '-'
```

the [Panenco/git-flow/cleanup](https://github.com/Panenco/git-flow/blob/master/cleanup/action.yml) action already does
all the heavy lifting for us, we just need to pass the arguments

## Summary

Overall, these pipelines simplify the whole workflow if you use the GCP App Engine for your apps. Of course, in
real-world apps, you may have some extra steps like secrets pulling, sentry integration, etc. But the idea remains the
same, you have 1 long-living master branch and a bunch of short-lived feature branches. The master branch is used for both
staging and production deployments and whenever there is a need, you can easily boot up a temporary environment.

The example repo can be found on GitHub
at [doichev-kostia/git-flow-poc](https://github.com/doichev-kostia/git-flow-poc).

If you have any ideas/suggestions you can open an issue or hit me up on socials
