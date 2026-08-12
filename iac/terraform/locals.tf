locals {
  name_prefix = "nexsift-${var.environment}"
  common_tags = {
    Project     = "NexSift"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
