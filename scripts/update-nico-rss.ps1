$ErrorActionPreference = "Stop"

$rssUrl = "https://www.nicovideo.jp/user/61445526/mylist/78998106?rss=2.0"
$outputPath = Join-Path $PSScriptRoot "..\data\nico-mylist.json"
$scriptOutputPath = Join-Path $PSScriptRoot "..\data\nico-mylist.js"

$response = Invoke-WebRequest -Uri $rssUrl -UseBasicParsing -Headers @{
  "User-Agent" = "Mozilla/5.0 GitHub Pages RSS Fetcher"
}

[xml]$rss = $response.Content
$videos = @()

foreach ($item in $rss.rss.channel.item) {
  $link = [string]$item.link

  if ($link -match "watch/((?:sm|so|nm)\d+)") {
    $videos += [pscustomobject]@{
      id = $matches[1]
      title = [string]$item.title
      url = $link
      pubDate = [string]$item.pubDate
      description = [string]$item.description
    }
  }
}

$videos = $videos | Group-Object id | ForEach-Object { $_.Group[0] }

if ($videos.Count -eq 0) {
  throw "No videos found in RSS."
}

$output = [ordered]@{
  updatedAt = (Get-Date).ToUniversalTime().ToString("o")
  source = $rssUrl
  totalCount = $videos.Count
  videos = @($videos)
}

$json = $output | ConvertTo-Json -Depth 5

$json | Set-Content -LiteralPath $outputPath -Encoding utf8
"window.NICO_MYLIST_DATA = $json;" | Set-Content -LiteralPath $scriptOutputPath -Encoding utf8

Write-Host "Saved $($videos.Count) videos to $outputPath"
Write-Host "Saved browser data to $scriptOutputPath"
