resource "aws_s3_bucket" "content" {
  bucket        = var.content_bucket_name
  force_destroy = var.environment == "local"

  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "content" {
  bucket = aws_s3_bucket.content.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
