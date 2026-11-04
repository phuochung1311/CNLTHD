{
  "info": {
    "name": "Teaching Assignment API - Latency Test",
    "description": "Collection đo độ trễ các endpoint đọc dữ liệu bằng Collection Runner.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:3000" }
  ],
  "item": [
    {
      "name": "Health",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "type": "text/javascript",
            "exec": [
              "pm.test('HTTP status 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "pm.test('Latency dưới 1 giây', function () {",
              "    pm.expect(pm.response.responseTime).to.be.below(1000);",
              "});",
              "console.log({ endpoint: pm.request.url.toString(), iteration: pm.info.iteration + 1, status: pm.response.code, latencyMs: pm.response.responseTime });"
            ]
          }
        }
      ]
    },
    {
      "name": "Ping",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/v1/ping"
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "type": "text/javascript",
            "exec": [
              "pm.test('HTTP status 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "pm.test('Latency dưới 1 giây', function () {",
              "    pm.expect(pm.response.responseTime).to.be.below(1000);",
              "});",
              "console.log({ endpoint: pm.request.url.toString(), iteration: pm.info.iteration + 1, status: pm.response.code, latencyMs: pm.response.responseTime });"
            ]
          }
        }
      ]
    },
    {
      "name": "List courses",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/v1/courses"
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "type": "text/javascript",
            "exec": [
              "pm.test('HTTP status 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "pm.test('Latency dưới 1 giây', function () {",
              "    pm.expect(pm.response.responseTime).to.be.below(1000);",
              "});",
              "console.log({ endpoint: pm.request.url.toString(), iteration: pm.info.iteration + 1, status: pm.response.code, latencyMs: pm.response.responseTime });"
            ]
          }
        }
      ]
    },
    {
      "name": "List classes",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/v1/classes"
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "type": "text/javascript",
            "exec": [
              "pm.test('HTTP status 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "pm.test('Latency dưới 1 giây', function () {",
              "    pm.expect(pm.response.responseTime).to.be.below(1000);",
              "});",
              "console.log({ endpoint: pm.request.url.toString(), iteration: pm.info.iteration + 1, status: pm.response.code, latencyMs: pm.response.responseTime });"
            ]
          }
        }
      ]
    },
    {
      "name": "List assignments",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/v1/assignments"
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "type": "text/javascript",
            "exec": [
              "pm.test('HTTP status 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "pm.test('Latency dưới 1 giây', function () {",
              "    pm.expect(pm.response.responseTime).to.be.below(1000);",
              "});",
              "console.log({ endpoint: pm.request.url.toString(), iteration: pm.info.iteration + 1, status: pm.response.code, latencyMs: pm.response.responseTime });"
            ]
          }
        }
      ]
    }
  ]
}
