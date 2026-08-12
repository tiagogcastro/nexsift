provider "aws" {
  region = var.aws_region

  access_key                  = var.aws_endpoint_url != "" ? "test" : null
  secret_key                  = var.aws_endpoint_url != "" ? "test" : null
  s3_use_path_style           = var.aws_endpoint_url != ""
  skip_credentials_validation = var.aws_endpoint_url != ""
  skip_metadata_api_check     = var.aws_endpoint_url != ""
  skip_requesting_account_id  = var.aws_endpoint_url != ""

  dynamic "endpoints" {
    for_each = var.aws_endpoint_url != "" ? [var.aws_endpoint_url] : []

    content {
      s3     = endpoints.value
      lambda = endpoints.value
      iam    = endpoints.value
      ssm    = endpoints.value
      sts    = endpoints.value
    }
  }
}
