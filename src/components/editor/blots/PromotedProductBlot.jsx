import { Quill } from 'react-quill';

const BlockEmbed = Quill.import('blots/block/embed');

class PromotedProductBlot extends BlockEmbed {
  static create(value) {
    const node = super.create();
    node.setAttribute('contenteditable', 'false');

    const iframe = document.createElement('iframe');
    iframe.className = 'b44-promoted-product-iframe';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.style.width = '100%';
    iframe.style.height = '160px';
    iframe.style.border = '0';
    iframe.style.borderRadius = '12px';
    iframe.style.background = '#fff';

    const html = typeof value === 'string' ? value : '';
    iframe.setAttribute('srcdoc', html);

    node.appendChild(iframe);
    return node;
  }

  static value(node) {
    const iframe = node.querySelector('iframe');
    return iframe ? (iframe.getAttribute('srcdoc') || '') : '';
  }
}

PromotedProductBlot.blotName = 'promoted-product';
PromotedProductBlot.tagName = 'div';
PromotedProductBlot.className = 'b44-promoted-product-container';

export default PromotedProductBlot;