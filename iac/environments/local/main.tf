terraform {
  required_version = ">= 1.11.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.8"
    }
  }
}

provider "aws" {
  region = "us-east-1"

  access_key                  = "test"
  secret_key                  = "test"
  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3            = "http://localhost:4566"
    lambda        = "http://localhost:4566"
    iam           = "http://localhost:4566"
    ssm           = "http://localhost:4566"
    sts           = "http://localhost:4566"
    apigatewayv2  = "http://localhost:4566"
  }
}

variable "name_prefix" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "content_bucket_name" {
  type = string
}

variable "publish_token" {
  type      = string
  sensitive = true
}

variable "lambda_endpoint_url" {
  type = string
}

variable "bucket_force_destroy" {
  type = bool
}

variable "create_vercel_reader" {
  type = bool
}

variable "tags_environment" {
  type = string
}

module "content_stack" {
  source = "../../modules/content-stack"

  name_prefix          = var.name_prefix
  aws_region           = var.aws_region
  content_bucket_name  = var.content_bucket_name
  publish_token        = var.publish_token
  lambda_endpoint_url  = var.lambda_endpoint_url
  bucket_force_destroy = var.bucket_force_destroy
  create_vercel_reader = var.create_vercel_reader
  tags_environment     = var.tags_environment
}

output "content_bucket" {
  value = module.content_stack.content_bucket
}

output "publish_function_name" {
  value = module.content_stack.publish_function_name
}

output "publish_function_url" {
  value = module.content_stack.publish_function_url
}
