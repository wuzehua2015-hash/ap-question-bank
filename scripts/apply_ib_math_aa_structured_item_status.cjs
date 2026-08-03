#!/usr/bin/env node
throw new Error('Retired: this per-item Math AA writer may not modify the bank. Use install_ib_math_aa_structured_batch.cjs with a fully reviewed batch payload.')
// Applies only explicit, source-checked structured-item status records. This
// prevents a generic text replacement from promoting a neighbouring item.
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const bankPath = path.join(ROOT, 'public', 'data', 'ib', 'math-aa-sl', 'paper_bank.json')
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'))
const item = bank.find(row => row.question_id === 'P2-000047')
if (!item) throw new Error('P2-000047 not found')
if (!item.content || !Array.isArray(item.answers) || !Array.isArray(item.markscheme?.rows)) throw new Error('P2-000047 structured payload is incomplete')

item.publication_review = {
  ...item.publication_review,
  transcription_basis: 'complete structured transcription checked against rendered question, diagram-only figure asset, and both official markscheme pages',
}
item.structured_field_audit = [
  { field_path: 'content.stem_blocks[0]', source_role: 'question', source_file_sha256: '616fc17b9a6bf83dd8d8a2c6842cbfdc668689fb54f958b2db3086c377016755', source_page: 4, asset_sha256: '13e992c562a4f2bcd3d55cff6fc54ddafcb5edf71242951dc29f9abf4ad5b319' },
  { field_path: 'content.stem_blocks[1]', source_role: 'figure', source_file_sha256: '616fc17b9a6bf83dd8d8a2c6842cbfdc668689fb54f958b2db3086c377016755', source_page: 4, parent_asset_sha256: '13e992c562a4f2bcd3d55cff6fc54ddafcb5edf71242951dc29f9abf4ad5b319', derived_asset_sha256: 'f7257425ea10d9bfe0952859f9dfee65746e18b634102ee4a92f47dfb73a6382', crop_pixels: [180, 155, 850, 465] },
  { field_path: 'content.parts', source_role: 'question', source_file_sha256: '616fc17b9a6bf83dd8d8a2c6842cbfdc668689fb54f958b2db3086c377016755', source_page: 4, asset_sha256: '13e992c562a4f2bcd3d55cff6fc54ddafcb5edf71242951dc29f9abf4ad5b319' },
  { field_path: 'answers', source_role: 'markscheme', source_file_sha256: '8d550d5c6c9156dc9bfbfded26357ced5ee2708d9662baa3919724d8405c356e', source_pages: [8, 9] },
  { field_path: 'markscheme.rows[a]', source_role: 'markscheme', source_file_sha256: '8d550d5c6c9156dc9bfbfded26357ced5ee2708d9662baa3919724d8405c356e', source_page: 8 },
  { field_path: 'markscheme.rows[b]', source_role: 'markscheme', source_file_sha256: '8d550d5c6c9156dc9bfbfded26357ced5ee2708d9662baa3919724d8405c356e', source_pages: [8, 9] },
]
item.transcription_status = 'structured_reviewed'
item.display_mode = 'structured'

const populationItem = bank.find(row => row.question_id === 'P2-000050')
if (!populationItem) throw new Error('P2-000050 not found')
if (!populationItem.content || !Array.isArray(populationItem.answers) || !Array.isArray(populationItem.markscheme?.rows)) throw new Error('P2-000050 structured payload is incomplete')
populationItem.publication_review = {
  ...populationItem.publication_review,
  transcription_basis: 'complete structured transcription checked against the rendered question and official markscheme asset',
}
populationItem.structured_field_audit = [
  { field_path: 'content.stem_blocks', source_role: 'question', source_file_sha256: '616fc17b9a6bf83dd8d8a2c6842cbfdc668689fb54f958b2db3086c377016755', source_page: 7, asset_sha256: '1ae2edfa8bc59561bece4114a5c9ab03f2410f246b7864181fcc7652053ac591' },
  { field_path: 'content.parts[main]', source_role: 'question', source_file_sha256: '616fc17b9a6bf83dd8d8a2c6842cbfdc668689fb54f958b2db3086c377016755', source_page: 7, asset_sha256: '1ae2edfa8bc59561bece4114a5c9ab03f2410f246b7864181fcc7652053ac591' },
  { field_path: 'answers', source_role: 'markscheme', source_file_sha256: '8d550d5c6c9156dc9bfbfded26357ced5ee2708d9662baa3919724d8405c356e', source_page: 12, asset_sha256: '3a4b2ce51df897195ea3ed32465acb1a252948ed21371de392356409c75fdcf0' },
  { field_path: 'markscheme.rows[main]', source_role: 'markscheme', source_file_sha256: '8d550d5c6c9156dc9bfbfded26357ced5ee2708d9662baa3919724d8405c356e', source_page: 12, asset_sha256: '3a4b2ce51df897195ea3ed32465acb1a252948ed21371de392356409c75fdcf0' },
]
populationItem.transcription_status = 'structured_reviewed'
populationItem.display_mode = 'structured'

