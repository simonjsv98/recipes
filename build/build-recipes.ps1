# Merges the imported recipes, applies the audit corrections and rebuilds the app in the repo folder.
$src = $PSScriptRoot
$repo = Split-Path $PSScriptRoot -Parent
$utf8 = New-Object Text.UTF8Encoding $false
$all = @()
foreach ($n in 1..6) { foreach ($r in ([IO.File]::ReadAllText("$src/recipes-data/batch-$n.json",[Text.Encoding]::UTF8) | ConvertFrom-Json)) { $all += $r } }
$byId = @{}; foreach ($r in $all) { $byId[$r.id] = $r }

# Link-to-page blocks in Notion, identified through backlinks: source, text the link follows ('' = own note), target
$links = @(
  @('3d9e56f5972280bb997fdfde6e80562f','intro','2d8e56f59722804ba3c2e698fdab230b'),
  @('3a8e56f597228071b654ddb7f5ce4d81','Se metod i sidan nedan','3a8e56f5972280b7944de3907e0398dd'),
  @('2bbe56f5972280ecb19ce8191e334428','intro','2bbe56f5972280b1a5b1ff972f566fae'),
  @('2bbe56f59722805593edff631bb0713a','Servera med potatismos','2bbe56f59722805d91c9e7fe5c0f82ae'),
  @('3eae56f59722800f8ccccf71c81a7ec0','Servera med potatismos','2bbe56f59722805d91c9e7fe5c0f82ae'),
  @('2b6e56f5972280eda612d7a9c8dcb3f4','Servera med polenta','2b6e56f59722804b9d91c7e6a5c6d4c3'),
  @('2e1e56f5972280ceab5cfb45fdcb85f7','Första gången jag gjorde detta','2e1e56f597228056bd85ed563949841a'),
  @('2e1e56f59722809e956fe62d9f8762f6','Vaniljsås till servering','2d8e56f59722804ba3c2e698fdab230b'),
  @('2b6e56f5972280aa937ae8caee6872d3','','2b6e56f5972280e78d89e8e5adb48749'),
  @('2dbe56f59722803380fdfb70a2ab49a0','','2dbe56f5972280f09abbc0cc77ee98ea'),
  @('3d8e56f5972280f38057c7af5321ccc5','Tillaga laxen gärna enligt','303e56f5972280a9a9d6cb724f2341b2')
)
foreach ($l in $links) {
  $r = $byId[$l[0]]; $t = $byId[$l[2]]; $token = "[[$($l[2])|$($t.title)]]"; $done = $false
  if ($l[1] -eq 'intro') { $r.intro = "$($r.intro)`n$token"; $done = $true }
  elseif ($l[1] -eq '') { $r.notes = @($r.notes) + [pscustomobject]@{ heading=$null; lines=@($token) }; $done = $true }
  else {
    foreach ($m in @($r.method)) { $s=@($m.steps); for ($i=0;$i -lt $s.Count;$i++) { if (-not $done -and $s[$i].Contains($l[1])) { $s[$i]="$($s[$i])`n$token"; $done=$true } }; $m.steps=$s }
    foreach ($n in @($r.notes)) { if ($n) { $s=@($n.lines); for ($i=0;$i -lt $s.Count;$i++) { if (-not $done -and $s[$i].Contains($l[1])) { $s[$i]="$($s[$i])`n$token"; $done=$true } }; $n.lines=$s } }
    if (-not $done) { $r.notes = @($r.notes) + [pscustomobject]@{ heading=$null; lines=@("$($l[1])`n$token") }; "LINK TEXT NOT FOUND, added as note: $($r.title) / $($l[1])" }
  }
}

# Peposa: the four sub-bullets belong to step 3
$p = $byId['2b6e56f5972280eda612d7a9c8dcb3f4']; $s = @($p.method[0].steps); $i = [array]::FindIndex([string[]]$s,[Predicate[string]]{ param($x) $x -eq 'Förbered resten av ingredienserna.' })
if ($i -ge 0) { $merged = $s[$i] + "`n– " + (($s[($i+1)..($i+4)]) -join "`n– "); $p.method[0].steps = @($s[0..($i-1)]) + $merged + @($s[($i+5)..($s.Count-1)]) } else { "PEPOSA STEP NOT FOUND" }

# Napolitansk Pizza: restore the lost Topping heading
foreach ($g in @($byId['39de56f59722808a9ee6dfabc6772a2c'].groups)) { if ($g.name -eq 'Vit bas 4st') { $g.name = 'Topping – Vit bas 4st' } }

