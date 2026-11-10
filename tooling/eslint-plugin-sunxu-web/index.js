const PAGE_CONTRACTS = Object.freeze({
  list: [{ source: 'sunxu-web', name: 'ListScreenContainer' }],
  form: [{ source: 'sunxu-web', name: 'FormScreenContainer' }],
  detail: [{ source: 'sunxu-web', name: 'DetailScreenContainer' }],
  custom: [{ source: 'sunxu-web', name: 'ScreenContainer' }],
});

const USE_CONTRACTS = Object.freeze({
  filters: [
    { source: 'sunxu-web', name: 'FilterBar' },
    { source: '@ant-design/pro-components', name: 'QueryFilter' },
  ],
  'status-tabs': [{ source: 'sunxu-web', name: 'StatusTabs' }],
  'data-table': [
    { source: '@ant-design/pro-components', name: 'ProTable' },
    { source: 'antd', name: 'Table' },
  ],
  'detail-properties': [
    { source: 'sunxu-web', name: 'DetailCard' },
    { source: 'antd', name: 'Descriptions' },
  ],
  'metric-summary': [{ source: 'sunxu-web', name: 'MetricCard' }],
  'settings-row': [{ source: 'sunxu-web', name: 'SettingsRow' }],
  'profile-identity': [{ source: 'sunxu-web', name: 'ProfileIdentity' }],
  'editable-details': [{ source: 'sunxu-web', name: 'EditableDetailTable' }],
  'remote-select': [{ source: 'sunxu-web', name: 'RemoteSelect' }],
  'long-text': [{ source: 'sunxu-web', name: 'LongText' }],
  'chart-panel': [{ source: 'sunxu-web', name: 'ChartPanel' }],
});

function isFunction(node) {
  return node?.type === 'FunctionDeclaration' || node?.type === 'FunctionExpression' ||
    node?.type === 'ArrowFunctionExpression';
}

function unwrapComponent(node) {
  if (isFunction(node)) return node;
  if (node?.type === 'CallExpression') return node.arguments.map(unwrapComponent).find(Boolean);
  return null;
}

function componentName(node) {
  if (node?.type === 'FunctionDeclaration' || node?.type === 'FunctionExpression') return node.id?.name ?? null;
  if (node?.type === 'VariableDeclarator') return node.id?.type === 'Identifier' ? node.id.name : null;
  return null;
}

function childNodes(node, visitorKeys) {
  const keys = visitorKeys?.[node.type] ?? Object.keys(node).filter((key) => key !== 'parent');
  return keys.flatMap((key) => {
    const child = node[key];
    if (Array.isArray(child)) return child.filter((value) => value && typeof value.type === 'string');
    return child && typeof child.type === 'string' ? [child] : [];
  });
}

function visitWithinFunction(node, visitorKeys, visitor, isRoot = true) {
  if (!node || typeof node.type !== 'string') return;
  if (!isRoot && isFunction(node)) return;
  visitor(node);
  for (const child of childNodes(node, visitorKeys)) visitWithinFunction(child, visitorKeys, visitor, false);
}

function hasJSX(functionNode, visitorKeys) {
  let found = false;
  visitWithinFunction(functionNode.body, visitorKeys, (node) => {
    if (node.type === 'JSXElement' || node.type === 'JSXFragment') found = true;
  });
  return found;
}

function getLeadingDoc(sourceCode, node) {
  const comments = sourceCode.getCommentsBefore(node);
  const lastComment = comments[comments.length - 1];
  if (!lastComment || lastComment.type !== 'Block' || !lastComment.value.trim().startsWith('*')) return '';
  return lastComment.value;
}

function hasTag(doc, tag) {
  return new RegExp(`@${tag}\\s+[^\\s*]+`).test(doc);
}

function exportedComponents(node, sourceCode) {
  const declaration = node.declaration;
  if (!declaration || (node.type === 'ExportNamedDeclaration' && node.exportKind === 'type')) return [];
  const visitorKeys = sourceCode.visitorKeys;

  if (node.type === 'ExportDefaultDeclaration' && declaration.type === 'Identifier') {
    const declarations = sourceCode.ast.body
      .map((statement) => statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement)
      .filter(Boolean)
      .flatMap((statement) => {
        if (statement.type === 'FunctionDeclaration' && statement.id?.name === declaration.name) return [statement];
        if (statement.type === 'VariableDeclaration') {
          return statement.declarations.filter((item) => item.id?.type === 'Identifier' && item.id.name === declaration.name);
        }
        return [];
      });
    return declarations.flatMap((item) => {
      const fn = unwrapComponent(item.type === 'VariableDeclarator' ? item.init : item);
      if (!fn || !hasJSX(fn, visitorKeys)) return [];
      return [{ name: componentName(item) ?? componentName(fn) ?? declaration.name, fn, docNode: item }];
    });
  }

  const declarations = declaration.type === 'VariableDeclaration' ? declaration.declarations : [declaration];
  return declarations.flatMap((item) => {
    const fn = unwrapComponent(item.type === 'VariableDeclarator' ? item.init : item);
    if (!fn || !hasJSX(fn, visitorKeys)) return [];
    const name = componentName(item) ?? componentName(fn) ?? 'default export';
    if (name !== 'default export' && !/^[A-Z]/.test(name)) return [];
    return [{ name, fn, docNode: node }];
  });
}

