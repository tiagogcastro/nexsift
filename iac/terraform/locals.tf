locals {
  name_prefix = "nexsift-${var.environment}"
  common_tags = {
    Application = "nexsift"
    Environment = var.environment == "local" ? "dev" : var.environment
    ManagedBy   = "Terraform"
  }
}
