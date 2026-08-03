function bytesToBase64(bytes) {
  let binary = ''
  const chunkSize = 32768
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

export async function recognizeWithAgnes({ env, attempt, assets, question }) {
  if (!env.AGNES_API_KEY || !env.AGNES_BASE_URL) throw new Error('agnes_not_configured')
  if (assets.some(asset => asset.mime_type === 'application/pdf')) throw new Error('pdf_page_conversion_required')
  const imageContent = assets.map(asset => ({
    type: 'image_url',
    image_url: { url: `data:${asset.mime_type};base64,${bytesToBase64(asset.bytes)}` },
  }))
  const markPoints = question?.markscheme?.mark_points || []
  const rowsByPart = new Map((question?.markscheme?.rows || []).map(row => [row.part, row]))
  const answersByPart = new Map((question?.answers || []).map(row => [row.part, row]))
  const prompt = {
    task: 'Transcribe handwritten mathematics faithfully. Preserve the order of work, equations, crossed-out uncertainty, and final answers. Return JSON only.',
    output_schema: {
      transcription_text: 'string',
      latex_blocks: ['string'],
      ordered_steps: [{ index: 'number', text: 'string', latex: 'string|null', confidence: 'number' }],
      overall_confidence: 'number',
      uncertain_regions: [{ page: 'number', description: 'string' }],
      mark_point_suggestions: [{ mark_point_id: 'string', awarded: 'boolean', confidence: 'number', evidence: 'string' }],
    },
    question_locator: { subject_id: attempt.subject_id, question_id: attempt.question_id, part_label: attempt.part_label },
    registered_mark_points: markPoints.map(row => ({
      id: row.id,
      mark_value: Number(row.marks) || 0,
      official_point_text: row.description || row.text || '',
      official_part_markscheme: rowsByPart.get(row.part_label)?.text || '',
      official_final_answer: answersByPart.get(row.part_label)?.text || '',
      knowledge_point_codes: Array.isArray(row.knowledge_point_codes)
        ? row.knowledge_point_codes
        : (row.knowledge_point_code ? [row.knowledge_point_code] : []),
    })),
    rule: 'Mark-point suggestions are advisory. Compare the student work against the complete official marking text and official final answer supplied for that part. Do not invent a missing formula, step, answer, mark point, alternative method, or follow-through rule.',
  }
  const response = await fetch(`${String(env.AGNES_BASE_URL).replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.AGNES_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.AGNES_MODEL || 'agnes-2.0-flash',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: [{ type: 'text', text: JSON.stringify(prompt) }, ...imageContent] }],
    }),
  })
  if (!response.ok) throw new Error(`agnes_http_${response.status}`)
  const payload = await response.json()
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error('agnes_empty_response')
  return typeof content === 'string' ? JSON.parse(content) : content
}
