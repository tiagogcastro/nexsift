resource "aws_ssm_parameter" "publish_token" {
  name             = "/nexsift/${var.environment}/publish-token"
  type             = "SecureString"
  value_wo         = var.publish_token
  value_wo_version = var.publish_token_version

  tags = local.common_tags
}