const binomialItem = bank.find(row => row.question_id === 'P2-000051')
if (!binomialItem) throw new Error('P2-000051 not found')
if (!binomialItem.content || !Array.isArray(binomialItem.answers) || !Array.isArray(binomialItem.markscheme?.rows)) throw new Error('P2-000051 structured payload is incomplete')
binomialItem.publication_review = { ...binomialItem.publication_review, transcription_basis: 'complete structured transcription checked against both rendered question pages and both official markscheme pages' }
binomialItem.structured_field_audit = [
  { field_path: 'content.stem_blocks', source_role: 'question', source_file_sha256: '616fc17b9a6bf83dd8d8a2c6842cbfdc668689fb54f958b2db3086c377016755', source_pages: [8, 9], asset_sha256: 'cd35f265c47d144fade0045d2331bce3ea5686f86a1a456f8e6311ef16669aff' },
  { field_path: 'content.parts[main]', source_role: 'question', source_file_sha256: '616fc17b9a6bf83dd8d8a2c6842cbfdc668689fb54f958b2db3086c377016755', source_pages: [8, 9], asset_sha256: 'f93cbce5fb21f22e153a75dec90eeda4aa4023e8f86fca753bbe2931eae06a37' },
  { field_path: 'answers', source_role: 'markscheme', source_file_sha256: '8d550d5c6c9156dc9bfbfded26357ced5ee2708d9662baa3919724d8405c356e', source_pages: [13, 14], asset_sha256: 'e63b1ac4824735f75bac5656d187ccc41e399b2a8efb675d0d6900435cce690a' },
  { field_path: 'markscheme.rows[main]', source_role: 'markscheme', source_file_sha256: '8d550d5c6c9156dc9bfbfded26357ced5ee2708d9662baa3919724d8405c356e', source_pages: [13, 14], asset_sha256: 'e95949480c54ba0cb2dea6b9b030c035286fcfdb325821885120ec4588099e98' },
]
binomialItem.transcription_status = 'structured_reviewed'
binomialItem.display_mode = 'structured'

const kinematicsItem = bank.find(row => row.question_id === 'P2-000052')
if (!kinematicsItem) throw new Error('P2-000052 not found')
if (!kinematicsItem.content || !Array.isArray(kinematicsItem.answers) || !Array.isArray(kinematicsItem.markscheme?.rows)) throw new Error('P2-000052 structured payload is incomplete')
kinematicsItem.publication_review = { ...kinematicsItem.publication_review, transcription_basis: 'complete structured transcription checked against rendered question graph and all three official markscheme pages' }
const questionHash = 'f18ee1f525c47df79fad43524995d9f1093696c1d18d694d7663e19d379000d7'
const markschemeHash = '8d550d5c6c9156dc9bfbfded26357ced5ee2708d9662baa3919724d8405c356e'
kinematicsItem.structured_field_audit = [
  { field_path: 'content.stem_blocks[0]', source_role: 'question', source_file_sha256: '616fc17b9a6bf83dd8d8a2c6842cbfdc668689fb54f958b2db3086c377016755', source_page: 10, asset_sha256: questionHash },
  { field_path: 'content.stem_blocks[1]', source_role: 'figure', source_file_sha256: '616fc17b9a6bf83dd8d8a2c6842cbfdc668689fb54f958b2db3086c377016755', source_page: 10, parent_asset_sha256: questionHash, derived_asset_sha256: 'a23c6658d213078c6c6c5b47d3f8e47f2b98392730d3c51b724b7d94f005eaed', crop_pixels: [260, 150, 770, 610] },
  ...['a', 'b', 'c', 'd', 'e'].map(part => ({ field_path: `content.parts[${part}]`, source_role: 'question', source_file_sha256: '616fc17b9a6bf83dd8d8a2c6842cbfdc668689fb54f958b2db3086c377016755', source_page: 10, asset_sha256: questionHash })),
  { field_path: 'answers', source_role: 'markscheme', source_file_sha256: markschemeHash, source_pages: [15, 16, 17] },
  ...['a', 'b', 'c', 'd', 'e'].map(part => ({ field_path: `markscheme.rows[${part}]`, source_role: 'markscheme', source_file_sha256: markschemeHash, source_pages: [15, 16, 17] })),
]
kinematicsItem.transcription_status = 'structured_reviewed'
kinematicsItem.display_mode = 'structured'

