$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$cafPath = Join-Path $root "assets/source-images/Caffeina_LatestWork.png"
$perPath = Join-Path $root "assets/source-images/Peristeronica_LatestWork.jpg"
$outputPath = Join-Path $root "assets/images/ogp.png"

$width = 1200
$height = 630
$halfHeight = [int]($height / 2)

function Draw-CoverImage {
  param (
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [System.Drawing.Rectangle]$Destination
  )

  $scale = [Math]::Max($Destination.Width / $Image.Width, $Destination.Height / $Image.Height)
  $sourceWidth = $Destination.Width / $scale
  $sourceHeight = $Destination.Height / $scale
  $sourceX = ($Image.Width - $sourceWidth) / 2
  $sourceY = ($Image.Height - $sourceHeight) / 2

  $Graphics.DrawImage(
    $Image,
    $Destination,
    [single]$sourceX,
    [single]$sourceY,
    [single]$sourceWidth,
    [single]$sourceHeight,
    [System.Drawing.GraphicsUnit]::Pixel
  )
}

$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$cafImage = [System.Drawing.Image]::FromFile($cafPath)
$perImage = [System.Drawing.Image]::FromFile($perPath)

try {
  Draw-CoverImage -Graphics $graphics -Image $cafImage -Destination (New-Object System.Drawing.Rectangle(0, 0, $width, $halfHeight))
  Draw-CoverImage -Graphics $graphics -Image $perImage -Destination (New-Object System.Drawing.Rectangle(0, $halfHeight, $width, $halfHeight))

  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "Saved OGP image to $outputPath"
}
finally {
  $cafImage.Dispose()
  $perImage.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}
