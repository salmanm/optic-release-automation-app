# optic-release-automation-app

[![ci](https://github.com/nearform/optic-release-automation-app/actions/workflows/ci.yml/badge.svg)](https://github.com/nearform/optic-release-automation-app/actions/workflows/ci.yml)
[![cd](https://github.com/nearform/optic-release-automation-app/actions/workflows/cd.yml/badge.svg)](https://github.com/nearform/optic-release-automation-app/actions/workflows/cd.yml)

An helper application that simply creates release PRs to the requesting repo. This app is intended to be used with [optic-release-automation-action](https://github.com/nearform/optic-release-automation-action).

## Usage

- Install the GitHub App [optic-release-automation](https://github.com/apps/optic-release-automation) on the repositories or the organization where you want to use the action `optic-release-automation-action`.
- Use `optic-release-automation-action` in your GitHub action workflow as documented [here](https://github.com/nearform/optic-release-automation-action#example)

### Overview

This application is a companion to the GitHub action [optic-release-automation-action](https://github.com/nearform/optic-release-automation-action).

When used in a GitHub workflow, the action invokes this application to delegate creating of pull request for the new release.

The reason why an external application is needed to automate this is because events triggered by the `GITHUB_TOKEN` will not create a new workflow run. [Learn more](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#triggering-new-workflows-using-a-personal-access-token):

Hence we need a separate Github App that does not rely on the `GITHUB_TOKEN` and can generate one when needed.

### How it works

- [optic-release-automation](https://github.com/apps/optic-release-automation) GitHub app is installed on the target repository/organization.
- This allows the GitHub app to create relevant token for the requesting repository.
- [optic-release-automation-action](https://github.com/nearform/optic-release-automation-action) GitHub action is used in a workflow and it delegates to this app the responsibility of creating the pull request using a HTTP request.
- The action provides the `GITHUB_TOKEN` secret to the GitHub app as the authentication token.
- The GitHub app uses the token to infer which repository is being targeted (i.e. the requesting repository), thereby preventing misuse.
- Once the GitHub app has verified that the provided token has access to the target repository, it uses its own credentials to create the pull request

### Security

The approach used by this mechanism is secure.

- It does not serve to unauthenticated requests.
- It expects a `GITHUB_TOKEN` that's scoped to the repository and is valid for the duration of the workflow execution to infer the target repository, to prevent anybody from sending a malicious request.
- It does/can not do anything besides openning a pull request.

So if somebody has a token for your repository, and they invoke the GitHub app's HTTP API with correct request body, they can do nothing but **open** a pull request from a branch that "already exist" in your repo.

## Development

_This section covers how to contribute to this app. You don't need to read further if you're simply using this as described in the above sections._

- Prerequisites: a GCP project with the [cloud run and cloud build apis enabled](https://cloud.google.com/apis/docs/getting-started)
- Create a service account in the IAM & Admin console to be used to deploy the app
- Create a key for the service account, this key will be configured as a secret in the GitHub actions to be able to deploy the app
- Grant following [permissions](https://github.com/google-github-actions/deploy-cloudrun) for the service account
  - Artifact Registry Administrator
  - Cloud Build Service Account
  - Service Account User
  - Cloud Run Admin
  - Cloud Run Service Agent
  - Storage Admin
- Clone this repo to your GitHub account
- In the `Settings` of your GitHub repo, go to `Secrets` and create the `New repository secret` with the names and values below:
    - `GCP_PROJECT_ID`: The [ID](https://support.google.com/googleapi/answer/7014113?hl=en) of the GCP project as found in your GCP Account
    - `GCP_CLOUDRUN_SERVICE_NAME`: The name of the cloud run service, you can select any name that you prefer
    - `GCP_CLOUDRUN_SERVICE_REGION`: The [region](https://cloud.google.com/compute/docs/regions-zones) in the GCP that you want to create the cloud run service
    - `GCP_SA_KEY`: The key that you created for your service account with the permissions to deploy the app. This is a JSON object and should be used as-is.
    - `APP_ID`: The ID of the GitHub App. You can get this from the GitHub app settings. The default app is [here](https://github.com/apps/optic-release-automation)
    - `PRIVATE_KEY`: The private key of the GitHub App. You can get this from the GitHub app settings. The default app is [here](https://github.com/apps/optic-release-automation)
- After the steps above are configured, go to `Actions` in your GitHub repo and run the CD workflow that is created in the folder `.github/workflows/cd.yaml`. The file is already configured with the action to deploy the cloud run service using the secrets that were created in the step above.
- Once the workflow run, go to you GCP Account and open the "Cloud Run" page to see the details of the deployed service.

## Testing changes locally
_This section covers how to run the app locally using ngrok to test your changes while developing a new feature or debugging an issue_

- Create a new github app and add the following permissions:
  - `Contents`: Read and write
  - `Pull requests`: Read and write
- Then go to `Install App` and install it on your repository
- Start the server and run `ngrok http 3000` on your local machine and get the public URL. This will be your API url, which needs to be set as the webhook URL on your github app and to be passed as the `api-url` input for the `optic-release-automation-action`.
- You should also pass the name of your bot as the `app-name` to the action. This is used after a PR is merged to check whether it was created by optic and whether we should proceed running the action on that PR
