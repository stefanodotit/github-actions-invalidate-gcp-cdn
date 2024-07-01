# Google Cloud CDN Cache Invalidation GitHub Action

This GitHub Action invalidates the cache for a specified path on a Google Cloud CDN load balancer.

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
