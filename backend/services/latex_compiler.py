"""
Convert a TipTap JSON document to a LaTeX source string.
Handles all standard TipTap node types plus PaperCraft custom nodes.
"""
from typing import Any
import math


def doc_to_latex(paper: dict) -> str:
    """
    Convert a paper dict (from DB) to a complete LaTeX document string.
    """
    title = paper.get("title", "Untitled")
    authors = paper.get("authors", [])
    abstract = paper.get("abstract", "")
    content = paper.get("content", {})

    author_str = " \\and ".join(authors) if authors else "Anonymous"

    preamble = r"""\documentclass[12pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{amsmath,amssymb,amsfonts}
\usepackage{graphicx}
\usepackage{hyperref}
\usepackage{geometry}
\usepackage{setspace}
\usepackage{caption}
\geometry{margin=2.5cm}
\onehalfspacing
\hypersetup{colorlinks=true,linkcolor=blue,citecolor=blue,urlcolor=blue}
"""

    body_parts = []

    # Abstract
    if abstract:
        body_parts.append(f"\\begin{{abstract}}\n{_escape_latex(abstract)}\n\\end{{abstract}}\n")

    # Document content
    if content and content.get("content"):
        body_parts.append(_process_nodes(content["content"], paper))

    body = "\n".join(body_parts)

    return f"""{preamble}
\\begin{{document}}

\\title{{{_escape_latex(title)}}}
\\author{{{author_str}}}
\\date{{\\today}}
\\maketitle

{body}

\\end{{document}}
"""


def _process_nodes(nodes: list, paper: dict) -> str:
    parts = []
    for node in nodes:
        parts.append(_process_node(node, paper))
    return "\n".join(filter(None, parts))


def _process_node(node: dict, paper: dict) -> str:
    node_type = node.get("type", "")

    if node_type == "paragraph":
        content = _process_inline(node.get("content", []))
        return content + "\n" if content else ""

    elif node_type == "heading":
        level = node.get("attrs", {}).get("level", 1)
        content = _process_inline(node.get("content", []))
        cmd = {1: "section", 2: "subsection", 3: "subsubsection"}.get(level, "section")
        return f"\\{cmd}{{{content}}}\n"

    elif node_type == "blockquote":
        inner = _process_nodes(node.get("content", []), paper)
        return f"\\begin{{quote}}\n{inner}\n\\end{{quote}}\n"

    elif node_type == "bulletList":
        items = []
        for item in node.get("content", []):
            item_content = _process_nodes(item.get("content", []), paper)
            items.append(f"  \\item {item_content.strip()}")
        return "\\begin{itemize}\n" + "\n".join(items) + "\n\\end{itemize}\n"

    elif node_type == "orderedList":
        items = []
        for item in node.get("content", []):
            item_content = _process_nodes(item.get("content", []), paper)
            items.append(f"  \\item {item_content.strip()}")
        return "\\begin{enumerate}\n" + "\n".join(items) + "\n\\end{enumerate}\n"

    elif node_type == "listItem":
        return _process_nodes(node.get("content", []), paper)

    elif node_type == "latexBlock":
        latex = node.get("attrs", {}).get("latex", "")
        return f"\\[\n{latex}\n\\]\n"

    elif node_type == "figure":
        return _render_figure_node(node, paper)

    elif node_type == "tableData":
        return _render_table_node(node)

    elif node_type == "horizontalRule":
        return "\\hrule\n"

    elif node_type == "hardBreak":
        return "\\\\\n"

    elif node_type == "codeBlock":
        lang = node.get("attrs", {}).get("language", "")
        code = _process_inline(node.get("content", []))
        return f"\\begin{{verbatim}}\n{code}\n\\end{{verbatim}}\n"

    else:
        # Fallback: process children
        children = node.get("content", [])
        if children:
            return _process_nodes(children, paper)
        return ""


