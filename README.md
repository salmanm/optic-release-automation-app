# optic-release-automation-app

[![ci](https://github.com/nearform/optic-release-automation-app/actions/workflows/ci.yml/badge.svg)](https://github.com/nearform/optic-release-automation-app/actions/workflows/ci.yml)
[![cd](https://github.com/nearform/optic-release-automation-app/actions/workflows/cd.yml/badge.svg)](https://github.com/nearform/optic-release-automation-app/actions/workflows/cd.yml)

An helper application that simply creates release PRs to the requesting repo. This app is intended to be used with [optic-release-automation-action](https://github.com/nearform/optic-release-automation-action).

## Documentation

The Optic documentation is available [on the website](https://optic.nearform.com/)

To get started, visit the [Getting Started](https://optic.nearform.com/getting-started) page for a brief overview.
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