function collectReturnedRoots(expression, roots) {
  if (!expression) return;
  if (expression.type === 'JSXElement') {
    roots.push(expression.openingElement.name);
  } else if (expression.type === 'JSXFragment') {
    for (const child of expression.children ?? []) {
      if (child.type === 'JSXElement') roots.push(child.openingElement.name);
      else if (child.type === 'JSXExpressionContainer') collectReturnedRoots(child.expression, roots);
    }
  } else if (expression.type === 'ConditionalExpression') {
    collectReturnedRoots(expression.consequent, roots);
    collectReturnedRoots(expression.alternate, roots);
  } else if (expression.type === 'LogicalExpression') {
    collectReturnedRoots(expression.right, roots);
  }
}

function returnedRootNames(functionNode, visitorKeys) {
  const roots = [];
  if (functionNode.body.type !== 'BlockStatement') {
    collectReturnedRoots(functionNode.body, roots);
  } else {
    visitWithinFunction(functionNode.body, visitorKeys, (node) => {
      if (node.type === 'ReturnStatement') collectReturnedRoots(node.argument, roots);
    });
  }
  return roots.filter((name) => name?.type === 'JSXIdentifier').map((name) => name.name);
}

function componentJSXNames(functionNode, visitorKeys) {
  const names = [];
  function visit(node) {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier') names.push(node.name.name);
    for (const child of childNodes(node, visitorKeys)) visit(child);
  }
  visit(functionNode.body);
  return names;
}

function importBindings(sourceCode) {
  const bindings = new Map();
  for (const statement of sourceCode.ast.body) {
    if (statement.type !== 'ImportDeclaration') continue;
    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ImportSpecifier') continue;
      bindings.set(specifier.local.name, {
        source: statement.source.value,
        name: specifier.imported.name ?? specifier.imported.value,
      });
    }
  }
  return bindings;
}

function matchesExpected(localName, expected, imports) {
  const binding = imports.get(localName);
  return expected.some((candidate) => candidate.source === binding?.source && candidate.name === binding.name);
}

function createClassificationRule() {
  return {
    meta: {
      type: 'problem',
      docs: { description: 'Require exported React components to declare their Sunxu business scope.' },
      schema: [],
      messages: {
        missing: 'Exported React component "{{name}}" must declare @sunxu-component shared or business-specific.',
        invalid: 'Component "{{name}}" must use @sunxu-component shared or business-specific.',
        domain: 'Business-specific component "{{name}}" must declare @sunxu-domain <domain>.',
        reason: 'Business-specific component "{{name}}" must declare @sunxu-reason <why it stays business-specific>.',
      },
    },
    create(context) {
      const sourceCode = context.sourceCode ?? context.getSourceCode();
      const inspected = new Set();
      return {
        ExportNamedDeclaration(node) { inspect(node); },
        ExportDefaultDeclaration(node) { inspect(node); },
      };

      function inspect(node) {
        for (const component of exportedComponents(node, sourceCode)) {
          const key = component.fn.range?.join(':') ?? component.name;
          if (inspected.has(key)) continue;
          inspected.add(key);
          const doc = getLeadingDoc(sourceCode, component.docNode);
          const match = doc.match(/@sunxu-component\s+([^\s*]+)/);
          if (!match) {
            context.report({ node, messageId: 'missing', data: { name: component.name } });
            continue;
          }
          if (match[1] !== 'shared' && match[1] !== 'business-specific') {
            context.report({ node, messageId: 'invalid', data: { name: component.name } });
          } else if (match[1] === 'business-specific') {
            if (!hasTag(doc, 'sunxu-domain')) context.report({ node, messageId: 'domain', data: { name: component.name } });
            if (!hasTag(doc, 'sunxu-reason')) context.report({ node, messageId: 'reason', data: { name: component.name } });
          }
        }
      }
    },
  };
}

