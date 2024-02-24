import "./styles.css";
// Import React dependencies.
import React, { useCallback, useState } from "react";
// Import the Slate editor factory.
import { createEditor, BaseEditor, Editor, Element } from "slate";

// Import the Slate components and React plugin.
import {
  Slate,
  Editable,
  withReact,
  RenderElementProps,
  ReactEditor,
  useSelected,
  useFocused
} from "slate-react";

type CustomElement = {
  type: "variable";
  variable: string;
  children: CustomText[];
};
type CustomText = { text: string };

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const VAR_REGEX = /(<\+[a-zA-z0-9_.]+?>)/;

const withVariables = (editor: Editor) => {
  const { isInline, isVoid, markableVoid } = editor;

  editor.isInline = (element: Element) => {
    return element.type === "variable" ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === "variable" ? true : isVoid(element);
  };

  editor.markableVoid = (element) => {
    return element.type === "variable" || markableVoid(element);
  };

  return editor;
};

function deserialize(input: string) {
  const split = input.split(VAR_REGEX);

  return [
    {
      type: "paragraph",
      children: split.map((part) => {
        if (part.match(VAR_REGEX)) {
          const variable = part.slice(2).slice(0, -1);
          return {
            type: "variable",
            variable,
            children: [{ text: "" }]
          };
        }

        return { type: "text", text: part };
      })
    }
  ];
}

const initialValue = deserialize(
  "My name is <+user.name> and I am <+user.age> old"
);

console.log(initialValue);

function VariableElement(props: RenderElementProps) {
  const { attributes, element, children } = props;
  const selected = useSelected();
  const focused = useFocused();

  return (
    <span
      {...attributes}
      className="variable"
      contentEditable
      style={{
        boxShadow: selected && focused ? "0 0 0 2px #B4D5FF" : "none"
      }}
    >
      {children}&lt;+{element.variable}&gt;
    </span>
  );
}

// const insertVariable = (editor: Editor, variable: string) => {
//   const variableElem: CustomElement = {
//     type: "variable",
//     variable,
//     children: [{ text: "" }]
//   };
//   Transforms.insertNodes(editor, variableElem);
//   Transforms.move(editor);
// };

export default function App() {
  // Create a Slate editor object that won't change across renders.
  const [editor] = useState(() => withVariables(withReact(createEditor())));

  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, element, children } = props;
    switch (element.type) {
      case "variable":
        return <VariableElement {...props} />;
      default:
        return <span {...attributes}>{children}</span>;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      return;

      // const { selection } = editor;
      // if (e.key === "+" && selection) {
      //   const [start, end] = Range.edges(selection);
      //   const wordBefore = Editor.before(editor, start, { unit: "character" });
      //   const before = wordBefore && Editor.before(editor, wordBefore);
      //   const beforeRange = before && Editor.range(editor, before, start);
      //   const beforeText = beforeRange && Editor.string(editor, beforeRange);
      //   // const after = Editor.after(editor, start);
      //   // const afterRange = Editor.range(editor, start, after);
      //   // const afterText = Editor.string(editor, afterRange);

      //   if (beforeText === "<") {
      //     e.preventDefault();
      //     Transforms.delete(editor, { at: beforeRange });
      //     insertVariable(editor, "");
      //   }
      // }
    },
    [editor]
  );

  const handleChange = useCallback((val) => {
    // setValue(deserialize(serialize(val)));
  }, []);

  return (
    <Slate editor={editor} value={initialValue} onChange={handleChange}>
      <Editable
        className="editable"
        renderElement={renderElement}
        onKeyDown={handleKeyDown}
      />
    </Slate>
  );
}
