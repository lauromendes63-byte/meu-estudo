import { describe, expect, it } from 'vitest';
import { reconcileKeyedList } from '../../src/ui/reconcile.js';

describe('reconcileKeyedList surgical DOM patcher', () => {
  it('preserves existing keyed DOM element identities when updating or reordering items', () => {
    const container = document.createElement('div');
    const itemsA = [
      { id: 'a', label: 'Primeiro' },
      { id: 'b', label: 'Segundo' },
      { id: 'c', label: 'Terceiro' }
    ];

    const createNode = (item) => {
      const div = document.createElement('div');
      div.textContent = item.label;
      return div;
    };
    const patchNode = (node, item) => {
      node.textContent = item.label;
    };

    reconcileKeyedList(container, itemsA, (x) => x.id, createNode, patchNode);
    const nodeA = container.children[0];
    const nodeB = container.children[1];
    const nodeC = container.children[2];

    const itemsB = [
      { id: 'c', label: 'Terceiro Atualizado' },
      { id: 'a', label: 'Primeiro' },
      { id: 'd', label: 'Quarto' }
    ];

    reconcileKeyedList(container, itemsB, (x) => x.id, createNode, patchNode);

    expect(container.children).toHaveLength(3);
    expect(container.children[0]).toBe(nodeC);
    expect(container.children[0].textContent).toBe('Terceiro Atualizado');
    expect(container.children[1]).toBe(nodeA);
    expect(container.children[2].dataset.key).toBe('d');
    expect(nodeB.isConnected).toBe(false);
  });
});
