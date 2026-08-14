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
  type    = string
  default = ""
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

output "publish_api_url" {
  value = module.content_stack.publish_api_url
}

output "mcp_function_url" {
  value = module.content_stack.mcp_function_url
}

output "vercel_reader_access_key_id" {
  value     = module.content_stack.vercel_reader_access_key_id
  sensitive = true
}

output "vercel_reader_secret_access_key" {
  value     = module.content_stack.vercel_reader_secret_access_key
  sensitive = true
}
