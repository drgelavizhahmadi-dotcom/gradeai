# Fix the GradeAIParentReport component file
$file = 'c:\Users\geli1\gradeai\components\GradeAIParentReport.tsx'
$content = Get-Content $file -Raw

# Fix all double dots systematically
$content = $content -replace 'reportData\.\.', 'reportData.scores.'
$content = $content -replace 'reportData\.scores\.warnings', 'reportData.warnings'
$content = $content -replace 'reportData\.scores\.examStructure', 'reportData.examStructure'
$content = $content -replace 'reportData\.scores\.fairnessCheck', 'reportData.fairnessCheck'
$content = $content -replace 'reportData\.scores\.errorAnalysis', 'reportData.errorAnalysis'
$content = $content -replace 'reportData\.scores\.parentActions', 'reportData.parentActions'
$content = $content -replace 'reportData\.scores\.learningPlan', 'reportData.learningPlan'
$content = $content -replace 'reportData\.scores\.strengths', 'reportData.strengths'
$content = $content -replace 'reportData\.scores\.outlook', 'reportData.outlook'
$content = $content -replace 'reportData\.scores\.promotionRisk', 'reportData.warnings.promotionRisk'
$content = $content -replace 'reportData\.scores\.requiredNextGrade', 'reportData.warnings.requiredNextGrade'
$content = $content -replace 'reportData\.scores\.remainingExams', 'reportData.warnings.remainingExams'
$content = $content -replace 'reportData\.scores\.map\(', 'reportData.examStructure.map('
$content = $content -replace 'reportData\.scores\.task', 'reportData.scores.task'

# Fix remaining data. references
$content = $content -replace '\{data\.', '{reportData.'

Set-Content $file $content
Write-Host "Fixed!"
