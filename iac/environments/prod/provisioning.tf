resource "aws_iam_policy" "provisioning" {
  name        = "nexsift-terraform-provisioning"
  description = "nexsift-terraform-provisioning"
  policy      = file("${path.module}/provisioning-user-policy.json")
  tags = {
    Application = "nexsift"
    Environment = "prod"
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_user_policy_attachment" "provisioning" {
  user       = "nexsift-terraform"
  policy_arn = aws_iam_policy.provisioning.arn
}
