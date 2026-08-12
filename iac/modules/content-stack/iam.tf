data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "publish" {
  name               = "${var.name_prefix}-publish"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "publish" {
  statement {
    sid    = "ContentBucket"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.content.arn,
      "${aws_s3_bucket.content.arn}/*",
    ]
  }

  statement {
    sid    = "WriteLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_role_policy" "publish" {
  name   = "${var.name_prefix}-publish"
  role   = aws_iam_role.publish.id
  policy = data.aws_iam_policy_document.publish.json
}

data "aws_iam_policy_document" "vercel_reader" {
  statement {
    sid    = "ReadContentBucket"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.content.arn,
      "${aws_s3_bucket.content.arn}/*",
    ]
  }
}

resource "aws_iam_user" "vercel_reader" {
  count = var.create_vercel_reader ? 1 : 0
  name  = "nexsift-vercel-reader"
  tags  = local.common_tags
}

resource "aws_iam_user_policy" "vercel_reader" {
  count  = var.create_vercel_reader ? 1 : 0
  name   = "nexsift-content-readonly"
  user   = aws_iam_user.vercel_reader[0].name
  policy = data.aws_iam_policy_document.vercel_reader.json
}

resource "aws_iam_access_key" "vercel_reader" {
  count = var.create_vercel_reader ? 1 : 0
  user  = aws_iam_user.vercel_reader[0].name
}
