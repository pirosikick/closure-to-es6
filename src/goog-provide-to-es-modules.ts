import j from "jscodeshift";
import { Collection } from "jscodeshift/src/Collection";

export const googProvideToEsModules = (root: Collection<any>) => {
  const providedNamespaces: string[] = [];
  root
    .find(j.CallExpression, {
      callee: {
        object: { name: "goog" },
        property: { name: "provide" }
      }
    })
    .forEach((path) => {
      const [arg0] = path.node.arguments;
      if (
        !(
          (j.StringLiteral.check(arg0) || j.Literal.check(arg0)) &&
          typeof arg0.value === "string"
        )
      ) {
        return;
      }
      const providedNamespace = arg0.value;
      providedNamespaces.push(providedNamespace);

      // comment out goog.provide
      path.replace(
        j.commentLine(` goog.provide("${providedNamespace}")`, false, false)
      );
    });

  const renameMap: Record<string, string> = {};

  root.find(j.ExpressionStatement).forEach((path) => {
    if (!j.Program.check(path.parent.node)) {
      return;
    }

    const expression = path.node.expression;

    if (
      !(
        j.AssignmentExpression.check(expression) &&
        j.MemberExpression.check(expression.left)
      )
    ) {
      return;
    }

    const namespace = nodeToString(expression.left);
    if (!namespace) {
      return;
    }

    const matched = providedNamespaces.some(
      (providedNamespace) =>
        providedNamespace === namespace ||
        namespace.indexOf(`${providedNamespace}.`) === 0
    );
    if (!matched) {
      return;
    }

    const chunks = namespace.split(".");
    const variableName = chunks[chunks.length - 1];

    // a.b.c.d = ... => const d = ...
    path.replace(
      j.exportNamedDeclaration(
        j.variableDeclaration("let", [
          j.variableDeclarator(j.identifier(variableName), expression.right)
        ])
      )
    );

    renameMap[namespace] = variableName;
  });

  root.find(j.MemberExpression).forEach((path) => {
    const namespace = nodeToString(path.node);
    const renamed = renameMap[namespace];
    if (renamed) {
      path.replace(j.identifier(renamed));
    }
  });
};

export default function transformer(fileInfo: j.FileInfo) {
  const root = j(fileInfo.source);
  googProvideToEsModules(root);
  return root.toSource();
}

const nodeToString = (node: unknown): string => {
  if (j.MemberExpression.check(node)) {
    return `${nodeToString(node.object)}.${nodeToString(node.property)}`;
  } else if (j.Identifier.check(node)) {
    return node.name;
  } else if (
    j.Literal.check(node) ||
    j.StringLiteral.check(node) ||
    j.NumericLiteral.check(node)
  ) {
    return String(node.value);
  }
  return "";
};