const sectorItem = bank.find(row => row.question_id === 'P2-000053')
if (!sectorItem) throw new Error('P2-000053 not found')
const sectorQuestionHash = '609130d6ec8b7d4d655fe24dad5f18bf31ce3337e9e1f29a1cd978c1ac271029'
const sectorQuestionContinuationHash = 'fa9b2859b43e01a0916731180964b920ba3de2ce6ba3ce3f03e9328b7b5df690'
const sectorMarkschemeHash = '8d550d5c6c9156dc9bfbfded26357ced5ee2708d9662baa3919724d8405c356e'
const sectorMarkschemeAssets = ['a888cd3942499252092b76fe2663f69ef7df845f80eb6ae90b8cda2b22233dd6', '0b6487e2923bfd9a18d7d645ab0c80ab2def8fe8b2ce87e55857c11a301927f0', 'caef01c9e022434e35e47724d3bd59d9a21a926adedbc5f95bbd286d0b8bbaca']
const sectorRows = [
  {
    part: 'a', marks: 4,
    text: 'Note: In parts (a) and (b) of this question, candidates may consider either triangle AOD or triangle AOE and work correctly to obtain the answer. Side AD is interchangeable with side AE in the following MS.\n\nattempt to use right angled trigonometry or sine rule to find \\(AE\\) in terms of \\(r\\) and \\(\\alpha\\) (M1)\n\\[\\tan\\alpha=\\frac r{AE}\\quad\\text{OR}\\quad\\frac{AE}{\\sin(\\frac\\pi2-\\alpha)}=\\frac r{\\sin\\alpha}\\]\n\\[AE=\\frac r{\\tan\\alpha}\\quad\\text{OR}\\quad AE=\\frac{r\\sin(\\frac\\pi2-\\alpha)}{\\sin\\alpha}\\quad\\text{OR}\\quad AE=\\frac{r\\cos\\alpha}{\\sin\\alpha}\\] (A1)\n\nvalid approach to find the area of ADOE (M1)\n\\[2\\times\\text{ area of triangle AOE}\\quad\\text{OR}\\quad\\text{area of triangle AED}+\\text{area of triangle OED}\\quad\\text{OR}\\quad OE\\times AE\\]\n\\[\\text{Area ADOE}=2\\left(\\frac12\\cdot\\frac r{\\tan\\alpha}\\cdot r\\right)\\quad\\text{OR}\\quad r\\times AE\\] (A1)\n\\[\\text{Area ADOE}=\\frac{r^2}{\\tan\\alpha}\\] (AG)',
    official_notes: ['In parts (a) and (b) of this question, candidates may consider either triangle AOD or triangle AOE and work correctly to obtain the answer. Side AD is interchangeable with side AE in the following MS.'],
    mark_points: [
      { id: 'MP1', part_label: 'a', code: 'M1', marks: 1, description: 'attempt to use right angled trigonometry or sine rule to find \\(AE\\) in terms of \\(r\\) and \\(\\alpha\\); \\(\\tan\\alpha=\\frac r{AE}\\) OR \\(\\frac{AE}{\\sin(\\frac\\pi2-\\alpha)}=\\frac r{\\sin\\alpha}\\)', knowledge_point_codes: ['AA-3.3'] },
      { id: 'MP2', part_label: 'a', code: 'A1', marks: 1, description: '\\(AE=\\frac r{\\tan\\alpha}\\) OR \\(AE=\\frac{r\\sin(\\frac\\pi2-\\alpha)}{\\sin\\alpha}\\) OR \\(AE=\\frac{r\\cos\\alpha}{\\sin\\alpha}\\)', knowledge_point_codes: ['AA-3.3'] },
      { id: 'MP3', part_label: 'a', code: 'M1', marks: 1, description: 'valid approach to find the area of ADOE; \\(2\\times\\text{ area of triangle AOE}\\) OR \\(\\text{area of triangle AED}+\\text{area of triangle OED}\\) OR \\(OE\\times AE\\)', knowledge_point_codes: ['AA-3.2'] },
      { id: 'MP4', part_label: 'a', code: 'A1', marks: 1, description: '\\(\\text{Area ADOE}=2\\left(\\frac12\\cdot\\frac r{\\tan\\alpha}\\cdot r\\right)\\) OR \\(r\\times AE\\)', knowledge_point_codes: ['AA-3.2'] },
      { id: 'MP5', part_label: 'a', code: 'AG', marks: 0, description: '\\(\\text{Area ADOE}=\\frac{r^2}{\\tan\\alpha}\\)', knowledge_point_codes: ['AA-3.2'] },
    ],
  },
  {
    part: 'b.i', marks: 2,
    text: 'recognizing that the sum of the angles of a kite is \\(2\\pi\\) (M1)\n\\[D\\hat OE+O\\hat EA+E\\hat AD+A\\hat DO=2\\pi\\quad\\text{OR}\\quad2\\alpha+2\\cdot\\frac\\pi2+D\\hat OE=2\\pi\\]\n\\[D\\hat OE=\\pi-2\\alpha\\] (A1)\n\nNote: Award M1A0 if candidate uses degrees (i.e. \\(D\\hat OE+O\\hat EA+E\\hat AD+A\\hat DO=360^\\circ\\) or \\(2\\alpha+2\\cdot\\frac\\pi2+D\\hat OE=360^\\circ\\)) and obtains \\(D\\hat OE=180^\\circ-2\\alpha\\).',
    official_notes: ['Award M1A0 if candidate uses degrees (i.e. \\(D\\hat OE+O\\hat EA+E\\hat AD+A\\hat DO=360^\\circ\\) or \\(2\\alpha+2\\cdot\\frac\\pi2+D\\hat OE=360^\\circ\\)) and obtains \\(D\\hat OE=180^\\circ-2\\alpha\\).'],
    mark_points: [
      { id: 'MP6', part_label: 'b.i', code: 'M1', marks: 1, description: 'recognizing that the sum of the angles of a kite is \\(2\\pi\\); \\(D\\hat OE+O\\hat EA+E\\hat AD+A\\hat DO=2\\pi\\) OR \\(2\\alpha+2\\cdot\\frac\\pi2+D\\hat OE=2\\pi\\)', knowledge_point_codes: ['AA-3.4'] },
      { id: 'MP7', part_label: 'b.i', code: 'A1', marks: 1, description: '\\(D\\hat OE=\\pi-2\\alpha\\)', knowledge_point_codes: ['AA-3.4'] },
      { id: 'MP8', part_label: 'b.i', code: 'Note', marks: 0, description: 'Award M1A0 if candidate uses degrees (i.e. \\(D\\hat OE+O\\hat EA+E\\hat AD+A\\hat DO=360^\\circ\\) or \\(2\\alpha+2\\cdot\\frac\\pi2+D\\hat OE=360^\\circ\\)) and obtains \\(D\\hat OE=180^\\circ-2\\alpha\\).', knowledge_point_codes: ['AA-3.4'] },
    ],
  },
  {
    part: 'b.ii', marks: 3,
    text: 'valid approach to find the area of \\(R\\) (M1)\n\\[\\text{area of kite}-\\text{area of sector}\\quad\\text{OR}\\quad2(\\text{area of triangle AOE}-0.5\\text{ area of sector OED})\\]\n\\[\\text{Area of sector}=\\frac12r^2\\cdot D\\hat OE\\left(=\\frac12r^2(\\pi-2\\alpha)\\right)\\text{ seen anywhere}\\] (A1)\n\\[\\text{Area of R}=\\frac{r^2}{\\tan\\alpha}-\\frac12r^2(\\pi-2\\alpha)\\] (A1)\n\nNote: Accept \\(\\frac{r^2}{\\tan\\alpha}-\\frac12r^2\\cdot D\\hat OE\\).',
    official_notes: ['Accept \\(\\frac{r^2}{\\tan\\alpha}-\\frac12r^2\\cdot D\\hat OE\\).'],
    mark_points: [
      { id: 'MP9', part_label: 'b.ii', code: 'M1', marks: 1, description: 'valid approach to find the area of \\(R\\); area of kite − area of sector OR \\(2(\\text{area of triangle AOE}-0.5\\text{ area of sector OED})\\)', knowledge_point_codes: ['AA-3.4'] },
      { id: 'MP10', part_label: 'b.ii', code: 'A1', marks: 1, description: '\\(\\text{Area of sector}=\\frac12r^2\\cdot D\\hat OE\\left(=\\frac12r^2(\\pi-2\\alpha)\\right)\\) seen anywhere', knowledge_point_codes: ['AA-3.4'] },
      { id: 'MP11', part_label: 'b.ii', code: 'A1', marks: 1, description: '\\(\\text{Area of R}=\\frac{r^2}{\\tan\\alpha}-\\frac12r^2(\\pi-2\\alpha)\\)', knowledge_point_codes: ['AA-3.4'] },
      { id: 'MP12', part_label: 'b.ii', code: 'Note', marks: 0, description: 'Accept \\(\\frac{r^2}{\\tan\\alpha}-\\frac12r^2\\cdot D\\hat OE\\).', knowledge_point_codes: ['AA-3.4'] },
    ],
  },
  {
    part: 'c', marks: 4,
    text: 'equating their area formula to \\(\\pi r^2\\) (M1)\n\\[\\frac{r^2}{\\tan\\alpha}-\\frac12r^2(\\pi-2\\alpha)=\\pi r^2\\]\n\ncorrect equation in terms of \\(\\alpha\\) (A1)\n\\[\\frac1{\\tan\\alpha}-\\frac12(\\pi-2\\alpha)=\\pi\\]\n\nvalid approach to solve the equation (M1)\n\\[\\alpha=0.218979\\ldots\\]\n\\[\\alpha=0.219\\] (A1)',
    mark_points: [
      { id: 'MP13', part_label: 'c', code: 'M1', marks: 1, description: 'equating their area formula to \\(\\pi r^2\\); \\(\\frac{r^2}{\\tan\\alpha}-\\frac12r^2(\\pi-2\\alpha)=\\pi r^2\\)', knowledge_point_codes: ['AA-3.4'] },
      { id: 'MP14', part_label: 'c', code: 'A1', marks: 1, description: 'correct equation in terms of \\(\\alpha\\); \\(\\frac1{\\tan\\alpha}-\\frac12(\\pi-2\\alpha)=\\pi\\)', knowledge_point_codes: ['AA-3.4'] },
      { id: 'MP15', part_label: 'c', code: 'M1', marks: 1, description: 'valid approach to solve the equation; \\(\\alpha=0.218979\\ldots\\)', knowledge_point_codes: ['AA-3.4'] },
      { id: 'MP16', part_label: 'c', code: 'A1', marks: 1, description: '\\(\\alpha=0.219\\)', knowledge_point_codes: ['AA-3.4'] },
    ],
  },
]
const sectorParts = [
  { label: 'a', marks: 4, text: 'Show that the area of the quadrilateral \\(ADOE\\) is \\(\\frac{r^2}{\\tan\\alpha}\\).', scheme: sectorRows[0].text },
  { label: 'b.i', marks: 2, text: 'Find \\(D\\hat OE\\) in terms of \\(\\alpha\\).', scheme: sectorRows[1].text },
  { label: 'b.ii', marks: 3, text: 'Hence or otherwise, find an expression for the area of \\(R\\).', scheme: sectorRows[2].text },
  { label: 'c', marks: 4, text: 'Find the value of \\(\\alpha\\) for which the area of \\(R\\) is equal to the area of the circle of centre \\(O\\) and radius \\(r\\).', scheme: sectorRows[3].text },
]
sectorItem.text = 'The following diagram shows a sector \\(ABC\\) of a circle with centre \\(A\\). The angle \\(B\\hat AC=2\\alpha\\), where \\(0<\\alpha<\\frac\\pi2\\), and \\(O\\hat EA=\\frac\\pi2\\). A circle with centre \\(O\\) and radius \\(r\\) is inscribed in sector \\(ABC\\). \\(AB\\) and \\(AC\\) are both tangent to the circle at points \\(D\\) and \\(E\\) respectively. ' + sectorParts.map(part => `(${part.label}) ${part.text}`).join(' ')
sectorItem.content = {
  stem_blocks: [
    { type: 'paragraph', text: 'The following diagram shows a sector \\(ABC\\) of a circle with centre \\(A\\). The angle \\(B\\hat AC=2\\alpha\\), where \\(0<\\alpha<\\frac\\pi2\\), and \\(O\\hat EA=\\frac\\pi2\\).' },
    { type: 'paragraph', text: 'A circle with centre \\(O\\) and radius \\(r\\) is inscribed in sector \\(ABC\\). \\(AB\\) and \\(AC\\) are both tangent to the circle at points \\(D\\) and \\(E\\) respectively.' },
    { type: 'figure', asset: { path: 'data/ib/math-aa/real-source-assets/figures/mathsaa_sl_p2_2022_nov_q08_sector.webp', sha256: 'b252729b56e86d408fdaca9211abcb450b5efc357a2d9fd9ef2c8f427736e13e', parent_asset_sha256: sectorQuestionHash, crop_pixels: [220, 300, 840, 790] }, alt: 'Sector ABC centred at A, with angle BAC equal to 2 alpha. A circle with centre O and radius r is tangent to sides AB and AC at D and E.', caption: 'Diagram not to scale.' },
    { type: 'paragraph', text: '\\(R\\) represents the shaded region shown in the following diagram.' },
    { type: 'figure', asset: { path: 'data/ib/math-aa/real-source-assets/figures/mathsaa_sl_p2_2022_nov_q08_shaded_region.webp', sha256: '2aa1e6d23d4eb47606f5761022d1f9156ed240f60c159a9c3a7e2f51abbc2307', parent_asset_sha256: sectorQuestionContinuationHash, crop_pixels: [250, 250, 850, 710] }, alt: 'The same sector and inscribed circle, with the region bounded by AE, AD and arc ED shaded and labelled R.', caption: 'Diagram not to scale.' },
  ],
  parts: sectorParts.map(part => ({ label: part.label, marks: part.marks, blocks: [{ type: 'paragraph', text: part.text }] })),
}
sectorItem.parts = sectorParts
sectorItem.part_marks = sectorParts.map(part => ({ label: part.label, marks: part.marks }))
sectorItem.answers = [
  { part: 'a', text: '\\(\\text{Area ADOE}=\\frac{r^2}{\\tan\\alpha}\\).' },
  { part: 'b.i', text: '\\(D\\hat OE=\\pi-2\\alpha\\).' },
  { part: 'b.ii', text: '\\(\\text{Area of R}=\\frac{r^2}{\\tan\\alpha}-\\frac12r^2(\\pi-2\\alpha)\\). Accept \\(\\frac{r^2}{\\tan\\alpha}-\\frac12r^2\\cdot D\\hat OE\\).' },
  { part: 'c', text: '\\(\\alpha=0.219\\).' },
]
sectorItem.solution = { outline: '\\(AE=\\frac r{\\tan\\alpha}\\); \\(\\text{Area ADOE}=\\frac{r^2}{\\tan\\alpha}\\); \\(D\\hat OE=\\pi-2\\alpha\\); \\(\\text{Area R}=\\frac{r^2}{\\tan\\alpha}-\\frac12r^2(\\pi-2\\alpha)\\); \\(\\alpha=0.219\\).' }
sectorItem.markscheme = { rows: sectorRows, mark_points: sectorRows.flatMap(row => row.mark_points) }
sectorItem.publication_review = { ...sectorItem.publication_review, transcription_basis: 'complete structured transcription checked against both rendered question pages, two diagram-only figure assets, and all three official markscheme pages' }
sectorItem.structured_field_audit = [
  { field_path: 'content.stem_blocks[0]', source_role: 'question', source_file_sha256: sectorItem.source.paper_sha256, source_page: 11, asset_sha256: sectorQuestionHash },
  { field_path: 'content.stem_blocks[1]', source_role: 'question', source_file_sha256: sectorItem.source.paper_sha256, source_page: 11, asset_sha256: sectorQuestionHash },
  { field_path: 'content.stem_blocks[2]', source_role: 'figure', source_file_sha256: sectorItem.source.paper_sha256, source_page: 11, parent_asset_sha256: sectorQuestionHash, derived_asset_sha256: 'b252729b56e86d408fdaca9211abcb450b5efc357a2d9fd9ef2c8f427736e13e', crop_pixels: [220, 300, 840, 790] },
  { field_path: 'content.stem_blocks[3]', source_role: 'question', source_file_sha256: sectorItem.source.paper_sha256, source_page: 12, asset_sha256: sectorQuestionContinuationHash },
  { field_path: 'content.stem_blocks[4]', source_role: 'figure', source_file_sha256: sectorItem.source.paper_sha256, source_page: 12, parent_asset_sha256: sectorQuestionContinuationHash, derived_asset_sha256: '2aa1e6d23d4eb47606f5761022d1f9156ed240f60c159a9c3a7e2f51abbc2307', crop_pixels: [250, 250, 850, 710] },
  ...sectorParts.map(part => ({ field_path: `content.parts[${part.label}]`, source_role: 'question', source_file_sha256: sectorItem.source.paper_sha256, source_page: part.label === 'a' ? 11 : 12, asset_sha256: part.label === 'a' ? sectorQuestionHash : sectorQuestionContinuationHash })),
  ...sectorItem.answers.map(answer => ({ field_path: `answers[${answer.part}]`, source_role: 'markscheme', source_file_sha256: sectorMarkschemeHash, source_pages: answer.part === 'a' ? [18] : answer.part === 'b.i' || answer.part === 'b.ii' ? [19] : [20], asset_sha256: answer.part === 'a' ? sectorMarkschemeAssets[0] : answer.part === 'b.i' || answer.part === 'b.ii' ? sectorMarkschemeAssets[1] : sectorMarkschemeAssets[2] })),
  ...sectorRows.map(row => ({ field_path: `markscheme.rows[${row.part}]`, source_role: 'markscheme', source_file_sha256: sectorMarkschemeHash, source_pages: row.part === 'a' ? [18] : row.part === 'b.i' || row.part === 'b.ii' ? [19] : [20], asset_sha256: row.part === 'a' ? sectorMarkschemeAssets[0] : row.part === 'b.i' || row.part === 'b.ii' ? sectorMarkschemeAssets[1] : sectorMarkschemeAssets[2] })),
]
sectorItem.transcription_status = 'structured_reviewed'
sectorItem.display_mode = 'structured'
sectorItem.knowledge_point_classification = {
  ...sectorItem.knowledge_point_classification,
  review_basis_sha256: require('./lib/ib_math_aa_knowledge_classifier.cjs').reviewBasisHash(sectorItem),
  evidence: [
    `question source ${sectorItem.source.paper_sha256}`,
    `markscheme source ${sectorItem.source.markscheme_sha256}`,
    'verified 13 scored marks and three official non-mark notes across 4 part(s)',
  ],
}

const ledgerPath = path.join(ROOT, 'public', 'data', 'ib', 'math-aa', 'item_classification_ledger.json')
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))
const ledgerRow = ledger.items.find(row => row.subject_id === 'ib-math-aa-sl' && row.question_id === 'P2-000053')
if (!ledgerRow) throw new Error('P2-000053 classification-ledger entry not found')
const { reviewBasisHash } = require('./lib/ib_math_aa_knowledge_classifier.cjs')
ledgerRow.review_basis_sha256 = reviewBasisHash(sectorItem)
ledgerRow.mark_point_count = sectorItem.markscheme.mark_points.length
fs.writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\\n`, 'utf8')
fs.writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8')
// Write a final canonical UTF-8 JSON payload; this must end with an actual LF, not a literal backslash-n.
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + String.fromCharCode(10), 'utf8')
console.log('Applied structured status through ib-math-aa-sl::P2-000053')