function createPageContainerRule() {
  return {
    meta: {
      type: 'problem',
      docs: { description: 'Require each screen to use its declared Sunxu Web page container.' },
      schema: [],
      messages: {
        missingPage: 'Screen "{{name}}" must declare @sunxu-page list, form, detail, or custom.',
        invalidPage: 'Screen "{{name}}" has an unsupported @sunxu-page value "{{page}}".',
        customReason: 'A custom screen "{{name}}" must explain why standard page containers do not fit with @sunxu-reason.',
        container: 'Screen "{{name}}" is marked @sunxu-page {{page}} and must return the matching Sunxu Web container as its outer page root.',
      },
    },
    create(context) {
      const sourceCode = context.sourceCode ?? context.getSourceCode();
      const imports = importBindings(sourceCode);
      const visitorKeys = sourceCode.visitorKeys;
      const inspected = new Set();
      return {
        ExportNamedDeclaration(node) { inspect(node); },
        ExportDefaultDeclaration(node) { inspect(node); },
      };

      function inspect(node) {
        for (const component of exportedComponents(node, sourceCode)) {
          const key = component.fn.range?.join(':') ?? component.name;
          if (inspected.has(key)) continue;
          inspected.add(key);
          const doc = getLeadingDoc(sourceCode, component.docNode);
          const match = doc.match(/@sunxu-page\s+([^\s*]+)/);
          if (!match) {
            context.report({ node, messageId: 'missingPage', data: { name: component.name } });
            continue;
          }
          const page = match[1];
          const expected = PAGE_CONTRACTS[page];
          if (!expected) {
            context.report({ node, messageId: 'invalidPage', data: { name: component.name, page } });
            continue;
          }
          if (page === 'custom' && !hasTag(doc, 'sunxu-reason')) {
            context.report({ node, messageId: 'customReason', data: { name: component.name } });
          }
          const roots = returnedRootNames(component.fn, visitorKeys);
          if (!roots.some((root) => matchesExpected(root, expected, imports))) {
            context.report({ node, messageId: 'container', data: { name: component.name, page } });
          }
        }
      }
    },
  };
}

function createRequiredComponentsRule() {
  return {
    meta: {
      type: 'problem',
      docs: { description: 'Require components declared by each Sunxu Web usage feature.' },
      schema: [],
      messages: {
        unknown: 'Unsupported @sunxu-use value "{{feature}}". See the Sunxu Web component usage policy.',
        missing: 'Component "{{name}}" declares @sunxu-use {{feature}} and must use the matching shared component in its JSX.',
      },
    },
    create(context) {
      const sourceCode = context.sourceCode ?? context.getSourceCode();
      const visitorKeys = sourceCode.visitorKeys;
      const imports = importBindings(sourceCode);
      const inspected = new Set();
      return {
        ExportNamedDeclaration(node) { inspect(node); },
        ExportDefaultDeclaration(node) { inspect(node); },
      };

      function inspect(node) {
        for (const component of exportedComponents(node, sourceCode)) {
          const key = component.fn.range?.join(':') ?? component.name;
          if (inspected.has(key)) continue;
          inspected.add(key);
          const doc = getLeadingDoc(sourceCode, component.docNode);
          const features = [...doc.matchAll(/@sunxu-use\s+([^\s*]+)/g)].map((match) => match[1]);
          if (!features.length) continue;
          const names = componentJSXNames(component.fn, visitorKeys);
          for (const feature of features) {
            const expected = USE_CONTRACTS[feature];
            if (!expected) {
              context.report({ node, messageId: 'unknown', data: { feature } });
              continue;
            }
            if (!names.some((name) => matchesExpected(name, expected, imports))) {
              context.report({ node, messageId: 'missing', data: { name: component.name, feature } });
            }
          }
        }
      }
    },
  };
}

const plugin = {
  meta: { name: 'eslint-plugin-sunxu-web', version: '0.1.0' },
  rules: {
    'component-classification': createClassificationRule(),
    'page-container': createPageContainerRule(),
    'required-components': createRequiredComponentsRule(),
  },
  configs: {},
};

plugin.configs['components/recommended'] = {
  plugins: { 'sunxu-web': plugin },
  rules: {
    'sunxu-web/component-classification': 'error',
    'sunxu-web/required-components': 'error',
  },
};
plugin.configs['screens/recommended'] = {
  plugins: { 'sunxu-web': plugin },
  rules: {
    'sunxu-web/component-classification': 'error',
    'sunxu-web/page-container': 'error',
    'sunxu-web/required-components': 'error',
  },
};

export { PAGE_CONTRACTS, USE_CONTRACTS };
export default plugin;
