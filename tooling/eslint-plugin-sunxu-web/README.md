# eslint-plugin-sunxu-web

ESLint rules for enforcing Sunxu Web page-container, component-usage, and business-scope contracts. This development-tool package stays separate from the `sunxu-web` runtime package.

## Rules

- `sunxu-web/component-classification`: exported components in configured host directories must declare `@sunxu-component shared` or `business-specific`. Business-specific components also need `@sunxu-domain` and `@sunxu-reason`.
- `sunxu-web/page-container`: exported screens must declare `@sunxu-page` and return the matching Sunxu Web page container as their outer root.
- `sunxu-web/required-components`: each declared `@sunxu-use` feature must be backed by the matching Sunxu Web or Ant Design component in the component's JSX.

See `docs/component-usage-policy.md` for the feature-to-component map.

## Flat config

The consuming app supplies its own file globs:

```js
import sunxuWeb from 'eslint-plugin-sunxu-web';

export default [
  {
    ...sunxuWeb.configs['components/recommended'],
    files: ['src/components/**/*.{ts,tsx}'],
  },
  {
    ...sunxuWeb.configs['screens/recommended'],
    files: ['src/pages/**/*.{ts,tsx}'],
  },
];
```

Configure the actual component and route paths. The component package does not enforce rules in a consuming app unless the app installs and loads this ESLint plugin. Enable the rules as errors in local lint and CI.

## Component markers

```tsx
/**
 * @sunxu-component business-specific
 * @sunxu-domain inventory
 * @sunxu-reason Combines inventory lot traceability and record actions that have no shared domain contract.
 */
export function InventoryBatchCard() {
  return <SectionCard title="Batch">...</SectionCard>;
}

/**
 * @sunxu-page list
 * @sunxu-component business-specific
 * @sunxu-domain inventory
 * @sunxu-reason Owns inventory fields and permission visibility while using shared page and table structures.
 * @sunxu-use filters
 * @sunxu-use data-table
 */
export function InventoryListPage() {
  return <ListScreenContainer toolbar={<FilterBar ariaLabel="Inventory filters">...</FilterBar>}>
    <ProTable columns={columns} dataSource={rows} />
  </ListScreenContainer>;
}
```

`page-container` checks the direct JSX roots returned by the exported component. `required-components` checks the component's JSX source, including nested JSX callbacks. It does not infer business intent from filenames or component names; the owning component declares its semantics with `@sunxu-use`.
