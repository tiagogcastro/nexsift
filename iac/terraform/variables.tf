variable "environment" {
  type        = string
  description = "Deployment environment name."
  default     = "local"

  validation {
    condition     = contains(["local", "prod"], var.environment)
    error_message = "environment must be local or prod."
  }
}

variable "aws_region" {
  type        = string
  description = "AWS region."
  default     = "us-east-1"
}

variable "aws_endpoint_url" {
  type        = string
  description = "Endpoint used by Terraform when targeting MiniStack. Leave empty for AWS."
  default     = ""
}

variable "lambda_endpoint_url" {
  type        = string
  description = "AWS endpoint reachable from the Lambda runtime. Leave empty for AWS."
  default     = ""
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

variable "publish_token_version" {
  type        = number
  description = "Version trigger for the write-only SSM publication token."
  default     = 1
}
