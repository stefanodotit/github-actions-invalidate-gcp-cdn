# Google Cloud CDN Cache Invalidation GitHub Action

This GitHub Action invalidates the cache for a specified path on a Google Cloud CDN load balancer.

## Setup

Before using this action, you must first use the `google-github-actions/auth` action to authenticate to Google Cloud.

## **Required inputs:**

* `load-balancer-name`: The name of the load balancer. This value can be found in the Google Cloud Console.
* `path`: The path to the content that you want to invalidate. This value must be a valid URL path. For example:
  * to invalidate the cache for the `/index.html` file, you would set the `path` input to `/index.html`.
  * to invalidate the whole directory, you would set the `path` input to `/images/*`.
  * to invalidate everything, you would set the `path` input to `/*`.

## **Optional inputs:**

* `host`: The hostname of the CDN endpoint. If you do not specify a hostname, the action will use the default hostname for the load balancer.
* `gcloud_version`: Version of the Cloud SDK to install. If unspecified or set to "latest", the latest available gcloud SDK version for the target platform will be installed. Example: "290.0.1".
* `gcloud_component`: Version of the Cloud SDK components to install and use.

## **Example usage:**

```yaml
name: Invalidate Google Cloud CDN Cache

on:
  push:
    branches: [ main ]

jobs:
  invalidate-cache:
    runs-on: ubuntu-latest

    steps:
     - name: Authenticate to Google Cloud
       uses: google-github-actions/auth@v2
       with:

     - name: Invalid CDN cache on GCP
       uses: stefanodotit/github-actions-invalidate-gcp-cdn@v1
       with:
          load_balancer_name: LOAD_BALANCER_NAME
          path: '/path/to/invalid/*'
```