# Fractions become decimals (½ and 1/2 -> 0,5). Scores such as 8/10 stay as they are.
$fractions = @{ '½'=0.5; '¼'=0.25; '¾'=0.75; '⅓'=(1/3); '⅔'=(2/3); '⅛'=0.125 }
function Dec([double]$v){ ([math]::Round($v,2)).ToString('0.##',[Globalization.CultureInfo]::InvariantCulture).Replace('.',',') }
function D([string]$t){
  $t = [regex]::Replace($t,'(\d+)?\s?([½¼¾⅓⅔⅛])',{ param($m) $w = if ($m.Groups[1].Success) { [double]$m.Groups[1].Value } else { 0 }; $p = if ($m.Value -match '^\s') { ' ' } else { '' }; $p + (Dec ($w + $fractions[$m.Groups[2].Value])) })
  [regex]::Replace($t,'(?<![\d/,.-])(?:(\d+)\s)?([1-9])/([2348])(?![\d/])',{ param($m) $w = if ($m.Groups[1].Success) { [double]$m.Groups[1].Value } else { 0 }; Dec ($w + [double]$m.Groups[2].Value/[double]$m.Groups[3].Value) })
}
# Always a space between number and unit, except inside web addresses.
function U([string]$t){ [regex]::Replace($t,'https?://\S+|(?<![\p{L}\d/])(\d+(?:[,.]\d+)?(?:\s?[–-]\s?\d+(?:[,.]\d+)?)?)(kg|mg|ml|cl|dl|msk|tsk|krm|st|cm|mm|min|g|l|L|h|C|°C|°)(?![\p{L}\d])',{ param($m) if ($m.Groups[1].Success) { $m.Groups[1].Value + ' ' + $m.Groups[2].Value } else { $m.Value } }) }
function E($s){ if ($null -eq $s) { return $s }; (U (D ([string]$s))).Replace('&','&amp;').Replace('<','&lt;').Replace('>','&gt;') }
# Sub-items of another ingredient in Notion
$nested = '150g egenmalt','300g vete special','0,5dl vatten.'
$out = New-Object System.Collections.ArrayList
foreach ($r in $all) {
  $groups = @($r.groups | Where-Object { $_ } | ForEach-Object { $items = @($_.items | ForEach-Object { $a=[string]$_[0]; $b=[string]$_[1]
      if (-not $a -and $b -match '^(\d[\d,./–-]*\s?(?:g|kg|ml|cl|dl|l|msk|tsk|krm|st)\b)\s*(.*)$') { $a=$matches[1]; $b=$matches[2] }
      if ($nested -contains ("$a $b").Trim() -and ($r.id -in '2b6e56f5972280e78d89e8e5adb48749','2dbe56f5972280a4b3c7e41a1f144645')) { $a = "– $a" }
      # "1" + "½ tsk salt" is one mixed number split across amount and name
      if ($a -match '^\d+$' -and $b -match '^([½¼¾⅓⅔⅛]|\d/\d(?!\d))\s*(.*)$') { $a = "$a $($matches[1])"; $b = $matches[2] }
      ,@((E $a),(E $b)) }); [ordered]@{ name=(E $_.name); items=$items } })
  $method = @($r.method | Where-Object { $_ } | ForEach-Object { [ordered]@{ name=(E $_.name); steps=@($_.steps | ForEach-Object { E $_ }) } })
  $notes = @($r.notes | Where-Object { $_ } | ForEach-Object { [ordered]@{ heading=(E $_.heading); lines=@($_.lines | ForEach-Object { E $_ }) } })
  [void]$out.Add([ordered]@{ id=$r.id; notion="https://app.notion.com/p/$($r.id)"; title=(E $r.title); intro=(E $r.intro); plan=(E $r.plan); groups=$groups; method=$method; notes=$notes })
}
$json = ConvertTo-Json @($out) -Depth 12 -Compress
[IO.File]::WriteAllText("$repo/recipes-data.js","const RECIPES = $json;`n",$utf8)
$html = [IO.File]::ReadAllText("$src/kokslaget.html",[Text.Encoding]::UTF8)
$html = [regex]::Replace($html,'(?s)// Texts are copied.*?\n\];\r?\n','')
if (-not $html.Contains('recipes-data.js')) { $html = $html.Replace("<script>`n","<script src=`"recipes-data.js`"></script>`n<script>`n") }
$pre = "<!doctype html>`n<html lang=`"sv`">`n<head>`n<meta charset=`"utf-8`">`n<meta name=`"viewport`" content=`"width=device-width, initial-scale=1, viewport-fit=cover`">`n<meta name=`"robots`" content=`"noindex, nofollow`">`n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>`n`n"
[IO.File]::WriteAllText("$repo/index.html",$pre+$html,$utf8)
"built $($out.Count) recipes; inline data gone: $(-not $html.Contains('const RECIPES'))"

