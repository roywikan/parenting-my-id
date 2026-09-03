import { useEffect } from 'react';
import { SiteConfig } from '../types';

interface Props {
  siteConfig?: SiteConfig;
}

export default function CustomScriptsInjector({ siteConfig }: Props) {
  // 1. Head Snippet Injection (JS / CSS)
  useEffect(() => {
    if (!siteConfig?.custom_snippet_head_enable || !siteConfig?.custom_snippet_head_code?.trim()) {
      return;
    }
    const container = document.createElement('div');
    container.innerHTML = siteConfig.custom_snippet_head_code.trim();

    const injectedNodes: Node[] = [];
    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeName === 'SCRIPT') {
        const script = document.createElement('script');
        script.setAttribute('data-custom-head-script', 'true');
        Array.from((node as HTMLScriptElement).attributes).forEach((attr) => {
          script.setAttribute(attr.name, attr.value);
        });
        if ((node as HTMLScriptElement).innerHTML) {
          script.innerHTML = (node as HTMLScriptElement).innerHTML;
        }
        document.head.appendChild(script);
        injectedNodes.push(script);
      } else if (node.nodeName === 'STYLE' || node.nodeName === 'LINK') {
        const clone = node.cloneNode(true);
        if (clone instanceof HTMLElement) {
          clone.setAttribute('data-custom-head-style', 'true');
        }
        document.head.appendChild(clone);
        injectedNodes.push(clone);
      }
    });

    return () => {
      injectedNodes.forEach((node) => {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    };
  }, [siteConfig?.custom_snippet_head_enable, siteConfig?.custom_snippet_head_code]);

  // 2. Custom Meta Tags Injection
  useEffect(() => {
    if (!siteConfig?.custom_meta_tags_enable || !siteConfig?.custom_meta_tags_code?.trim()) {
      return;
    }
    const container = document.createElement('div');
    container.innerHTML = siteConfig.custom_meta_tags_code.trim();

    const injectedNodes: Node[] = [];
    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeName === 'META' || node.nodeName === 'LINK') {
        const clone = node.cloneNode(true);
        if (clone instanceof HTMLElement) {
          clone.setAttribute('data-custom-meta-tag', 'true');
        }
        document.head.appendChild(clone);
        injectedNodes.push(clone);
      }
    });

    return () => {
      injectedNodes.forEach((node) => {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    };
  }, [siteConfig?.custom_meta_tags_enable, siteConfig?.custom_meta_tags_code]);

  // 3. Body Snippet Injection (Sebelum </body>)
  useEffect(() => {
    if (!siteConfig?.custom_snippet_body_enable || !siteConfig?.custom_snippet_body_code?.trim()) {
      return;
    }
    const container = document.createElement('div');
    container.innerHTML = siteConfig.custom_snippet_body_code.trim();

    const injectedNodes: Node[] = [];
    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeName === 'SCRIPT') {
        const script = document.createElement('script');
        script.setAttribute('data-custom-body-script', 'true');
        Array.from((node as HTMLScriptElement).attributes).forEach((attr) => {
          script.setAttribute(attr.name, attr.value);
        });
        if ((node as HTMLScriptElement).innerHTML) {
          script.innerHTML = (node as HTMLScriptElement).innerHTML;
        }
        document.body.appendChild(script);
        injectedNodes.push(script);
      } else {
        const clone = node.cloneNode(true);
        if (clone instanceof HTMLElement) {
          clone.setAttribute('data-custom-body-node', 'true');
        }
        document.body.appendChild(clone);
        injectedNodes.push(clone);
      }
    });

    return () => {
      injectedNodes.forEach((node) => {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    };
  }, [siteConfig?.custom_snippet_body_enable, siteConfig?.custom_snippet_body_code]);

  return null;
}
