resource "aws_apigatewayv2_api" "publish" {
  name          = "${var.name_prefix}-publish-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "publish" {
  api_id                 = aws_apigatewayv2_api.publish.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.publish.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "publish" {
  api_id    = aws_apigatewayv2_api.publish.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.publish.id}"
}

resource "aws_apigatewayv2_stage" "publish" {
  api_id      = aws_apigatewayv2_api.publish.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "apigateway" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.publish.function_name
  principal     = "apigateway.amazonaws.com"
}
