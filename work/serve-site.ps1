$root = [System.IO.Path]::GetFullPath(
  "C:\Users\Phil Alu\Documents\Codex\2026-06-11\to-create-a-real-estate-web\outputs\real-estate-site"
)
$listener = [System.Net.Sockets.TcpListener]::new(
  [System.Net.IPAddress]::Loopback,
  4174
)
$listener.Start()

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".png" = "image/png"
  ".svg" = "image/svg+xml"
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()
    while ($reader.ReadLine()) {}

    $relativePath = "index.html"
    if ($requestLine -match "^[A-Z]+ /([^ ?]*)") {
      $relativePath = [System.Uri]::UnescapeDataString($Matches[1])
      if ([string]::IsNullOrWhiteSpace($relativePath)) {
        $relativePath = "index.html"
      }
    }

    $requestedPath = [System.IO.Path]::GetFullPath(
      [System.IO.Path]::Combine($root, $relativePath.Replace("/", "\"))
    )
    $found = $requestedPath.StartsWith($root) -and [System.IO.File]::Exists($requestedPath)

    if ($found) {
      $body = [System.IO.File]::ReadAllBytes($requestedPath)
      $extension = [System.IO.Path]::GetExtension($requestedPath).ToLowerInvariant()
      $contentType = if ($contentTypes.ContainsKey($extension)) { $contentTypes[$extension] } else { "application/octet-stream" }
      $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
    } else {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Not found")
      $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
    }

    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($body, 0, $body.Length)
    $stream.Flush()
    $client.Close()
  }
} finally {
  $listener.Stop()
}
