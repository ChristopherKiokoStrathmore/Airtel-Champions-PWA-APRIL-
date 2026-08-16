# Shadow IT / VM-Approval Document

Source for `Airtel_Champions_App_ShadowIT_VM_Approval.docx` (written to the
repository root). This is the formal submission prepared under Airtel Africa
Shadow IT Policy v2.0, covering the as-is architecture, the proposed migration to
Airtel-managed VMs, VM sizing, and the data-security controls.

## Files

- `gen_docx.py` - builds the `.docx` (python-docx). Reads the two figures from
  this folder and writes the document to the repo root.
- `gen_diagrams.py` - regenerates the architecture figures (matplotlib) into this
  folder. Only needed if the diagrams change.
- `fig1_asis.png`, `fig2_tobe.png` - as-is / to-be architecture diagrams.

House style: no en/em dashes anywhere in the document.

## Regenerate

```bash
python -m pip install python-docx matplotlib   # once
cd docs/vm-approval
python gen_diagrams.py   # only if the diagrams changed
python gen_docx.py       # writes ../../Airtel_Champions_App_ShadowIT_VM_Approval.docx
```

Paths resolve relative to the scripts (via `__file__`), so this works from any
checkout. After regenerating, open the `.docx` in Word and use Update Field on
the Table of Contents to refresh page numbers.

## Editing content

Content lives in `gen_docx.py` as `h1()/h2()/P()/add_table()/note_box()` calls,
section by section. The placeholders in Section 1 (requestor, business owner,
document code, Opco confirmation) are for the requesting function to complete;
they are intentionally left blank.
