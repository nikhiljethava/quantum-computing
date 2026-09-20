# Article 4 V9 source intake

This folder holds the V9 document supplied by the user for the existing Quantum
Foundry application. It is a source intake folder, not a second application or a
complete copy of the originally described implementation kit.

## Project and source

- Repository: https://github.com/nikhiljethava/quantum-computing
- User-provided app address: https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app/
- Intended companion route: `/series/04-qubit-technologies`
- Original source: `article4-v9/Article_4_V9_Scannable_Edition.docx`
- Article revision: `article4-v9`
- Canonical external Article 4 publication URL: not supplied. The application
  homepage is not the article publication URL.

## Contents

| File | Purpose |
| --- | --- |
| `IMPLEMENTATION_REQUEST.md` | Verbatim original user request, retained separately from article content. |
| `CODEX_ARTICLE4_BRIEF.md` | User-supplied detailed implementation brief, read completely before application edits. |
| `SOURCE_INVENTORY.json` | Source hash, extracted counts, and missing package components. |
| `SOURCE_NOTES.md` | Source qualifications and inconsistencies to retain during implementation. |
| `CHECKOUT_AUDIT.md` | Starting checkout, integration points, and verification status. |
| `import_docx.py` | Reproducible authoring-time extraction; not an application runtime dependency. |
| `article4-v9/article.md` | Readable mechanical extraction, including all 11 tables. |
| `article4-v9/document-blocks.json` | Ordered paragraphs and tables, with image and hyperlink relationships. |
| `article4-v9/references.json` | All 41 original numbered references and their hyperlinks. |
| `article4-v9/media-manifest.json` | Embedded image provenance, hashes, captions, and lesson mapping. |
| `article4-v9/media/` | Eleven byte-identical embedded PNGs: the cover and ten lesson stills. |

The DOCX was preserved byte-for-byte. Paragraph line breaks, table contents,
reference numbers, and caption qualifications were retained. The extraction is
for authoring; the frontend must use normal typed content and imported assets,
not parse Word documents at runtime.

## Missing parts of the requested handoff

The detailed brief was subsequently supplied as
`Quantum_Foundry_Article4_Codex_Instructions.md` and copied to its requested name.
The supplied files still do not include `ACCEPTANCE_CASES.json`,
`golden-fixtures.json`, `validate_handoff.py`, separate V9 review notes, MP4s,
GIFs, four numbered step images per lesson, or separately identified print
images. These were not replaced with older-edition files or invented fixtures.

The implementation uses the supplied stills and provides the four local tools.
Missing original media are explicitly unavailable, and the registry marks the
companion as a preview. Locally authored regression expectations are not the
missing independent fixtures. Running `python3 validate_handoff.py` in this
directory failed because that supplied script is absent. See
`../../docs/ARTICLE_04_IMPLEMENTATION.md` for actual validation and release status.

## Re-extracting

Use a Python environment with `lxml` installed:

```bash
python3 incoming/article4-kit/import_docx.py /absolute/path/to/Article_4_V9_Scannable_Edition.docx
```

This command copies the original and regenerates the extracted source files. It
refuses to replace an existing original with different bytes. It is not the
supplied mathematical handoff validator and does not verify scientific claims.
