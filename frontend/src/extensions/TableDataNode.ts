import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableData: {
      insertTableData: (csvData: string, caption?: string) => ReturnType;
    };
  }
}

export const TableDataNode = Node.create({
  name: 'tableData',
  block: true,
  group: 'block',
  draggable: true,

  addAttributes() {
    return {
      csvData: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-csv') || '',
        renderHTML: (attributes) => ({ 'data-csv': attributes.csvData }),
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') || '',
        renderHTML: (attributes) => ({ 'data-caption': attributes.caption }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-table-data]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-table-data': '', class: 'table-data-node' }),
      0,
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement('div');
      container.className = 'table-data-container';
      container.setAttribute('contenteditable', 'false');
      container.style.border = '1px solid #e5e7eb';
      container.style.borderRadius = '6px';
      container.style.overflow = 'hidden';
      container.style.margin = '1rem 0';

      const renderTable = (csv: string) => {
        if (!csv.trim()) {
          container.innerHTML = '<p style="padding:1rem;color:#9ca3af;text-align:center">Empty table — click to edit</p>';
          return;
        }
        const rows = csv.trim().split('\n').map((r) => r.split(',').map((c) => c.trim()));
        const table = document.createElement('table');
        table.style.cssText = 'width:100%;border-collapse:collapse;font-size:0.9em;';
        rows.forEach((cells, ri) => {
          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid #e5e7eb';
          cells.forEach((cell) => {
            const td = document.createElement(ri === 0 ? 'th' : 'td');
            td.textContent = cell;
            td.style.cssText = `padding:6px 12px;text-align:left;${ri === 0 ? 'background:#f9fafb;font-weight:600;' : ''}`;
            tr.appendChild(td);
          });
          table.appendChild(tr);
        });
        container.innerHTML = '';
        container.appendChild(table);

        if (node.attrs.caption) {
          const cap = document.createElement('p');
          cap.textContent = `Table: ${node.attrs.caption}`;
          cap.style.cssText = 'padding:6px 12px;font-size:0.8em;color:#6b7280;font-style:italic;';
          container.appendChild(cap);
        }
      };

      renderTable(node.attrs.csvData);

      container.addEventListener('dblclick', () => {
        const pos = typeof getPos === 'function' ? getPos() : -1;
        const newCsv = window.prompt('Edit CSV data (header row, then data rows):', node.attrs.csvData);
        if (newCsv !== null && pos >= 0) {
          editor.chain().focus().command(({ tr }) => {
            tr.setNodeAttribute(pos, 'csvData', newCsv);
            return true;
          }).run();
        }
      });

      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'tableData') return false;
          renderTable(updatedNode.attrs.csvData);
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      insertTableData:
        (csvData: string, caption?: string) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { csvData, caption: caption || '' },
          }),
    };
  },
});