def _process_inline(nodes: list) -> str:
    parts = []
    for node in nodes:
        node_type = node.get("type", "")
        text = node.get("text", "")
        marks = node.get("marks", [])

        if node_type == "text":
            result = _escape_latex(text)
            for mark in marks:
                mark_type = mark.get("type", "")
                if mark_type == "bold":
                    result = f"\\textbf{{{result}}}"
                elif mark_type == "italic":
                    result = f"\\textit{{{result}}}"
                elif mark_type == "underline":
                    result = f"\\underline{{{result}}}"
                elif mark_type == "strike":
                    result = f"\\sout{{{result}}}"
                elif mark_type == "figureCitation":
                    fig_id = mark.get("attrs", {}).get("figureId", "")
                    result = f"\\ref{{fig:{fig_id}}}"
            parts.append(result)

        elif node_type == "latexInline":
            latex = node.get("attrs", {}).get("latex", "")
            parts.append(f"${latex}$")

        elif node_type == "hardBreak":
            parts.append("\\\\\n")

    return "".join(parts)


def _render_figure_node(node: dict, paper: dict) -> str:
    figure_id = node.get("attrs", {}).get("figureId", "")
    figures = paper.get("figures", [])
    figure = next((f for f in figures if f["id"] == figure_id), None)

    if not figure:
        return f"% Figure {figure_id} not found\n"

    panels = figure.get("panels", [])
    n = len(panels)
    legend = _escape_latex(figure.get("legend", ""))
    title = _escape_latex(figure.get("title", ""))
    num = figure.get("number", 1)

    # Panel grid
    cols = math.ceil(math.sqrt(n)) if n > 0 else 1
    panel_lines = []
    for i, panel in enumerate(panels):
        label = panel.get("label", chr(65 + i))
        image_url = panel.get("imageUrl", "")
        if image_url:
            width = round(1.0 / cols - 0.02, 2)
            panel_lines.append(
                f"  \\begin{{subfigure}}[b]{{{width}\\textwidth}}\n"
                f"    \\includegraphics[width=\\textwidth]{{{image_url}}}\n"
                f"    \\caption*{{\\textbf{{{label}}}}}\n"
                f"  \\end{{subfigure}}"
            )
        else:
            width = round(1.0 / cols - 0.02, 2)
            panel_lines.append(
                f"  \\begin{{subfigure}}[b]{{{width}\\textwidth}}\n"
                f"    \\fbox{{\\rule[0pt]{{0pt}}{{3cm}}}}\n"
                f"    \\caption*{{\\textbf{{{label}}}}}\n"
                f"  \\end{{subfigure}}"
            )
    panels_tex = "\n  \\hfill\n".join(panel_lines)

    return (
        f"\\begin{{figure}}[htbp]\n"
        f"  \\centering\n"
        f"{panels_tex}\n"
        f"  \\caption{{\\textbf{{Figure {num}. {title}.}} {legend}}}\n"
        f"  \\label{{fig:{figure_id}}}\n"
        f"\\end{{figure}}\n"
    )


def _render_table_node(node: dict) -> str:
    csv_data = node.get("attrs", {}).get("csvData", "")
    caption = node.get("attrs", {}).get("caption", "")

    if not csv_data.strip():
        return "% Empty table\n"

    rows = [r.split(",") for r in csv_data.strip().split("\n")]
    if not rows:
        return ""

    n_cols = max(len(r) for r in rows)
    col_spec = "|" + "|".join(["l"] * n_cols) + "|"

    lines = [
        f"\\begin{{table}}[htbp]",
        "  \\centering",
        f"  \\begin{{tabular}}{{{col_spec}}}",
        "    \\hline",
    ]
    for i, row in enumerate(rows):
        cells = [_escape_latex(c.strip()) for c in row]
        while len(cells) < n_cols:
            cells.append("")
        row_str = " & ".join(cells) + " \\\\"
        if i == 0:
            lines.append(f"    {row_str}")
            lines.append("    \\hline")
        else:
            lines.append(f"    {row_str}")
    lines.append("    \\hline")
    lines.append("  \\end{tabular}")
    if caption:
        lines.append(f"  \\caption{{{_escape_latex(caption)}}}")
    lines.append("\\end{table}\n")

    return "\n".join(lines)


def _escape_latex(text: str) -> str:
    """Escape special LaTeX characters."""
    if not text:
        return ""
    replacements = [
        ("\\", "\\textbackslash{}"),
        ("&", "\\&"),
        ("%", "\\%"),
        ("$", "\\$"),
        ("#", "\\#"),
        ("_", "\\_"),
        ("{", "\\{"),
        ("}", "\\}"),
        ("~", "\\textasciitilde{}"),
        ("^", "\\textasciicircum{}"),
    ]
    for old, new in replacements:
        text = text.replace(old, new)
    return text
