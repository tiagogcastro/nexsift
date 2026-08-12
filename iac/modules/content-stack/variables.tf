variable "name_prefix" {
  type        = string
  description = "Prefix for AWS resource names, e.g. nexsift-prod."
}

variable "aws_region" {
  type        = string
  description = "AWS region."
}

variable "content_bucket_name" {
  type        = string
  description = "S3 bucket that stores NexSift content."
}

variable "publish_token" {
  type        = string
  description = "Bearer token accepted by the publication Lambda."
  sensitive   = true
}

variable "lambda_endpoint_url" {
  type        = string
  description = "AWS endpoint reachable from the Lambda runtime. Empty for AWS."
  default     = ""
}

variable "bucket_force_destroy" {
  type        = bool
  description = "Allow the content bucket to be destroyed while non-empty."
}

variable "create_vercel_reader" {
  type        = bool
  description = "Create the read-only IAM user used by Vercel."
  default     = false
}

variable "tags_environment" {
  type        = string
  description = "Value of the Environment tag."
}
